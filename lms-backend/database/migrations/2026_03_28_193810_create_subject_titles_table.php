<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Create the new subject_titles table
        Schema::create('subject_titles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // 2. Add subject_title_id to subjects table (nullable initially)
        Schema::table('subjects', function (Blueprint $table) {
            $table->unsignedBigInteger('subject_title_id')->nullable()->after('academic_level_id');
            $table->foreign('subject_title_id')->references('id')->on('subject_titles')->onDelete('cascade');
        });

        // 3. Migrate existing names to the new table
        $subjects = DB::table('subjects')->get();
        foreach ($subjects as $subject) {
            // Find or create title record
            $titleId = DB::table('subject_titles')->where('name', $subject->name)->value('id');
            
            if (!$titleId) {
                $titleId = DB::table('subject_titles')->insertGetId([
                    'name' => $subject->name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Update the subject record with the title ID
            DB::table('subjects')->where('id', $subject->id)->update([
                'subject_title_id' => $titleId
            ]);
        }

        // 4. Drop the redundant name column and make title_id mandatory
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('name');
        });

        // Use raw SQL to avoid Doctrine DBAL dependency for ->change()
        DB::statement('ALTER TABLE subjects MODIFY subject_title_id BIGINT UNSIGNED NOT NULL');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Reverse migration: Restore 'name' column and its data
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('name')->after('academic_level_id')->nullable();
        });

        $subjects = DB::table('subjects')->get();
        foreach ($subjects as $subject) {
            $name = DB::table('subject_titles')->where('id', $subject->subject_title_id)->value('name');
            DB::table('subjects')->where('id', $subject->id)->update(['name' => $name]);
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['subject_title_id']);
            $table->dropColumn('subject_title_id');
        });

        DB::statement('ALTER TABLE subjects MODIFY name VARCHAR(255) NOT NULL');

        Schema::dropIfExists('subject_titles');
    }
};
