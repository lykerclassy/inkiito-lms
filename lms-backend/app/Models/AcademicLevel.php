<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicLevel extends Model
{
    use HasFactory;

    protected $fillable = ['curriculum_id', 'name'];

    public function curriculum()
    {
        // Notice we still specify 'curriculums' here just to be safe!
        return $this->belongsTo(Curriculum::class, 'curriculum_id')->setModel('App\Models\Curriculum');
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}