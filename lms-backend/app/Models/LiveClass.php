<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiveClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'teacher_id',
        'title',
        'description',
        'meeting_link',
        'start_time',
        'end_time',
        'platform',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    protected $appends = ['computed_status'];

    /**
     * Compute real-time status based on current time.
     */
    public function getComputedStatusAttribute()
    {
        // Manual override (e.g. if cancelled/ended early by teacher)
        if (in_array($this->status, ['cancelled'])) {
            return $this->status;
        }

        $now = now();

        if ($now->between($this->start_time, $this->end_time)) {
            return 'started';
        }

        if ($now->greaterThan($this->end_time)) {
            return 'ended';
        }

        return 'scheduled';
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
