<?php
// backend/api/config/database.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

class Database {
    private ?MongoDB\Driver\Manager $manager = null;
    private $db_name = "twinsdb"; // default

    public function __construct() {
        // Simple .env parser to avoid external dependencies
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                list($name, $value) = explode('=', $line, 2);
                $_ENV[trim($name)] = trim($value);
            }
        }
    }

    public function getConnection() {
        if ($this->manager === null) {
            try {
                $uri = isset($_ENV['MONGODB_URI']) ? $_ENV['MONGODB_URI'] : "mongodb://127.0.0.1:27017";
                $this->db_name = isset($_ENV['MONGODB_DATABASE']) ? $_ENV['MONGODB_DATABASE'] : "twinsdb";
                
                if (class_exists('MongoDB\Driver\Manager')) {
                    $this->manager = new MongoDB\Driver\Manager($uri);
                } else {
                    die(json_encode(["message" => "MongoDB Extension not found."]));
                }
            } catch (Exception $e) {
                die(json_encode(["message" => "Connection error: " . $e->getMessage()]));
            }
        }
        return $this->manager;
    }

    public function getDbName() {
        return $this->db_name;
    }
}
?>
