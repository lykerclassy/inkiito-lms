<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all settings as a key-value object
     */
    public function index()
    {
        try {
            $settings = Setting::all()->pluck('value', 'key');
            
            // Provide some defaults if empty
            if (!isset($settings['school_name'])) {
                $settings['school_name'] = 'Inkiito Manoh Academy';
            }
            
            return response()->json($settings);
        } catch (\Exception $e) {
            return response()->json([
                'school_name' => 'Inkiito Manoh Academy',
                'brand_primary' => '#d81d22',
                'brand_secondary' => '#4b4da3',
                'brand_accent' => '#f8af18'
            ]);
        }
    }

    /**
     * Update multiple settings
     */
    public function update(Request $request)
    {
        // Keys that should NEVER be saved as settings (reserved/dangerous)
        $blacklist = ['_method', '_token', 'school_logo'];
        $data = $request->except($blacklist);
        
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        if ($request->hasFile('school_logo')) {
            $path = $request->file('school_logo')->store('config', 'public');
            // Store the relative path (e.g. config/abc.jpg).
            // The frontend getMediaUrl() handles converting to full URL for both local and production.
            Setting::updateOrCreate(
                ['key' => 'school_logo'],
                ['value' => 'storage/' . $path]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function getCurriculums()
    {
        return response()->json(\App\Models\Curriculum::all());
    }
}
