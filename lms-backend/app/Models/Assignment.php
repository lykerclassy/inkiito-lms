<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 
        'subject_title_id', 
        'academic_level_id',
        'teacher_id', 
        'type', 
        'due_date', 
        'description', 
        'content', 
        'media_url', 
        'expected_submission_type'
    ];

    public function subjectTitle()
    {
        return $this->belongsTo(SubjectTitle::class, 'subject_title_id');
    }

    public function academicLevel()
    {
        return $this->belongsTo(AcademicLevel::class, 'academic_level_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }
}