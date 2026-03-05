<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubUnit extends Model
{
    use HasFactory;

    // Allow mass assignment for these columns
    protected $fillable = [
        'unit_id',
        'title',
        'order'
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }
}