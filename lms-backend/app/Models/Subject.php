<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'academic_level_id',
    ];

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