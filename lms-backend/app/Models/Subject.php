<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_title_id',
        'academic_level_id',
        'is_compulsory',
    ];

    protected $casts = [
        'is_compulsory' => 'boolean',
    ];

    protected $with = ['title'];

    protected $appends = ['name'];

    /**
     * Get the subject title record for this subject instance.
     */
    public function title()
    {
        return $this->belongsTo(SubjectTitle::class, 'subject_title_id');
    }

    /**
     * Get the name from the title record (backward compatibility).
     */
    public function getNameAttribute()
    {
        return $this->title?->name ?? 'Untitled Subject';
    }

    /**
     * Get the academic level this subject belongs to (e.g., Grade 10, Form 3).
     */
    public function academicLevel()
    {
        return $this->belongsTo(AcademicLevel::class, 'academic_level_id');
    }

    /**
     * Get the units (strands/topics) associated with this subject.
     */
    public function units()
    {
        return $this->hasMany(Unit::class)->orderBy('order');
    }

    /**
     * Get the students enrolled in this subject.
     * Includes the pivot table 'status' to power the red tick, blue tick, and blue x indicators.
     */
    public function students()
    {
        return $this->belongsToMany(User::class)->withPivot('status')->withTimestamps();
    }

    /**
     * Get the teachers assigned to teach this subject.
     */
    public function teachers()
    {
        return $this->belongsToMany(User::class, 'subject_teacher')->withTimestamps();
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }
}