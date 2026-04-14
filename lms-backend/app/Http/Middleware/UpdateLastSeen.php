<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UpdateLastSeen
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (auth()->check()) {
            $user = auth()->user();
            
            // Log daily attendance
            if ($user->role === 'student') {
                $today = now()->toDateString();
                \DB::table('attendances')->insertOrIgnore([
                    'user_id' => $user->id,
                    'date' => $today,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // To prevent massive database writes on every single API pulse,
            // we only update the timestamp if it's been more than 2 minutes since the last update.
            if (!$user->last_seen_at || $user->last_seen_at->diffInMinutes(now()) >= 2) {
                // Perform a quiet update (avoids touching updated_at which triggers observer loops)
                \DB::table('users')->where('id', $user->id)->update(['last_seen_at' => now()]);
            }
        }

        return $response;
    }
}
