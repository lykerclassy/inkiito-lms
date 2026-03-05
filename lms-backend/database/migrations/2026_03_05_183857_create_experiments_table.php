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
        Schema::create('experiments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('science_lab_id')->constrained()->onDelete('cascade');
            $table->foreignId('curriculum_id')->nullable()->constrained('curriculums')->onDelete('set null');
            $table->string('slug');
            $table->string('title');
            $table->string('level'); 
            $table->string('duration');
            $table->boolean('is_active')->default(true);
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
        Schema::dropIfExists('experiments');
    }
};
