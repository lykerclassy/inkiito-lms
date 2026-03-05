<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScienceLab;
use App\Models\Experiment;
use App\Models\Curriculum;
use App\Models\ExperimentStep;
use Illuminate\Http\Request;
use Illuminate\Support\Str; // Added for Str::slug

class ScienceLabController extends Controller
{
    public function index()
    {
        return response()->json(ScienceLab::with(['experiments.curriculum', 'experiments.steps'])->get());
    }

    public function getCurriculums()
    {
        return response()->json(Curriculum::all());
    }

    public function show($id)
    {
        return ScienceLab::with(['experiments.steps', 'experiments.curriculum'])->findOrFail($id);
    }

    public function storeExperiment(Request $request)
    {
        $validated = $request->validate([
            'science_lab_id' => 'required|exists:science_labs,id',
            'curriculum_id' => 'nullable|exists:curriculums,id',
            'title' => 'required|string',
            'slug' => 'nullable|string', // Changed to nullable
            'description' => 'nullable|string', // Added description
            'level' => 'required|string',
            'duration' => 'required|string',
            'simulation_type' => 'nullable|string',
            'steps' => 'array',
        ]);

        $experiment = Experiment::create([
            'science_lab_id' => $validated['science_lab_id'],
            'curriculum_id' => $validated['curriculum_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $validated['slug'] ?? Str::slug($validated['title']), // Use Str::slug if not provided
            'description' => $validated['description'] ?? null,
            'level' => $validated['level'],
            'duration' => $validated['duration'],
            'simulation_type' => $validated['simulation_type'] ?? 'none',
        ]);

        if (isset($validated['steps']) && is_array($validated['steps'])) {
            foreach ($validated['steps'] as $index => $step) {
                ExperimentStep::create([
                    'experiment_id' => $experiment->id,
                    'instruction' => $step['instruction'],
                    'type' => $step['type'],
                    'step_order' => $index + 1,
                ]);
            }
        }

        return $experiment->load('steps', 'curriculum');
    }

    public function updateExperiment(Request $request, $id)
    {
        $experiment = Experiment::findOrFail($id);
        $validated = $request->validate([
            'title' => 'string',
            'level' => 'string',
            'duration' => 'string',
            'steps' => 'array',
            'curriculum_id' => 'nullable|exists:curriculums,id',
            'is_active' => 'boolean'
        ]);

        $experiment->update($validated);

        if (isset($validated['steps']) && is_array($validated['steps'])) {
            $experiment->steps()->delete();
            foreach ($validated['steps'] as $index => $step) {
                ExperimentStep::create([
                    'experiment_id' => $experiment->id,
                    'instruction' => $step['instruction'],
                    'type' => $step['type'],
                    'step_order' => $index + 1,
                ]);
            }
        }

        return $experiment->load('steps', 'curriculum');
    }

    public function destroyExperiment($id)
    {
        $experiment = Experiment::findOrFail($id);
        $experiment->delete();
        return response()->json(['message' => 'Experiment deleted successfully']);
    }

    public function toggleLabStatus($id)
    {
        $lab = ScienceLab::findOrFail($id);
        $lab->is_active = !$lab->is_active;
        $lab->save();
        return $lab;
    }
}
