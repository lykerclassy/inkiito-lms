<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Subject;
use Illuminate\Http\Request;

class StudentQuizController extends Controller
{
    /**
     * List all active quizzes available for the student's subjects.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $subjectIds = $user->subjects->pluck('id');

        $quizzes = Quiz::whereIn('subject_id', $subjectIds)
            ->where('is_active', true)
            ->with(['subject'])
            ->withCount('questions')
            ->latest()
            ->get();

        // Check for existing attempts
        $attempts = QuizAttempt::where('user_id', $user->id)
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->get()
            ->groupBy('quiz_id');

        $quizzes = $quizzes->map(function ($quiz) use ($attempts) {
            $quizAttempts = $attempts->get($quiz->id);
            $quiz->best_score = $quizAttempts ? $quizAttempts->max('score') : null;
            $quiz->attempted_count = $quizAttempts ? $quizAttempts->count() : 0;
            return $quiz;
        });

        return response()->json($quizzes);
    }

    /**
     * Start/View a specific quiz.
     */
    public function show($id)
    {
        $quiz = Quiz::with(['questions' => function($q) {
            // We might want to shuffle or hide answers initially, 
            // but for simplicity we return questions with options.
            // Note: correct_answer is returned but should be handled carefully on frontend.
        }, 'subject'])->findOrFail($id);
        
        return response()->json($quiz);
    }

    /**
     * Submit quiz answers.
     */
    public function submit(Request $request, $id)
    {
        $quiz = Quiz::with('questions')->findOrFail($id);
        $user = $request->user();
        $answers = $request->input('answers', []); // format: [question_id => selected_answer]
        
        $score = 0;
        $totalPoints = 0;
        $details = [];

        foreach ($quiz->questions as $question) {
            $totalPoints += $question->points;
            $studentAnswer = $answers[$question->id] ?? null;
            $isCorrect = ($studentAnswer == $question->correct_answer);
            
            if ($isCorrect) {
                $score += $question->points;
            }

            $details[] = [
                'question_id' => $question->id,
                'is_correct' => $isCorrect,
                'correct_answer' => $question->correct_answer,
                'student_answer' => $studentAnswer
            ];
        }

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'score' => $score,
            'total_points' => $totalPoints,
            'started_at' => $request->has('started_at') ? \Carbon\Carbon::parse($request->input('started_at'))->toDateTimeString() : now(),
            'completed_at' => now()
        ]);

        return response()->json([
            'message' => 'Quiz submitted successfully!',
            'attempt' => $attempt,
            'details' => $details
        ]);
    }
}
