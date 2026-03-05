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
        $settings = Setting::all()->pluck('value', 'key');
        
        // Provide some defaults if empty
        if (!isset($settings['school_name'])) {
            $settings['school_name'] = 'Inkiito Manoh Academy';
        }
        
        return response()->json($settings);
    }

    /**
     * Update multiple settings
     */
    public function update(Request $request)
    {
        // Request should be a dictionary: ['school_name' => '...', 'contact_email' => '...']
        $data = $request->all();
        
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
