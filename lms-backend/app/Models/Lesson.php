<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    // Allow mass assignment for these columns
    protected $fillable = [
        'sub_unit_id',
        'title',
        'order',
        'is_published' // Allows us to toggle draft/published status
    ];

    public function subUnit()
    {
        return $this->belongsTo(SubUnit::class);
    }

    public function blocks()
    {
        return $this->hasMany(LessonBlock::class)->orderBy('order');
    }
}