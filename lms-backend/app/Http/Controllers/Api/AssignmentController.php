<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    // ==========================================
    // TEACHER & ADMIN METHODS
    // ==========================================

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Assignment::with(['subject', 'teacher'])->withCount('submissions');

        // If the user is a teacher, only show assignments for subjects they teach
        if ($user->role === 'teacher') {
            $subjectIds = $user->taughtSubjects()->pluck('subjects.id');
            $query->whereIn('subject_id', $subjectIds);
        }

        $assignments = $query->latest()->get();
        return response()->json($assignments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'subject_id' => 'required|exists:subjects,id',
            'due_date' => 'required|date',
        ]);

        if (!$this->canManageSubject($request->user(), $request->subject_id)) {
            return response()->json(['message' => 'You are not assigned to this subject.'], 403);
        }

        $initialContent = json_encode([
            ['id' => uniqid(), 'type' => 'multiple_choice', 'title' => 'Untitled Question', 'options' => ['Option 1'], 'points' => 1]
        ]);

        $assignment = Assignment::create([
            'title' => $request->title,
            'subject_id' => $request->subject_id,
            'teacher_id' => $request->user()->id,
            'type' => $request->type ?? 'Homework',
            'due_date' => $request->due_date,
            'description' => $request->description,
            'content' => $initialContent, 
            'expected_submission_type' => 'complex'
        ]);

        return response()->json(['message' => 'Assignment created', 'assignment' => $assignment->load('subject')]);
    }

    public function update(Request $request, $id)
    {
        $assignment = Assignment::findOrFail($id);
        
        if (!$this->canManageSubject($request->user(), $assignment->subject_id)) {
            return response()->json(['message' => 'You do not have permission to manage this assignment.'], 403);
        }

        $assignment->update($request->only(['title', 'subject_id', 'type', 'due_date', 'description']));
        return response()->json(['message' => 'Assignment details updated', 'assignment' => $assignment->load('subject')]);
    }

    public function updateContent(Request $request, $id)
    {
        $request->validate(['blocks' => 'required|array']);
        $assignment = Assignment::findOrFail($id);

        if (!$this->canManageSubject($request->user(), $assignment->subject_id)) {
            return response()->json(['message' => 'You do not have permission to manage this assignment.'], 403);
        }

        $assignment->update(['content' => json_encode($request->blocks)]);
        return response()->json(['message' => 'Assignment content blocks saved.']);
    }

    public function destroy(Request $request, $id)
    {
        $assignment = Assignment::findOrFail($id);

        if (!$this->canManageSubject($request->user(), $assignment->subject_id)) {
            return response()->json(['message' => 'You do not have permission to delete this assignment.'], 403);
        }

        $assignment->delete();
        return response()->json(['message' => 'Assignment deleted']);
    }

    public function getSubmissions(Request $request, $id)
    {
        $assignment = Assignment::findOrFail($id);

        if (!$this->canManageSubject($request->user(), $assignment->subject_id)) {
            return response()->json(['message' => 'You do not have permission to view these submissions.'], 403);
        }

        $submissions = AssignmentSubmission::where('assignment_id', $id)->with('student')->get();
            
        $submissions->transform(function ($submission) {
            $submission->student_answers = json_decode($submission->student_text, true);
            return $submission;
        });

        return response()->json($submissions);
    }

    public function gradeSubmission(Request $request, $submissionId)
    {
        $request->validate(['score' => 'required|numeric']);
        $submission = AssignmentSubmission::with('assignment')->findOrFail($submissionId);

        if (!$this->canManageSubject($request->user(), $submission->assignment->subject_id)) {
            return response()->json(['message' => 'You do not have permission to grade this submission.'], 403);
        }

        $submission->update([
            'score' => $request->score,
            'teacher_feedback' => $request->teacher_feedback,
            'status' => 'graded'
        ]);
        return response()->json(['message' => 'Grade and feedback saved successfully', 'submission' => $submission]);
    }

    /**
     * Helper to check if a user can manage a subject.
     */
    private function canManageSubject($user, $subjectId)
    {
        if (in_array($user->role, ['admin', 'developer', 'principal', 'deputy_principal', 'dos'])) {
            return true;
        }

        if ($user->role === 'teacher') {
            return $user->taughtSubjects()->where('subjects.id', $subjectId)->exists();
        }

        return false;
    }

    // ==========================================
    // STUDENT METHODS
    // ==========================================

    public function studentAssignments(Request $request)
    {
        $user = $request->user();
        $activeSubjectIds = $user->subjects()->wherePivot('status', 'active')->pluck('subjects.id');

        $assignments = Assignment::whereIn('subject_id', $activeSubjectIds)
            ->with(['subject', 'submissions' => function($query) use ($user) {
                $query->where('student_id', $user->id);
            }])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json($assignments);
    }

    public function submitWork(Request $request, $assignmentId)
    {
        $user = $request->user();
        $request->validate(['answers' => 'required|array']);

        $assignment = Assignment::findOrFail($assignmentId);
        $blocks = json_decode($assignment->content, true) ?? [];
        
        $totalPoints = 0;
        $earnedPoints = 0;
        $requiresManualGrading = false;
        
        // Map correct answers by block ID
        $answerKey = [];
        foreach ($blocks as $block) {
            $answerKey[$block['id']] = $block;
            if (isset($block['points']) && !str_contains($block['type'], 'info')) {
                $totalPoints += (float)$block['points'];
            }
            if (in_array($block['type'], ['paragraph', 'file_upload'])) {
                $requiresManualGrading = true;
            }
        }

        // Grade the student's answers
        $gradedAnswers = [];
        foreach ($request->answers as $ans) {
            $blockId = $ans['blockId'];
            $studentAnswer = $ans['answer'];
            $isCorrect = false;
            $pointsEarned = 0;

            if (isset($answerKey[$blockId])) {
                $block = $answerKey[$blockId];
                $pointsAvailable = (float)($block['points'] ?? 0);
                $correctAnswer = $block['correctAnswer'] ?? null;

                // Auto-grading logic
                if ($block['type'] === 'short_answer' || $block['type'] === 'multiple_choice') {
                    // Case-insensitive string matching
                    if (strtolower(trim($studentAnswer)) === strtolower(trim($correctAnswer))) {
                        $isCorrect = true;
                        $pointsEarned = $pointsAvailable;
                    }
                } elseif ($block['type'] === 'checkboxes') {
                    // Array matching
                    $studentArr = is_array($studentAnswer) ? $studentAnswer : [];
                    $correctArr = is_array($correctAnswer) ? $correctAnswer : [];
                    sort($studentArr);
                    sort($correctArr);
                    if ($studentArr === $correctArr && count($correctArr) > 0) {
                        $isCorrect = true;
                        $pointsEarned = $pointsAvailable;
                    }
                }

                $earnedPoints += $pointsEarned;
            }

            $ans['pointsEarned'] = $pointsEarned;
            $ans['isCorrect'] = $isCorrect;
            $gradedAnswers[] = $ans;
        }

        // Calculate final score
        $score = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100) : 0;
        
        // If everything was auto-graded, instantly mark as graded!
        $status = $requiresManualGrading ? 'submitted' : 'graded';

        $submission = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignmentId, 'student_id' => $user->id],
            [
                'student_text' => json_encode($gradedAnswers), 
                'score' => $score,
                'status' => $status
            ]
        );

        return response()->json(['message' => 'Work submitted and auto-graded successfully', 'submission' => $submission]);
    }
}