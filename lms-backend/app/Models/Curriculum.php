<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Curriculum extends Model
{
    use HasFactory;

    // Force the exact table name we fixed earlier!
    protected $table = 'curriculums'; 

    protected $fillable = ['name'];

    public function academicLevels()
    {
        return $this->hasMany(AcademicLevel::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}