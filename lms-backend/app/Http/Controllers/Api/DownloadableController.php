<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Downloadable;
use App\Models\Subject;
use App\Models\SubjectTitle;
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
        $query = Downloadable::with(['subjectTitle', 'academicLevel']);

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Filter based on student's active subjects and level
        $subjects = $user->subjects()->wherePivot('status', 'active')->get();
        $activeTitleIds = $subjects->pluck('subject_title_id');
        $levelId = $user->academic_level_id;

        $query->whereIn('subject_title_id', $activeTitleIds)
              ->where(function($q) use ($levelId) {
                  $q->whereNull('academic_level_id')
                    ->orWhere('academic_level_id', $levelId);
              });

        if ($request->has('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_title_id', $request->subject_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $resources = $query->latest()->get()->map(function($r) {
            $r->subject = $r->subjectTitle;
            return $r;
        });

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
        $user = $request->user();
        $query = Downloadable::with(['subjectTitle', 'academicLevel']);

        if (in_array($user->role, ['teacher', 'class_teacher'])) {
            $taughtTitleIds = $user->taughtSubjects->pluck('subject_title_id')->unique();
            $query->whereIn('subject_title_id', $taughtTitleIds);
        }

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $resources = $query->latest()->get();

        return response()->json([
            'resources' => $resources
        ]);
    }

    /**
     * Store resource. Supports both local FILE UPLOAD and external URL.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_type' => 'required|string', 
            'category' => 'required|string',
            'subject_title_id' => 'required|exists:subject_titles,id',
            'academic_level_id' => 'nullable|exists:academic_levels,id',
            'file' => 'nullable|file|max:20480',
            'external_url' => 'nullable|string|max:1000',
        ]);

        // Security check for teachers
        if (in_array($user->role, ['teacher', 'class_teacher'])) {
             $taughtTitleIds = $user->taughtSubjects->pluck('subject_title_id')->unique();
             if (!$taughtTitleIds->contains($request->subject_title_id)) {
                 return response()->json(['message' => 'Unauthorized subject.'], 403);
             }
        }

        $fileUrl = $request->external_url;

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('resources', 'public');
            $fileUrl = $path;
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
            'subject_title_id' => $validated['subject_title_id'],
            'academic_level_id' => $validated['academic_level_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'Resource published successfully!',
            'resource' => $resource->load(['subjectTitle', 'academicLevel'])
        ]);
    }

    /**
     * Delete resource.
     */
    public function destroy(Request $request, $id)
    {
        $resource = Downloadable::findOrFail($id);
        $user = $request->user();
        
        // Security check
        if (in_array($user->role, ['teacher', 'class_teacher'])) {
             $taughtTitleIds = $user->taughtSubjects->pluck('subject_title_id')->unique();
             if (!$taughtTitleIds->contains($resource->subject_title_id)) {
                 return response()->json(['message' => 'Unauthorized.'], 403);
             }
        }

        if ($resource->file_url && !filter_var($resource->file_url, FILTER_VALIDATE_URL)) {
            // It's a path, check if it exists before trying to delete from public disk
            // Note: we store real path in DB but display via accessor
            $rawPath = $resource->getRawOriginal('file_url');
            Storage::disk('public')->delete($rawPath);
        }

        $resource->delete();

        return response()->json(['message' => 'Resource deleted.']);
    }
}
