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
        'admission_number',
        'password',
        'access_key',
        'role',
        'curriculum_id',
        'academic_level_id',
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
}