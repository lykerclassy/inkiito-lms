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
        $securityKey = trim($request->security_key);

        // 1. STUDENT LOGIN: Must use Admission Number and Access Key
        $student = User::where('role', 'student')
                       ->where('admission_number', $identifier)
                       ->where('access_key', $securityKey)
                       ->first();

        if ($student) {
            $token = $student->createToken('lms-react-app')->plainTextToken;
            $student->load(['curriculum', 'academicLevel', 'subjects', 'targetCareer.pathway']);
            return response()->json(['user' => $student, 'token' => $token]);
        }

        // 2. STAFF/ADMIN/DEVELOPER LOGIN: Must use Email and Password
        $staff = User::where('role', '!=', 'student')
                     ->where('email', $identifier)
                     ->first();

        if ($staff && Hash::check($securityKey, $staff->password)) {
            $token = $staff->createToken('lms-react-app')->plainTextToken;
            return response()->json(['user' => $staff, 'token' => $token]);
        }

        // If no match is found, throw a validation error
        throw ValidationException::withMessages([
            'identifier' => ['The provided credentials do not match our records.'],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['curriculum', 'academicLevel', 'subjects', 'targetCareer.pathway']);
        return response()->json($user);
    }
}