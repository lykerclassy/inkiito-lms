<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Fetch all users, including their active subject enrollments.
     */
    public function index()
    {
        // Load users with their enrolled subjects, curriculum, and academic level
        $users = User::with(['subjects', 'curriculum', 'academicLevel'])->latest()->get();
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
            'password' => $request->role === 'student' ? 'nullable' : 'required|string|min:6',
            'role' => 'required|string|in:admin,developer,principal,deputy_principal,dos,class_teacher,teacher,student',
        ]);

        // 2. Ensure at least one login method (email or admission number) is provided
        if (empty($request->email) && empty($request->admission_number)) {
            return response()->json([
                'message' => 'You must provide either an email address or an admission number.'
            ], 422);
        }

        // 3. Prepare data
        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'admission_number' => $request->admission_number,
            'role' => $request->role,
        ];

        if ($request->role === 'student') {
            // Students use access_key for login
            $accessKey = $request->access_key ?? strtoupper(Str::random(6));
            $data['access_key'] = $accessKey;
            $data['password'] = Hash::make($accessKey); // Keeping password in sync just in case
            $data['curriculum_id'] = $request->curriculum_id ?? 1;
            $data['academic_level_id'] = $request->academic_level_id ?? 1;
        } else {
            // Staff use email and password
            $data['password'] = Hash::make($request->password);
        }

        $user = User::create($data);

        return response()->json([
            'message' => 'User created successfully', 
            'user' => $user->load(['subjects', 'academicLevel', 'curriculum'])
        ], 201);
    }

    /**
     * Update an existing user
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $id,
            'admission_number' => 'nullable|string|max:50|unique:users,admission_number,' . $id,
            'role' => 'required|string|in:admin,developer,principal,deputy_principal,dos,class_teacher,teacher,student',
            'password' => 'nullable|string|min:6',
            'access_key' => 'nullable|string'
        ]);

        $data = $request->only(['name', 'email', 'admission_number', 'role', 'curriculum_id', 'academic_level_id']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        if ($request->has('access_key')) {
            $data['access_key'] = $request->access_key;
        }

        $user->update($data);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load(['subjects', 'academicLevel', 'curriculum'])
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting yourself
        if (auth()->id() == $id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Import users from CSV
     */
    public function importCSV(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'role' => 'required|string|in:student,teacher'
        ]);

        $file = $request->file('file');
        $csvData = file_get_contents($file);
        $rows = array_map('str_getcsv', explode("\n", $csvData));
        $header = array_shift($rows);

        $importedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                if (empty($row[0])) continue; // Skip empty rows

                $data = array_combine($header, $row);
                
                try {
                    if ($request->role === 'student') {
                        $accessKey = strtoupper(Str::random(6));
                        User::create([
                            'name' => $data['name'],
                            'admission_number' => $data['admission_number'],
                            'role' => 'student',
                            'access_key' => $accessKey,
                            'password' => Hash::make($accessKey),
                            'curriculum_id' => $data['curriculum_id'] ?? 1,
                            'academic_level_id' => $data['academic_level_id'] ?? 1,
                        ]);
                    } else {
                        User::create([
                            'name' => $data['name'],
                            'email' => $data['email'],
                            'role' => $request->role,
                            'password' => Hash::make($data['password'] ?? 'password123'),
                        ]);
                    }
                    $importedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'message' => "Successfully imported $importedCount users.",
            'errors' => $errors
        ]);
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

    /**
     * Update authenticated user's profile
     */
    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $request->name;
        
        // Students typically cannot change their primary email/login identifier natively outside of admins
        if ($user->role !== 'student' && $request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        if ($request->hasFile('avatar')) {
            // Delete old avatar if present
            if ($user->avatar) {
                // Delete logic, e.g. \Illuminate\Support\Facades\Storage::disk('public')->delete(str_replace('/storage/', '', $user->avatar))
                $oldPath = str_replace(url('/storage') . '/', '', $user->avatar);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = url('/storage/' . $path);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => clone $user
        ]);
    }
}