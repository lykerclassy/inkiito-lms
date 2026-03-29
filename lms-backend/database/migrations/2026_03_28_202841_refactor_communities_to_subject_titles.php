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
        if (!Schema::hasColumn('communities', 'subject_title_id')) {
            Schema::table('communities', function (Blueprint $table) {
                $table->unsignedBigInteger('subject_title_id')->nullable()->after('id');
            });
        }

        // Migrate existing data (subject_id -> subject_title_id)
        if (Schema::hasColumn('communities', 'subject_id')) {
            DB::statement("
                UPDATE communities c
                JOIN subjects s ON c.subject_id = s.id
                SET c.subject_title_id = s.subject_title_id
                WHERE c.subject_title_id IS NULL
            ");
        }

        // 4. Cleanup old col and add foreign key
        if (Schema::hasColumn('communities', 'subject_id')) {
            try {
                Schema::table('communities', function (Blueprint $table) {
                    $table->dropForeign(['subject_id']);
                    $table->dropColumn('subject_id');
                });
            } catch (\Exception $e) {}
        }
        
        // Try drop and re-add subject_title_id foreign key
        try {
            Schema::table('communities', function (Blueprint $table) {
                $table->dropForeign(['subject_title_id']);
            });
        } catch (\Exception $e) {}

        Schema::table('communities', function (Blueprint $table) {
            $table->foreign('subject_title_id')->references('id')->on('subject_titles')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('communities', function (Blueprint $table) {
            $table->unsignedBigInteger('subject_id')->nullable()->after('id');
        });

        // Note: Reverting might map to multiple subjects, we pick one match
        DB::statement("
            UPDATE communities c
            JOIN subjects s ON c.subject_title_id = s.subject_title_id
            SET c.subject_id = s.id
        ");

        Schema::table('communities', function (Blueprint $table) {
            $table->dropForeign(['subject_title_id']);
            $table->dropColumn('subject_title_id');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('set null');
        });
    }
};
