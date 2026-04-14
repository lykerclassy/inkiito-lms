<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HardwareItem;
use Illuminate\Http\Request;

class HardwareItemController extends Controller
{
    public function index()
    {
        return response()->json(HardwareItem::where('is_active', true)->get());
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view hardware items.'], 403);
        }

        // Laravel FormData boolean fix
        if ($request->has('is_active')) {
            $request->merge([
                'is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)
            ]);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image_url' => 'nullable|string',
                'video_url' => 'nullable|string',
                'type' => 'nullable|string|in:hardware,safety_video,safety_guide',
                'category' => 'nullable|string',
                'is_active' => 'boolean'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed for hardware-item store:', $e->errors());
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        }

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('lab-assets', 'public');
            $validated['file_path'] = $path;
        }

        $item = HardwareItem::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        return response()->json(HardwareItem::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view hardware items.'], 403);
        }

        $item = HardwareItem::findOrFail($id);
        
        // Laravel FormData boolean fix
        if ($request->has('is_active')) {
            $request->merge([
                'is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)
            ]);
        }

        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'image_url' => 'nullable|string',
                'video_url' => 'nullable|string',
                'type' => 'nullable|string|in:hardware,safety_video,safety_guide',
                'category' => 'nullable|string',
                'is_active' => 'boolean'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed for hardware-item update:', $e->errors());
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        }

        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($item->getRawOriginal('file_path')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($item->getRawOriginal('file_path'));
            }
            $path = $request->file('file')->store('lab-assets', 'public');
            $validated['file_path'] = $path;
        }

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view hardware items.'], 403);
        }

        $item = HardwareItem::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Hardware item deleted successfully']);
    }

    // Special method for admin to get all items (including inactive)
    public function adminIndex()
    {
        return response()->json(HardwareItem::all());
    }
}
