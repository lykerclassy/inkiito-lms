<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Career;
use App\Models\Pathway;
use App\Models\CareerTrack;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CareerController extends Controller
{
    public function getPathways()
    {
        return response()->json(Pathway::with('tracks')->get());
    }

    public function storePathway(Request $request)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view career pathways.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|unique:pathways,name',
            'description' => 'nullable|string',
            'color_code' => 'required|string',
            'icon' => 'nullable|string'
        ]);

        $pathway = Pathway::create($validated);
        return response()->json($pathway, 201);
    }

    public function updatePathway(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view career pathways.'], 403);
        }

        $pathway = Pathway::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|unique:pathways,name,' . $id,
            'description' => 'nullable|string',
            'color_code' => 'required|string',
            'icon' => 'nullable|string'
        ]);

        $pathway->update($validated);
        return response()->json($pathway);
    }

    public function destroyPathway(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view career pathways.'], 403);
        }

        $pathway = Pathway::findOrFail($id);
        if ($pathway->careers()->count() > 0) {
            return response()->json(['message' => 'Cannot delete pathway with attached careers'], 422);
        }
        $pathway->delete();
        return response()->json(['message' => 'Pathway deleted']);
    }

    public function storeTrack(Request $request)
    {
        if ($request->user()->role === 'teacher') return response()->json(['message' => 'Unauthorized'], 403);
        $validated = $request->validate([
            'pathway_id' => 'required|exists:pathways,id',
            'name' => 'required|string',
            'description' => 'nullable|string'
        ]);
        return response()->json(CareerTrack::create($validated), 201);
    }

    public function updateTrack(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') return response()->json(['message' => 'Unauthorized'], 403);
        $track = CareerTrack::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string'
        ]);
        $track->update($validated);
        return response()->json($track);
    }

    public function destroyTrack(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') return response()->json(['message' => 'Unauthorized'], 403);
        $track = CareerTrack::findOrFail($id);
        if ($track->careers()->count() > 0) return response()->json(['message' => 'Cannot delete track with careers'], 422);
        $track->delete();
        return response()->json(['message' => 'Track deleted']);
    }

    public function index(Request $request)
    {
        $query = Career::with(['pathway', 'careerTrack', 'subjects']);
        
        if ($request->pathway_id) {
            $query->where('pathway_id', $request->pathway_id);
        }
        
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view career content.'], 403);
        }

        $validated = $request->validate([
            'pathway_id' => 'required|exists:pathways,id',
            'career_track_id' => 'nullable|exists:career_tracks,id',
            'name' => 'required|string',
            'description' => 'required|string',
            'salary_range' => 'nullable|string',
            'outlook' => 'nullable|string',
            'qualifications' => 'nullable|string',
            'skills' => 'nullable|string',
            'typical_employers' => 'nullable|string',
            'subjects' => 'array'
        ]);

        $career = Career::create([
            'pathway_id' => $validated['pathway_id'],
            'career_track_id' => $validated['career_track_id'] ?? null,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'],
            'salary_range' => $validated['salary_range'] ?? null,
            'outlook' => $validated['outlook'] ?? 'Steady',
            'qualifications' => $validated['qualifications'] ?? null,
            'skills' => $validated['skills'] ?? null,
            'typical_employers' => $validated['typical_employers'] ?? null,
        ]);

        if (isset($validated['subjects'])) {
            foreach ($validated['subjects'] as $sub) {
                $career->subjects()->attach($sub['id'], ['is_mandatory' => $sub['is_mandatory'] ?? false]);
            }
        }

        return response()->json($career->load(['pathway', 'careerTrack', 'subjects']), 201);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view career content.'], 403);
        }

        $career = Career::findOrFail($id);
        $validated = $request->validate([
            'pathway_id' => 'required|exists:pathways,id',
            'career_track_id' => 'nullable|exists:career_tracks,id',
            'name' => 'required|string',
            'description' => 'required|string',
            'salary_range' => 'nullable|string',
            'outlook' => 'nullable|string',
            'qualifications' => 'nullable|string',
            'skills' => 'nullable|string',
            'typical_employers' => 'nullable|string',
            'subjects' => 'array'
        ]);

        $career->update([
            'pathway_id' => $validated['pathway_id'],
            'career_track_id' => $validated['career_track_id'] ?? null,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'],
            'salary_range' => $validated['salary_range'] ?? null,
            'outlook' => $validated['outlook'] ?? 'Steady',
            'qualifications' => $validated['qualifications'] ?? null,
            'skills' => $validated['skills'] ?? null,
            'typical_employers' => $validated['typical_employers'] ?? null,
        ]);

        if (isset($validated['subjects'])) {
            $syncData = [];
            foreach ($validated['subjects'] as $sub) {
                $syncData[$sub['id']] = ['is_mandatory' => $sub['is_mandatory'] ?? false];
            }
            $career->subjects()->sync($syncData);
        }

        return response()->json($career->load(['pathway', 'subjects']));
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view career content.'], 403);
        }

        Career::findOrFail($id)->delete();
        return response()->json(['message' => 'Career deleted']);
    }

    public function getRecommendedCareers(Request $request)
    {
        $subjectIds = $request->subject_ids; // Array of IDs selected by student
        if (empty($subjectIds)) return response()->json([]);

        // Reverse engineer: Find careers where mandatory subjects are covered by $subjectIds
        // This is a simple logic for now: Any career where all its mandatory subjects are in the student's list
        $careers = Career::with(['pathway', 'subjects'])->get();
        
        $qualified = $careers->filter(function($career) use ($subjectIds) {
            $mandatorySubIds = $career->subjects->where('pivot.is_mandatory', true)->pluck('id')->toArray();
            if (empty($mandatorySubIds)) return true; // No mandatory subjects? You qualify.
            
            // Checks if all mandatory subject IDs are in the subjectIds array
            return empty(array_diff($mandatorySubIds, $subjectIds));
        });

        return response()->json($qualified->values());
    }

    public function setCareerGoal(Request $request)
    {
        $validated = $request->validate([
            'career_id' => 'required|exists:careers,id'
        ]);

        $user = $request->user();
        $user->update(['target_career_id' => $validated['career_id']]);

        return response()->json([
            'message' => 'Career goal updated successfully',
            'user' => $user->load('targetCareer.pathway')
        ]);
    }
}
