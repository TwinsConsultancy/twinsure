<?php
// backend/api/admin/partners.php
require_once '../config/database.php';
require_once '../middleware/auth.php';

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only admin can access management endpoints
requireRole('admin');

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // optional id query param
            if (isset($_GET['id']) && strlen($_GET['id']) > 0) {
                $filter = ['_id' => new MongoDB\BSON\ObjectId($_GET['id'])];
            } else {
                $filter = [];
            }
            $query = new MongoDB\Driver\Query($filter);
            $cursor = $db->executeQuery("$dbName.partners", $query);
            $rows = [];
            foreach ($cursor as $doc) {
                $arr = (array) $doc;
                if (isset($arr['_id'])) $arr['_id'] = (string)$arr['_id'];
                $rows[] = $arr;
            }
            echo json_encode($rows);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Accept multipart form for photo upload
        try {
            $name = $_POST['name'] ?? null;
            $phone = $_POST['phone'] ?? null;
            $email = $_POST['email'] ?? null;
            $address = $_POST['address'] ?? null;
            $occupation = $_POST['occupation'] ?? null;
            $meta = [];
            if ($occupation === 'student') {
                $meta['college'] = $_POST['college'] ?? null;
                $meta['course'] = $_POST['course'] ?? null;
            } else {
                $meta['company'] = $_POST['company'] ?? null;
                $meta['designation'] = $_POST['designation'] ?? null;
            }

            // basic validation
            if (!$name || !$phone || !$email) {
                http_response_code(400);
                echo json_encode(["message" => "Missing required fields (name, phone, email)."]);
                exit();
            }

            // handle photo upload
            $photoPath = null;
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $uploadsDir = __DIR__ . '/uploads/partners';
                if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

                $tmp = $_FILES['photo']['tmp_name'];
                $orig = basename($_FILES['photo']['name']);
                $ext = pathinfo($orig, PATHINFO_EXTENSION);
                $safe = preg_replace('/[^a-zA-Z0-9_\\-\\.]/', '_', pathinfo($orig, PATHINFO_FILENAME));
                $filename = $safe . '_' . time() . '.' . $ext;
                $dest = $uploadsDir . '/' . $filename;
                if (move_uploaded_file($tmp, $dest)) {
                    // store relative path
                    $photoPath = 'uploads/partners/' . $filename;
                }
            }

            $doc = [
                'name' => $name,
                'phone' => $phone,
                'email' => $email,
                'address' => $address,
                'occupation' => $occupation,
                'meta' => $meta,
                'photo' => $photoPath,
                'status' => 'pending',
                'createdAt' => new MongoDB\BSON\UTCDateTime(),
                'updatedAt' => new MongoDB\BSON\UTCDateTime()
            ];

            $bulk = new MongoDB\Driver\BulkWrite;
            $id = $bulk->insert($doc);
            $db->executeBulkWrite("$dbName.partners", $bulk);

            http_response_code(201);
            echo json_encode(["message" => "Partner created", "id" => (string)$id]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Expect JSON body or URLSearchParams
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input) {
            parse_str(file_get_contents("php://input"), $input);
        }

        $id = $input['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "Missing id parameter."]);
            exit();
        }

        try {
            $updateData = [];
            if (isset($input['name'])) $updateData['name'] = $input['name'];
            if (isset($input['phone'])) $updateData['phone'] = $input['phone'];
            if (isset($input['email'])) $updateData['email'] = $input['email'];
            if (isset($input['address'])) $updateData['address'] = $input['address'];
            if (isset($input['occupation'])) $updateData['occupation'] = $input['occupation'];
            if (isset($input['status'])) $updateData['status'] = $input['status'];

            // Rebuild meta if dynamic fields are present
            $meta = [];
            if (isset($input['college'])) $meta['college'] = $input['college'];
            if (isset($input['course'])) $meta['course'] = $input['course'];
            if (isset($input['company'])) $meta['company'] = $input['company'];
            if (isset($input['designation'])) $meta['designation'] = $input['designation'];
            if (!empty($meta)) {
                $updateData['meta'] = $meta;
            }

            $updateData['updatedAt'] = new MongoDB\BSON\UTCDateTime();

            $bulk = new MongoDB\Driver\BulkWrite;
            $bulk->update(
                ['_id' => new MongoDB\BSON\ObjectId($id)],
                ['$set' => $updateData],
                ['multi' => false, 'upsert' => false]
            );
            $db->executeBulkWrite("$dbName.partners", $bulk);
            echo json_encode(["message" => "Updated"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Expect query param id
        parse_str(file_get_contents("php://input"), $delVars);
        if (!isset($delVars['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Missing id parameter."]);
            exit();
        }
        try {
            $bulk = new MongoDB\Driver\BulkWrite;
            $bulk->delete(['_id' => new MongoDB\BSON\ObjectId($delVars['id'])], ['limit' => 1]);
            $db->executeBulkWrite("$dbName.partners", $bulk);
            echo json_encode(["message" => "Deleted"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}

?>
