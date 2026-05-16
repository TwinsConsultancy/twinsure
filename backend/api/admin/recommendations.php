<?php
// backend/api/admin/recommendations.php
require_once '../config/database.php';
require_once '../middleware/auth.php';

// Only admins can access the builder
requireRole('admin');

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $query = new MongoDB\Driver\Query([]);
            $cursor = $db->executeQuery("$dbName.recommendation_questions", $query);
            $flows = $cursor->toArray();
            
            if(count($flows) == 0) {
                // Return default empty flow structure
                echo json_encode([
                    "greeting" => "Welcome! Let's find the best insurance plan for you.",
                    "nodes" => [],
                    "edges" => []
                ]);
            } else {
                echo json_encode($flows[0]); // Returns the master flow
            }
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error loading flow: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (isset($data['nodes']) && isset($data['edges'])) {
            try {
                // Clear existing flow to replace with the updated one
                $bulkDelete = new MongoDB\Driver\BulkWrite;
                $bulkDelete->delete([]); 
                $db->executeBulkWrite("$dbName.recommendation_questions", $bulkDelete);

                // Insert new flow
                $bulkInsert = new MongoDB\Driver\BulkWrite;
                $document = [
                    'greeting' => isset($data['greeting']) ? $data['greeting'] : '',
                    'nodes' => $data['nodes'],
                    'edges' => $data['edges'],
                    'updatedAt' => new MongoDB\BSON\UTCDateTime()
                ];
                $bulkInsert->insert($document);
                $db->executeBulkWrite("$dbName.recommendation_questions", $bulkInsert);
                
                http_response_code(200);
                echo json_encode(["message" => "Recommendation flow saved successfully."]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["message" => "Error saving flow: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Invalid flow data structure."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}
?>
