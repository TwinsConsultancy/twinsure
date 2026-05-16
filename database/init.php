<?php
// database/init.php
// Run this script from the terminal: php database/init.php
// It will initialize the MongoDB database and collections based on your .env

$envFile = __DIR__ . '/../backend/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
} else {
    die("Error: backend/.env file not found!\n");
}

$uri = isset($_ENV['MONGODB_URI']) ? $_ENV['MONGODB_URI'] : "mongodb://127.0.0.1:27017";
$dbName = isset($_ENV['MONGODB_DATABASE']) ? $_ENV['MONGODB_DATABASE'] : "twinsdb";
$adminEmail = isset($_ENV['ADMIN_EMAIL']) ? $_ENV['ADMIN_EMAIL'] : "admin@twinsure.com";
$adminPassword = isset($_ENV['ADMIN_PASSWORD']) ? $_ENV['ADMIN_PASSWORD'] : "admin123";

try {
    $manager = new MongoDB\Driver\Manager($uri);
    
    echo "Connected to MongoDB.\n";
    echo "Initializing database: $dbName\n\n";

    $collectionsToCreate = ['users', 'services', 'partners', 'recommendation_questions', 'leads'];

    foreach ($collectionsToCreate as $col) {
        $command = new MongoDB\Driver\Command(["create" => $col]);
        try {
            $manager->executeCommand($dbName, $command);
            echo "✅ Collection created: $col\n";
        } catch (MongoDB\Driver\Exception\CommandException $e) {
            // Error code 48 means collection already exists
            if ($e->getCode() == 48) {
                echo "ℹ️ Collection already exists: $col\n";
            } else {
                echo "❌ Error creating $col: " . $e->getMessage() . "\n";
            }
        }
    }

    // Insert Default Admin
    $query = new MongoDB\Driver\Query(['email' => $adminEmail]);
    $cursor = $manager->executeQuery("$dbName.users", $query);
    if (count($cursor->toArray()) == 0) {
        $bulk = new MongoDB\Driver\BulkWrite;
        $bulk->insert([
            'name' => 'Super Admin',
            'email' => $adminEmail,
            'password' => $adminPassword,
            'role' => 'admin',
            'createdAt' => new MongoDB\BSON\UTCDateTime(),
            'updatedAt' => new MongoDB\BSON\UTCDateTime()
        ]);
        $manager->executeBulkWrite("$dbName.users", $bulk);
        echo "\n🔑 Default Admin created: $adminEmail\n";
    } else {
        echo "\n🔑 Admin user already exists.\n";
    }

    echo "\n🎉 Database initialization complete!\n";

} catch (Exception $e) {
    die("\n❌ Connection error: " . $e->getMessage() . "\n");
}
?>
