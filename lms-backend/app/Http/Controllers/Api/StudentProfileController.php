<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subject;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StudentProfileController extends Controller
{
    /**
     * Display the specified student profile for administrative review.
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, $id)
    {
        $student = User::with(['curriculum', 'academicLevel', 'subjects', 'targetCareer'])->findOrFail($id);

        if ($student->role !== 'student') {
            return response()->json(['message' => 'User is not a student.'], 422);
        }

        $userSubjectIds = $student->subjects()->pluck('subjects.id')->toArray();

        // 1. Progress by Subject (Aggregating Lessons, Assignments, and Quizzes)
        $subjectsProgress = $student->subjects->map(function ($subject) use ($student) {
            // A. Lessons (STILL tied to Subject ID via unit hierarchy)
            $totalLessons = Lesson::whereHas('subUnit.unit', function ($q) use ($subject) {
                $q->where('subject_id', $subject->id);
            })->where('is_published', true)->count();

            $completedLessons = $student->completedLessons()
                ->whereHas('subUnit.unit', function ($q) use ($subject) {
                    $q->where('subject_id', $subject->id);
                })->count();

            // B. Assignments (NOW tied to SubjectTitle + AcademicLevel)
            $totalAssignments = Assignment::where('subject_title_id', $subject->subject_title_id)
                ->where('academic_level_id', $subject->academic_level_id)
                ->count();
            
            $completedAssignmentsCount = AssignmentSubmission::where('student_id', $student->id)
                ->whereHas('assignment', function($q) use ($subject) {
                    $q->where('subject_title_id', $subject->subject_title_id)
                      ->where('academic_level_id', $subject->academic_level_id);
                })->count();

            // C. Quizzes (NOW tied to SubjectTitle + AcademicLevel)
            $totalQuizzes = Quiz::where('subject_title_id', $subject->subject_title_id)
                ->where('academic_level_id', $subject->academic_level_id)
                ->where('is_active', true)->count();
            
            $completedQuizzesCount = QuizAttempt::where('user_id', $student->id)
                ->whereNotNull('completed_at')
                ->whereHas('quiz', function($q) use ($subject) {
                    $q->where('subject_title_id', $subject->subject_title_id)
                      ->where('academic_level_id', $subject->academic_level_id);
                })
                ->distinct('quiz_id')
                ->count();

            $totalItems = $totalLessons + $totalAssignments + $totalQuizzes;
            $completedItems = $completedLessons + $completedAssignmentsCount + $completedQuizzesCount;

            $progress = $totalItems > 0 ? round(($completedItems / $totalItems) * 100) : 0;

            return [
                'id' => $subject->id,
                'name' => $subject->name,
                'status' => $subject->pivot->status,
                'progress' => $progress,
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'total_assignments' => $totalAssignments,
                'completed_assignments' => $completedAssignmentsCount,
                'total_quizzes' => $totalQuizzes,
                'completed_quizzes' => $completedQuizzesCount,
                'total_items' => $totalItems,
                'completed_items' => $completedItems
            ];
        });

        // 2. Assignments (Done vs Not Done)
        // We collect all assignments that match the subject-title and level of the student's enrolled subjects
        $allAssignments = collect();
        foreach ($student->subjects as $subj) {
            $assignments = Assignment::where('subject_title_id', $subj->subject_title_id)
                ->where('academic_level_id', $subj->academic_level_id)
                ->with(['subjectTitle', 'submissions' => function ($q) use ($student) {
                    $q->where('student_id', $student->id);
                }])
                ->get();
            $allAssignments = $allAssignments->concat($assignments);
        }
        
        $allAssignments = $allAssignments->sortBy('due_date');

        $doneAssignments = [];
        $pendingAssignments = [];

        foreach ($allAssignments as $assignment) {
            $submission = $assignment->submissions->first();
            $days = now()->diffInDays($assignment->due_date, false);
            
            // Format due text
            if ($days < 0) {
                $dueText = "Overdue by " . abs($days) . " days";
            } elseif ($days == 0) {
                $dueText = "Due today";
            } elseif ($days == 1) {
                $dueText = "Due tomorrow";
            } else {
                $dueText = "Due in $days days";
            }
            
            $item = [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'subject' => $assignment->subjectTitle?->name ?? 'Unknown',
                'due' => $dueText,
                'due_date' => $assignment->due_date ? Carbon::parse($assignment->due_date)->format('M d, Y') : 'No Date',
                'day' => $assignment->due_date ? Carbon::parse($assignment->due_date)->format('d') : '-',
                'status' => $submission ? $submission->status : 'pending',
                'score' => $submission ? $submission->score : null,
                'link' => '/student/assignments/' . $assignment->id
            ];

            if ($submission) {
                $doneAssignments[] = $item;
            } else {
                $pendingAssignments[] = $item;
            }
        }

        // 3. Recent Activity (Last 5 lesson completions or assignment submissions)
        $lessonActivity = $student->completedLessons()
            ->with(['subUnit.unit.subject'])
            ->latest('lesson_user.completed_at')
            ->take(5)
            ->get()
            ->map(function($lesson) {
                return [
                    'type' => 'lesson',
                    'title' => $lesson->title,
                    'subject' => $lesson->subUnit?->unit?->subject?->name ?? 'Unknown Subject',
                    'date' => $lesson->pivot->completed_at,
                    'description' => 'Completed lesson'
                ];
            });

        $assignmentActivity = $student->assignmentSubmissions()
            ->with(['assignment.subjectTitle'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function($sub) {
                return [
                    'type' => 'assignment',
                    'title' => $sub->assignment?->title ?? 'Deleted Assignment',
                    'subject' => $sub->assignment?->subjectTitle?->name ?? 'Unknown Subject',
                    'date' => $sub->created_at,
                    'description' => 'Submitted assignment'
                ];
            });

        $recentActivity = $lessonActivity->concat($assignmentActivity)
            ->sortByDesc('date')
            ->take(5)
            ->values();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'admission_number' => $student->admission_number,
                'avatar' => $student->avatar,
                'role' => $student->role,
                'curriculum' => $student->curriculum,
                'academic_level' => $student->academicLevel,
                'target_career' => $student->targetCareer,
            ],
            'subjects' => $subjectsProgress,
            'pendingAssignments' => $pendingAssignments,
            'completedAssignments' => $doneAssignments,
            'recentActivity' => $recentActivity,
            'stats' => [
                'totalSubjects' => count($userSubjectIds),
                'pendingAssignmentsCount' => count($pendingAssignments),
                'completedSubjectsCount' => $subjectsProgress->filter(fn($s) => $s['progress'] >= 80)->count()
            ]
        ]);
    }
}
