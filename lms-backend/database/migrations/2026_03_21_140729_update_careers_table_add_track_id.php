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
    public function up(): void
    {
        Schema::table('careers', function (Blueprint $table) {
            $table->foreignId('career_track_id')->nullable()->after('pathway_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('careers', function (Blueprint $table) {
            $table->dropForeign(['career_track_id']);
            $table->dropColumn('career_track_id');
        });
    }
};
