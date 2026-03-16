<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\Subject;
use Illuminate\Http\Request;

class QuizManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Quiz::with('subject', 'questions');

        // If teacher, only show quizzes for subjects they teach
        if ($user->role === 'teacher') {
            $taughtSubjectIds = $user->taughtSubjects->pluck('id');
            $query->whereIn('subject_id', $taughtSubjectIds);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'time_limit' => 'nullable|integer',
            'is_active' => 'boolean'
        ]);

        $user = $request->user();

        // Security: Teachers can only create quizzes for their subjects
        if ($user->role === 'teacher' && !$user->taughtSubjects->contains($request->subject_id)) {
            return response()->json(['message' => 'Unauthorized to create quiz for this subject.'], 403);
        }

        $quiz = Quiz::create([
            'subject_id' => $request->subject_id,
            'title' => $request->title,
            'description' => $request->description,
            'time_limit' => $request->time_limit,
            'is_active' => $request->is_active ?? true,
            'created_by' => $user->id
        ]);

        return response()->json(['message' => 'Quiz created successfully', 'quiz' => $quiz], 201);
    }

    public function show($id)
    {
        $quiz = Quiz::with('questions', 'subject')->findOrFail($id);
        return response()->json($quiz);
    }

    public function update(Request $request, $id)
    {
        $quiz = Quiz::findOrFail($id);
        $user = $request->user();

        // Security check
        if ($user->role === 'teacher' && !$user->taughtSubjects->contains($quiz->subject_id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $quiz->update($request->all());
        return response()->json(['message' => 'Quiz updated', 'quiz' => $quiz]);
    }

    public function destroy($id)
    {
        $quiz = Quiz::findOrFail($id);
        $quiz->delete();
        return response()->json(['message' => 'Quiz deleted']);
    }

    // --- Question Management ---

    public function addQuestion(Request $request, $quizId)
    {
        $quiz = Quiz::findOrFail($quizId);
        
        $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'required|string',
            'options' => 'nullable', // Removed array constraint because it's sent as JSON string
            'correct_answer' => 'required|string',
            'points' => 'integer',
            'image' => 'nullable|image|max:2048'
        ]);

        $data = $request->only(['question_text', 'question_type', 'correct_answer', 'points']);
        
        // Handle options if present (sent as JSON string via FormData)
        if ($request->has('options')) {
            $data['options'] = is_string($request->options) ? json_decode($request->options, true) : $request->options;
        }

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('quizzes', 'public');
        }

        $question = $quiz->questions()->create($data);

        return response()->json(['message' => 'Question added', 'question' => $question]);
    }

    public function updateQuestion(Request $request, $id)
    {
        $question = QuizQuestion::findOrFail($id);

        $request->validate([
            'question_text' => 'sometimes|required|string',
            'question_type' => 'sometimes|required|string',
            'options' => 'nullable',
            'correct_answer' => 'sometimes|required|string',
            'points' => 'sometimes|integer',
            'image' => 'nullable|image|max:2048'
        ]);
        
        $data = $request->except(['image']);

        // Handle options if present (sent as JSON string via FormData)
        if ($request->has('options')) {
            $data['options'] = is_string($request->options) ? json_decode($request->options, true) : $request->options;
        }

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($question->image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($question->image_path);
            }
            $data['image_path'] = $request->file('image')->store('quizzes', 'public');
        }

        $question->update($data);
        return response()->json(['message' => 'Question updated', 'question' => $question]);
    }

    public function deleteQuestion($id)
    {
        $question = QuizQuestion::findOrFail($id);
        $question->delete();
        return response()->json(['message' => 'Question deleted']);
    }
}
