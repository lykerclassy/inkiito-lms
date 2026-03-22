<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CareerTrack extends Model
{
    use HasFactory;

    protected $fillable = ['pathway_id', 'name', 'description'];

    public function pathway()
    {
        return $this->belongsTo(Pathway::class);
    }

    public function careers()
    {
        return $this->hasMany(Career::class);
    }
}
