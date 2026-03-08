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
        $data = $request->except(['school_logo']);
        
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        if ($request->hasFile('school_logo')) {
            $path = $request->file('school_logo')->store('config', 'public');
            Setting::updateOrCreate(
                ['key' => 'school_logo'],
                ['value' => url('/storage/' . $path)]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
