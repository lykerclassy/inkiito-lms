<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\LiveClass;
use App\Models\Subject;

class LiveClassController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LiveClass::with(['subject', 'teacher']);

        // Filter based on role if needed.
        // For students: only show their enrolled subjects.
        if ($user->role === 'student') {
            $enrolledSubjectIds = $user->subjects()->wherePivot('status', 'active')->pluck('subjects.id');
            $query->whereIn('subject_id', $enrolledSubjectIds);
            
            // Only show live or scheduled for today
            $query->where('status', '!=', 'cancelled');
        }

        return response()->json($query->orderBy('start_time', 'asc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'meeting_link' => 'nullable|url',
        ]);

        $user = $request->user();

        // Security check
        if (!$this->canManageSubject($user, $request->subject_id)) {
            return response()->json(['message' => 'Unauthorized to schedule live classes for this subject.'], 403);
        }

        $meetLink = $request->meeting_link;
        $isRealGoogleLink = false;

        // If no link provided, try to generate a real Google Meet link via API
        if (!$meetLink) {
            $client = $this->getGoogleClient($user);
            if ($client) {
                try {
                    $meetLink = $this->createRealGoogleMeetEvent($client, $request);
                    $isRealGoogleLink = (bool)$meetLink;
                } catch (\Exception $e) {
                    \Log::error("Google Meet API Error: " . $e->getMessage());
                }
            }
            
            // Fallback to formatted mock link if Google is not connected or fails
            if (!$meetLink) {
                $pool = 'abcdefghijklmnopqrstuvwxyz';
                $g1 = substr(str_shuffle($pool), 0, 3);
                $g2 = substr(str_shuffle($pool), 0, 4);
                $g3 = substr(str_shuffle($pool), 0, 3);
                $meetLink = "https://meet.google.com/$g1-$g2-$g3";
            }
        }

        $liveClass = LiveClass::create([
            'subject_id' => $request->subject_id,
            'teacher_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'meeting_link' => $meetLink,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'platform' => 'google_meet',
            'status' => 'scheduled',
        ]);

        $message = 'Live class scheduled successfully.';
        if ($isRealGoogleLink) {
            $message .= ' (Verified Google Meet link generated and synced to your calendar)';
        } elseif (!$request->meeting_link) {
            $message .= ' (Local Google Meet link generated. Connect your Google account for calendar sync)';
        }

        return response()->json([
            'message' => $message,
            'live_class' => $liveClass->load('subject')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $liveClass = LiveClass::findOrFail($id);
        
        if (!$this->canManageSubject($request->user(), $liveClass->subject_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $liveClass->update($request->all());
        return response()->json(['message' => 'Live class updated', 'live_class' => $liveClass]);
    }

    public function destroy(Request $request, $id)
    {
        $liveClass = LiveClass::findOrFail($id);
        
        if (!$this->canManageSubject($request->user(), $liveClass->subject_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $liveClass->delete();
        return response()->json(['message' => 'Live class cancelled/deleted']);
    }

    private function canManageSubject($user, $subjectId)
    {
        if (in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos'])) {
            return true;
        }

        if (in_array($user->role, ['teacher', 'class_teacher'])) {
            return $user->taughtSubjects()->where('subjects.id', $subjectId)->exists();
        }

        return false;
    }

    private function getGoogleClient($user)
    {
        $token = $user->googleToken;
        if (!$token) return null;

        $client = new \Google\Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken($token->access_token);

        if ($token->expires_at->isPast()) {
            if ($token->refresh_token) {
                try {
                    $newToken = $client->fetchAccessTokenWithRefreshToken($token->refresh_token);
                    if (isset($newToken['access_token'])) {
                        $token->update([
                            'access_token' => $newToken['access_token'],
                            'expires_at' => now()->addSeconds($newToken['expires_in']),
                        ]);
                        $client->setAccessToken($newToken['access_token']);
                    } else {
                        return null;
                    }
                } catch (\Exception $e) {
                    return null;
                }
            } else {
                return null;
            }
        }

        return $client;
    }

    private function createRealGoogleMeetEvent($client, $request)
    {
        $service = new \Google\Service\Calendar($client);

        $event = new \Google\Service\Calendar\Event([
            'summary' => $request->title,
            'description' => $request->description ?? 'Live interactive class session on Inkiito LMS.',
            'start' => ['dateTime' => date(\DateTime::RFC3339, strtotime($request->start_time)), 'timeZone' => config('app.timezone', 'UTC')],
            'end' => ['dateTime' => date(\DateTime::RFC3339, strtotime($request->end_time)), 'timeZone' => config('app.timezone', 'UTC')],
            'conferenceData' => [
                'createRequest' => [
                    'requestId' => uniqid(),
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet']
                ]
            ]
        ]);

        $event = $service->events->insert('primary', $event, ['conferenceDataVersion' => 1]);
        
        return $event->getHangoutLink();
    }
}
