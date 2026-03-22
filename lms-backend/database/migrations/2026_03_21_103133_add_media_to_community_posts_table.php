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
        Schema::table('community_posts', function (Blueprint $table) {
            $table->string('media_type')->nullable();
            $table->string('media_url')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('community_posts', function (Blueprint $table) {
            $table->dropColumn(['media_type', 'media_url']);
        });
    }
};
