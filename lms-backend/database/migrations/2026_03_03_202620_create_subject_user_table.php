<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subject_user', function (Blueprint $table) {
            $table->id();
            // Link to the user (student)
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            // Link to the subject
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            
            // This powers your Red Tick, Blue Tick, and Blue X!
            $table->enum('status', ['active', 'completed', 'dropped'])->default('active');
            
            $table->timestamps();

            // Ensure a student can't be enrolled in the exact same subject twice
            $table->unique(['user_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_user');
    }
};