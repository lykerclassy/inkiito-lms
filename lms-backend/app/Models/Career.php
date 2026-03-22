<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Career extends Model
{
    use HasFactory;

    protected $fillable = [
        'pathway_id',
        'career_track_id',
        'track',
        'name',
        'slug',
        'description',
        'salary_range',
        'outlook',
        'qualifications',
        'skills',
        'typical_employers'
    ];

    public function pathway()
    {
        return $this->belongsTo(Pathway::class);
    }

    public function careerTrack()
    {
        return $this->belongsTo(CareerTrack::class, 'career_track_id');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'career_subject')
                    ->withPivot('is_mandatory')
                    ->withTimestamps();
    }
}
