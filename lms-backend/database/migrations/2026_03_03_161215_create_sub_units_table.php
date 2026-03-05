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
Schema::create('sub_units', function (Blueprint $table) {
        $table->id();
        $table->foreignId('unit_id')->constrained()->cascadeOnDelete();
        $table->string('title'); // e.g., 'HTML Structure'
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
        Schema::dropIfExists('sub_units');
    }
};
