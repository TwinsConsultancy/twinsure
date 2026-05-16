<?php
// backend/api/admin/leads.php
require_once '../config/database.php';
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
            $opts = ['sort' => ['submittedAt' => -1]];
            $q    = new MongoDB\Driver\Query([], $opts);
            $cur  = $db->executeQuery("$dbName.leads", $q);
            $leads = [];
            foreach ($cur as $doc) {
                $d = (array) $doc;
                $d['_id'] = (string) $d['_id'];
                if (isset($d['submittedAt']) && $d['submittedAt'] instanceof MongoDB\BSON\UTCDateTime) {
                    $d['submittedAt'] = $d['submittedAt']->toDateTime()->format('Y-m-d H:i:s');
                }
                $leads[] = $d;
            }
            echo json_encode($leads);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Update lead status (new | contacted | closed)
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id']) || !isset($data['status'])) {
            http_response_code(400); echo json_encode(["error" => "id and status required"]); break;
        }
        try {
            $bulk = new MongoDB\Driver\BulkWrite;
            $bulk->update(
                ['_id' => new MongoDB\BSON\ObjectId($data['id'])],
                ['$set' => ['status' => $data['status']]]
            );
            $db->executeBulkWrite("$dbName.leads", $bulk);
            echo json_encode(["success" => true]);
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
