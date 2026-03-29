<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentPortfolio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class PortfolioController extends Controller
{
    /**
     * Get all exhibits grouped by subject.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $student_id = $request->query('student_id', $user->id);

        // CBC/CBE Restriction
        if ($user->role === 'student' && 
            !str_contains($user->curriculum?->name ?? '', 'CBC') && 
            !str_contains($user->curriculum?->name ?? '', 'CBE')) {
            return response()->json(['message' => 'The Museum is only open to CBC/CBE students.'], 403);
        }

        // Security: teachers/admins can view any student, students only their own
        $isStaff = in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher']);
        
        if (!$isStaff && $student_id != $user->id) {
            return response()->json(['message' => 'Unauthorized access to this museum.'], 403);
        }

        $portfolios = StudentPortfolio::where('student_id', $student_id)
            ->with(['subject', 'student'])
            ->orderBy('exhibition_date', 'desc')
            ->get();

        // Group by subject for the Museum Wings
        $grouped = $portfolios->groupBy(function($item) {
            return $item->subject?->name ?? 'Other Skills';
        });

        return response()->json($grouped);
    }

    /**
     * Add a new exhibit to the museum.
     */
    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'media' => 'required|file|max:30720', // 30MB
            'exhibition_date' => 'required|date',
            'competency_tag' => 'nullable|string',
            'is_featured' => 'boolean'
        ]);

        $user = $request->user();
        $mediaPath = '';
        $mediaType = 'image';

        // Determine media type
        $mime = $request->file('media')->getMimeType();
        if (str_starts_with($mime, 'image/')) $mediaType = 'image';
        elseif (str_starts_with($mime, 'video/')) $mediaType = 'video';
        elseif (str_starts_with($mime, 'audio/')) $mediaType = 'audio';
        else $mediaType = 'document';

        // Upload logic
        if (config('app.env') === 'production' || env('CLOUDINARY_URL')) {
            $mediaPath = $request->file('media')->storeOnCloudinary('portfolios')->getSecurePath();
        } else {
            $path = $request->file('media')->store('public/portfolios');
            $mediaPath = Storage::url($path);
        }

        $portfolio = StudentPortfolio::create([
            'student_id' => $user->id,
            'subject_id' => $request->subject_id,
            'title' => $request->title,
            'description' => $request->description,
            'media_path' => $mediaPath,
            'media_type' => $mediaType,
            'exhibition_date' => $request->exhibition_date,
            'competency_tag' => $request->competency_tag,
            'is_featured' => $request->is_featured ?? false
        ]);

        return response()->json([
            'message' => 'Successful Exhibit: ' . $portfolio->title . ' has been added to the museum!',
            'portfolio' => $portfolio
        ]);
    }

    /**
     * Remove an exhibit.
     */
    public function destroy($id, Request $request)
    {
        $portfolio = StudentPortfolio::findOrFail($id);
        
        $isStaff = in_array($request->user()->role, ['admin', 'developer']);
        if ($request->user()->id !== $portfolio->student_id && !$isStaff) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $portfolio->delete();
        return response()->json(['message' => 'Exhibit removed from the gallery.']);
    }
}
