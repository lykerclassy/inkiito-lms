<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vocabulary extends Model
{
    use HasFactory;

    protected $fillable = [
        'word',
        'definition',
        'phonetic',
        'category',
        'difficulty',
    ];

    /**
     * Get the users tracking this word.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_vocabularies')
                    ->withPivot(['attempts', 'best_score', 'last_seen_at', 'mastered_at'])
                    ->withTimestamps();
    }
}
