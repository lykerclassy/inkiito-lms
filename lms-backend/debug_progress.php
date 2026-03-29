<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use App\Models\Lesson;
use App\Models\Assignment;

$studentId = $argv[1] ?? 2; // Default to 2 if not provided
$student = User::with(['subjects', 'completedLessons', 'curriculum', 'academicLevel'])->find($studentId);

if (!$student) {
    echo "Student not found\n";
    exit;
}

echo "Student: " . $student->name . " (ID: " . $student->id . ")\n";

foreach ($student->subjects as $subject) {
    echo "\nSubject: " . $subject->name . " (ID: " . $subject->id . ")\n";
    
    $totalLessons = Lesson::whereHas('subUnit.unit', function ($q) use ($subject) {
        $q->where('subject_id', $subject->id);
    })->where('is_published', true)->count();

    $completedLessons = $student->completedLessons()
        ->whereHas('subUnit.unit', function ($q) use ($subject) {
            $q->where('subject_id', $subject->id);
        })->count();

    $totalAssignments = App\Models\Assignment::where('subject_id', $subject->id)->count();
    $completedAssignments = App\Models\AssignmentSubmission::where('student_id', $student->id)
        ->whereHas('assignment', function($q) use ($subject) {
            $q->where('subject_id', $subject->id);
        })->count();

    $totalQuizzes = App\Models\Quiz::where('subject_id', $subject->id)->where('is_active', true)->count();

    $totalItems = $totalLessons + $totalAssignments + $totalQuizzes;
    $completedItems = $completedLessons + $completedAssignments; // Simplification for debug

    echo "Lessons: $completedLessons/$totalLessons | Assignments: $completedAssignments/$totalAssignments | Quizzes: ?/$totalQuizzes\n";
    $progress = $totalItems > 0 ? round(($completedItems / $totalItems) * 100) : 0;
    echo "Aggregate Progress: " . $progress . "%\n";
}

$userSubjectIds = $student->subjects->pluck('id')->toArray();
$allAssignments = Assignment::whereIn('subject_id', $userSubjectIds)->get();
echo "\nAssignments Count: " . $allAssignments->count() . "\n";
foreach ($allAssignments as $assignment) {
    $days = now()->diffInDays($assignment->due_date, false);
    echo "Assignment: " . $assignment->title . " | Due: " . $assignment->due_date . " | Days diff: " . $days . "\n";
}
