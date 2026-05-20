<?php
// backend/api/admin/claims.php
require_once '../config/database.php';
require_once '../middleware/auth.php';

// Only administrators can manage claim forms
$user = requireRole('admin');

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$method = $_SERVER['REQUEST_METHOD'];

// Helper to query admin's name
function getAdminName($db, $dbName, $adminId) {
    try {
        $query = new MongoDB\Driver\Query(['_id' => new MongoDB\BSON\ObjectId($adminId)]);
        $cursor = $db->executeQuery("$dbName.users", $query);
        $users = $cursor->toArray();
        if (count($users) > 0) {
            return $users[0]->name;
        }
    } catch (Exception $e) {
        // Fallback
    }
    return 'Admin';
}

switch ($method) {
    case 'GET':
        try {
            $opts = ['sort' => ['lastUpdated' => -1]];
            $q    = new MongoDB\Driver\Query([], $opts);
            $cur  = $db->executeQuery("$dbName.claims", $q);
            $claims = [];
            foreach ($cur as $doc) {
                $d = (array) $doc;
                $d['_id'] = (string) $d['_id'];
                if (isset($d['createdAt']) && $d['createdAt'] instanceof MongoDB\BSON\UTCDateTime) {
                    $d['createdAt'] = $d['createdAt']->toDateTime()->format('Y-m-d H:i:s');
                }
                if (isset($d['lastUpdated']) && $d['lastUpdated'] instanceof MongoDB\BSON\UTCDateTime) {
                    $d['lastUpdated'] = $d['lastUpdated']->toDateTime()->format('Y-m-d H:i:s');
                }
                $claims[] = $d;
            }
            echo json_encode($claims);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error listing claims: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Determine if creating or updating
        $id = isset($_POST['id']) ? trim($_POST['id']) : '';
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $category = isset($_POST['category']) ? trim($_POST['category']) : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        $status = isset($_POST['status']) ? trim($_POST['status']) : 'active';

        if (empty($name) || empty($category)) {
            http_response_code(400);
            echo json_encode(["message" => "Form Name and Category are required."]);
            break;
        }

        try {
            $existingClaim = null;
            if (!empty($id)) {
                $query = new MongoDB\Driver\Query(['_id' => new MongoDB\BSON\ObjectId($id)]);
                $cursor = $db->executeQuery("$dbName.claims", $query);
                $results = $cursor->toArray();
                if (count($results) > 0) {
                    $existingClaim = $results[0];
                } else {
                    http_response_code(404);
                    echo json_encode(["message" => "Claim form not found for updating."]);
                    break;
                }
            }

            // Handle file upload if present
            $fileName = null;
            $filePath = null;
            $fileSize = null;

            if (isset($_FILES['pdf']) && $_FILES['pdf']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['pdf'];
                $origName = basename($file['name']);
                $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

                if ($ext !== 'pdf') {
                    http_response_code(400);
                    echo json_encode(["message" => "Only PDF files are allowed."]);
                    break;
                }

                $uploadDir = __DIR__ . '/../uploads/claims/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                // Create a clean safe name
                $cleanName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $origName);
                $fileName = time() . '_' . $cleanName;
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                    $filePath = 'uploads/claims/' . $fileName;
                    $sizeVal = $file['size'];
                    if ($sizeVal >= 1048576) {
                        $fileSize = round($sizeVal / 1048576, 1) . ' MB';
                    } else {
                        $fileSize = round($sizeVal / 1024) . ' KB';
                    }
                } else {
                    http_response_code(500);
                    echo json_encode(["message" => "Failed to save uploaded PDF file."]);
                    break;
                }
            }

            // If it's a new claim form, a PDF is mandatory
            if (empty($id) && !$filePath) {
                http_response_code(400);
                echo json_encode(["message" => "PDF document upload is required for new claim forms."]);
                break;
            }

            $bulk = new MongoDB\Driver\BulkWrite;
            $now = new MongoDB\BSON\UTCDateTime();
            $adminName = getAdminName($db, $dbName, $user->id);

            if (empty($id)) {
                // INSERT
                $document = [
                    'name' => $name,
                    'category' => $category,
                    'description' => $description,
                    'status' => $status,
                    'fileName' => $fileName,
                    'filePath' => $filePath,
                    'fileSize' => $fileSize,
                    'downloads' => 0,
                    'uploadedBy' => $adminName,
                    'createdAt' => $now,
                    'lastUpdated' => $now
                ];
                $bulk->insert($document);
                $db->executeBulkWrite("$dbName.claims", $bulk);
                http_response_code(201);
                echo json_encode(["success" => true, "message" => "Claim form published successfully."]);
            } else {
                // UPDATE
                $finalFileName = ($fileName !== null) ? $fileName : $existingClaim->fileName;
                $finalFilePath = ($filePath !== null) ? $filePath : $existingClaim->filePath;
                $finalFileSize = ($fileSize !== null) ? $fileSize : $existingClaim->fileSize;

                // Delete old file if a new file was uploaded
                if ($filePath !== null && isset($existingClaim->filePath)) {
                    $oldFullPath = __DIR__ . '/../' . $existingClaim->filePath;
                    if (file_exists($oldFullPath) && is_file($oldFullPath)) {
                        unlink($oldFullPath);
                    }
                }

                $updateData = [
                    'name' => $name,
                    'category' => $category,
                    'description' => $description,
                    'status' => $status,
                    'fileName' => $finalFileName,
                    'filePath' => $finalFilePath,
                    'fileSize' => $finalFileSize,
                    'lastUpdated' => $now
                ];

                $bulk->update(
                    ['_id' => new MongoDB\BSON\ObjectId($id)],
                    ['$set' => $updateData]
                );
                $db->executeBulkWrite("$dbName.claims", $bulk);
                echo json_encode(["success" => true, "message" => "Claim form updated successfully."]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database write failed: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? trim($_GET['id']) : '';
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["message" => "Claim ID is required for deletion."]);
            break;
        }

        try {
            // Find existing claim form to delete its file from disk
            $query = new MongoDB\Driver\Query(['_id' => new MongoDB\BSON\ObjectId($id)]);
            $cursor = $db->executeQuery("$dbName.claims", $query);
            $results = $cursor->toArray();

            if (count($results) > 0) {
                $claim = $results[0];
                if (isset($claim->filePath)) {
                    $fullPath = __DIR__ . '/../' . $claim->filePath;
                    if (file_exists($fullPath) && is_file($fullPath)) {
                        unlink($fullPath);
                    }
                }
            }

            $bulk = new MongoDB\Driver\BulkWrite;
            $bulk->delete(['_id' => new MongoDB\BSON\ObjectId($id)]);
            $db->executeBulkWrite("$dbName.claims", $bulk);
            echo json_encode(["success" => true, "message" => "Claim form deleted successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to delete claim: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}
?>
