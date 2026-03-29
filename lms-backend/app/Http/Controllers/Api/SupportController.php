<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    /**
     * Get tickets for the logged in user or all for developer
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role === 'developer' || $user->role === 'admin') {
            return SupportTicket::with('user')->orderBy('created_at', 'desc')->get();
        }

        return SupportTicket::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Create a new ticket
     */
    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'nullable|string|in:low,medium,high,critical'
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => $request->subject,
            'message' => $request->message,
            'priority' => $request->priority ?? 'medium'
        ]);

        return response()->json([
            'message' => 'Your inquiry has been submitted! Our developer will review it shortly.',
            'ticket' => $ticket
        ], 201);
    }

    /**
     * Update a ticket (Response/Status)
     */
    public function update(Request $request, $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $user = $request->user();

        // Only developer or admin can respond/change status
        if ($user->role !== 'developer' && $user->role !== 'admin') {
             return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'developer_response' => 'nullable|string',
            'status' => 'nullable|string|in:open,in_progress,resolved,closed,on_hold'
        ]);

        if ($request->has('developer_response')) {
            $ticket->developer_response = $request->developer_response;
        }

        if ($request->has('status')) {
            $ticket->status = $request->status;
            if ($request->status === 'resolved') {
                $ticket->resolved_at = now();
            }
        }

        $ticket->save();

        return response()->json([
            'message' => 'Ticket updated successfully.',
            'ticket' => $ticket
        ]);
    }
}
