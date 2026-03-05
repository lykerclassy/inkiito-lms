<?php

namespace Database\Seeders;

use App\Models\Pathway;
use App\Models\Career;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CareerPathwaySeeder extends Seeder
{
    public function run()
    {
        $stem = Pathway::updateOrCreate(['name' => 'STEM'], [
            'description' => 'Science, Technology, Engineering and Mathematics. Focusing on research, innovation and technical expertise.',
            'color_code' => 'blue',
            'icon' => 'Microscope'
        ]);

        $social = Pathway::updateOrCreate(['name' => 'Social Sciences'], [
            'description' => 'Humanities, Economics, and Business. Focusing on understanding society, behavior, and commerce.',
            'color_code' => 'emerald',
            'icon' => 'Users'
        ]);

        $arts = Pathway::updateOrCreate(['name' => 'Arts & Sports Science'], [
            'description' => 'Creativity, Performance and Physical education. Focusing on cultural expression and athletic excellence.',
            'color_code' => 'amber',
            'icon' => 'Palette'
        ]);

        // Subjects
        $math = Subject::where('name', 'Mathematics')->first();
        $phy = Subject::where('name', 'Physics')->first();
        $comp = Subject::where('name', 'Computer Science')->first();
        $bio = Subject::where('name', 'Biology')->first();
        $chem = Subject::where('name', 'Chemistry')->first();
        $bus = Subject::where('name', 'Business Studies')->first();
        $artS = Subject::where('name', 'Art and Design')->first();

        // Careers for STEM
        $softEng = Career::updateOrCreate(['slug' => 'software-engineer'], [
            'pathway_id' => $stem->id,
            'name' => 'Software Engineer',
            'description' => 'Designs and develops software systems, applications, and platforms using programming languages.',
            'salary_range' => 'KSh 150k - 400k',
            'outlook' => 'High Growth',
            'qualifications' => 'BSc. Computer Science, Software Engineering or related field. Coding bootcamp certifications also recognized.',
            'skills' => 'Problem Solving, JavaScript, Python, System Design, Teamwork, Git',
            'typical_employers' => 'Tech Giants, Fintech startups, Banks, E-commerce platforms'
        ]);
        if ($math) $softEng->subjects()->syncWithoutDetaching([$math->id => ['is_mandatory' => true]]);
        if ($phy) $softEng->subjects()->syncWithoutDetaching([$phy->id => ['is_mandatory' => false]]);
        if ($comp) $softEng->subjects()->syncWithoutDetaching([$comp->id => ['is_mandatory' => false]]);

        $doc = Career::updateOrCreate(['slug' => 'medical-doctor'], [
            'pathway_id' => $stem->id,
            'name' => 'Medical Doctor',
            'description' => 'Diagnoses and treats illnesses, injuries, and health conditions in patients.',
            'salary_range' => 'KSh 200k - 600k',
            'outlook' => 'Steady',
            'qualifications' => 'Bachelor of Medicine and Bachelor of Surgery (MBChB). 1-year internship and registration by KMPDC.',
            'skills' => 'Diagnosis, Patient Care, Empathy, Critical Thinking, Surgical Precision',
            'typical_employers' => 'Public Hospitals, Private Clinics, NGOs, Research Institutions'
        ]);
        if ($math) $doc->subjects()->syncWithoutDetaching([$math->id => ['is_mandatory' => true]]);
        if ($bio) $doc->subjects()->syncWithoutDetaching([$bio->id => ['is_mandatory' => true]]);
        if ($chem) $doc->subjects()->syncWithoutDetaching([$chem->id => ['is_mandatory' => true]]);

        // Careers for Social Sciences
        $acc = Career::updateOrCreate(['slug' => 'public-accountant'], [
            'pathway_id' => $social->id,
            'name' => 'Public Accountant',
            'description' => 'Manages financial records, audits books, and provides tax and financial advice.',
            'salary_range' => 'KSh 80k - 250k',
            'outlook' => 'Steady',
            'qualifications' => 'BCom (Accounting option). Professional certification (CPA-K or ACCA) is highly recommended.',
            'skills' => 'Auditing, Financial Reporting, Tax Law, Attention to Detail, Integrity',
            'typical_employers' => 'Audit Firms (Big Four), Government Agencies, Corporate Finance Depts'
        ]);
        if ($math) $acc->subjects()->syncWithoutDetaching([$math->id => ['is_mandatory' => true]]);
        if ($bus) $acc->subjects()->syncWithoutDetaching([$bus->id => ['is_mandatory' => true]]);

        // Careers for Arts
        $design = Career::updateOrCreate(['slug' => 'graphic-designer'], [
            'pathway_id' => $arts->id,
            'name' => 'Graphic Designer',
            'description' => 'Creates visual concepts to communicate ideas that inspire, inform, or captivate consumers.',
            'salary_range' => 'KSh 50k - 150k',
            'outlook' => 'Growth',
            'qualifications' => 'Degree or Diploma in Graphic Design, Fine Arts or related. Portfolio is critical.',
            'skills' => 'Adobe Creative Suite, Typography, Branding, Visual Communication',
            'typical_employers' => 'Ad Agencies, Media Houses, Corporate Marketing Teams, Freelance'
        ]);
        if ($artS) $design->subjects()->syncWithoutDetaching([$artS->id => ['is_mandatory' => true]]);

        // ADDITIONAL DATA FOR TRIAL
        // 1. Aeronautical Engineer (STEM)
        $aero = Career::updateOrCreate(['slug' => 'aeronautical-engineer'], [
            'pathway_id' => $stem->id,
            'name' => 'Aeronautical Engineer',
            'description' => 'Designs, develops, and tests aircraft, missiles, and spacecraft.',
            'salary_range' => 'KSh 250k - 700k',
            'outlook' => 'High Growth',
            'qualifications' => 'Bachelor of Engineering in Aerospace/Aeronautical Engineering.',
            'skills' => 'Aerodynamics, Propulsion, Structural Analysis, CAD, Critical Thinking',
            'typical_employers' => 'Airlines, Kenya Civil Aviation Authority, International Space Agencies'
        ]);
        if ($math) $aero->subjects()->syncWithoutDetaching([$math->id => ['is_mandatory' => true]]);
        if ($phy) $aero->subjects()->syncWithoutDetaching([$phy->id => ['is_mandatory' => true]]);

        // 2. Finance Manager (Social Sciences)
        $finMan = Career::updateOrCreate(['slug' => 'finance-manager'], [
            'pathway_id' => $social->id,
            'name' => 'Finance Manager',
            'description' => 'Oversees the financial health of an organization and produces financial reports.',
            'salary_range' => 'KSh 150k - 500k',
            'outlook' => 'Growth',
            'qualifications' => 'BCom Finance/Economics. Professional qualification like CFA or CIFA.',
            'skills' => 'Strategic Planning, Risk Management, Financial Modeling, Data Analysis',
            'typical_employers' => 'Investment Banks, Insurance Companies, Multi-national Corporations'
        ]);
        if ($math) $finMan->subjects()->syncWithoutDetaching([$math->id => ['is_mandatory' => true]]);
        if ($bus) $finMan->subjects()->syncWithoutDetaching([$bus->id => ['is_mandatory' => true]]);

        // 3. Creative Arts Director (Arts)
        $artDir = Career::updateOrCreate(['slug' => 'creative-arts-director'], [
            'pathway_id' => $arts->id,
            'name' => 'Creative Arts Director',
            'description' => 'Responsible for the visual style and images in magazines, newspapers, product packaging, and movie/TV productions.',
            'salary_range' => 'KSh 100k - 300k',
            'outlook' => 'Steady',
            'qualifications' => 'B.A. in Fine Arts, Performance Arts or Film Studies.',
            'skills' => 'Artistic Vision, Leadership, Photography, Project Management',
            'typical_employers' => 'Film Studios, Advertising Agencies, Publishing Houses'
        ]);
        if ($artS) $artDir->subjects()->syncWithoutDetaching([$artS->id => ['is_mandatory' => true]]);

        // --- NEW PATHWAY: AGRICULTURE & NATURAL RESOURCES ---
        $agri = Pathway::updateOrCreate(['name' => 'Agriculture & Environments'], [
            'description' => 'Sustainable farming, conservation and climate action. Focusing on food security and ecological balance.',
            'color_code' => 'emerald',
            'icon' => 'Leaf'
        ]);

        $crev = Subject::where('name', 'Geography')->first();
        $agriS = Subject::where('name', 'Agriculture')->first();

        // 1. Agricultural Engineer
        $agriEng = Career::updateOrCreate(['slug' => 'agricultural-engineer'], [
            'pathway_id' => $agri->id,
            'name' => 'Agricultural Engineer',
            'description' => 'Applies engineering technology and biological science to agricultural problems and environmental conservation.',
            'salary_range' => 'KSh 120k - 350k',
            'outlook' => 'Growth',
            'qualifications' => 'BSc. in Agricultural or Biosystems Engineering.',
            'skills' => 'Machine Design, Irrigation Systems, Sustainability, Technical Drawing',
            'typical_employers' => 'Equipment Manufacturers, Large Scale Farms, Ministry of Agriculture'
        ]);
        if ($math) $agriEng->subjects()->syncWithoutDetaching([$math->id => ['is_mandatory' => true]]);
        if ($agriS) $agriEng->subjects()->syncWithoutDetaching([$agriS->id => ['is_mandatory' => true]]);

        // 2. Wildlife Conservationist
        $wild = Career::updateOrCreate(['slug' => 'wildlife-conservationist'], [
            'pathway_id' => $agri->id,
            'name' => 'Wildlife Conservationist',
            'description' => 'Protects and manages habitats for wildlife, ensuring the survival of endangered species.',
            'salary_range' => 'KSh 70k - 200k',
            'outlook' => 'Steady',
            'qualifications' => 'Degree in Wildlife Management, Zoology or Environmental Science.',
            'skills' => 'Field Research, GIS, Passion for Animals, endurance, Reporting',
            'typical_employers' => 'KWS, International Conservation NGOs, Private Conservancies'
        ]);
        if ($bio) $wild->subjects()->syncWithoutDetaching([$bio->id => ['is_mandatory' => true]]);
        if ($crev) $wild->subjects()->syncWithoutDetaching([$crev->id => ['is_mandatory' => false]]);

        // --- MORE STEM ---
        // 3. Clinical Psychologist
        $psych = Career::updateOrCreate(['slug' => 'clinical-psychologist'], [
            'pathway_id' => $social->id,
            'name' => 'Clinical Psychologist',
            'description' => 'Assesses, diagnoses and treats mental, emotional and behavioral disorders.',
            'salary_range' => 'KSh 90k - 300k',
            'outlook' => 'High Growth',
            'qualifications' => 'Master’s or Doctorate in Clinical Psychology.',
            'skills' => 'Active Listening, Empathy, Research Methods, Analytical Thinking',
            'typical_employers' => 'Hospitals, Private Practice, Universities, Counseling Centers'
        ]);
        if ($bio) $psych->subjects()->syncWithoutDetaching([$bio->id => ['is_mandatory' => true]]);

        // 4. Data Scientist
        $data = Career::updateOrCreate(['slug' => 'data-scientist'], [
            'pathway_id' => $stem->id,
            'name' => 'Data Scientist',
            'description' => 'Uses algorithms and statistics to interpret vast amounts of data for business intelligence.',
            'salary_range' => 'KSh 180k - 500k',
            'outlook' => 'High Growth',
            'qualifications' => 'Degree in Data Science, Statistics or Analytics.',
            'skills' => 'Machine Learning, R/Python, SQL, Statistical Modeling',
            'typical_employers' => 'Tech Companies, Financial Firms, Research Labs'
        ]);
        if ($math) $data->subjects()->syncWithoutDetaching([$math->id => ['is_mandatory' => true]]);
        if ($comp) $data->subjects()->syncWithoutDetaching([$comp->id => ['is_mandatory' => true]]);
    }
}
