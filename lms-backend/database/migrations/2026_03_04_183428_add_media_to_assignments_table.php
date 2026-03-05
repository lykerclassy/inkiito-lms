<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            // The actual questions or instructions
            $table->longText('content')->nullable()->after('description'); 
            // For YouTube links, Google Drive links, or Audio URLs
            $table->string('media_url')->nullable()->after('content');
            // Allow teachers to specify how students should reply
            $table->string('expected_submission_type')->default('text')->after('type'); // text, file, url, video
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropColumn(['content', 'media_url', 'expected_submission_type']);
        });
    }
};