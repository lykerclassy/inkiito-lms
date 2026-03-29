<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\Lesson;

$lessons = Lesson::with('subUnit.unit.subject')->get();

echo "Total Lessons in DB: " . $lessons->count() . "\n\n";

foreach ($lessons as $lesson) {
    echo "ID: {$lesson->id} | Title: {$lesson->title}\n";
    echo "  Published: " . ($lesson->is_published ? 'YES' : 'NO') . "\n";
    echo "  Subunit: " . ($lesson->subUnit->title ?? 'NONE') . "\n";
    echo "  Unit: " . ($lesson->subUnit->unit->title ?? 'NONE') . "\n";
    echo "  Subject: " . ($lesson->subUnit->unit->subject->name ?? 'NONE') . " (ID: " . ($lesson->subUnit->unit->subject_id ?? 'N/A') . ")\n";
    echo "-------------------\n";
}
