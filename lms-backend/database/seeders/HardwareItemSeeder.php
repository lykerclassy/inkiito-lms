<?php

namespace Database\Seeders;

use App\Models\HardwareItem;
use Illuminate\Database\Seeder;

class HardwareItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $items = [
            [
                'name' => 'Monitor',
                'description' => 'The screen used to display visual output from the computer.',
                'image_url' => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
                'category' => 'Output Device'
            ],
            [
                'name' => 'CPU',
                'description' => 'The brain of the computer that processes all instructions.',
                'image_url' => 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=500&auto=format&fit=crop&q=60',
                'category' => 'Processing'
            ],
            [
                'name' => 'Keyboard',
                'description' => 'An input device used to type text and commands.',
                'image_url' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
                'category' => 'Input Device'
            ],
            [
                'name' => 'Mouse',
                'description' => 'A pointing device used to interact with elements on the screen.',
                'image_url' => 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60',
                'category' => 'Input Device'
            ],
            [
                'name' => 'RAM',
                'description' => 'Temporary memory that stores data being used currently.',
                'image_url' => 'https://images.unsplash.com/photo-1563206767-5b18f218e7de?w=500&auto=format&fit=crop&q=60',
                'category' => 'Memory'
            ],
            [
                'name' => 'Hard Drive',
                'description' => 'The permanent storage where all your files and apps stay.',
                'image_url' => 'https://images.unsplash.com/photo-1531492746377-ad6d29c856e8?w=500&auto=format&fit=crop&q=60',
                'category' => 'Storage'
            ]
        ];

        foreach ($items as $item) {
            HardwareItem::updateOrCreate(['name' => $item['name']], $item);
        }
    }
}
