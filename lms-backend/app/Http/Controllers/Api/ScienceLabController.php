<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScienceLab;
use App\Models\Experiment;
use App\Models\Curriculum;
use App\Models\ExperimentStep;
use App\Models\User;
use App\Models\LabQuestion;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Str; // Added for Str::slug

class ScienceLabController extends Controller
{
    public function index()
    {
        return response()->json(ScienceLab::with(['experiments.curriculum', 'experiments.steps', 'coordinator'])->get());
    }

    public function getCurriculums()
    {
        return response()->json(Curriculum::all());
    }

    public function show($id)
    {
        return ScienceLab::with(['experiments.steps', 'experiments.curriculum', 'coordinator'])->findOrFail($id);
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
            'youtube_url' => 'nullable|string',
            'requirements' => 'nullable|string',
            'observations' => 'nullable|string',
            'explanations' => 'nullable|string',
            'conclusion' => 'nullable|string',
            'knowledge_check' => 'nullable|array',
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
            'youtube_url' => $validated['youtube_url'] ?? null,
            'requirements' => $validated['requirements'] ?? null,
            'observations' => $validated['observations'] ?? null,
            'explanations' => $validated['explanations'] ?? null,
            'conclusion' => $validated['conclusion'] ?? null,
            'knowledge_check' => $validated['knowledge_check'] ?? null,
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
            'youtube_url' => 'nullable|string',
            'requirements' => 'nullable|string',
            'observations' => 'nullable|string',
            'explanations' => 'nullable|string',
            'conclusion' => 'nullable|string',
            'knowledge_check' => 'nullable|array',
            'simulation_type' => 'nullable|string',
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

    public function assignCoordinator(Request $request, $id)
    {
        $validated = $request->validate([
            'coordinator_id' => 'nullable|exists:users,id'
        ]);
        $lab = ScienceLab::findOrFail($id);
        $lab->coordinator_id = $validated['coordinator_id'];
        $lab->save();

        return response()->json(['message' => 'Coordinator assigned successfully', 'lab' => $lab->load('coordinator')]);
    }

    public function askQuestion(Request $request, $id)
    {
        $validated = $request->validate([
            'question' => 'required|string'
        ]);

        $lab = ScienceLab::findOrFail($id);

        $question = LabQuestion::create([
            'science_lab_id' => $lab->id,
            'student_id' => $request->user()->id,
            'coordinator_id' => $lab->coordinator_id,
            'question' => $validated['question'],
            'status' => 'pending'
        ]);

        if ($lab->coordinator_id) {
            Notification::create([
                'user_id' => $lab->coordinator_id,
                'type' => 'lab_question',
                'message' => $request->user()->name . ' asked a question in ' . $lab->name,
                'link' => '/admin/lab-questions', // To be built in frontend
                'is_read' => false
            ]);
        }

        return response()->json(['message' => 'Question submitted perfectly!', 'question' => $question]);
    }

    public function getQuestions(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'student') {
            $questions = LabQuestion::with(['scienceLab', 'coordinator'])->where('student_id', $user->id)->orderBy('created_at', 'desc')->get();
        } else {
            // Coordinator or Admin
            $query = LabQuestion::with(['scienceLab', 'student'])->orderBy('created_at', 'desc');
            $questions = $query->get();
        }

        return response()->json($questions);
    }

    public function answerQuestion(Request $request, $id)
    {
        $validated = $request->validate([
            'answer' => 'required|string'
        ]);

        $question = LabQuestion::findOrFail($id);
        $question->answer = $validated['answer'];
        $question->status = 'answered';
        $question->save();

        Notification::create([
            'user_id' => $question->student_id,
            'type' => 'lab_answer',
            'message' => 'Your question in ' . ($question->scienceLab->name ?? 'Science Lab') . ' was answered by the coordinator.',
            'link' => '/student/science-lab', 
            'is_read' => false
        ]);

        return response()->json(['message' => 'Answer submitted successfully', 'question' => $question]);
    }
}
