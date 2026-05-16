<?php
// backend/api/public/contact.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(["error" => "Method not allowed"]); exit;
}

require_once '../config/database.php';

$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

// Mandatory fields
$name  = isset($data['name'])  ? trim($data['name'])  : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$city  = isset($data['city'])  ? trim($data['city'])  : '';

if (!$name || !$phone || !$city) {
    http_response_code(400);
    echo json_encode(["error" => "Name, phone and city are required."]);
    exit;
}
if (!preg_match('/^\d{10}$/', $phone)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid phone number."]);
    exit;
}
$email = isset($data['email']) ? trim($data['email']) : '';
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid email address."]);
    exit;
}

try {
    $database = new Database();
    $db       = $database->getConnection();
    $dbName   = $database->getDbName();

    $bulk = new MongoDB\Driver\BulkWrite;
    $bulk->insert([
        'name'         => $name,
        'phone'        => $phone,
        'city'         => $city,
        'email'        => $email,
        'altPhone'     => isset($data['altPhone'])    ? trim($data['altPhone'])    : '',
        'address'      => isset($data['address'])     ? trim($data['address'])     : '',
        'enquiryType'  => isset($data['enquiryType']) ? trim($data['enquiryType']) : '',
        'specify'      => isset($data['specify'])     ? substr(trim($data['specify']), 0, 100) : '',
        'submittedAt'  => new MongoDB\BSON\UTCDateTime(),
        'status'       => 'new'
    ]);
    $db->executeBulkWrite("$dbName.contacts", $bulk);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save: " . $e->getMessage()]);
}
