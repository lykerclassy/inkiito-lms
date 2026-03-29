<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentPortfolio extends Model
{
    protected $fillable = [
        'student_id',
        'subject_id',
        'title',
        'description',
        'media_path',
        'media_type',
        'exhibition_date',
        'competency_tag',
        'is_featured'
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
