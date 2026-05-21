<?php
// backend/api/partners.php
// Public endpoint to receive partner signup submissions (no admin auth)
// Mirrors admin/partners.php but open to public POST

require_once __DIR__ . '/config/database.php';

// Allow CORS from same origin or any during development
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // allow listing for debugging (not recommended in production)
            $query = new MongoDB\Driver\Query([]);
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
        try {
            // Accept multipart form for photo upload
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
                    // store relative path (same pattern as admin endpoint)
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

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}

?>