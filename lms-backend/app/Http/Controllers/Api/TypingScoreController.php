<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypingScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TypingScoreController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $scores = TypingScore::where('user_id', $user->id)
            ->latest()
            ->take(20)
            ->get();
            
        $averageWpm = TypingScore::where('user_id', $user->id)->avg('wpm') ?? 0;
        $maxWpm = TypingScore::where('user_id', $user->id)->max('wpm') ?? 0;
        $averageAccuracy = TypingScore::where('user_id', $user->id)->avg('accuracy') ?? 0;

        return response()->json([
            'scores' => $scores,
            'stats' => [
                'average_wpm' => round($averageWpm),
                'max_wpm' => $maxWpm,
                'average_accuracy' => round($averageAccuracy, 2)
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'wpm' => 'required|integer',
            'accuracy' => 'required|numeric',
            'duration_seconds' => 'required|integer',
        ]);

        $score = TypingScore::create([
            'user_id' => $request->user()->id,
            'wpm' => $request->wpm,
            'accuracy' => $request->accuracy,
            'duration_seconds' => $request->duration_seconds,
        ]);

        return response()->json([
            'message' => 'Score saved successfully',
            'score' => $score
        ]);
    }

    public function leaderboard()
    {
        // Get top 10 highest WPM scores with user names
        $topScores = TypingScore::with('user:id,name')
            ->select('user_id', DB::raw('MAX(wpm) as max_wpm'), DB::raw('MAX(accuracy) as max_accuracy'))
            ->groupBy('user_id')
            ->orderBy('max_wpm', 'desc')
            ->take(10)
            ->get();

        return response()->json($topScores);
    }
}
