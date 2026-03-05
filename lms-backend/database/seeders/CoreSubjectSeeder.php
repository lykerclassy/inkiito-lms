<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class CoreSubjectSeeder extends Seeder
{
    public function run()
    {
        $level = \App\Models\AcademicLevel::where('name', 'Grade 10')->orWhere('name', 'Form 3')->first();
        if (!$level) return;

        $subjects = [
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'Geography',
            'History',
            'Art and Design',
            'Agriculture',
            'Business Studies',
            'Christian Religious Education',
        ];

        foreach ($subjects as $sName) {
            Subject::updateOrCreate(
                ['name' => $sName, 'academic_level_id' => $level->id],
                ['academic_level_id' => $level->id]
            );
        }
    }
}
