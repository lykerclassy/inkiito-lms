<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'teacher', 'student'])->default('student')->after('password');
            
            // Explicitly defining the table names overrides Laravel's smart pluralization
            $table->foreignId('curriculum_id')->nullable()->constrained('curriculums')->nullOnDelete()->after('role');
            $table->foreignId('academic_level_id')->nullable()->constrained('academic_levels')->nullOnDelete()->after('curriculum_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the foreign keys first
            $table->dropForeign(['curriculum_id']);
            $table->dropForeign(['academic_level_id']);
            
            // Then drop the columns
            $table->dropColumn(['role', 'curriculum_id', 'academic_level_id']);
        });
    }
};