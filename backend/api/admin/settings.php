<?php
// backend/api/admin/settings.php
require_once '../config/database.php';
// Allow preflight requests without auth
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once '../middleware/auth.php';

requireRole('admin');
header('Content-Type: application/json');

$database = new Database();
$db       = $database->getConnection();
$dbName   = $database->getDbName();
$method   = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $q = new MongoDB\Driver\Query(['_id' => 'global']);
            $cur = $db->executeQuery("$dbName.settings", $q);
            $settings = current($cur->toArray());
            
            if ($settings) {
                echo json_encode($settings);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Settings not found"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid payload"]);
            break;
        }

        try {
            // Remove _id from data to prevent modifying the immutable field directly in $set
            if (isset($data['_id'])) {
                unset($data['_id']);
            }
            $data['updatedAt'] = date('Y-m-d H:i:s');

            $bulk = new MongoDB\Driver\BulkWrite;
            $bulk->update(
                ['_id' => 'global'],
                ['$set' => $data],
                ['upsert' => true]
            );
            $db->executeBulkWrite("$dbName.settings", $bulk);
            
            echo json_encode(["success" => true, "message" => "Settings updated successfully"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
}
?>
