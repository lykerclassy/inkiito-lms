<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('curriculums', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., '8-4-4', 'CBC'
            $table->timestamps();
        });
    }

    public function down()
    {
        // Changed this from 'curricula' to 'curriculums'
        Schema::dropIfExists('curriculums');
    }
};