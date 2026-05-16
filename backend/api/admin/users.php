<?php
// backend/api/admin/users.php
require_once '../config/database.php';
require_once '../middleware/auth.php';

// Only admins can access this endpoint
requireRole('admin');

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all users
        try {
            $query = new MongoDB\Driver\Query([]);
            $cursor = $db->executeQuery("$dbName.users", $query);
            $users = $cursor->toArray();
            
            // Unset passwords for response
            foreach ($users as &$user) {
                unset($user->password);
            }
            
            echo json_encode($users);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Create new user
        $data = json_decode(file_get_contents("php://input"));
        if (!empty($data->name) && !empty($data->email) && !empty($data->role) && !empty($data->password)) {
            try {
                $bulk = new MongoDB\Driver\BulkWrite;
                $document = [
                    'name' => $data->name,
                    'email' => $data->email,
                    'password' => $data->password, // Need hash in prod
                    'role' => $data->role,
                    'createdAt' => new MongoDB\BSON\UTCDateTime(),
                    'updatedAt' => new MongoDB\BSON\UTCDateTime()
                ];
                $_id = $bulk->insert($document);
                $result = $db->executeBulkWrite("$dbName.users", $bulk);
                
                http_response_code(201);
                echo json_encode(["message" => "User created successfully."]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["message" => "Error: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}
?>
