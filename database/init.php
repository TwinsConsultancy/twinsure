<?php
// database/init.php
// Run this script from the terminal: php database/init.php
// It will initialize the MongoDB database and collections based on your .env
require_once __DIR__ . '/../backend/api/config/database.php';

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
    $database = new Database();
    
    echo "Connected to MongoDB.\n";
    echo "Initializing database: $dbName\n\n";

    $collectionsToCreate = ['users', 'services', 'partners', 'recommendation_questions', 'leads', 'form_help_requests', 'settings'];

    foreach ($collectionsToCreate as $col) {
        try {
            $created = $database->createCollectionIfNotExists($col);
            if ($created) {
                echo "✅ Collection created: $col\n";
            } else {
                echo "ℹ️ Collection already exists: $col\n";
            }
        } catch (Exception $e) {
            echo "❌ Error creating $col: " . $e->getMessage() . "\n";
        }
    }

    // Insert Default Admin
    $existingAdmin = $database->findOne('users', ['email' => $adminEmail]);
    if ($existingAdmin === null) {
        $database->insertOne('users', [
            'name' => 'Super Admin',
            'email' => $adminEmail,
            'password' => $adminPassword,
            'role' => 'admin',
            'createdAt' => date('Y-m-d H:i:s'),
            'updatedAt' => date('Y-m-d H:i:s')
        ]);
        echo "\n🔑 Default Admin created: $adminEmail\n";
    } else {
        echo "\n🔑 Admin user already exists.\n";
    }

    // Insert Default Settings
    $existingSettings = $database->findOne('settings', ['_id' => 'global']);
    if ($existingSettings === null) {
        $database->insertOne('settings', [
            '_id' => 'global',
            'supportEmail' => 'support@twinsure.com',
            'supportPhone' => '+91 9999988888',
            'officeAddress' => 'Twinsure H.Q., Chennai, Tamil Nadu - 600xxx',
            'workingHours' => 'Mon-Fri: 9AM - 6PM',
            'timeZone' => 'IST',
            'defaultLanguage' => 'English',
            'maintenanceMode' => false,
            'whatsappButton' => true,
            'emailNotifications' => true,
            'whatsappNotifications' => true,
            'leadAlerts' => true,
            'partnerAlerts' => true,
            'claimAlerts' => true,
            'notificationPriority' => 'high',
            'sessionTimeout' => '60',
            'loginAttempts' => '5',
            'recEngineEnabled' => true,
            'leadPopup' => true,
            'callbackSlot' => true,
            'partnerRegEnabled' => true,
            'referralTracking' => true,
            'publicCommissionInfo' => false,
            'minCommission' => '5',
            'maxCommission' => '25',
            'manualPartnerApproval' => true,
            'updatedAt' => date('Y-m-d H:i:s')
        ]);
        echo "\n⚙️ Default Settings initialized.\n";
    } else {
        echo "\n⚙️ Settings already exist.\n";
    }

    echo "\n🎉 Database initialization complete!\n";

} catch (Exception $e) {
    die("\n❌ Connection error: " . $e->getMessage() . "\n");
}
?>
