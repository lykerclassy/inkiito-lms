<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    // Allow mass assignment for these columns
    protected $fillable = [
        'subject_id',
        'title',
        'order'
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function subUnits()
    {
        return $this->hasMany(SubUnit::class)->orderBy('order');
    }
}