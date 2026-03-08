<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Downloadable;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DownloadableController extends Controller
{
    /**
     * Get all downloadables for the student.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Downloadable::with(['subject', 'academicLevel']);

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->has('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $resources = $query->latest()->get()->map(function($r) {
            // If the file_url is a relative path (starting with 'resources/'), 
            // convert it to a full URL using Laravel's asset system.
            if (!filter_var($r->file_url, FILTER_VALIDATE_URL)) {
                $r->file_url = asset('storage/' . $r->file_url);
            }
            return $r;
        });

        $subjects = Subject::orderBy('name')->get();

        return response()->json([
            'resources' => $resources,
            'subjects' => $subjects
        ]);
    }

    /**
     * Get all downloadables for admin index.
     */
    public function adminIndex(Request $request)
    {
        $query = Downloadable::with(['subject', 'academicLevel']);

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $resources = $query->latest()->get()->map(function($r) {
            if (!filter_var($r->file_url, FILTER_VALIDATE_URL)) {
                $r->file_url = asset('storage/' . $r->file_url);
            }
            return $r;
        });

        return response()->json([
            'resources' => $resources
        ]);
    }

    /**
     * Store resource. Supports both local FILE UPLOAD and external URL.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_type' => 'required|string', 
            'category' => 'required|string',
            'subject_id' => 'required|exists:subjects,id',
            'academic_level_id' => 'nullable|exists:academic_levels,id',
            // Either 'file' or 'external_url' is required
            'file' => 'nullable|file|max:20480',
            'external_url' => 'nullable|string|max:1000',
        ]);

        $fileUrl = $request->external_url;

        // If a file is uploaded, store it locally on OUR OWN SERVER
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('resources', 'public');
            $fileUrl = $path; // Store relative path, map to asset() on retrieval
        }

        if (empty($fileUrl)) {
            return response()->json(['message' => 'Please provide either a file upload or a valid URL.'], 422);
        }

        $resource = Downloadable::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'file_url' => $fileUrl,
            'file_type' => $validated['file_type'],
            'category' => $validated['category'],
            'subject_id' => $validated['subject_id'],
            'academic_level_id' => $validated['academic_level_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'Resource published successfully on Local Nodes!',
            'resource' => $resource->load(['subject', 'academicLevel'])
        ]);
    }

    /**
     * Delete resource.
     */
    public function destroy($id)
    {
        $resource = Downloadable::findOrFail($id);
        
        // Cleanup local file if it's not a URL
        if (!filter_var($resource->file_url, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($resource->file_url);
        }

        $resource->delete();

        return response()->json(['message' => 'Resource deleted.']);
    }
}
