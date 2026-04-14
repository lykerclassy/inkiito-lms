<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\QuizQuestion;
use App\Models\User;

class GamificationController extends Controller
{
    /**
     * Fetch a set of 8 random questions for the Daily Spin wheel.
     * We purposefully DONT return the correct_answer to prevent client-side cheating.
     */
    public function getWheelQuestions(Request $request)
    {
        $user = $request->user();
        
        // Retrieve the Title IDs the student is actively enrolled in
        $titleIds = $user->subjects ? $user->subjects->pluck('subject_title_id') : collect([]);
        $academicLevelId = $user->academic_level_id;

        // Base Query: Only questions from explicitly ACTIVE quizzes
        $baseQuery = QuizQuestion::with('quiz.subjectTitle')
            ->whereHas('quiz', function($q) {
                $q->where('is_active', true);
            });

        // 1. Personalized Query: Only fetch questions mapped to the student's exact subjects and level
        $personalizedQuestions = (clone $baseQuery)
            ->whereHas('quiz', function($q) use ($titleIds, $academicLevelId) {
                $q->whereIn('subject_title_id', $titleIds)
                  ->where(function($levelQ) use ($academicLevelId) {
                      $levelQ->whereNull('academic_level_id')
                             ->orWhere('academic_level_id', $academicLevelId);
                  });
            })
            ->inRandomOrder()
            ->take(8)
            ->get();

        // 2. Fallback Padding: To prevent the physical UI wheel from crashing/looking empty if teachers haven't written 8 questions yet,
        // we pad any remaining slots with random general-knowledge active questions.
        if ($personalizedQuestions->count() < 8) {
            $neededLength = 8 - $personalizedQuestions->count();
            $excludedIds = $personalizedQuestions->pluck('id');
            
            $fallbackQuestions = (clone $baseQuery)
                ->whereNotIn('id', $excludedIds)
                ->inRandomOrder()
                ->take($neededLength)
                ->get();
                
            $questions = $personalizedQuestions->concat($fallbackQuestions)->shuffle();
        } else {
            $questions = $personalizedQuestions;
        }
            
        // Map to hide correct answers and simplify data structure
        $wheelQuestions = $questions->map(function($q) {
            return [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'question_type' => $q->question_type,
                'options' => is_string($q->options) ? json_decode($q->options, true) : $q->options,
                'points' => $q->points ?: 10, // Default 10 if missing
                'subject' => $q->quiz && $q->quiz->subjectTitle ? $q->quiz->subjectTitle->name : 'General Knowledge'
            ];
        });
        
        return response()->json($wheelQuestions);
    }

    /**
     * Submit an answer for the spun question.
     */
    public function submitSpinAnswer(Request $request)
    {
        $request->validate([
            'question_id' => 'required|exists:quiz_questions,id',
            'answer' => 'required|string'
        ]);

        $user = $request->user();
        $question = QuizQuestion::findOrFail($request->question_id);
        
        // Anti-cheat verification
        $submitted = strtolower(trim($request->answer));
        $expected = strtolower(trim($question->correct_answer));
        
        $isCorrect = ($submitted === $expected);

        // Intelligent resolution: Check if the frontend submitted a key (e.g. "A" or "0") 
        // while the database expected a label (e.g. "George Washington"), or vice-versa.
        if (!$isCorrect && !empty($question->options)) {
            $options = is_string($question->options) ? json_decode($question->options, true) : $question->options;
            
            if (is_array($options)) {
                // If submitted is a key (e.g. "A"), check if its label matches the expected answer
                if (isset($options[$request->answer]) && strtolower(trim($options[$request->answer])) === $expected) {
                    $isCorrect = true;
                }
                // If submitted is a label (e.g. "70"), check if its key matches the expected answer (Seeder handling)
                $keyByValue = array_search(trim($request->answer), $options);
                if ($keyByValue !== false && strtolower(trim($keyByValue)) === $expected) {
                    $isCorrect = true;
                }
                // Finally, if both submitted and expected are keys or labels, handle mismatched arrays
                if (isset($options[$request->answer]) && isset($options[$question->correct_answer]) && 
                    strtolower(trim($options[$request->answer])) === strtolower(trim($options[$question->correct_answer]))) {
                    $isCorrect = true;
                }
            }
        }
        
        if ($isCorrect) {
            $pointsEarned = $question->points ?: 10;
            $user->gamification_points += $pointsEarned;
            $user->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Correct! You earned ' . $pointsEarned . ' points.',
                'points_earned' => $pointsEarned,
                'new_total_points' => $user->gamification_points,
                'feedback' => $question->feedback_correct
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Incorrect answer.',
            'points_earned' => 0,
            'new_total_points' => $user->gamification_points,
            'correct_answer' => $question->correct_answer, // Only reveal after an attempt
            'feedback' => $question->feedback_incorrect
        ]);
    }
}
