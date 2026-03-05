<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LessonController extends Controller
{
    public function show($id)
    {
        $lesson = Lesson::with(['blocks' => function($query) {
            $query->orderBy('order');
        }])->findOrFail($id);

        return response()->json($lesson);
    }

    // --- NEW: Create a blank lesson ---
    public function store(Request $request)
    {
        $request->validate([
            'sub_unit_id' => 'required|exists:sub_units,id',
            'title' => 'required|string',
            'order' => 'required|integer'
        ]);

        $lesson = Lesson::create([
            'sub_unit_id' => $request->sub_unit_id,
            'title' => $request->title,
            'order' => $request->order,
            'is_published' => false // Draft by default
        ]);

        return response()->json(['message' => 'Lesson created', 'lesson' => $lesson]);
    }

    // --- NEW: Update Lesson title or publish status ---
    public function update(Request $request, $id)
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->update($request->only(['title', 'order', 'is_published']));
        
        return response()->json(['message' => 'Lesson details updated', 'lesson' => $lesson]);
    }

    // (Your existing updateBlocks method remains exactly the same below)
    public function updateBlocks(Request $request, $id)
    {
        $request->validate(['blocks' => 'required|array']);
        $lesson = Lesson::findOrFail($id);
        DB::beginTransaction();
        try {
            LessonBlock::where('lesson_id', $lesson->id)->delete();
            foreach ($request->blocks as $index => $blockData) {
                LessonBlock::create([
                    'lesson_id' => $lesson->id,
                    'type' => $blockData['type'],
                    'order' => $index + 1,
                    'content' => $blockData['content'],
                ]);
            }
            DB::commit();
            return response()->json(['message' => 'Lesson blocks saved successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save lesson blocks.', 'error' => $e->getMessage()], 500);
        }
    }
}