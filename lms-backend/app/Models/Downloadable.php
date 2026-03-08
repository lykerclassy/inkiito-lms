<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Downloadable extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'file_url',
        'file_type',
        'category',
        'subject_id',
        'academic_level_id',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function academicLevel()
    {
        return $this->belongsTo(AcademicLevel::class);
    }
}
