<?php
require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiKey = $_ENV['GEMINI_API_KEY'];
$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$client = new \GuzzleHttp\Client();
try {
    $response = $client->get($url);
    echo $response->getBody();
} catch (\Exception $e) {
    echo $e->getMessage();
}
