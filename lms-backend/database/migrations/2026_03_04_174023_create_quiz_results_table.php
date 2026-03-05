<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_block_id')->constrained()->onDelete('cascade');
            
            // Tracking the actual answer and if it was right/wrong
            $table->string('student_answer')->nullable();
            $table->boolean('is_correct');
            
            $table->timestamps();

            // A student should only have one recorded result per specific quiz block
            $table->unique(['user_id', 'lesson_block_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_results');
    }
};