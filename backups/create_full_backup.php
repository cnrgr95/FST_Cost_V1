<?php
/**
 * Maximum Level Database Backup Script
 * Creates comprehensive backups of PostgreSQL database
 * with all data, schema, indexes, constraints, and triggers
 * 
 * Usage: php backups/create_full_backup.php
 *        or visit in browser for automatic backup
 */

// Set unlimited execution time for large databases
set_time_limit(0);
ini_set('max_execution_time', 0);
ini_set('memory_limit', '512M');

// Load configuration
define('APP_INIT', true);
require_once __DIR__ . '/../config.php';

// Database Configuration
$dbHost = DB_HOST;
$dbPort = DB_PORT;
$dbName = DB_NAME;
$dbUser = DB_USER;
$dbPass = DB_PASS;

// Backup Configuration
$backupDir = __DIR__ . DIRECTORY_SEPARATOR . 'DB' . DIRECTORY_SEPARATOR;
$keepBackups = 10; // Keep last 10 backups

// Create backup directory if it doesn't exist
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
}

/**
 * Create full database backup
 */
function createBackup($dbHost, $dbPort, $dbName, $dbUser, $dbPass, $backupDir) {
    $timestamp = date('Y-m-d_H-i-s');
    $filename = "fst_cost_db_backup_{$timestamp}.sql";
    $filepath = $backupDir . $filename;
    
    // Determine pg_dump location (common paths)
    $pgDumpPaths = [
        'C:\\laragon\\bin\\postgresql\\postgresql\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
        'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
        'C:\\xampp\\PostgreSQL\\bin\\pg_dump.exe',
        'C:\\laragon\\bin\\postgresql\\16\\bin\\pg_dump.exe',
        'C:\\laragon\\bin\\postgresql\\15\\bin\\pg_dump.exe',
        'C:\\laragon\\bin\\postgresql\\14\\bin\\pg_dump.exe',
        '/usr/bin/pg_dump',
        '/usr/local/bin/pg_dump',
        'pg_dump' // In PATH
    ];
    
    $pgDump = null;
    foreach ($pgDumpPaths as $path) {
        if (file_exists($path)) {
            $pgDump = $path;
            break;
        }
    }
    
    if (!$pgDump) {
        // Try to find pg_dump in PATH
        $output = [];
        exec('where pg_dump 2>nul', $output);
        if (!empty($output)) {
            $pgDump = 'pg_dump';
        } else {
            throw new Exception("pg_dump not found. Please install PostgreSQL or add pg_dump to PATH.");
        }
    }
    
    // Build pg_dump command with maximum options
    $command = sprintf(
        '"%s" --host=%s --port=%s --username=%s --dbname=%s --format=plain --encoding=UTF-8 --no-owner --no-privileges --clean --if-exists --file="%s"',
        $pgDump,
        $dbHost,
        $dbPort,
        $dbUser,
        $dbName,
        $filepath
    );
    
    // Set PGPASSWORD environment variable for password
    putenv("PGPASSWORD={$dbPass}");
    
    // Execute pg_dump
    $output = [];
    $returnCode = 0;
    
    // Execute command
    exec($command . " 2>&1", $output, $returnCode);
    
    // Unset password from environment
    putenv("PGPASSWORD");
    
    if ($returnCode !== 0) {
        $errorMsg = implode("\n", $output);
        throw new Exception("pg_dump failed: {$errorMsg}");
    }
    
    // Check if file was created
    if (!file_exists($filepath)) {
        throw new Exception("Backup file was not created. pg_dump may have failed silently.");
    }
    
    // Read the content
    $content = file_get_contents($filepath);
    
    if (empty($content)) {
        throw new Exception("pg_dump produced empty output. Check database connection.");
    }
    
    // Compress backup
    $zipFilename = $filename . '.gz';
    $zipFilepath = $backupDir . $zipFilename;
    
    if (function_exists('gzencode')) {
        $compressed = gzencode($content, 9); // Maximum compression
        file_put_contents($zipFilepath, $compressed);
        unlink($filepath); // Remove uncompressed file
        $finalFilename = $zipFilename;
        $finalFilepath = $zipFilepath;
    } else {
        $finalFilename = $filename;
        $finalFilepath = $filepath;
    }
    
    $fileSize = filesize($finalFilepath);
    $fileSizeFormatted = formatBytes($fileSize);
    
    return [
        'success' => true,
        'filename' => $finalFilename,
        'filepath' => $finalFilepath,
        'size' => $fileSize,
        'sizeFormatted' => $fileSizeFormatted,
        'timestamp' => $timestamp,
        'database' => $dbName
    ];
}

/**
 * Clean old backups, keep only last N
 */
function cleanOldBackups($backupDir, $keepBackups) {
    $files = glob($backupDir . 'fst_cost_db_backup_*.sql*');
    
    if (count($files) <= $keepBackups) {
        return;
    }
    
    // Sort by modification time (newest first)
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    // Delete old backups
    for ($i = $keepBackups; $i < count($files); $i++) {
        unlink($files[$i]);
    }
}

/**
 * Format bytes to human readable format
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}

/**
 * Get database size
 */
function getDatabaseSize($conn, $dbName) {
    $query = "SELECT pg_size_pretty(pg_database_size('{$dbName}')) as size";
    $result = pg_query($conn, $query);
    if ($result) {
        $row = pg_fetch_assoc($result);
        return $row['size'] ?? 'Unknown';
    }
    return 'Unknown';
}

// Main execution
try {
    echo "=== FST Cost Management - Maximum Level Database Backup ===\n\n";
    
    // Test database connection
    echo "Testing database connection...\n";
    $conn = pg_connect("host={$dbHost} port={$dbPort} dbname={$dbName} user={$dbUser} password={$dbPass}");
    
    if (!$conn) {
        throw new Exception("Failed to connect to database: " . pg_last_error());
    }
    
    echo "✓ Connected to database\n";
    
    $dbSize = getDatabaseSize($conn, $dbName);
    echo "Database size: {$dbSize}\n";
    pg_close($conn);
    
    echo "\nStarting backup process...\n";
    echo "This may take a while for large databases...\n\n";
    
    // Create backup
    $backupResult = createBackup($dbHost, $dbPort, $dbName, $dbUser, $dbPass, $backupDir);
    
    echo "✓ Backup created successfully!\n";
    echo "  File: {$backupResult['filename']}\n";
    echo "  Size: {$backupResult['sizeFormatted']}\n";
    echo "  Location: {$backupResult['filepath']}\n\n";
    
    // Clean old backups
    echo "Cleaning old backups...\n";
    cleanOldBackups($backupDir, $keepBackups);
    echo "✓ Cleanup completed\n";
    
    echo "\n=== Backup Complete ===\n";
    
    // If running from browser, output JSON
    if (php_sapi_name() !== 'cli') {
        header('Content-Type: application/json');
        echo json_encode($backupResult, JSON_PRETTY_PRINT);
    }
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    
    if (php_sapi_name() !== 'cli') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_PRETTY_PRINT);
    }
    
    exit(1);
}
