<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::all();
foreach ($users as $u) {
    echo "ID: " . $u->id . "\n";
    echo "  Name: " . $u->name . "\n";
    echo "  Role: " . $u->role . "\n";
    echo "  Email: " . $u->email . "\n";
    echo "  Adm: " . $u->admission_number . "\n";
    echo "  Key: " . $u->access_key . "\n";
    echo "  Pass Hashed: " . (Hash::info($u->password)['algoName'] !== 'unknown' ? 'YES' : 'NO') . "\n";
    echo "-------------------\n";
}
