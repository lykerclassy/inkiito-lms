<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Lesson;
use App\Models\Subject;
use App\Models\Unit;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Roles Check
        $isManagement = in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos']);
        $isTeacher = in_array($user->role, ['teacher', 'class_teacher']);
        $isStudent = in_array($user->role, ['student']);

        if ($isManagement) {
            return $this->getManagementStats();
        }

        if ($isTeacher) {
            return $this->getTeacherStats($user);
        }
        
        if ($isStudent) {
            return $this->getStudentStats($user);
        }

        return response()->json(['message' => 'Unauthorized dashboard access'], 403);
    }

    private function getManagementStats()
    {
        // 1. Core Summary Stats
        $totalStudents = User::where('role', 'student')->count();
        $activeLessons = Lesson::where('is_published', true)->count();
        $totalUnits = Unit::count();
        
        // Trends (Hardcoded for visual appeal as in original, but could be calculated)
        $newThisWeek = User::where('role', 'student')
            ->where('created_at', '>=', now()->startOfWeek())
            ->count();
        
        $newLessonsToday = Lesson::where('is_published', true)
            ->where('updated_at', '>=', now()->startOfDay())
            ->count();

        $stats = [
            [
                'label' => 'Total Students',
                'value' => (string)$totalStudents,
                'trend' => "+$newThisWeek this week"
            ],
            [
                'label' => 'Active Lessons',
                'value' => (string)$activeLessons,
                'trend' => "+$newLessonsToday today"
            ],
            [
                'label' => 'Published Units',
                'value' => (string)$totalUnits,
                'trend' => 'Across all subjects'
            ],
        ];

        // 2. Curriculum Overview (Subjects with Student Counts)
        $subjects = Subject::with(['academicLevel.curriculum'])
            ->withCount('students')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'title' => ($subject->academicLevel?->name ?? 'Unknown Level') . " - " . $subject->name,
                    'framework' => ($subject->academicLevel?->curriculum?->name ?? 'Unknown') . " Framework",
                    'studentCount' => $subject->students_count . " Students"
                ];
            });

        return response()->json([
            'stats' => $stats,
            'subjects' => $subjects
        ]);
    }

    private function getTeacherStats($user)
    {
        // Get the subjects assigned to this teacher
        $assignedSubjectIds = DB::table('subject_teacher')
            ->where('user_id', $user->id)
            ->pluck('subject_id')
            ->toArray();

        // 1. Core Summary Stats for Teachers
        // Pending Grading: Submissions for assignments in teacher's subjects
        $pendingGrading = AssignmentSubmission::whereNull('score')
            ->whereHas('assignment', function($q) use ($assignedSubjectIds) {
                $q->whereIn('subject_id', $assignedSubjectIds);
            })
            ->count();

        // Active Classes count
        $activeClassesCount = count($assignedSubjectIds);

        $stats = [
            [
                'label' => 'Pending Grading',
                'value' => (string)$pendingGrading,
                'trend' => $pendingGrading > 0 ? 'Needs attention' : 'All caught up!'
            ],
            [
                'label' => 'Classes Taught',
                'value' => (string)$activeClassesCount,
                'trend' => 'Assigned to you'
            ],
            [
                'label' => 'Average Score',
                'value' => '78%', // Mocked until we have more historical global calc
                'trend' => 'In your subjects'
            ],
        ];

        // 2. My Active Classes (Real subjects assigned to the teacher)
        $classes = Subject::whereIn('id', $assignedSubjectIds)
            ->withCount(['students', 'units'])
            ->latest()
            ->get()
            ->map(function($subject) {
                return [
                    'id' => $subject->id,
                    'title' => ($subject->academicLevel?->name ?? 'Unknown') . " - " . $subject->name,
                    'subtitle' => "Subject Teacher",
                    'actionLabel' => "View Details",
                    'studentCount' => $subject->students_count . " Enrolled",
                    'unitCount' => $subject->units_count . " Units"
                ];
            });

        return response()->json([
            'stats' => $stats,
            'classes' => $classes
        ]);
    }

    private function getStudentStats($user)
    {
        // 1. Upcoming Deadlines (Assignments assigned to this user's subjects that they haven't submitted yet)
        try {
            $userSubjectIds = $user->subjects()->pluck('subjects.id')->toArray();
            
            $upcomingDeadlines = \App\Models\Assignment::whereIn('subject_id', $userSubjectIds)
                ->where('due_date', '>=', now())
                ->whereDoesntHave('submissions', function($q) use ($user) {
                    $q->where('student_id', $user->id);
                })
                ->with('subject')
                ->orderBy('due_date', 'asc')
                ->take(3)
                ->get()
                ->map(function($assignment) {
                    $days = now()->diffInDays($assignment->due_date, false);
                    $dueText = $days <= 0 ? "Due today" : ($days == 1 ? "Due tomorrow" : "Due in $days days");
                    return [
                        'id' => $assignment->id,
                        'title' => $assignment->title,
                        'subject' => $assignment->subject->name ?? 'Unknown',
                        'due' => $dueText,
                        'day' => \Carbon\Carbon::parse($assignment->due_date)->format('d'),
                        'action' => 'Start',
                        'link' => '/student/assignments/' . $assignment->id
                    ];
                });
        } catch (\Exception $e) {
            $upcomingDeadlines = [];
        }

        // 2. Recent Activity
        try {
            // Find the most recently published lesson in students' enrolled subjects
            $recentLesson = \App\Models\Lesson::whereHas('subUnit.unit', function($q) use ($userSubjectIds) {
                    $q->whereIn('subject_id', $userSubjectIds);
                })
                ->where('is_published', true)
                ->with(['subUnit.unit.subject'])
                ->latest()
                ->first();

            $recentActivity = null;
            if ($recentLesson && $recentLesson->subUnit && $recentLesson->subUnit->unit && $recentLesson->subUnit->unit->subject) {
                $unit = $recentLesson->subUnit->unit;
                $subject = $unit->subject;

                // REAL PROGRESS CALCULATION
                // 1. Total lessons in this subject
                $totalLessonsCount = \App\Models\Lesson::whereHas('subUnit.unit', function($q) use ($subject) {
                    $q->where('subject_id', $subject->id);
                })->where('is_published', true)->count();
                
                // 2. Lessons completed by this user in this subject
                $completedLessonsCount = $user->completedLessons()
                    ->whereHas('subUnit.unit', function($q) use ($subject) {
                        $q->where('subject_id', $subject->id);
                    })->count();

                $realProgress = $totalLessonsCount > 0 
                    ? round(($completedLessonsCount / $totalLessonsCount) * 100) 
                    : 0;

                $recentActivity = [
                    'subject' => $subject->name,
                    'unit' => $unit->title,
                    'lesson' => $recentLesson->title,
                    'progress' => $realProgress, 
                    'lesson_id' => $recentLesson->id,
                    'subject_id' => $subject->id
                ];
            }
        } catch (\Exception $e) {
            $recentActivity = null;
        }

        return response()->json([
            'upcomingDeadlines' => $upcomingDeadlines,
            'recentActivity' => $recentActivity
        ]);
    }
}
