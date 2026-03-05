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
            $table->text('qualifications')->nullable();
            $table->text('skills')->nullable();
            $table->text('typical_employers')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('careers', function (Blueprint $table) {
            $table->dropColumn(['qualifications', 'skills', 'typical_employers']);
        });
    }
};
