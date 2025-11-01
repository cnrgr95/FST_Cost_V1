<?php
/**
 * System Requirements Checker
 * Bu dosyayı browser'da çalıştırarak gereksinimleri kontrol edin
 * URL: http://localhost/FST_Cost_V1/check_requirements.php
 */

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FST Cost Management - System Requirements Check</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #151A2D;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        h3 {
            color: #777;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        th {
            background: #151A2D;
            color: white;
            padding: 12px;
            text-align: left;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        tr:hover {
            background: #f9f9f9;
        }
        .pass {
            color: #28a745;
            font-weight: bold;
        }
        .fail {
            color: #dc3545;
            font-weight: bold;
        }
        .warning {
            color: #ffc107;
            font-weight: bold;
        }
        .info-box {
            background: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #151A2D;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .error {
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>🔍 FST Cost Management - System Requirements Check</h1>
    
    <?php
    $allPassed = true;
    $warnings = [];
    
    // PHP Version Check
    $phpVersionOk = version_compare(PHP_VERSION, '7.4.0', '>=');
    if (!$phpVersionOk) {
        $allPassed = false;
    }
    
    // Extension Checks
    $extensions = [
        'pgsql' => 'PostgreSQL Extension (pgsql)',
        'pdo_pgsql' => 'PDO PostgreSQL Extension',
        'mbstring' => 'mbstring Extension (UTF-8 support)',
        'curl' => 'cURL Extension (API calls)',
        'json' => 'JSON Extension',
        'openssl' => 'OpenSSL Extension (Security)',
        'fileinfo' => 'fileinfo Extension (File uploads)',
        'zip' => 'ZIP Extension (Excel files)',
    ];
    
    $requirements = [
        'PHP Version >= 7.4' => [
            'status' => $phpVersionOk,
            'value' => PHP_VERSION,
            'required' => true
        ],
    ];
    
    foreach ($extensions as $ext => $name) {
        $loaded = extension_loaded($ext);
        $requirements[$name] = [
            'status' => $loaded,
            'value' => $loaded ? 'Loaded' : 'Not Loaded',
            'required' => true
        ];
        if (!$loaded) {
            $allPassed = false;
        }
    }
    
    // Directory Checks
    $directories = [
        'Composer Autoload' => [
            'path' => __DIR__ . '/vendor/autoload.php',
            'check' => 'file_exists',
            'required' => true
        ],
        'Translations Directory' => [
            'path' => __DIR__ . '/translations',
            'check' => 'is_dir',
            'required' => true
        ],
        'Uploads Directory' => [
            'path' => __DIR__ . '/uploads',
            'check' => 'is_dir',
            'required' => true,
            'writable' => true
        ],
        'Logs Directory' => [
            'path' => __DIR__ . '/logs',
            'check' => 'is_dir',
            'required' => true,
            'writable' => true
        ],
    ];
    
    foreach ($directories as $name => $dir) {
        $exists = $dir['check']($dir['path']);
        $writable = isset($dir['writable']) ? is_writable($dir['path']) : null;
        
        $requirements[$name] = [
            'status' => $exists && ($writable === null || $writable),
            'value' => $exists ? ($writable !== null ? ($writable ? 'Exists & Writable' : 'Exists but Not Writable') : 'Exists') : 'Not Found',
            'required' => $dir['required']
        ];
        
        if (!$exists) {
            if ($dir['required']) {
                $allPassed = false;
            }
        } elseif ($writable === false) {
            $warnings[] = "$name is not writable";
            if ($dir['required']) {
                $allPassed = false;
            }
        }
    }
    
    // .env File Check
    $envExists = file_exists(__DIR__ . '/.env');
    $requirements['.env Configuration File'] = [
        'status' => $envExists,
        'value' => $envExists ? 'Exists' : 'Not Found (using config.php defaults)',
        'required' => false
    ];
    if (!$envExists) {
        $warnings[] = '.env file not found - using config.php defaults (not recommended for production)';
    }
    
    // Database Connection Test
    $dbConnected = false;
    $dbError = '';
    if (file_exists(__DIR__ . '/config.php')) {
        try {
            // Try to include config (may fail if DB not configured)
            define('APP_INIT', true);
            define('API_REQUEST', true);
            @include_once __DIR__ . '/config.php';
            
            if (defined('DB_HOST') && defined('DB_NAME')) {
                $conn = @pg_connect("host=" . DB_HOST . " port=" . (defined('DB_PORT') ? DB_PORT : '5432') . " dbname=" . DB_NAME . " user=" . DB_USER . " password=" . DB_PASS);
                if ($conn) {
                    $dbConnected = true;
                    pg_close($conn);
                } else {
                    $dbError = pg_last_error();
                }
            }
        } catch (Exception $e) {
            $dbError = $e->getMessage();
        }
    }
    
    $requirements['Database Connection'] = [
        'status' => $dbConnected,
        'value' => $dbConnected ? 'Connected' : ($dbError ? 'Error: ' . htmlspecialchars($dbError) : 'Not Configured'),
        'required' => true
    ];
    if (!$dbConnected) {
        $allPassed = false;
    }
    
    // PHP Configuration
    $phpConfig = [
        'Memory Limit' => ini_get('memory_limit'),
        'Upload Max Size' => ini_get('upload_max_filesize'),
        'Post Max Size' => ini_get('post_max_size'),
        'Session Save Path' => ini_get('session.save_path'),
        'Timezone' => ini_get('date.timezone'),
    ];
    
    // Display Results
    echo "<table>";
    echo "<tr><th>Requirement</th><th>Status</th><th>Details</th></tr>";
    
    foreach ($requirements as $requirement => $data) {
        $statusText = $data['status'] ? '✅ PASS' : '❌ FAIL';
        $statusClass = $data['status'] ? 'pass' : 'fail';
        
        echo "<tr>";
        echo "<td><strong>{$requirement}</strong></td>";
        echo "<td class='{$statusClass}'>{$statusText}</td>";
        echo "<td>" . htmlspecialchars($data['value']) . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    // Display PHP Configuration
    echo "<h2>📋 PHP Configuration</h2>";
    echo "<table>";
    echo "<tr><th>Setting</th><th>Value</th></tr>";
    foreach ($phpConfig as $key => $value) {
        echo "<tr><td>{$key}</td><td>" . htmlspecialchars($value) . "</td></tr>";
    }
    echo "</table>";
    
    // Final Status
    if ($allPassed) {
        echo "<div class='success'>";
        echo "<h2>✅ All Requirements Met!</h2>";
        echo "<p>Your system is ready to run FST Cost Management.</p>";
        echo "</div>";
    } else {
        echo "<div class='error'>";
        echo "<h2>❌ Some Requirements Are Missing</h2>";
        echo "<p>Please install the missing components before proceeding.</p>";
        echo "</div>";
    }
    
    if (!empty($warnings)) {
        echo "<div class='info-box'>";
        echo "<h3>⚠️ Warnings:</h3>";
        echo "<ul>";
        foreach ($warnings as $warning) {
            echo "<li>" . htmlspecialchars($warning) . "</li>";
        }
        echo "</ul>";
        echo "</div>";
    }
    
    // PHP Info Link
    echo "<div class='info-box'>";
    echo "<h3>ℹ️ Additional Information</h3>";
    echo "<p><strong>PHP Version:</strong> " . PHP_VERSION . "</p>";
    echo "<p><strong>PHP SAPI:</strong> " . php_sapi_name() . "</p>";
    echo "<p><strong>Server Software:</strong> " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "</p>";
    echo "<p><strong>Document Root:</strong> " . htmlspecialchars($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "</p>";
    echo "<p><strong>Script Path:</strong> " . htmlspecialchars(__DIR__) . "</p>";
    echo "</div>";
    
    // Security Note
    echo "<div class='info-box'>";
    echo "<h3>🔒 Security Note</h3>";
    echo "<p><strong>IMPORTANT:</strong> Delete or protect this file in production environment!</p>";
    echo "<p>This file exposes system information and should not be publicly accessible.</p>";
    echo "</div>";
    ?>
</body>
</html>

