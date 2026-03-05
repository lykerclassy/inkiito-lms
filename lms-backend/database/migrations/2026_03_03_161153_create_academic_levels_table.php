<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('academic_levels', function (Blueprint $table) {
            $table->id();
            // ADDED 'curriculums' INSIDE THE CONSTRAINED METHOD HERE:
            $table->foreignId('curriculum_id')->constrained('curriculums')->cascadeOnDelete();
            $table->string('name'); // e.g., 'Form 3', 'Grade 10'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('academic_levels');
    }
};