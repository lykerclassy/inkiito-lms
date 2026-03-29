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
        'subject_title_id',
        'academic_level_id',
    ];

    public function subjectTitle()
    {
        return $this->belongsTo(SubjectTitle::class, 'subject_title_id');
    }

    public function academicLevel()
    {
        return $this->belongsTo(AcademicLevel::class, 'academic_level_id');
    }

    /**
     * Get the resource's file URL.
     * Ensures consistent URLs across all environments.
     */
    public function getFileUrlAttribute($value)
    {
        if (!$value) return null;
        
        // If it's already a full URL (external link), return it
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        // Otherwise generate it using current disk
        return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
    }
}
