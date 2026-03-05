<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExperimentStep extends Model
{
    use HasFactory;

    protected $fillable = ['experiment_id', 'instruction', 'type', 'step_order'];

    public function experiment()
    {
        return $this->belongsTo(Experiment::class);
    }
}
