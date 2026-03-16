<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class FixProductionSettings extends Command
{
    protected $signature = 'app:fix-settings';
    protected $description = 'Fix production settings: remove _method poison, normalize logo URLs, verify storage link.';

    public function handle()
    {
        $this->info('=== Inkiito LMS Production Settings Fix ===');

        // 1. Remove dangerous reserved keys that should never be in settings
        $dangerous = ['_method', '_token'];
        foreach ($dangerous as $key) {
            $deleted = Setting::where('key', $key)->delete();
            if ($deleted) {
                $this->warn("  ✓ Removed poisoned setting: {$key}");
            } else {
                $this->line("  - No poisoned setting found for: {$key}");
            }
        }

        // 2. Normalize school_logo URL to a relative path
        $logoSetting = Setting::where('key', 'school_logo')->first();
        if ($logoSetting) {
            $currentVal = $logoSetting->value;
            $this->line("  Current logo value: {$currentVal}");

            // If it's stored as a full http:// URL, extract the relative storage path
            if (str_starts_with($currentVal, 'http')) {
                // Extract everything after /storage/
                if (preg_match('/\/storage\/(.+)$/', $currentVal, $matches)) {
                    $relativePath = 'storage/' . $matches[1];
                    $logoSetting->value = $relativePath;
                    $logoSetting->save();
                    $this->info("  ✓ Normalized logo URL to relative path: {$relativePath}");
                } else {
                    $this->error("  ✗ Could not extract relative path from: {$currentVal}");
                }
            } else {
                $this->info("  ✓ Logo URL is already a relative path: {$currentVal}");
            }

            // Verify the file actually exists in storage
            $path = preg_replace('/^storage\//', '', $logoSetting->value);
            if (Storage::disk('public')->exists($path)) {
                $this->info("  ✓ Logo file exists on disk at: {$path}");
            } else {
                $this->error("  ✗ Logo file NOT found on disk at: {$path}");
                $this->warn("    You may need to re-upload the logo.");
            }
        } else {
            $this->warn("  - No school_logo setting found in database.");
        }

        // 3. Verify storage symlink
        $publicStoragePath = public_path('storage');
        if (is_link($publicStoragePath)) {
            $this->info("  ✓ Storage symlink exists at public/storage");
        } else {
            $this->warn("  ✗ Storage symlink is MISSING. Running storage:link now...");
            $this->call('storage:link');
        }

        $this->info('');
        $this->info('=== Fix complete! ===');
        $this->info('Next steps:');
        $this->info('  1. Run: php artisan optimize:clear');
        $this->info('  2. Upload the new frontend dist/ build');
        $this->info('  3. Verify APP_URL in .env = https://backend.inkiitomanohseniorschool.co.ke');

        return 0;
    }
}
