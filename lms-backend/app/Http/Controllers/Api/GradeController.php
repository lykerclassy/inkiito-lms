<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subject;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function index(Request $request)
    {
        $subjectId = $request->query('subject_id');
        
        // Only fetching students for the gradebook
        $query = User::where('role', 'student')
            ->with(['quizResults.lesson.subUnit.unit.subject', 'quizAttempts.quiz.subject', 'assignmentSubmissions.assignment.subject', 'academicLevel']);

        if ($subjectId) {
            // If subject_id is provided, we might want to filter students enrolled in that subject
            $query->whereHas('subjects', function($q) use ($subjectId) {
                $q->where('subjects.id', $subjectId);
            });
        }

        $students = $query->get();

        $gradebook = $students->map(function ($student) use ($subjectId) {
            // QUIZZES (Interactive Blocks): calculate % where is_correct is true
            $quizResults = $student->quizResults;
            if ($subjectId) {
                $quizResults = $quizResults->filter(function($qr) use ($subjectId) {
                    return $qr->lesson?->subUnit?->unit?->subject_id == $subjectId;
                });
            }
            $totalQuizzes = $quizResults->count();
            $correctQuizzes = $quizResults->where('is_correct', true)->count();
            $quizAvg = $totalQuizzes > 0 ? ($correctQuizzes / $totalQuizzes) * 100 : 0;

            // STANDALONE QUIZZES: average of (score/total_points) * 100
            $quizAttempts = $student->quizAttempts;
            if ($subjectId) {
                $quizAttempts = $quizAttempts->filter(function($qa) use ($subjectId) {
                    return $qa->quiz?->subject_id == $subjectId;
                });
            }
            $standaloneQuizAvg = $quizAttempts->count() > 0 
                ? $quizAttempts->map(fn($qa) => ($qa->total_points > 0 ? ($qa->score / $qa->total_points) * 100 : 0))->avg() 
                : 0;

            // ASSIGNMENTS: average of the 'score' column
            $assignmentSubmissions = $student->assignmentSubmissions;
            if ($subjectId) {
                $assignmentSubmissions = $assignmentSubmissions->filter(function($as) use ($subjectId) {
                    return $as->assignment?->subject_id == $subjectId;
                });
            }
            $assignmentAvg = $assignmentSubmissions->avg('score') ?? 0;

            // OVERALL: simplified weighted average
            // In a subject-specific view, we just average what's available
            $metrics = array_filter([$quizAvg, $standaloneQuizAvg, $assignmentAvg], fn($m) => $m > 0);
            $overall = count($metrics) > 0 ? array_sum($metrics) / count($metrics) : 0;
            $overall = round($overall);

            $status = 'Good';
            if ($overall >= 80) $status = 'Excellent';
            if ($overall < 50) $status = 'At Risk';

            return [
                'id' => $student->id,
                'name' => $student->name,
                'admission' => $student->admission_number,
                'level' => $student->academicLevel?->name ?? 'N/A',
                'average' => $overall,
                'status' => $status,
                'flagged' => $overall < 50,
                'quiz_avg' => round($quizAvg),
                'standalone_quiz_avg' => round($standaloneQuizAvg),
                'assignment_avg' => round($assignmentAvg),
                'total_quizzes' => $quizResults->count() + $quizAttempts->count(),
                'assignment_count' => $assignmentSubmissions->count()
            ];
        });

        // Sorted for Leaderboard if requested, or just return as is
        $leaderboard = $gradebook->sortByDesc('average')->values();

        // Quick Stats aggregation
        $stats = [
            'totalStudents' => $students->count(),
            'schoolAverage' => round($gradebook->avg('average')),
            'atRiskCount' => $gradebook->where('flagged', true)->count()
        ];

        return response()->json([
            'gradebook' => $gradebook,
            'leaderboard' => $leaderboard,
            'stats' => $stats,
            'subjects' => Subject::select('id', 'name')->get()
        ]);
    }

    public function show($userId)
    {
        $student = User::where('role', 'student')
            ->where('id', $userId)
            ->with([
                'quizResults.lesson.subUnit.unit.subject',
                'quizAttempts.quiz.subject',
                'assignmentSubmissions.assignment.subject',
                'academicLevel'
            ])
            ->firstOrFail();

        // Group quiz results by subject
        $quizBreakdown = $student->quizResults->groupBy(function($res) {
            return $res->lesson?->subUnit?->unit?->subject?->name ?? 'Other';
        })->map(function($results) {
            return [
                'count' => $results->count(),
                'correct' => $results->where('is_correct', true)->count(),
                'avg' => round(($results->where('is_correct', true)->count() / $results->count()) * 100)
            ];
        });

        // Group standalone quizzes by subject
        $standaloneQuizBreakdown = $student->quizAttempts->groupBy(function($qa) {
            return $qa->quiz?->subject?->name ?? 'Other';
        })->map(function($attempts) {
            return [
                'count' => $attempts->count(),
                'avg' => round($attempts->map(fn($qa) => ($qa->total_points > 0 ? ($qa->score / $qa->total_points) * 100 : 0))->avg())
            ];
        });

        // Group assignments by subject
        $assignmentBreakdown = $student->assignmentSubmissions->groupBy(function($sub) {
            return $sub->assignment?->subject?->name ?? 'Other';
        })->map(function($subs) {
            return [
                'count' => $subs->count(),
                'avg' => round($subs->avg('score'))
            ];
        });

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'admission' => $student->admission_number,
                'level' => $student->academicLevel?->name ?? 'N/A'
            ],
            'quizzes' => $quizBreakdown,
            'standalone_quizzes' => $standaloneQuizBreakdown,
            'assignments' => $assignmentBreakdown
        ]);
    }
}
