<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonBlock extends Model
{
    use HasFactory;

    protected $fillable = ['lesson_id', 'type', 'content', 'order'];

    // Automatically convert JSON content to an array when accessing it
    protected $casts = [
        'content' => 'array', 
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}