<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScienceLab extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'color', 'icon', 'description', 'is_active'];

    public function experiments()
    {
        return $this->hasMany(Experiment::class);
    }
}
