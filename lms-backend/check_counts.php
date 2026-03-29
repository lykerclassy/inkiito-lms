<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\Subject;
use App\Models\Lesson;

$subjects = Subject::all();

foreach ($subjects as $subject) {
    $allLessons = Lesson::whereHas('subUnit.unit', function ($q) use ($subject) {
        $q->where('subject_id', $subject->id);
    })->count();

    $publishedLessons = Lesson::whereHas('subUnit.unit', function ($q) use ($subject) {
        $q->where('subject_id', $subject->id);
    })->where('is_published', true)->count();

    echo "Subject: {$subject->name} (ID: {$subject->id})\n";
    echo "  Total Lessons: {$allLessons}\n";
    echo "  Published Lessons: {$publishedLessons}\n";
    echo "-------------------\n";
}
