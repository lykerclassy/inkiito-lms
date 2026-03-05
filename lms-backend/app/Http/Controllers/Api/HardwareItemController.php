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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $item = HardwareItem::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        return response()->json(HardwareItem::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $item = HardwareItem::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy($id)
    {
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
