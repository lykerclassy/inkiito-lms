<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Laravel\Socialite\Facades\Socialite;
use App\Models\GoogleToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GoogleAuthController extends Controller
{
    /**
     * Step 1: Redirect the user to Google's OAuth 2.0 endpoint.
     */
    public function redirect(Request $request)
    {
        // Require user to be authenticated locally first if Connecting or Login (for SPAs, we attach token later)
        // For simple "Connect", we pass the current user's ID as state if possible.
        // Actually Socialite manages state.

        return response()->json([
            'url' => Socialite::driver('google')
                ->redirectUrl(url('/api/auth/google/callback')) // Dynamically use the current domain
                ->scopes(['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'])
                ->with(['access_type' => 'offline', 'prompt' => 'consent'])
                ->stateless()
                ->redirect()
                ->getTargetUrl()
        ]);
    }

    /**
     * Step 2: Handle the callback from Google.
     */
    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')
                ->redirectUrl(url('/api/auth/google/callback'))
                ->stateless()
                ->user();
            
            // To link the Google account to a local user, we need their local user_id. 
            // In a real SPA, we might use a temporary cookie or specific state. 
            // For now, let's look them up by email if they are already logged in? 
            // Wait, we can't easily get the 'current' user if Google redirected it.
            
            // Step 3: Match based on email.
            $user = User::where('email', $googleUser->email)->first();
            
            // Derive Frontend URL: Use .env if provided, otherwise try to guess from APP_URL or current host
            $frontendUrl = env('FRONTEND_URL');
            if (!$frontendUrl) {
                $frontendUrl = str_replace(['/api', ':8000'], ['', ':5173'], url('/'));
            }
            
            if (!$user) {
                return redirect($frontendUrl . '/admin/profile?status=error&message=No matching school account found for this Google email.');
            }

            // Store or Update the Token
            GoogleToken::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'google_id' => $googleUser->id,
                    'access_token' => $googleUser->token,
                    'refresh_token' => $googleUser->refreshToken ?? null,
                    'expires_at' => now()->addSeconds($googleUser->expiresIn),
                ]
            );

            // Redirect back to the frontend profile page
            return redirect($frontendUrl . '/admin/profile?status=success&message=Connected to Google Calendar successfully.');

        } catch (\Exception $e) {
            \Log::error("Google Auth Error: " . $e->getMessage());
            $frontendUrl = env('FRONTEND_URL') ?: str_replace(['/api', ':8000'], ['', ':5173'], url('/'));
            return redirect($frontendUrl . '/admin/profile?status=error&message=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Check if the user is currently connected to Google.
     */
    public function status(Request $request)
    {
        $isConnected = GoogleToken::where('user_id', $request->user()->id)->exists();
        return response()->json([
            'is_connected' => $isConnected
        ]);
    }
}
