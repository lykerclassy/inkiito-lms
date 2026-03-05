<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ScienceLabSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $cbc = \App\Models\Curriculum::where('name', 'CBC')->first();
        $eightFourFour = \App\Models\Curriculum::where('name', '8-4-4')->first();

        $labs = [
            [
                'name' => 'Biology Discovery Lab',
                'slug' => 'biology',
                'color' => 'emerald',
                'description' => 'Explore the wonders of life, from microscopic cells to complex ecosystems.',
                'icon' => 'biology-icon',
                'experiments' => [
                    '8-4-4' => [
                        [
                            'slug' => 'circulatory',
                            'title' => 'Human Circulatory System Study',
                            'level' => 'Advanced',
                            'duration' => '60 mins',
                            'steps' => [
                                ['instruction' => "Activate the heart valves to start pumping oxygenated blood.", 'type' => 'interactive'],
                                ['instruction' => "Observe the flow to the lungs for gas exchange.", 'type' => 'observation'],
                                ['instruction' => "Record the heart rate (BPM) from the digital sensor.", 'type' => 'recording']
                            ]
                        ],
                        [
                            'slug' => 'microscopy',
                            'title' => 'Plant Cell Microscopy',
                            'level' => 'Intermediate',
                            'duration' => '40 mins',
                            'steps' => [
                                ['instruction' => "Place the onion peel slide under the stage.", 'type' => 'setup'],
                                ['instruction' => "Slowly adjust the focus knob to see the cell wall.", 'type' => 'adjustment'],
                                ['instruction' => "Identify and label the nucleus and vacuoles.", 'type' => 'labelling']
                            ]
                        ],
                        ['slug' => 'genetics', 'title' => 'Genetics: Mendelian Inheritance', 'level' => 'Advanced', 'duration' => '45 mins']
                    ],
                    'CBC' => [
                        ['slug' => 'classification', 'title' => 'Classification of Living Things', 'level' => 'Beginner', 'duration' => '30 mins'],
                        ['slug' => 'body_systems', 'title' => 'Human Body Systems (Grade 7)', 'level' => 'Intermediate', 'duration' => '35 mins'],
                        ['slug' => 'photosynthesis', 'title' => 'The Miracle of Photosynthesis', 'level' => 'Beginner', 'duration' => '40 mins']
                    ]
                ]
            ],
            [
                'name' => 'Chemistry Reaction Center',
                'slug' => 'chemistry',
                'color' => 'purple',
                'description' => 'Discover the building blocks of matter and the magic of chemical interactions.',
                'icon' => 'chemistry-icon',
                'experiments' => [
                    '8-4-4' => [
                        [
                            'slug' => 'titration',
                            'title' => 'Titration: Acid-Base Reactions',
                            'level' => 'Advanced',
                            'duration' => '50 mins',
                            'steps' => [
                                ['instruction' => "Fill the burette with Sodium Hydroxide (NaOH) to the 0.0ml mark.", 'type' => 'setup'],
                                ['instruction' => "Slowly release the tap until the solution in the flask changes color.", 'type' => 'interactive'],
                                ['instruction' => "Observe the endpoint and record the volume used.", 'type' => 'recording']
                            ]
                        ],
                        ['slug' => 'organic', 'title' => 'Organic Chemistry: Alkanes', 'level' => 'Intermediate', 'duration' => '45 mins'],
                        ['slug' => 'electrolysis', 'title' => 'Electrolysis of Copper Sulphate', 'level' => 'Advanced', 'duration' => '55 mins']
                    ],
                    'CBC' => [
                        [
                            'slug' => 'states_of_matter',
                            'title' => 'States of Matter Discovery',
                            'level' => 'Beginner',
                            'duration' => '30 mins',
                            'steps' => [
                                ['instruction' => "Apply heat to the solid substance in the beaker.", 'type' => 'heating'],
                                ['instruction' => "Monitor the temperature jump as the phase changes.", 'type' => 'monitoring'],
                                ['instruction' => "Observe the molecules losing their rigid structure.", 'type' => 'observation']
                            ]
                        ],
                        ['slug' => 'kitchen_chemistry', 'title' => 'Changes in the Kitchen', 'level' => 'Beginner', 'duration' => '40 mins'],
                        ['slug' => 'indicators', 'title' => 'Acids, Bases & Indicators', 'level' => 'Intermediate', 'duration' => '35 mins']
                    ]
                ]
            ],
            [
                'name' => 'Physics & Mechanics Hub',
                'slug' => 'physics',
                'color' => 'blue',
                'description' => 'Master the laws of nature, from energy and motion to light and electricity.',
                'icon' => 'physics-icon',
                'experiments' => [
                    '8-4-4' => [
                        [
                            'slug' => 'newton_motion',
                            'title' => "Newton's Laws of Motion",
                            'level' => 'Advanced',
                            'duration' => '60 mins',
                            'steps' => [
                                ['instruction' => "Set the initial mass of the trolley on the frictionless track.", 'type' => 'setup'],
                                ['instruction' => "Apply a constant force and trigger the digital timer.", 'type' => 'interactive'],
                                ['instruction' => "Calculate acceleration from the displacement-time graph.", 'type' => 'analysis']
                            ]
                        ],
                        ['slug' => 'optics', 'title' => 'Wave Properties & Optics', 'level' => 'Intermediate', 'duration' => '45 mins'],
                        ['slug' => 'modern_physics', 'title' => 'Modern Physics Fundamentals', 'level' => 'Advanced', 'duration' => '75 mins']
                    ],
                    'CBC' => [
                        [
                            'slug' => 'light_reflection',
                            'title' => 'Light Reflection & Refraction',
                            'level' => 'Beginner',
                            'duration' => '35 mins',
                            'steps' => [
                                ['instruction' => "Position the laser beam towards the plane mirror.", 'type' => 'setup'],
                                ['instruction' => "Adjust the angle of incidence using the protractor.", 'type' => 'interactive'],
                                ['instruction' => "Verify that angle of incidence equals angle of reflection.", 'type' => 'verification']
                            ]
                        ],
                        ['slug' => 'forces', 'title' => 'Types of Forces & Effects', 'level' => 'Intermediate', 'duration' => '40 mins'],
                        ['slug' => 'electricity', 'title' => 'Magnets & Electricity', 'level' => 'Beginner', 'duration' => '50 mins']
                    ]
                ]
            ],
            [
                'name' => 'Agri-Science Innovation',
                'slug' => 'agriculture',
                'color' => 'orange',
                'description' => 'Explore climate-smart farming, soil science, and sustainable food production.',
                'icon' => 'agriculture-icon',
                'experiments' => [
                    '8-4-4' => [
                        [
                            'slug' => 'soil_testing',
                            'title' => 'Soil Analysis: pH & Texture',
                            'level' => 'Advanced',
                            'duration' => '50 mins',
                            'steps' => [
                                ['instruction' => "Collect 50g of soil sample from the virtual field.", 'type' => 'setup'],
                                ['instruction' => "Add distilled water and universal indicator to the sediment.", 'type' => 'interactive'],
                                ['instruction' => "Compare the color change with the pH scale chart.", 'type' => 'analysis']
                            ]
                        ],
                        ['slug' => 'livestock', 'title' => 'Livestock Management Systems', 'level' => 'Intermediate', 'duration' => '60 mins'],
                        ['slug' => 'farm_tools', 'title' => 'Farm Tools: Maintenance & Use', 'level' => 'Beginner', 'duration' => '40 mins']
                    ],
                    'CBC' => [
                        [
                            'slug' => 'irrigation',
                            'title' => 'Smart Irrigation Techniques',
                            'level' => 'Intermediate',
                            'duration' => '45 mins',
                            'steps' => [
                                ['instruction' => "Design the piping layout for the drip irrigation system.", 'type' => 'setup'],
                                ['instruction' => "Activate the water pump and check for nozzle clogs.", 'type' => 'interactive'],
                                ['instruction' => "Monitor soil moisture levels after the cycle.", 'type' => 'monitoring']
                            ]
                        ],
                        ['slug' => 'conservation', 'title' => 'Conservation Agriculture', 'level' => 'Beginner', 'duration' => '35 mins'],
                        ['slug' => 'value_addition', 'title' => 'Food Processing & Value Addition', 'level' => 'Intermediate', 'duration' => '50 mins']
                    ]
                ]
            ]
        ];

        foreach ($labs as $labData) {
            $experiments = $labData['experiments'];
            unset($labData['experiments']);
            
            $lab = \App\Models\ScienceLab::create($labData);

            foreach ($experiments['8-4-4'] as $expData) {
                $steps = $expData['steps'] ?? [];
                unset($expData['steps']);
                $expData['science_lab_id'] = $lab->id;
                $expData['curriculum_id'] = $eightFourFour?->id;
                
                $exp = \App\Models\Experiment::create($expData);
                foreach ($steps as $index => $step) {
                    $step['experiment_id'] = $exp->id;
                    $step['step_order'] = $index + 1;
                    \App\Models\ExperimentStep::create($step);
                }
            }

            foreach ($experiments['CBC'] as $expData) {
                $steps = $expData['steps'] ?? [];
                unset($expData['steps']);
                $expData['science_lab_id'] = $lab->id;
                $expData['curriculum_id'] = $cbc?->id;
                
                $exp = \App\Models\Experiment::create($expData);
                foreach ($steps as $index => $step) {
                    $step['experiment_id'] = $exp->id;
                    $step['step_order'] = $index + 1;
                    \App\Models\ExperimentStep::create($step);
                }
            }
        }
    }
}
