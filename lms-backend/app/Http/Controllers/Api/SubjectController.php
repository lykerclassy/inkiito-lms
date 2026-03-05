<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\Unit;
use App\Models\SubUnit;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index()
    {
        // Fetch all subjects with their full academic tree
        return Subject::with(['academicLevel', 'units.subUnits.lessons'])->get();
    }

    public function show($id)
    {
        return Subject::with(['academicLevel', 'units.subUnits.lessons'])->findOrFail($id);
    }

    // --- CURRICULUM BUILDER METHODS ---

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'academic_level_id' => 'required|exists:academic_levels,id'
        ]);
        
        $subject = Subject::create($request->all());
        return response()->json(['message' => 'Subject created', 'subject' => $subject]);
    }

    public function storeUnit(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string',
            'order' => 'required|integer'
        ]);

        $unit = Unit::create($request->all());
        return response()->json(['message' => 'Unit/Strand created', 'unit' => $unit]);
    }

    public function updateUnit(Request $request, $id)
    {
        $unit = Unit::findOrFail($id);
        $unit->update($request->only(['title', 'order']));
        return response()->json(['message' => 'Unit updated', 'unit' => $unit]);
    }

    public function storeSubUnit(Request $request)
    {
        $request->validate([
            'unit_id' => 'required|exists:units,id',
            'title' => 'required|string',
            'order' => 'required|integer'
        ]);

        $subUnit = SubUnit::create($request->all());
        return response()->json(['message' => 'Topic/Sub-Strand created', 'subUnit' => $subUnit]);
    }

    public function updateSubUnit(Request $request, $id)
    {
        $subUnit = SubUnit::findOrFail($id);
        $subUnit->update($request->only(['title', 'order']));
        return response()->json(['message' => 'Topic updated', 'subUnit' => $subUnit]);
    }
}