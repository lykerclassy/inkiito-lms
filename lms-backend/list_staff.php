<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::whereIn('role', ['admin', 'developer'])->get(['id', 'name', 'email', 'role', 'created_at']);
echo str_pad("ID", 4) . str_pad("NAME", 22) . str_pad("EMAIL", 42) . str_pad("ROLE", 12) . "CREATED\n";
echo str_repeat("-", 90) . "\n";
foreach ($users as $u) {
    echo str_pad($u->id, 4) . str_pad($u->name, 22) . str_pad($u->email, 42) . str_pad($u->role, 12) . $u->created_at . "\n";
}
