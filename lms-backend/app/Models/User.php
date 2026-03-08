<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar',
        'admission_number',
        'password',
        'access_key',
        'role',
        'curriculum_id',
        'academic_level_id',
        'target_career_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Get the curriculum associated with the user.
     */
    public function curriculum()
    {
        return $this->belongsTo(Curriculum::class, 'curriculum_id');
    }

    /**
     * Get the academic level (e.g., Grade 10, Form 3) associated with the user.
     */
    public function academicLevel()
    {
        return $this->belongsTo(AcademicLevel::class, 'academic_level_id');
    }

    /**
     * Get the subjects the student is enrolled in.
     * Includes the pivot table 'status' to power the red/blue tick visual indicators.
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class)->withPivot('status')->withTimestamps();
    }

    /**
     * Get the career goal of the student.
     */
    public function targetCareer()
    {
        return $this->belongsTo(Career::class, 'target_career_id');
    }

    /**
     * Get the student's quiz scores.
     */
    public function quizResults()
    {
        return $this->hasMany(QuizResult::class);
    }

    /**
     * Get the student's assignment submissions.
     */
    public function assignmentSubmissions()
    {
        return $this->hasMany(AssignmentSubmission::class, 'student_id');
    }

    /**
     * Get the vocabularies this student has explored/mastered.
     */
    public function vocabularies()
    {
        return $this->belongsToMany(Vocabulary::class, 'user_vocabularies')
                    ->withPivot(['attempts', 'best_score', 'last_seen_at', 'mastered_at'])
                    ->withTimestamps();
    }
}