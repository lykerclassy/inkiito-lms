<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\CommunityPost;
use App\Models\CommunityPostReply;
use App\Models\SubjectTitle;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $communities = Community::withCount('members')->with('subjectTitle')->get();
        
        $myCommunityIds = $user->communities()->pluck('communities.id')->toArray();
        // Enrollment check: we use the ENROLLED subject's title ID
        $myEnrolledTitleIds = $user->subjects()
            ->wherePivotIn('status', ['active', 'completed'])
            ->pluck('subjects.subject_title_id')->toArray();
            
        $isStaff = in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher']);

        $communities = $communities->map(function ($c) use ($myCommunityIds, $myEnrolledTitleIds, $isStaff) {
            $c->is_member = in_array($c->id, $myCommunityIds);
            
            $c->can_join = true;
            // Loophole Check: student can only join if they take the subject (via title)
            if ($c->subject_title_id && !$isStaff && !in_array($c->subject_title_id, $myEnrolledTitleIds)) {
                $c->can_join = false;
            }
            
            return $c;
        });

        // Dropdown for staff/creation
        $subjects = [];
        if ($isStaff) {
            $subjects = SubjectTitle::orderBy('name')->get();
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
            'subject_title_id' => 'nullable|exists:subject_titles,id'
        ]);

        $community = Community::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_public' => $request->is_public ?? true,
            'subject_title_id' => $request->subject_title_id,
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
            'is_public' => 'nullable',
            'subject_title_id' => 'nullable|exists:subject_titles,id',
            'avatar' => 'nullable|image|max:5120',
            'cover_image' => 'nullable|image|max:10240'
        ]);

        if ($request->filled('name')) $community->name = $request->name;
        if ($request->has('description')) $community->description = $request->description;
        
        if ($request->has('is_public')) {
            $community->is_public = filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->has('subject_title_id')) {
            $val = $request->subject_title_id;
            if ($val === '' || $val === 'null') {
                 $community->subject_title_id = null;
            } else {
                 $community->subject_title_id = $val;
            }
        }

        if ($request->hasFile('avatar')) {
             $community->avatar = $request->file('avatar')->store('communities/avatars', 'public');
        }

        if ($request->hasFile('cover_image')) {
             $community->cover_image = $request->file('cover_image')->store('communities/covers', 'public');
        }

        $community->save();

        return response()->json($community->load('subjectTitle'));
    }

    public function join(Request $request, $id)
    {
        $community = Community::findOrFail($id);
        $user = $request->user();
        $isStaff = in_array($user->role, ['admin', 'developer', 'principal', 'teacher', 'class_teacher', 'dos', 'deputy_principal']);
        
        // Subject Restriction Check via Enrollment and Title
        if ($community->subject_title_id && !$isStaff) {
            $isEnrolled = $user->subjects()
                ->where('subjects.subject_title_id', $community->subject_title_id)
                ->wherePivotIn('status', ['active', 'completed'])
                ->exists();
            if (!$isEnrolled) {
                return response()->json(['error' => 'Enrollment required in ' . ($community->subjectTitle->name ?? 'the subject') . ' to join this community.'], 403);
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
        $community = Community::with([
            'creator', 
            'posts' => function($q) {
                $q->orderBy('is_announcement', 'desc')->orderBy('created_at', 'desc');
            },
            'posts.user', 
            'posts.replies.user', 
            'events', 
            'subjectTitle'
        ])->withCount('members')->findOrFail($id);
        $user = $request->user();
        $isStaff = in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher']);
        
        $community->is_member = $community->members()->where('user_id', $user->id)->exists();

        // Privacy check
        if ($community->subject_title_id && !$isStaff) {
            $isEnrolled = $user->subjects()
                ->where('subjects.subject_title_id', $community->subject_title_id)
                ->wherePivotIn('status', ['active', 'completed'])
                ->exists();
            if (!$isEnrolled) {
                return response()->json(['error' => 'Access restricted.'], 403);
            }
        }

        return response()->json($community);
    }

    public function storePost(Request $request, $id)
    {
        $community = Community::findOrFail($id);
        $user = $request->user();
        $isStaff = in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher']);

        if (!$community->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'Not a member'], 403);
        }

        if ($community->subject_title_id && !$isStaff) {
             $isEnrolled = $user->subjects()
                ->where('subjects.subject_title_id', $community->subject_title_id)
                ->wherePivotIn('status', ['active', 'completed'])
                ->exists();
            if (!$isEnrolled) {
                return response()->json(['error' => 'Unauthorized participation.'], 403);
            }
        }

        $request->validate([
            'content' => 'required|string', 
            'media_file' => 'nullable|file|max:5120', // Cap local files to 5MB
            'media_type' => 'nullable|string',
            'media_url' => 'nullable|string|url', // Accept string URLs for YouTube
            'is_announcement' => 'nullable|boolean'
        ]);

        $data = [
            'community_id' => $community->id, 
            'user_id' => $user->id, 
            'content' => $request->content, 
            'media_type' => $request->media_type,
            'is_announcement' => $isStaff ? filter_var($request->input('is_announcement', false), FILTER_VALIDATE_BOOLEAN) : false
        ];
        
        if ($request->media_type === 'youtube' && $request->media_url) {
            $data['media_url'] = $request->media_url;
        } elseif ($request->hasFile('media_file')) {
            $data['media_url'] = $request->file('media_file')->store('community_posts', 'public');
        }

        $post = CommunityPost::create($data);
        return response()->json($post->load('user', 'replies'));
    }

    public function updatePost(Request $request, $id, $postId)
    {
        $post = CommunityPost::findOrFail($postId);
        if ($post->user_id != $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'required|string',
            'media_file' => 'nullable|file|max:5120',
            'media_type' => 'nullable|string',
            'media_url' => 'nullable|string|url',
            'is_announcement' => 'nullable|boolean'
        ]);

        $isStaff = in_array($request->user()->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher']);
        
        $post->content = $request->content;
        $post->media_type = $request->media_type;
        if ($isStaff) {
            $post->is_announcement = filter_var($request->input('is_announcement', false), FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->media_type === 'youtube' && $request->media_url) {
            // Delete old physical file if switching to youtube
            if ($post->media_url && !str_starts_with($post->media_url, 'http')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($post->media_url);
            }
            $post->media_url = $request->media_url;
        } elseif ($request->hasFile('media_file')) {
            // Delete old physical file before replacing
            if ($post->media_url && !str_starts_with($post->media_url, 'http')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($post->media_url);
            }
            $post->media_url = $request->file('media_file')->store('community_posts', 'public');
        }

        $post->save();
        return response()->json($post->load('user', 'replies'));
    }

    public function destroyPost(Request $request, $id, $postId)
    {
        $post = CommunityPost::findOrFail($postId);
        $isStaff = in_array($request->user()->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher']);
        
        if ($post->user_id != $request->user()->id && !$isStaff) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Clean up physical file if it exists and isn't a youtube URL
        if ($post->media_url && $post->media_type !== 'youtube' && !str_starts_with($post->media_url, 'http')) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($post->media_url);
        }

        $post->delete();
        return response()->json(['message' => 'Post deleted']);
    }

    public function storeReply(Request $request, $id, $postId)
    {
        $request->validate(['content' => 'required|string']);
        $post = CommunityPost::where('community_id', $id)->findOrFail($postId);
        $reply = CommunityPostReply::create(['community_post_id' => $post->id, 'user_id' => $request->user()->id, 'content' => $request->content]);
        return response()->json($reply->load('user'));
    }

    public function updateReply(Request $request, $id, $postId, $replyId)
    {
        $reply = CommunityPostReply::findOrFail($replyId);
        if ($reply->user_id != $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate(['content' => 'required|string']);
        $reply->content = $request->content;
        $reply->save();

        return response()->json($reply->load('user'));
    }

    public function destroyReply(Request $request, $id, $postId, $replyId)
    {
        $reply = CommunityPostReply::findOrFail($replyId);
        $isStaff = in_array($request->user()->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher']);

        if ($reply->user_id != $request->user()->id && !$isStaff) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        $reply->delete();
        return response()->json(['message' => 'Reply deleted.']);
    }
}
