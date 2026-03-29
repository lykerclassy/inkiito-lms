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
        
        $query = User::where('role', 'student')
            ->with(['quizResults.lesson.subUnit.unit.subject.title', 'quizAttempts.quiz.subjectTitle', 'assignmentSubmissions.assignment.subjectTitle', 'academicLevel']);

        if ($subjectId) {
            $query->whereHas('subjects', function($q) use ($subjectId) {
                $q->where('subjects.id', $subjectId);
            });
        }

        $students = $query->get();

        $gradebook = $students->map(function ($student) use ($subjectId) {
            $quizResults = $student->quizResults;
            if ($subjectId) {
                $quizResults = $quizResults->filter(function($qr) use ($subjectId) {
                    return $qr->lesson?->subUnit?->unit?->subject_id == $subjectId;
                });
            }
            $totalQuizzes = $quizResults->count();
            $correctQuizzes = $quizResults->where('is_correct', true)->count();
            $quizAvg = $totalQuizzes > 0 ? ($correctQuizzes / $totalQuizzes) * 100 : 0;

            $quizAttempts = $student->quizAttempts;
            if ($subjectId) {
                $subject = Subject::find($subjectId);
                $titleId = $subject?->subject_title_id;
                $levelId = $subject?->academic_level_id;
                
                $quizAttempts = $quizAttempts->filter(function($qa) use ($titleId, $levelId) {
                    $quiz = $qa->quiz;
                    if (!$quiz) return false;
                    return $quiz->subject_title_id == $titleId && 
                           ($quiz->academic_level_id === null || $quiz->academic_level_id == $levelId);
                });
            }
            $standaloneQuizAvg = $quizAttempts->count() > 0 
                ? $quizAttempts->map(fn($qa) => ($qa->total_points > 0 ? ($qa->score / $qa->total_points) * 100 : 0))->avg() 
                : 0;

            $assignmentSubmissions = $student->assignmentSubmissions;
            if ($subjectId) {
                $subject = Subject::find($subjectId);
                $titleId = $subject?->subject_title_id;
                $levelId = $subject?->academic_level_id;

                $assignmentSubmissions = $assignmentSubmissions->filter(function($as) use ($titleId, $levelId) {
                    $assignment = $as->assignment;
                    if (!$assignment) return false;
                    return $assignment->subject_title_id == $titleId && 
                           ($assignment->academic_level_id === null || $assignment->academic_level_id == $levelId);
                });
            }
            $assignmentAvg = $assignmentSubmissions->avg('score') ?? 0;

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

        $leaderboard = $gradebook->sortByDesc('average')->values();
        $stats = [
            'totalStudents' => $students->count(),
            'schoolAverage' => round($gradebook->avg('average')),
            'atRiskCount' => $gradebook->where('flagged', true)->count()
        ];

        return response()->json([
            'gradebook' => $gradebook,
            'leaderboard' => $leaderboard,
            'stats' => $stats,
            'subjects' => Subject::with(['title', 'academicLevel'])->get()
        ]);
    }

    public function show($userId)
    {
        $student = User::where('role', 'student')
            ->where('id', $userId)
            ->with([
                'quizResults.lesson.subUnit.unit.subject.title',
                'quizAttempts.quiz.subjectTitle',
                'assignmentSubmissions.assignment.subjectTitle',
                'academicLevel'
            ])
            ->firstOrFail();

        // Group interactive quiz results by subject title
        $quizBreakdown = $student->quizResults->groupBy(function($res) {
            return $res->lesson?->subUnit?->unit?->subject?->title?->name ?? 'Other';
        })->map(function($results) {
            return [
                'count' => $results->count(),
                'correct' => $results->where('is_correct', true)->count(),
                'avg' => round($results->count() > 0 ? ($results->where('is_correct', true)->count() / $results->count()) * 100 : 0)
            ];
        });

        // Group standalone quizzes by subject title
        $standaloneQuizBreakdown = $student->quizAttempts->groupBy(function($qa) {
            return $qa->quiz?->subjectTitle?->name ?? 'Other';
        })->map(function($attempts) {
            return [
                'count' => $attempts->count(),
                'avg' => round($attempts->map(fn($qa) => ($qa->total_points > 0 ? ($qa->score / $qa->total_points) * 100 : 0))->avg() ?? 0)
            ];
        });

        // Group assignments by subject title
        $assignmentBreakdown = $student->assignmentSubmissions->groupBy(function($sub) {
            return $sub->assignment?->subjectTitle?->name ?? 'Other';
        })->map(function($subs) {
            return [
                'count' => $subs->count(),
                'avg' => round($subs->avg('score') ?? 0)
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
