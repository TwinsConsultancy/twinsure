<?php
// backend/api/public/form_help_requests.php
require_once '../config/database.php';

header('Content-Type: application/json');

$database = new Database();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    $data = [];
}

$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$description = isset($data['description']) ? trim($data['description']) : '';
$claimId = isset($data['claimId']) ? trim($data['claimId']) : '';
$claimName = isset($data['claimName']) ? trim($data['claimName']) : '';
$claimCategory = isset($data['claimCategory']) ? trim($data['claimCategory']) : '';

$namePattern = '/^[A-Za-z][A-Za-z\s.\'-]{1,79}$/';
$phonePattern = '/^[0-9+\-()\s]{10,18}$/';

if ($name === '' || !preg_match($namePattern, $name)) {
    http_response_code(400);
    echo json_encode(["message" => "Please enter a valid name."]);
    exit();
}

if ($phone === '' || !preg_match($phonePattern, $phone) || preg_match_all('/\d/', $phone) < 10) {
    http_response_code(400);
    echo json_encode(["message" => "Please enter a valid phone number with at least 10 digits."]);
    exit();
}

if (strlen($description) > 500) {
    http_response_code(400);
    echo json_encode(["message" => "Description must be 500 characters or fewer."]);
    exit();
}

try {
    $requestId = uniqid('fhr_', true);
    $timestamp = date('Y-m-d H:i:s');

    $database->insertOne('form_help_requests', [
        'requestId' => $requestId,
        'name' => $name,
        'phone' => $phone,
        'description' => $description,
        'claimId' => $claimId,
        'claimName' => $claimName !== '' ? $claimName : 'Claim Form',
        'claimCategory' => $claimCategory,
        'status' => 'new',
        'submittedAt' => $timestamp,
        'updatedAt' => $timestamp,
        'source' => 'downloads'
    ]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Your request has been submitted. Our team will contact you shortly.'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to submit request: " . $e->getMessage()]);
}
