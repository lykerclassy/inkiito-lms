<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Add new columns if they don't exist
        if (!Schema::hasColumn('assignments', 'subject_title_id')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->unsignedBigInteger('subject_title_id')->nullable()->after('id');
            });
        }
        if (!Schema::hasColumn('assignments', 'academic_level_id')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->unsignedBigInteger('academic_level_id')->nullable()->after('subject_title_id');
            });
        }

        // 2. Migrate existing data if column exists
        if (Schema::hasColumn('assignments', 'subject_id')) {
            DB::statement("
                UPDATE assignments a
                JOIN subjects s ON a.subject_id = s.id
                SET a.subject_title_id = s.subject_title_id, 
                    a.academic_level_id = s.academic_level_id
                WHERE a.subject_title_id IS NULL OR a.academic_level_id IS NULL
            ");
        }

        // 3. Cleanup old columns
        if (Schema::hasColumn('assignments', 'subject_id')) {
            try {
                Schema::table('assignments', function (Blueprint $table) {
                    $table->dropForeign(['subject_id']);
                    $table->dropColumn('subject_id');
                });
            } catch (\Exception $e) {}
        }
        
        try {
            Schema::table('assignments', function (Blueprint $table) {
                $table->dropForeign(['subject_title_id']);
            });
        } catch (\Exception $e) {}
        try {
            Schema::table('assignments', function (Blueprint $table) {
                $table->dropForeign(['academic_level_id']);
            });
        } catch (\Exception $e) {}

        Schema::table('assignments', function (Blueprint $table) {
            $table->foreign('subject_title_id')->references('id')->on('subject_titles')->onDelete('cascade');
            $table->foreign('academic_level_id')->references('id')->on('academic_levels')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('subject_id')->nullable()->after('id');
        });

        DB::statement("
            UPDATE assignments a
            JOIN subjects s ON a.subject_title_id = s.subject_title_id 
                           AND (a.academic_level_id = s.academic_level_id OR (a.academic_level_id IS NULL AND s.academic_level_id IS NOT NULL))
            SET a.subject_id = s.id
        ");

        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['subject_title_id']);
            $table->dropForeign(['academic_level_id']);
            $table->dropColumn(['subject_title_id', 'academic_level_id']);
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
        });
    }
};
