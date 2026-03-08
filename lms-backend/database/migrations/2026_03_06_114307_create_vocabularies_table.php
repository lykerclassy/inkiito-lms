<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. The Global Vocabulary Library
        Schema::create('vocabularies', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('word')->unique();
            $blueprint->text('definition');
            $blueprint->string('phonetic')->nullable();
            $blueprint->string('category')->default('General');
            $blueprint->integer('difficulty')->default(1); // 1-5
            $blueprint->timestamps();
        });

        // 2. User Tracking: Which words has the student seen/mastered?
        Schema::create('user_vocabularies', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('user_id')->constrained()->onDelete('cascade');
            $blueprint->foreignId('vocabulary_id')->constrained()->onDelete('cascade');
            $blueprint->integer('attempts')->default(0);
            $blueprint->integer('best_score')->default(0);
            $blueprint->timestamp('last_seen_at')->nullable();
            $blueprint->timestamp('mastered_at')->nullable(); // If not null, we stop showing it as "new"
            $blueprint->timestamps();
            
            // Ensure a user tracks each word only once
            $blueprint->unique(['user_id', 'vocabulary_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_vocabularies');
        Schema::dropIfExists('vocabularies');
    }
};
