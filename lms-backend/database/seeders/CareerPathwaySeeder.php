<?php

namespace Database\Seeders;

use App\Models\Pathway;
use App\Models\Career;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class CareerPathwaySeeder extends Seeder
{
    public function run()
    {
        // Clean up existing data to ensure "ONLY 3" pathways
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Career::truncate();
        Pathway::truncate();
        DB::table('career_subject')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. STEM
        $stem = Pathway::create([
            'name' => 'STEM',
            'description' => 'Science, Technology, Engineering, and Mathematics. Driving innovation through logic and discovery.',
            'color_code' => 'blue',
            'icon' => 'Microscope'
        ]);

        // 2. Social Sciences
        $social = Pathway::create([
            'name' => 'Social Sciences',
            'description' => 'Humanities, Economics, and Business. Understanding human behavior, society, and commerce.',
            'color_code' => 'emerald',
            'icon' => 'Users'
        ]);

        // 3. Art and Sports
        $arts = Pathway::create([
            'name' => 'Art and Sports',
            'description' => 'Creativity, Performance, and Physical excellence. Focusing on expression and athletic achievement.',
            'color_code' => 'amber',
            'icon' => 'Palette'
        ]);

        // Fetch subjects for linking
        $math = Subject::where('name', 'Mathematics')->first();
        $phy = Subject::where('name', 'Physics')->first();
        $comp = Subject::where('name', 'Computer Science')->first();
        $bio = Subject::where('name', 'Biology')->first();
        $artS = Subject::where('name', 'Art and Design')->first();
        $bus = Subject::where('name', 'Business Studies')->first();

        // Sample Careers with Tracks
        
        // --- STEM TRACKS ---
        $this->createCareer($stem->id, 'Software & Systems', 'Software Engineer', 'designs-software', $math, $comp);
        $this->createCareer($stem->id, 'Medicine & Health', 'Medical Doctor', 'doctor', $math, $bio, true);
        $this->createCareer($stem->id, 'Engineering', 'Aeronautical Engineer', 'aero-eng', $math, $phy);

        // --- SOCIAL SCIENCE TRACKS ---
        $this->createCareer($social->id, 'Finance & Business', 'Public Accountant', 'accountant', $math, $bus);
        $this->createCareer($social->id, 'Law & Governance', 'Corporate Lawyer', 'lawyer', null, null);
        $this->createCareer($social->id, 'Economics', 'Market Researcher', 'market-research', $bus, null);

        // --- ART & SPORTS TRACKS ---
        $this->createCareer($arts->id, 'Creative Arts', 'Graphic Designer', 'graphic-designer', null, $artS);
        $this->createCareer($arts->id, 'Performing Arts', 'Actor/Performer', 'actor', null, null);
        $this->createCareer($arts->id, 'Sports Science', 'Sports Therapist', 'sports-therapist', $bio, null);
    }

    private function createCareer($pathwayId, $track, $name, $slug, $math = null, $extra = null, $extraIsMandatory = false)
    {
        $career = Career::create([
            'pathway_id' => $pathwayId,
            'track' => $track,
            'name' => $name,
            'slug' => $slug,
            'description' => "Professional path in $track focused on $name.",
            'salary_range' => 'KSh 100k - 300k',
            'outlook' => 'Growth',
            'qualifications' => 'Relevant Bachelor\'s Degree.',
            'skills' => 'Focus, Discipline, Technical Knowledge',
            'typical_employers' => 'Various Industry Leaders'
        ]);

        if ($math) {
            $career->subjects()->attach($math->id, ['is_mandatory' => true]);
        }
        if ($extra) {
            $career->subjects()->attach($extra->id, ['is_mandatory' => $extraIsMandatory]);
        }
    }
}
