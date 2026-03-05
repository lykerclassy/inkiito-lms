<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pathway extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'color_code', 'icon'];

    public function careers()
    {
        return $this->hasMany(Career::class);
    }
}
