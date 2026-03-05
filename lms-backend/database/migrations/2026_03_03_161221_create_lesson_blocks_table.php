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
    public function up()
    {
Schema::create('lesson_blocks', function (Blueprint $table) {
        $table->id();
        $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
        $table->string('type'); // e.g., 'text', 'video', 'code_editor', 'quiz'
        $table->json('content'); // Stores the dynamic content (video URL, quiz questions, etc.)
        $table->integer('order')->default(0);
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('lesson_blocks');
    }
};
