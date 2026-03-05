<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Changes the strict enum to a flexible string (VARCHAR)
        DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'student'");
    }

    public function down()
    {
        // Reverts back to enum if we ever roll back
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student'");
    }
};