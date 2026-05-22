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

    public function getConnection(): \MongoDB\Driver\Manager {
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

    public function getDbName(): string {
        return $this->db_name;
    }

    public function findMany(string $collectionName, array $filter = [], array $options = []): array {
        $manager = $this->getConnection();
        $query = new MongoDB\Driver\Query($filter, $options);
        $cursor = $manager->executeQuery($this->db_name . '.' . $collectionName, $query);
        $results = [];

        foreach ($cursor as $doc) {
            $item = (array) $doc;
            if (isset($item['_id'])) {
                $item['_id'] = (string) $item['_id'];
            }
            $results[] = $item;
        }

        return $results;
    }

    public function findOne(string $collectionName, array $filter = [], array $options = []): ?array {
        $results = $this->findMany($collectionName, $filter, $options);
        return count($results) > 0 ? $results[0] : null;
    }

    public function insertOne(string $collectionName, array $document): void {
        $manager = $this->getConnection();
        $bulk = new MongoDB\Driver\BulkWrite;
        $bulk->insert($document);
        $manager->executeBulkWrite($this->db_name . '.' . $collectionName, $bulk);
    }

    public function updateOne(string $collectionName, array $filter, array $update): void {
        $manager = $this->getConnection();
        $bulk = new MongoDB\Driver\BulkWrite;
        $bulk->update($filter, $update);
        $manager->executeBulkWrite($this->db_name . '.' . $collectionName, $bulk);
    }

    public function deleteOne(string $collectionName, array $filter): void {
        $manager = $this->getConnection();
        $bulk = new MongoDB\Driver\BulkWrite;
        $bulk->delete($filter, ['limit' => 1]);
        $manager->executeBulkWrite($this->db_name . '.' . $collectionName, $bulk);
    }

    public function createCollectionIfNotExists(string $collectionName): bool {
        $manager = $this->getConnection();
        try {
            $command = new MongoDB\Driver\Command(["create" => $collectionName]);
            $manager->executeCommand($this->db_name, $command);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>
