<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validation: Ensure both identifier and security_key are provided
        $request->validate([
            'identifier' => 'required',
            'security_key' => 'required',
        ]);

        $identifier = trim($request->identifier);
        $securityKey = $request->security_key;

        // Find user by either admission number or email
        $user = User::where('admission_number', $identifier)
                    ->orWhere('email', $identifier)
                    ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'identifier' => ['The provided credentials do not match our records.'],
            ]);
        }

        $authenticated = false;

        if ($user->role === 'student') {
            // Students can use access_key (plain) OR password (hashed)
            if ($user->access_key === $securityKey || Hash::check($securityKey, $user->password)) {
                $authenticated = true;
            }
        } else {
            // Staff must use password (hashed)
            if (Hash::check($securityKey, $user->password)) {
                $authenticated = true;
            }
        }

        if (!$authenticated) {
            throw ValidationException::withMessages([
                'identifier' => ['The provided credentials do not match our records.'],
            ]);
        }

        $token = $user->createToken('lms-react-app')->plainTextToken;

        if ($user->role === 'student') {
            $user->load(['curriculum', 'academicLevel', 'subjects', 'targetCareer.pathway']);
            
            // Calculate real student progress
            $user->subjects->map(function ($subject) use ($user) {
                $totalCount = \App\Models\Lesson::whereHas('subUnit.unit', function($q) use ($subject) {
                    $q->where('subject_id', $subject->id);
                })->where('is_published', true)->count();

                $completedCount = $user->completedLessons()
                    ->whereHas('subUnit.unit', function($q) use ($subject) {
                        $q->where('subject_id', $subject->id);
                    })->count();

                $subject->progress = $totalCount > 0 ? round(($completedCount / $totalCount) * 100) : 0;
                return $subject;
            });
        } else {
            $user->load(['taughtSubjects']);
        }

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['curriculum', 'academicLevel', 'subjects', 'taughtSubjects', 'targetCareer.pathway']);
        
        if ($user->role === 'student') {
            $user->subjects->map(function ($subject) use ($user) {
                $totalCount = \App\Models\Lesson::whereHas('subUnit.unit', function($q) use ($subject) {
                    $q->where('subject_id', $subject->id);
                })->where('is_published', true)->count();

                $completedCount = $user->completedLessons()
                    ->whereHas('subUnit.unit', function($q) use ($subject) {
                        $q->where('subject_id', $subject->id);
                    })->count();

                $subject->progress = $totalCount > 0 ? round(($completedCount / $totalCount) * 100) : 0;
                return $subject;
            });
        }

        return response()->json($user);
    }
}