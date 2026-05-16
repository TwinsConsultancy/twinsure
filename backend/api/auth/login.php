<?php
// backend/api/auth/login.php
require_once '../config/database.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $email = $data->email;
    $password = $data->password;

    $filter = ['email' => $email];
    $options = [];
    $query = new MongoDB\Driver\Query($filter, $options);
    
    try {
        $cursor = $db->executeQuery("$dbName.users", $query);
        $users = $cursor->toArray();

        if (count($users) > 0) {
            $user = $users[0];
            // Since this is a simple implementation, direct password match.
            // In production, use password_verify() with password_hash().
            if ($password === $user->password) {
                // Return basic token/user info
                $token = base64_encode(json_encode(['id' => (string)$user->_id, 'role' => $user->role, 'exp' => time() + 3600]));
                
                http_response_code(200);
                echo json_encode([
                    "message" => "Login successful.",
                    "token" => $token,
                    "role" => $user->role,
                    "name" => $user->name
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Invalid credentials."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "User not found."]);
        }
    } catch(MongoDB\Driver\Exception\Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error executing query: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
