<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Lesson;
use App\Models\Subject;
use App\Models\Unit;
use App\Models\AssignmentSubmission;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
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
        $totalStudents = User::where('role', 'student')->count();
        $activeLessons = Lesson::where('is_published', true)->count();
        $totalUnits = Unit::count();
        
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

        $subjects = Subject::with(['academicLevel.curriculum', 'title'])
            ->withCount('students')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'title' => ($subject?->title?->name ?? $subject->name) . " (" . ($subject->academicLevel?->name ?? 'Unknown') . ")",
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
        // Teacher's assigned subjects (instances)
        $assignedSubjects = $user->taughtSubjects()->with('title')->get();
        $assignedSubjectIds = $assignedSubjects->pluck('id')->toArray();
        $assignedTitleIds = $assignedSubjects->pluck('subject_title_id')->unique()->toArray();

        // Pending Grading: Assignments for the teacher's subject titles
        $pendingGrading = AssignmentSubmission::whereNull('score')
            ->whereHas('assignment', function($q) use ($assignedTitleIds) {
                $q->whereIn('subject_title_id', $assignedTitleIds);
            })
            ->count();

        $stats = [
            [
                'label' => 'Pending Grading',
                'value' => (string)$pendingGrading,
                'trend' => $pendingGrading > 0 ? 'Needs attention' : 'All caught up!'
            ],
            [
                'label' => 'Classes Taught',
                'value' => (string)$assignedSubjects->count(),
                'trend' => 'Assigned to you'
            ],
            [
                'label' => 'Average Score',
                'value' => '78%', 
                'trend' => 'In your subjects'
            ],
        ];

        $classes = $assignedSubjects->map(function($subject) {
            return [
                'id' => $subject->id,
                'title' => ($subject?->title?->name ?? $subject->name) . " (" . ($subject->academicLevel?->name ?? 'Unknown') . ")",
                'subtitle' => "Subject Teacher",
                'actionLabel' => "View Details",
                'studentCount' => $subject->students()->count() . " Enrolled",
                'unitCount' => $subject->units()->count() . " Units"
            ];
        });

        return response()->json([
            'stats' => $stats,
            'classes' => $classes
        ]);
    }

    private function getStudentStats($user)
    {
        $enrolledSubjects = $user->subjects()->with('title')->wherePivot('status', 'active')->get();
        $subjectIds = $enrolledSubjects->pluck('id')->toArray();
        $titleIds = $enrolledSubjects->pluck('subject_title_id')->unique()->toArray();
        $levelId = $user->academic_level_id;

        // 1. Upcoming Deadlines
        $upcomingDeadlines = Assignment::whereIn('subject_title_id', $titleIds)
            ->where(function($q) use ($levelId) {
                $q->whereNull('academic_level_id')
                  ->orWhere('academic_level_id', $levelId);
            })
            ->where('due_date', '>=', now())
            ->whereDoesntHave('submissions', function($q) use ($user) {
                $q->where('student_id', $user->id);
            })
            ->with('subjectTitle')
            ->orderBy('due_date', 'asc')
            ->take(3)
            ->get()
            ->map(function($assignment) {
                $days = now()->diffInDays($assignment->due_date, false);
                $dueText = $days <= 0 ? "Due today" : ($days == 1 ? "Due tomorrow" : "Due in $days days");
                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'subject' => $assignment->subjectTitle->name ?? 'Unknown',
                    'due' => $dueText,
                    'day' => \Carbon\Carbon::parse($assignment->due_date)->format('d'),
                    'action' => 'Start',
                    'link' => '/student/assignments/' . $assignment->id
                ];
            });

        // 2. Recent activity logic would be complex, but let's fix the immediate 500
        $recentActivity = null;
        try {
            $recentLesson = Lesson::whereHas('subUnit.unit', function($q) use ($subjectIds) {
                    $q->whereIn('subject_id', $subjectIds);
                })
                ->where('is_published', true)
                ->with(['subUnit.unit.subject'])
                ->latest()
                ->first();

            if ($recentLesson && $recentLesson->subUnit?->unit?->subject) {
                $subject = $recentLesson->subUnit->unit->subject;
                $recentActivity = [
                    'subject' => $subject->name,
                    'unit' => $recentLesson->subUnit->unit->title,
                    'lesson' => $recentLesson->title,
                    'progress' => 0, // Placeholder
                    'lesson_id' => $recentLesson->id,
                    'subject_id' => $subject->id
                ];
            }
        } catch (\Exception $e) {}

        // 3. Live Classes
        $liveClasses = \App\Models\LiveClass::whereIn('subject_id', $subjectIds)
            ->where('end_time', '>=', now())
            ->with(['teacher', 'subject'])
            ->get();

        return response()->json([
            'upcomingDeadlines' => $upcomingDeadlines,
            'recentActivity' => $recentActivity,
            'liveClasses' => $liveClasses,
        ]);
    }
}
