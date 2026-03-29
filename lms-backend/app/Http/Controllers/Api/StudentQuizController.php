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
        $titleIds = $user->subjects->pluck('subject_title_id');
        $academicLevelId = $user->academic_level_id;

        $quizzes = Quiz::whereIn('subject_title_id', $titleIds)
            ->where(function($q) use ($academicLevelId) {
                // Return quizzes that are either:
                // 1. Available for all levels (academic_level_id is NULL)
                // 2. Restricted specifically to the student's level
                $q->whereNull('academic_level_id')
                  ->orWhere('academic_level_id', $academicLevelId);
            })
            ->where('is_active', true)
            ->with(['subjectTitle', 'academicLevel'])
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
        $quiz = Quiz::with(['questions', 'subjectTitle', 'academicLevel'])->findOrFail($id);
        
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
                'student_answer' => $studentAnswer,
                'feedback_correct' => $question->feedback_correct,
                'feedback_incorrect' => $question->feedback_incorrect
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
