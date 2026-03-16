<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\Unit;
use App\Models\SubUnit;
use App\Models\AcademicLevel;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index()
    {
        // Fetch all subjects with their full academic tree and teachers
        return Subject::with(['academicLevel.curriculum', 'units.subUnits.lessons', 'teachers'])->get();
    }

    public function academicLevels()
    {
        // Return all academic levels with their curriculum and class teacher, for the curriculum manager
        return AcademicLevel::with(['curriculum', 'classTeacher'])->orderBy('curriculum_id')->orderBy('id')->get();
    }

    public function show($id, Request $request)
    {
        $subject = Subject::with(['academicLevel', 'units.subUnits.lessons'])->findOrFail($id);
        $user = $request->user();

        if ($user && $user->role === 'student') {
            // Count total published lessons in the subject
            $totalLessons = \App\Models\Lesson::whereHas('subUnit.unit', function($q) use ($id) {
                $q->where('subject_id', $id);
            })->where('is_published', true)->count();

            // Count completed lessons by this user in this subject
            $completedLessons = $user->completedLessons()
                ->whereHas('subUnit.unit', function($q) use ($id) {
                    $q->where('subject_id', $id);
                })->count();

            $progress = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;
            $subject->progress = $progress;
        }

        return $subject;
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

        if (!$this->canManageSubject($request->user(), $request->subject_id)) {
            return response()->json(['message' => 'You are not assigned to this subject.'], 403);
        }

        $unit = Unit::create($request->all());
        return response()->json(['message' => 'Unit/Strand created', 'unit' => $unit]);
    }

    public function updateUnit(Request $request, $id)
    {
        $unit = Unit::findOrFail($id);
        
        if (!$this->canManageSubject($request->user(), $unit->subject_id)) {
            return response()->json(['message' => 'You do not have permission to manage this subject structure.'], 403);
        }

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

        $unit = Unit::findOrFail($request->unit_id);
        if (!$this->canManageSubject($request->user(), $unit->subject_id)) {
            return response()->json(['message' => 'You are not assigned to this subject.'], 403);
        }

        $subUnit = SubUnit::create($request->all());
        return response()->json(['message' => 'Topic/Sub-Strand created', 'subUnit' => $subUnit]);
    }

    public function updateSubUnit(Request $request, $id)
    {
        $subUnit = SubUnit::with('unit')->findOrFail($id);
        
        if (!$this->canManageSubject($request->user(), $subUnit->unit->subject_id)) {
            return response()->json(['message' => 'You do not have permission to manage this subject structure.'], 403);
        }

        $subUnit->update($request->only(['title', 'order']));
        return response()->json(['message' => 'Topic updated', 'subUnit' => $subUnit]);
    }

    public function assignClassTeacher(Request $request, $id)
    {
        $request->validate([
            'class_teacher_id' => 'nullable|exists:users,id'
        ]);

        $level = AcademicLevel::findOrFail($id);
        $level->update(['class_teacher_id' => $request->class_teacher_id]);

        return response()->json([
            'message' => 'Class teacher assigned successfully',
            'level' => $level->load('classTeacher')
        ]);
    }

    public function assignSubjectTeachers(Request $request, $id)
    {
        $request->validate([
            'teacher_ids' => 'required|array',
            'teacher_ids.*' => 'exists:users,id'
        ]);

        $subject = Subject::findOrFail($id);
        $subject->teachers()->sync($request->teacher_ids);

        return response()->json([
            'message' => 'Subject teachers assigned successfully',
            'teachers' => $subject->teachers
        ]);
    }

    /**
     * Helper to check if a user can manage a subject.
     */
    private function canManageSubject($user, $subjectId)
    {
        if (in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos'])) {
            return true;
        }

        if ($user->role === 'teacher') {
            return $user->taughtSubjects()->where('subjects.id', $subjectId)->exists();
        }

        return false;
    }
}