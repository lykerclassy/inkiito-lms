<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\CommunityPost;
use App\Models\CommunityPostReply;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $communities = Community::withCount('members')->with('subject')->get();
        
        $myCommunityIds = $user->communities()->pluck('communities.id')->toArray();
        $mySubjectIds = $user->subjects()->pluck('subjects.id')->toArray();
        $isStaff = in_array($user->role, ['admin', 'developer', 'principal', 'teacher', 'class_teacher', 'dos', 'deputy_principal']);

        $communities = $communities->map(function ($c) use ($myCommunityIds, $mySubjectIds, $isStaff) {
            $c->is_member = in_array($c->id, $myCommunityIds);
            
            // Can only join if not restricted, or user is enrolled in the subject, or user is staff
            $c->can_join = true;
            if ($c->subject_id && !$isStaff && !in_array($c->subject_id, $mySubjectIds)) {
                $c->can_join = false;
            }
            
            return $c;
        });

        // If staff, also return all subjects to populate creation dropdown
        $subjects = [];
        if ($isStaff) {
            $subjects = \App\Models\Subject::orderBy('name')->get();
        }

        return response()->json([
            'communities' => $communities,
            'subjects' => $subjects
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
            'subject_id' => 'nullable|exists:subjects,id'
        ]);

        $community = Community::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_public' => $request->is_public ?? true,
            'subject_id' => $request->subject_id,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($community, 201);
    }

    public function update(Request $request, $id)
    {
        $community = Community::findOrFail($id);
        
        $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'nullable', // Handled below
            'subject_id' => 'nullable', // Validated manually or via logic
            'avatar' => 'nullable|image|max:5120',
            'cover_image' => 'nullable|image|max:10240'
        ]);

        if ($request->filled('name')) $community->name = $request->name;
        if ($request->has('description')) $community->description = $request->description;
        
        if ($request->has('is_public')) {
            $community->is_public = filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN);
        }

        // Handle subject_id conversion from string/null
        if ($request->has('subject_id')) {
            $subId = $request->subject_id;
            if ($subId === '' || $subId === 'null' || $subId === 'undefined') {
                $community->subject_id = null;
            } else {
                $community->subject_id = $subId;
            }
        }

        // Image Handling Pattern exactly like UserController@updateProfile
        if ($request->hasFile('avatar')) {
            $oldPath = $community->getRawOriginal('avatar');
            if ($oldPath && !filter_var($oldPath, FILTER_VALIDATE_URL)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $community->avatar = $request->file('avatar')->store('communities/avatars', 'public');
        }

        if ($request->hasFile('cover_image')) {
            $oldPath = $community->getRawOriginal('cover_image');
            if ($oldPath && !filter_var($oldPath, FILTER_VALIDATE_URL)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $community->cover_image = $request->file('cover_image')->store('communities/covers', 'public');
        }

        $community->save();

        return response()->json($community->load('subject'));
    }

    public function join(Request $request, $id)
    {
        $community = Community::findOrFail($id);
        $user = $request->user();
        $isStaff = in_array($user->role, ['admin', 'developer', 'principal', 'teacher', 'class_teacher', 'dos', 'deputy_principal']);
        
        // Subject Restriction Check
        if ($community->subject_id && !$isStaff) {
            $isEnrolled = $user->subjects()->where('subjects.id', $community->subject_id)->exists();
            if (!$isEnrolled) {
                return response()->json(['error' => 'Enrollment required in ' . $community->subject->name . ' to join this community.'], 403);
            }
        }

        if (!$community->members()->where('user_id', $user->id)->exists()) {
            $community->members()->attach($user->id);
        }

        return response()->json(['message' => 'Joined community']);
    }

    public function leave(Request $request, $id)
    {
        $community = Community::findOrFail($id);
        $user = $request->user();
        
        $community->members()->detach($user->id);

        return response()->json(['message' => 'Left community']);
    }

    public function show($id, Request $request)
    {
        $community = Community::with(['creator', 'posts.user', 'posts.replies.user', 'events', 'subject'])->withCount('members')->findOrFail($id);
        $community->is_member = $community->members()->where('user_id', $request->user()->id)->exists();
        return response()->json($community);
    }

    public function storePost(Request $request, $id)
    {
        $community = Community::findOrFail($id);
        if (!$community->members()->where('user_id', $request->user()->id)->exists()) {
            return response()->json(['error' => 'Not a member'], 403);
        }

        $request->validate([
            'content' => 'required|string',
            'media_file' => 'nullable|file|max:10240',
            'media_type' => 'nullable|string'
        ]);

        $data = [
            'community_id' => $community->id,
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'media_type' => $request->media_type
        ];

        if ($request->hasFile('media_file')) {
            $data['media_url'] = $request->file('media_file')->store('community_posts', 'public');
        }

        $post = CommunityPost::create($data);

        return response()->json($post->load('user', 'replies'));
    }

    public function destroyPost(Request $request, $id, $postId)
    {
        $post = CommunityPost::where('community_id', $id)->findOrFail($postId);
        
        $isAuthor = $post->user_id === $request->user()->id;
        $isSysAdmin = in_array($request->user()->role, ['admin', 'developer']);
        
        if (!$isAuthor && !$isSysAdmin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }


    public function storeReply(Request $request, $id, $postId)
    {
        $request->validate(['content' => 'required|string']);
        
        $post = CommunityPost::where('community_id', $id)->findOrFail($postId);

        $reply = CommunityPostReply::create([
            'community_post_id' => $post->id,
            'user_id' => $request->user()->id,
            'content' => $request->content
        ]);

        return response()->json($reply->load('user'));
    }
}
