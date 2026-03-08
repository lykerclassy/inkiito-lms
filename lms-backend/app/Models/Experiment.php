<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Experiment extends Model
{
    use HasFactory;

    protected $fillable = ['science_lab_id', 'curriculum_id', 'slug', 'title', 'level', 'duration', 'simulation_type', 'youtube_url', 'requirements', 'observations', 'explanations', 'conclusion', 'knowledge_check', 'is_active'];

    public function scienceLab()
    {
        return $this->belongsTo(ScienceLab::class);
    }

    public function steps()
    {
        return $this->hasMany(ExperimentStep::class);
    }

    public function curriculum()
    {
        return $this->belongsTo(Curriculum::class);
    }
}
