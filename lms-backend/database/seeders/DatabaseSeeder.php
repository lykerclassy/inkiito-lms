<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Curriculum;
use App\Models\AcademicLevel;
use App\Models\Subject;
use App\Models\Unit;
use App\Models\SubUnit;
use App\Models\Lesson;
use App\Models\LessonBlock;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create the Curriculums
        $cbc = Curriculum::create(['name' => 'CBC']);
        $system844 = Curriculum::create(['name' => '8-4-4']);

        // 2. Create the Academic Levels
        $grade10 = AcademicLevel::create([
            'curriculum_id' => $cbc->id,
            'name' => 'Grade 10'
        ]);
        
        $form3 = AcademicLevel::create([
            'curriculum_id' => $system844->id,
            'name' => 'Form 3'
        ]);

        // 3. Create Users
        // The Master Admin/Teacher (Logs in with Email and Password)
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@inkiitomanoh.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // A Test Student enrolled in Grade 10 CBC (Logs in with Admission Number and Access Key)
        User::create([
            'name' => 'Test Student',
            'email' => 'im-2026-001@student.inkiitomanoh.com', // Dummy email for DB constraints
            'admission_number' => 'IM-2026-001',
            'access_key' => 'K9X2B1',
            'password' => Hash::make(Str::random(12)), // Unused password
            'role' => 'student',
            'curriculum_id' => $cbc->id,
            'academic_level_id' => $grade10->id,
        ]);

        // 4. Create a Subject
        $computerStudies = Subject::create([
            'academic_level_id' => $grade10->id,
            'name' => 'Computer Studies'
        ]);

        // 5. Create a Unit (Strand)
        $unit = Unit::create([
            'subject_id' => $computerStudies->id,
            'title' => 'Foundations of Computer Systems',
            'order' => 1
        ]);

        // 6. Create a Sub-Unit (Sub-Strand)
        $subUnit = SubUnit::create([
            'unit_id' => $unit->id,
            'title' => 'Historical Development of Computers',
            'order' => 1
        ]);

        // 7. Create the Lesson
        $lesson = Lesson::create([
            'sub_unit_id' => $subUnit->id,
            'title' => 'Evolution of Mechanical Computers',
            'order' => 1,
            'is_published' => true
        ]);

        // 8. Create the Interactive Lesson Blocks
        
        // Block 1: Theory Notes
        LessonBlock::create([
            'lesson_id' => $lesson->id,
            'type' => 'text',
            'order' => 1,
            'content' => [
                'html' => '<h3>The Era of Mechanical Computing</h3><p>Before electricity, computing was done using purely mechanical devices operated by hand. The earliest known device is the <strong>Abacus</strong>, invented over 5000 years ago, which used sliding beads to perform addition and subtraction.</p><p>In 1617, a major leap occurred with the invention of <strong>Napier\'s Bones</strong>. Created by John Napier, this device allowed users to perform multiplication and division using a set of numbered rods. By aligning the rods according to the digits of the multiplicand and reading diagonally, complex calculations were greatly simplified without needing electricity.</p>'
            ]
        ]);

        // Block 2: Visual Representation
        LessonBlock::create([
            'lesson_id' => $lesson->id,
            'type' => 'image',
            'order' => 2,
            'content' => [
                'url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Napiers_bones.jpg/800px-Napiers_bones.jpg',
                'caption' => 'A traditional set of Napier\'s Bones used for multiplication.'
            ]
        ]);

        // Block 3: Knowledge Check Quiz
        LessonBlock::create([
            'lesson_id' => $lesson->id,
            'type' => 'quiz',
            'order' => 3,
            'content' => [
                'question' => 'Which mechanical calculating device utilized a set of numbered rods to perform multiplication diagonally?',
                'options' => [
                    'The Abacus',
                    'The Pascaline',
                    'Napier\'s Bones',
                    'The Slide Rule'
                ],
                'correct_answer' => 'Napier\'s Bones'
            ]
        ]);
        // 9. Enroll the Test Student in Computer Studies with an 'active' (Red Tick) status
        $testStudent = User::where('admission_number', 'IM-2026-001')->first();
        if ($testStudent) {
            $testStudent->subjects()->attach($computerStudies->id, ['status' => 'active']);
        }
    }
}