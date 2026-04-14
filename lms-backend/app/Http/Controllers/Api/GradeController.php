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
        $titleId = $request->query('subject_title_id');
        $levelId = $request->query('academic_level_id');
        $curriculumId = $request->query('curriculum_id');
        $user = $request->user();
        
        $query = User::where('role', 'student')
            ->with(['quizResults.lesson.subUnit.unit.subject.title', 'quizAttempts.quiz.subjectTitle', 'assignmentSubmissions.assignment.subjectTitle', 'academicLevel']);

        // Strict Curriculum Isolation
        if ($user && $user->role === 'student') {
            $query->where('curriculum_id', $user->curriculum_id);
        } elseif ($curriculumId) {
            $query->where('curriculum_id', $curriculumId);
        }

        if ($levelId) {
            $query->where('academic_level_id', $levelId);
        }

        if ($titleId) {
            $query->whereHas('subjects', function($q) use ($titleId) {
                $q->where('subject_title_id', $titleId);
            });
        }

        $students = $query->get();

        $gradebook = $students->map(function ($student) use ($titleId) {
            $quizResults = $student->quizResults;
            if ($titleId) {
                $quizResults = $quizResults->filter(function($qr) use ($titleId) {
                    return $qr->lesson?->subUnit?->unit?->subject?->subject_title_id == $titleId;
                });
            }
            $totalQuizzes = $quizResults->count();
            $correctQuizzes = $quizResults->where('is_correct', true)->count();
            $quizAvg = $totalQuizzes > 0 ? ($correctQuizzes / $totalQuizzes) * 100 : 0;

            $quizAttempts = $student->quizAttempts;
            if ($titleId) {
                $quizAttempts = $quizAttempts->filter(function($qa) use ($titleId) {
                    return $qa->quiz?->subject_title_id == $titleId;
                });
            }
            $standaloneQuizAvg = $quizAttempts->count() > 0 
                ? $quizAttempts->map(fn($qa) => ($qa->total_points > 0 ? ($qa->score / $qa->total_points) * 100 : 0))->avg() 
                : 0;

            $assignmentSubmissions = $student->assignmentSubmissions;
            if ($titleId) {
                $assignmentSubmissions = $assignmentSubmissions->filter(function($as) use ($titleId) {
                    return $as->assignment?->subject_title_id == $titleId;
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

        $subjectTitles = \App\Models\SubjectTitle::orderBy('name')->get();
        if ($user->role === 'student') {
            $subjectTitles = $user->subjects()->with('title')->get()
                                  ->pluck('title')
                                  ->filter()
                                  ->unique('id')
                                  ->values();
        }

        return response()->json([
            'gradebook' => $gradebook,
            'leaderboard' => $leaderboard,
            'stats' => $stats,
            'subject_titles' => $subjectTitles,
            'academic_levels' => \App\Models\AcademicLevel::all(),
            'curriculums' => \App\Models\Curriculum::all()
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
