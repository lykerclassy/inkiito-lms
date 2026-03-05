<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            
            // Link to the subject (e.g., Computer Studies)
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            
            // Link to the user (Teacher/Admin) who created it
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            
            // e.g., 'File Upload', 'Online Quiz', 'Offline Task'
            $table->string('type'); 
            
            $table->date('due_date');
            $table->text('description')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};