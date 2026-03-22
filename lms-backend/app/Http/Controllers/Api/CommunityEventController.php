<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\CommunityEvent;
use Illuminate\Http\Request;

class CommunityEventController extends Controller
{
    public function store(Request $request, $communityId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'event_date' => 'required|date',
            'description' => 'nullable|string'
        ]);

        $event = CommunityEvent::create([
            'community_id' => $communityId,
            'title' => $request->title,
            'description' => $request->description,
            'event_date' => \Carbon\Carbon::parse($request->event_date)->toDateTimeString()
        ]);

        return response()->json($event, 201);
    }
}
