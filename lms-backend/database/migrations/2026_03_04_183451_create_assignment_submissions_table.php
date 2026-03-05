<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            
            // The student's actual work
            $table->longText('student_text')->nullable(); // For typed essays
            $table->string('file_url')->nullable(); // For uploaded PDFs or Video URLs
            
            // Grading
            $table->integer('score')->nullable();
            $table->text('teacher_feedback')->nullable();
            $table->enum('status', ['submitted', 'graded', 'returned_for_revision'])->default('submitted');
            
            $table->timestamps();

            // A student should only have one active submission per assignment
            $table->unique(['assignment_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
    }
};