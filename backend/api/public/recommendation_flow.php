<?php
// backend/api/public/recommendation_flow.php
// Public endpoint — no auth required, read-only

// CORS headers — must be emitted before any output
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

try {
    $database = new Database();
    $db       = $database->getConnection();
    $dbName   = $database->getDbName();

    $query  = new MongoDB\Driver\Query([]);
    $cursor = $db->executeQuery("$dbName.recommendation_questions", $query);
    $flows  = $cursor->toArray();

    if (count($flows) > 0) {
        $flow = (array) $flows[0];
        unset($flow['_id']);
        echo json_encode($flow);
    } else {
        echo json_encode(['greeting' => '', 'nodes' => [], 'edges' => []]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
