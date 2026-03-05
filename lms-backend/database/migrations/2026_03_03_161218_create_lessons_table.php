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
Schema::create('lessons', function (Blueprint $table) {
        $table->id();
        $table->foreignId('sub_unit_id')->constrained()->cascadeOnDelete();
        $table->string('title'); // e.g., 'Introduction to HTML Tags'
        $table->integer('order')->default(0);
        $table->boolean('is_published')->default(false); // So teachers can draft lessons
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
        Schema::dropIfExists('lessons');
    }
};
