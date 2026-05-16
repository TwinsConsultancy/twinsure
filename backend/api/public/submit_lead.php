<?php
// backend/api/public/submit_lead.php
// Public endpoint — no auth required, write lead to MongoDB

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

require_once '../config/database.php';

$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!isset($data['name']) || !isset($data['phone'])) {
    http_response_code(400);
    echo json_encode(["error" => "Name and phone are required."]);
    exit;
}

try {
    $database = new Database();
    $db       = $database->getConnection();
    $dbName   = $database->getDbName();

    $bulk = new MongoDB\Driver\BulkWrite;
    $bulk->insert([
        'name'           => trim($data['name']),
        'phone'          => trim($data['phone']),
        'email'          => isset($data['email']) ? trim($data['email']) : '',
        'answers'        => $data['answers'] ?? [],
        'callbackSlots'  => $data['callbackSlots'] ?? [],
        'submittedAt'    => new MongoDB\BSON\UTCDateTime(),
        'status'         => 'new'
    ]);

    $db->executeBulkWrite("$dbName.leads", $bulk);
    echo json_encode(["success" => true, "message" => "Lead submitted successfully."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save lead: " . $e->getMessage()]);
}
