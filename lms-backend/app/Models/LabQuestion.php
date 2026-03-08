<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'science_lab_id',
        'student_id',
        'coordinator_id',
        'question',
        'answer',
        'status',
    ];

    public function scienceLab()
    {
        return $this->belongsTo(ScienceLab::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }
}
