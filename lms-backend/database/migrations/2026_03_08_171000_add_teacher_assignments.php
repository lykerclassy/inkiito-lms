<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Link a class teacher to each academic level (class/grade)
        Schema::table('academic_levels', function (Blueprint $table) {
            $table->foreignId('class_teacher_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->after('curriculum_id');
        });

        // 2. Many-many: subject ↔ teachers (subject teachers)
        Schema::create('subject_teacher', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['subject_id', 'user_id']); // No duplicate assignments
        });
    }

    public function down()
    {
        Schema::dropIfExists('subject_teacher');
        Schema::table('academic_levels', function (Blueprint $table) {
            $table->dropForeign(['class_teacher_id']);
            $table->dropColumn('class_teacher_id');
        });
    }
};
