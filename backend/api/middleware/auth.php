<?php
// backend/api/middleware/auth.php

function authenticate() {
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    }

    $authHeader = '';
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    }
    
    if (!$authHeader) {
        // Fallback for Nginx/other servers
        $authHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    }

    if ($authHeader) {
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = json_decode(base64_decode($token));

        if ($decoded && isset($decoded->role) && $decoded->exp > time()) {
            return $decoded;
        }
    }
    
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized access."]);
    exit();
}

function requireRole(string $role) {
    $user = authenticate();
    if ($user->role !== $role) {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden. Requires $role role."]);
        exit();
    }
    return $user;
}
?>
