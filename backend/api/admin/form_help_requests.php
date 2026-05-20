<?php
// backend/api/admin/form_help_requests.php
require_once '../config/database.php';
require_once '../middleware/auth.php';

requireRole('admin');
header('Content-Type: application/json');

$database = new Database();

function normalize_help_request_status($status) {
    $status = strtolower(trim((string)$status));
    if ($status === 'in-progress') {
        return 'pending';
    }
    if ($status === 'resolved') {
        return 'completed';
    }
    if (in_array($status, ['new', 'pending', 'completed'], true)) {
        return $status;
    }
    return 'new';
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $requests = $database->findMany('form_help_requests', [], ['sort' => ['submittedAt' => -1]]);
            echo json_encode($requests);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error listing form filling requests: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            $data = [];
        }

        if (!isset($data['id']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(["message" => "id and status required"]);
            break;
        }

        $status = normalize_help_request_status($data['status']);

        try {
            $database->updateOne(
                'form_help_requests',
                ['requestId' => trim($data['id'])],
                ['$set' => [
                    'status' => $status,
                    'updatedAt' => date('Y-m-d H:i:s')
                ]]
            );
            echo json_encode(["success" => true, "message" => "Request status updated successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update request: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? trim($_GET['id']) : '';
        if ($id === '') {
            http_response_code(400);
            echo json_encode(["message" => "id required"]);
            break;
        }

        try {
            $database->deleteOne(
                'form_help_requests',
                ['requestId' => $id]
            );
            echo json_encode(["success" => true, "message" => "Request deleted successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to delete request: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}
