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
        // We now ask for 'identifier' and 'security_key' instead of email/password
        $request->validate([
            'identifier' => 'required',
            'security_key' => 'required',
        ]);

        $identifier = $request->identifier;
        $securityKey = $request->security_key;

        // SCENARIO 1: Is it a Student using an Admission Number?
        $student = User::where('role', 'student')
                       ->where('admission_number', $identifier)
                       ->where('access_key', $securityKey)
                       ->first();

        if ($student) {
            $token = $student->createToken('lms-react-app')->plainTextToken;
            $student->load(['curriculum', 'academicLevel']);
            return response()->json(['user' => $student, 'token' => $token]);
        }

        // SCENARIO 2: Is it a Teacher/Admin using an Email address?
        $staff = User::whereIn('role', ['admin', 'teacher'])
                     ->where('email', $identifier)
                     ->first();

        if ($staff && Hash::check($securityKey, $staff->password)) {
            $token = $staff->createToken('lms-react-app')->plainTextToken;
            return response()->json(['user' => $staff, 'token' => $token]);
        }

        // If neither scenario passes, reject the login
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
        $user = $request->user()->load(['curriculum', 'academicLevel']);
        return response()->json($user);
    }
}