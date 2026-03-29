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
        // 1. Add subject_title_id if it doesn't exist
        if (!Schema::hasColumn('downloadables', 'subject_title_id')) {
            Schema::table('downloadables', function (Blueprint $table) {
                $table->unsignedBigInteger('subject_title_id')->nullable()->after('id');
            });
        }

        // 2. Add academic_level_id if it doesn't exist
        if (!Schema::hasColumn('downloadables', 'academic_level_id')) {
            Schema::table('downloadables', function (Blueprint $table) {
                $table->unsignedBigInteger('academic_level_id')->nullable()->after('subject_title_id');
            });
        }

        // 4. Cleanup and constraints
        if (Schema::hasColumn('downloadables', 'subject_id')) {
            try {
                Schema::table('downloadables', function (Blueprint $table) {
                    $table->dropForeign(['subject_id']);
                    $table->dropColumn('subject_id');
                });
            } catch (\Exception $e) {}
        }

        // Try drop existing ones
        try {
            Schema::table('downloadables', function (Blueprint $table) {
                $table->dropForeign(['academic_level_id']);
            });
        } catch (\Exception $e) {}
        
        try {
            Schema::table('downloadables', function (Blueprint $table) {
                $table->dropForeign(['subject_title_id']);
            });
        } catch (\Exception $e) {}

        Schema::table('downloadables', function (Blueprint $table) {
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
        Schema::table('downloadables', function (Blueprint $table) {
            $table->unsignedBigInteger('subject_id')->nullable()->after('id');
        });

        DB::statement("
            UPDATE downloadables d
            JOIN subjects s ON d.subject_title_id = s.subject_title_id 
                           AND (d.academic_level_id = s.academic_level_id OR (d.academic_level_id IS NULL AND s.academic_level_id IS NOT NULL))
            SET d.subject_id = s.id
        ");

        Schema::table('downloadables', function (Blueprint $table) {
            $table->dropForeign(['subject_title_id']);
            $table->dropForeign(['academic_level_id']);
            $table->dropColumn(['subject_title_id', 'academic_level_id']);
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
        });
    }
};
