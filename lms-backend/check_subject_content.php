<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\Subject;
use App\Models\Lesson;
use App\Models\Assignment;
use App\Models\Quiz;

$subjectId = 1;
$subject = Subject::find($subjectId);

if (!$subject) {
    echo "Subject not found\n";
    exit;
}

$lessons = Lesson::whereHas('subUnit.unit', function ($q) use ($subjectId) {
    $q->where('subject_id', $subjectId);
})->where('is_published', true)->count();

$assignments = Assignment::where('subject_id', $subjectId)->count();
$quizzes = Quiz::where('subject_id', $subjectId)->count();

echo "Subject: {$subject->name}\n";
echo "Lessons: {$lessons}\n";
echo "Assignments: {$assignments}\n";
echo "Quizzes: {$quizzes}\n";
echo "Total Content: " . ($lessons + $assignments + $quizzes) . "\n";
