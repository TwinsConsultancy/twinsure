<?php
// backend/api/public/claims.php
require_once '../config/database.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$dbName = $database->getDbName();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $filter = ['status' => 'active'];
        $opts = ['sort' => ['lastUpdated' => -1]];
        $q    = new MongoDB\Driver\Query($filter, $opts);
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
        echo json_encode(["message" => "Error listing active claims: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>
