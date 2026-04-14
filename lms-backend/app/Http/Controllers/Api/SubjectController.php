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
        // Fetch all subjects with their full academic tree, teachers, and title
        return Subject::with(['title', 'academicLevel.curriculum', 'units.subUnits.lessons', 'teachers'])->get();
    }

    public function subjectTitles()
    {
        return \App\Models\SubjectTitle::orderBy('name')->get();
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
            'academic_level_id' => 'required|exists:academic_levels,id',
            'is_compulsory' => 'boolean'
        ]);

        // Find or create the standard title for this subject
        $title = \App\Models\SubjectTitle::firstOrCreate(['name' => $request->name]);
        
        $subject = Subject::create([
            'subject_title_id' => $title->id,
            'academic_level_id' => $request->academic_level_id,
            'is_compulsory' => $request->is_compulsory ?? false
        ]);

        // If marked as compulsory, automatically enroll all existing students in this level
        if ($subject->is_compulsory) {
            $studentIds = \App\Models\User::where('academic_level_id', $request->academic_level_id)
                ->where('role', 'student')
                ->pluck('id');
            
            if ($studentIds->isNotEmpty()) {
                $syncData = [];
                foreach ($studentIds as $id) {
                    $syncData[$id] = ['status' => 'active'];
                }
                $subject->students()->syncWithoutDetaching($syncData);
            }
        }

        return response()->json(['message' => 'Subject created and synchronized', 'subject' => $subject->load('title')]);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'academic_level_id' => 'sometimes|exists:academic_levels,id',
            'is_compulsory' => 'boolean'
        ]);

        if ($request->has('name')) {
            $title = \App\Models\SubjectTitle::firstOrCreate(['name' => $request->name]);
            $subject->subject_title_id = $title->id;
        }

        if ($request->has('academic_level_id')) {
            $subject->academic_level_id = $request->academic_level_id;
        }

        if ($request->has('is_compulsory')) {
            $subject->is_compulsory = $request->is_compulsory;
        }

        $subject->save();

        // If marked as compulsory, automatically enroll all existing students in this level
        if ($subject->is_compulsory) {
            $studentIds = \App\Models\User::where('academic_level_id', $subject->academic_level_id)
                ->where('role', 'student')
                ->pluck('id');
            
            // Sync without detaching existing enrollments
            if ($studentIds->isNotEmpty()) {
                $syncData = [];
                foreach ($studentIds as $id) {
                    $syncData[$id] = ['status' => 'active'];
                }
                $subject->students()->syncWithoutDetaching($syncData);
            }
        }

        return response()->json(['message' => 'Subject updated', 'subject' => $subject->load('title', 'academicLevel')]);
    }

    public function storeAcademicLevel(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'curriculum_id' => 'required|exists:curriculums,id'
        ]);

        $level = AcademicLevel::create($request->all());
        return response()->json(['message' => 'Class / Academic Level created', 'level' => $level]);
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
     * Delete a subject.
     */
    public function destroy($id, Request $request)
    {
        \Illuminate\Support\Facades\Log::info("Curriculum DELETE Request: Subject ID $id by User " . $request->user()->id);
        return \Illuminate\Support\Facades\DB::transaction(function() use ($id, $request) {
            $subject = Subject::findOrFail($id);
            if (!$this->canManageSubject($request->user(), $id)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            // Safety check: Don't delete a subject with active enrollments unless forced?
            // Actually, we'll allow it but we must clear pivot tables first to avoid FK errors
            $subject->students()->detach();
            $subject->teachers()->detach();

            // Manually delete dependent units (which handles their sub-units etc)
            foreach ($subject->units as $unit) {
                $this->performUnitDeletion($unit);
            }

            $subject->delete();
            return response()->json(['message' => 'Subject deleted successfully']);
        });
    }

    /**
     * Delete a unit.
     */
    public function destroyUnit($id, Request $request)
    {
        \Illuminate\Support\Facades\Log::info("Curriculum DELETE Request: Unit ID $id by User " . $request->user()->id);
        return \Illuminate\Support\Facades\DB::transaction(function() use ($id, $request) {
            $unit = Unit::findOrFail($id);
            if (!$this->canManageSubject($request->user(), $unit->subject_id)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $this->performUnitDeletion($unit);
            return response()->json(['message' => 'Unit and all nested topics/lessons deleted']);
        });
    }

    /**
     * Delete a sub-unit.
     */
    public function destroySubUnit($id, Request $request)
    {
        \Illuminate\Support\Facades\Log::info("Curriculum DELETE Request: SubUnit ID $id by User " . $request->user()->id);
        return \Illuminate\Support\Facades\DB::transaction(function() use ($id, $request) {
            $subUnit = SubUnit::with('unit')->findOrFail($id);
            if (!$this->canManageSubject($request->user(), $subUnit->unit->subject_id)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            foreach ($subUnit->lessons as $lesson) {
                $lesson->delete(); // Lesson model handles its own triggers usually, but database cascade is on here.
            }

            $subUnit->delete();
            return response()->json(['message' => 'Topic/Sub-unit deleted']);
        });
    }

    private function performUnitDeletion($unit)
    {
        foreach ($unit->subUnits as $subUnit) {
            // Delete lessons first
            \App\Models\Lesson::where('sub_unit_id', $subUnit->id)->delete();
            $subUnit->delete();
        }
        $unit->delete();
    }

    /**
     * Delete an academic level (Class).
     */
    public function destroyAcademicLevel($id, Request $request)
    {
        $level = AcademicLevel::findOrFail($id);
        
        // Only actual management can delete entire classes
        if (!in_array($request->user()->role, ['admin', 'developer', 'principal', 'dos'])) {
            return response()->json(['message' => 'Only high-level administrators can delete classes.'], 403);
        }

        // Safety check: Cannot delete a class that still has subjects
        if ($level->subjects()->exists()) {
             return response()->json(['message' => 'Cannot delete a class that still has subjects. Please remove all subjects first.'], 422);
        }

        $level->delete();
        return response()->json(['message' => 'Academic Level deleted successfully.']);
    }

    /**
     * Helper to check if a user can manage a subject.
     */
    private function canManageSubject($user, $subjectId)
    {
        if (in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos'])) {
            return true;
        }

        if (in_array($user->role, ['teacher', 'class_teacher'])) {
            return $user->taughtSubjects()->where('subjects.id', $subjectId)->exists();
        }

        return false;
    }

    /**
     * Retrieve all subjects within the student's curriculum (grouped by academic level).
     * This acts as a "Library" for reviewing past term/class content easily without formal enrollment.
     */
    public function studentCurriculumSubjects(Request $request)
    {
        $user = $request->user();
        if (!$user->academicLevel || !$user->academicLevel->curriculum_id) {
            return response()->json([]);
        }
        
        $curriculumId = $user->academicLevel->curriculum_id;

        // Find all SubjectTitle IDs the student is currently enrolled in
        $takenTitleIds = $user->subjects()->pluck('subject_title_id')->unique()->toArray();

        // Fetch all subjects in the same curriculum matching the "taken" titles
        $subjects = Subject::with(['title', 'academicLevel'])
            ->whereHas('academicLevel', function ($query) use ($curriculumId) {
                $query->where('curriculum_id', $curriculumId);
            })
            ->whereIn('subject_title_id', $takenTitleIds)
            ->get();

        // Filter out subjects the user is explicitly currently enrolled in
        $enrolledIds = $user->subjects()->pluck('subjects.id')->toArray();
        $filtered = $subjects->filter(function ($subject) use ($enrolledIds) {
            return !in_array($subject->id, $enrolledIds);
        });

        $grouped = [];
        foreach ($filtered as $subject) {
            $levelName = $subject->academicLevel->name;
            if (!isset($grouped[$levelName])) {
                $grouped[$levelName] = [
                    'level_name' => $levelName,
                    'level_id' => $subject->academic_level_id,
                    'subjects' => []
                ];
            }
            $subject->progress = 0; // UI fallback
            $grouped[$levelName]['subjects'][] = $subject;
        }
        
        // Sort grouped array by level_id (rough chronological order approximation)
        usort($grouped, function($a, $b) {
            return $a['level_id'] <=> $b['level_id'];
        });

        return response()->json(array_values($grouped));
    }
}