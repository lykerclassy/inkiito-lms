<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function index()
    {
        // Only fetching students for the gradebook
        $students = User::where('role', 'student')
            ->with(['quizResults', 'assignmentSubmissions', 'academicLevel'])
            ->get();

        $gradebook = $students->map(function ($student) {
            // QUIZZES: calculate % where is_correct is true
            $totalQuizzes = $student->quizResults->count();
            $correctQuizzes = $student->quizResults->where('is_correct', true)->count();
            $quizAvg = $totalQuizzes > 0 ? ($correctQuizzes / $totalQuizzes) * 100 : 0;

            // ASSIGNMENTS: average of the 'score' column
            $assignmentAvg = $student->assignmentSubmissions->avg('score') ?? 0;

            // OVERALL: simplified weighted average
            if ($totalQuizzes > 0 && $student->assignmentSubmissions->count() > 0) {
                $overall = ($quizAvg + $assignmentAvg) / 2;
            } elseif ($totalQuizzes > 0) {
                $overall = $quizAvg;
            } else {
                $overall = $assignmentAvg;
            }

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
                'assignment_avg' => round($assignmentAvg)
            ];
        });

        // Quick Stats aggregation
        $stats = [
            'totalStudents' => $students->count(),
            'schoolAverage' => round($gradebook->avg('average')),
            'missingAssignments' => 0, // In a real app we'd compare against all assignments available to that student's subjects
            'atRiskCount' => $gradebook->where('flagged', true)->count()
        ];

        return response()->json([
            'students' => $gradebook,
            'stats' => $stats
        ]);
    }

    public function show($userId)
    {
        $student = User::where('role', 'student')
            ->where('id', $userId)
            ->with([
                'quizResults.lesson.subUnit.unit.subject',
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
            'assignments' => $assignmentBreakdown
        ]);
    }
}
