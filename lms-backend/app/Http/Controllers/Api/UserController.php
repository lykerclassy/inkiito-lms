<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Fetch all users, including their active subject enrollments.
     */
    public function index()
    {
        // Load users with their enrolled subjects so the React frontend can display them
        $users = User::with('subjects')->latest()->get();
        return response()->json($users);
    }

    /**
     * Create a new user (Student or Staff)
     */
    public function store(Request $request)
    {
        // 1. Validate the incoming data, enforcing the new expanded role list
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users',
            'admission_number' => 'nullable|string|max:50|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,developer,principal,deputy_principal,dos,class_teacher,teacher,student',
        ]);

        // 2. Ensure at least one login method (email or admission number) is provided
        if (empty($request->email) && empty($request->admission_number)) {
            return response()->json([
                'message' => 'You must provide either an email address or an admission number.'
            ], 422);
        }

        // 3. Create the user and securely hash the password
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'admission_number' => $request->admission_number,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Load the empty subjects relationship just so the frontend data structure matches
        return response()->json([
            'message' => 'User created successfully', 
            'user' => $user->load('subjects')
        ], 201);
    }

    /**
     * Update a student's enrolled subjects
     */
    public function updateEnrollments(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // We only enroll students into subjects
        if ($user->role !== 'student') {
            return response()->json(['message' => 'Only students can be enrolled in subjects.'], 403);
        }

        $request->validate([
            // Expecting an array of subject IDs and their statuses
            // Example: [ 1 => ['status' => 'active'], 3 => ['status' => 'dropped'] ]
            'enrollments' => 'required|array',
        ]);

        // The sync() method intelligently adds, updates, or removes pivot records
        $user->subjects()->sync($request->enrollments);

        return response()->json([
            'message' => 'Enrollments updated successfully',
            'user' => $user->load('subjects')
        ]);
    }
}