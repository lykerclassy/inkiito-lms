<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Community extends Model
{
    use HasFactory;
    
    protected $fillable = ['name', 'description', 'is_public', 'created_by', 'cover_image', 'avatar', 'subject_id'];

    protected $casts = [
        'is_public' => 'boolean'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function posts()
    {
        return $this->hasMany(CommunityPost::class)->orderBy('created_at', 'desc');
    }

    public function events()
    {
        return $this->hasMany(CommunityEvent::class)->orderBy('event_date', 'asc');
    }

    public function getCoverImageAttribute($value)
    {
        if (!$value) return null;
        if (filter_var($value, FILTER_VALIDATE_URL)) return $value;
        return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
    }

    public function getAvatarAttribute($value)
    {
        if (!$value) return null;
        if (filter_var($value, FILTER_VALIDATE_URL)) return $value;
        return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
    }
}
