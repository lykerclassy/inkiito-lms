<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizResult;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    // Save a student's answer to a specific quiz block
    public function submitAnswer(Request $request)
    {
        $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'lesson_block_id' => 'required|exists:lesson_blocks,id',
            'student_answer' => 'required|string',
            'is_correct' => 'required|boolean',
        ]);

        $user = $request->user();

        // updateOrCreate ensures we overwrite their old score if they retake it
        $result = QuizResult::updateOrCreate(
            [
                'user_id' => $user->id,
                'lesson_block_id' => $request->lesson_block_id,
            ],
            [
                'lesson_id' => $request->lesson_id,
                'student_answer' => $request->student_answer,
                'is_correct' => $request->is_correct,
            ]
        );

        return response()->json(['message' => 'Answer recorded successfully', 'result' => $result]);
    }

    // Fetch the logged-in student's grades across all quizzes
    public function myGrades(Request $request)
    {
        $user = $request->user();

        // Get all quiz results, eager load the lesson and the lesson's subunit/unit/subject to construct a report card
        $results = QuizResult::where('user_id', $user->id)
            ->with(['lesson.subUnit.unit.subject'])
            ->get();

        return response()->json($results);
    }
}