<?php
// backend/api/public/download_claim.php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$id = isset($_GET['id']) ? trim($_GET['id']) : '';

if (empty($id)) {
    http_response_code(400);
    echo "Claim ID is required.";
    exit();
}

try {
    // 1. Find the claim form to get the file path
    $query = new MongoDB\Driver\Query(['_id' => new MongoDB\BSON\ObjectId($id)]);
    $cursor = $db->executeQuery("$dbName.claims", $query);
    $claims = $cursor->toArray();
    
    if (count($claims) === 0) {
        http_response_code(404);
        echo "Claim form not found.";
        exit();
    }
    
    $claim = $claims[0];
    
    // 2. Increment download counter
    $bulk = new MongoDB\Driver\BulkWrite;
    $bulk->update(
        ['_id' => new MongoDB\BSON\ObjectId($id)],
        ['$inc' => ['downloads' => 1]]
    );
    $db->executeBulkWrite("$dbName.claims", $bulk);
    
    // 3. Redirect to the actual file path
    // File path is relative to backend root, e.g. uploads/claims/filename.pdf
    // So redirect to /uploads/claims/filename.pdf
    // In PHP's context of http://127.0.0.1:8000/, /uploads/... is served perfectly
    $fileUrl = '/' . $claim->filePath;
    
    header("Location: " . $fileUrl);
    exit();
} catch (Exception $e) {
    http_response_code(500);
    echo "Error processing download: " . $e->getMessage();
}
?>
