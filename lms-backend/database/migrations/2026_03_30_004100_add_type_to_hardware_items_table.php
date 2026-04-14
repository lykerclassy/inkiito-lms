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
        Schema::table('hardware_items', function (Blueprint $table) {
            $table->string('video_url')->nullable();
            $table->string('file_path')->nullable();
            // Category can stay, but let's add a functional 'type'
            $table->string('type')->default('hardware'); 
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('hardware_items', function (Blueprint $table) {
            $table->dropColumn(['video_url', 'file_path', 'type']);
        });
    }
};
