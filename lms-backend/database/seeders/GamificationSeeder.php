<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubjectTitle;
use App\Models\Quiz;
use App\Models\QuizQuestion;

class GamificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // 1. Get or create root subjects
        $math = SubjectTitle::firstOrCreate(['name' => 'Mathematics']);
        $science = SubjectTitle::firstOrCreate(['name' => 'Science']);
        $history = SubjectTitle::firstOrCreate(['name' => 'History']);
        
        $admin = \App\Models\User::where('role', 'admin')->first();
        $adminId = $admin ? $admin->id : 1;
        
        // 2. Create the Quizzes
        $quizMath = Quiz::firstOrCreate(['title' => 'Math Challenge'], [
            'subject_title_id' => $math->id,
            'description' => 'Basic rapid-fire math questions.',
            'is_active' => true,
            'created_by' => $adminId
        ]);
        
        $quizScience = Quiz::firstOrCreate(['title' => 'Science Trivia'], [
            'subject_title_id' => $science->id,
            'description' => 'Test your knowledge on physics and biology.',
            'is_active' => true,
            'created_by' => $adminId
        ]);
        
        $quizHistory = Quiz::firstOrCreate(['title' => 'World History'], [
            'subject_title_id' => $history->id,
            'description' => 'Important historical events.',
            'is_active' => true,
            'created_by' => $adminId
        ]);

        // 3. Populate Gamification Quiz Questions (Wheel Slices)
        $questions = [
            // Math
            [
                'quiz_id' => $quizMath->id,
                'question_text' => 'What is 15 * 6?',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => '70', 'B' => '80', 'C' => '90', 'D' => '100']),
                'correct_answer' => 'C',
                'points' => 30,
                'feedback_correct' => 'Perfect execution!',
                'feedback_incorrect' => '15 * 6 is 90.'
            ],
            [
                'quiz_id' => $quizMath->id,
                'question_text' => 'Solve for x: 2x + 5 = 15',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => 'x = 5', 'B' => 'x = 10', 'C' => 'x = 4', 'D' => 'x = 6']),
                'correct_answer' => 'A',
                'points' => 50,
                'feedback_correct' => 'Great algebra skills!',
                'feedback_incorrect' => 'Subtract 5, then divide by 2. x = 5.'
            ],
            [
                'quiz_id' => $quizMath->id,
                'question_text' => 'What is the square root of 144?',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => '10', 'B' => '12', 'C' => '14', 'D' => '16']),
                'correct_answer' => 'B',
                'points' => 20,
                'feedback_correct' => 'Spot on!',
                'feedback_incorrect' => '12 * 12 = 144.'
            ],
            // Science
            [
                'quiz_id' => $quizScience->id,
                'question_text' => 'What planet is known as the Red Planet?',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => 'Venus', 'B' => 'Mars', 'C' => 'Jupiter', 'D' => 'Saturn']),
                'correct_answer' => 'B',
                'points' => 15,
                'feedback_correct' => 'Yes! Mars is the Red Planet.',
                'feedback_incorrect' => 'It is Mars, due to iron oxide.'
            ],
            [
                'quiz_id' => $quizScience->id,
                'question_text' => 'What is the chemical symbol for Gold?',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => 'Ag', 'B' => 'Au', 'C' => 'Go', 'D' => 'Pt']),
                'correct_answer' => 'B',
                'points' => 25,
                'feedback_correct' => 'Aurum is the Latin word.',
                'feedback_incorrect' => 'It is Au from the Latin Aurum.'
            ],
            [
                'quiz_id' => $quizScience->id,
                'question_text' => 'What gas do plants absorb from the atmosphere?',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => 'Oxygen', 'B' => 'Nitrogen', 'C' => 'Carbon Dioxide', 'D' => 'Hydrogen']),
                'correct_answer' => 'C',
                'points' => 10,
                'feedback_correct' => 'Photosynthesis at work!',
                'feedback_incorrect' => 'Plants absorb Carbon Dioxide.'
            ],
            // History
            [
                'quiz_id' => $quizHistory->id,
                'question_text' => 'In what year did World War II end?',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => '1940', 'B' => '1945', 'C' => '1950', 'D' => '1939']),
                'correct_answer' => 'B',
                'points' => 45,
                'feedback_correct' => 'Correct!',
                'feedback_incorrect' => 'WWII ended in 1945.'
            ],
            [
                'quiz_id' => $quizHistory->id,
                'question_text' => 'Who was the first President of the United States?',
                'question_type' => 'multiple_choice',
                'options' => json_encode(['A' => 'John Adams', 'B' => 'George Washington', 'C' => 'Abraham Lincoln', 'D' => 'Thomas Jefferson']),
                'correct_answer' => 'B',
                'points' => 15,
                'feedback_correct' => 'Correct.',
                'feedback_incorrect' => 'It was George Washington.'
            ]
        ];

        foreach ($questions as $q) {
            QuizQuestion::updateOrCreate([
                'quiz_id' => $q['quiz_id'],
                'question_text' => $q['question_text']
            ], $q);
        }
    }
}
