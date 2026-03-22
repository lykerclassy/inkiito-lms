<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'community_id',
        'title',
        'description',
        'event_date',
        'location'
    ];

    protected $casts = [
        'event_date' => 'datetime'
    ];

    public function community()
    {
        return $this->belongsTo(Community::class);
    }
}
