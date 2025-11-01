<?php
/**
 * Database Creation Script
 * Creates the FST Cost Management database and tables
 * 
 * Usage: php database/create_database.php
 */

// Load configuration
require_once __DIR__ . '/../config.php';

// Colors for terminal output
$GREEN = "\033[32m";
$RED = "\033[31m";
$YELLOW = "\033[33m";
$BLUE = "\033[34m";
$NC = "\033[0m"; // No Color

echo $BLUE . "===========================================\n";
echo "FST Cost Management - Database Setup\n";
echo "===========================================\n\n" . $NC;

// Try to connect to postgres database first to create our database
try {
    echo $YELLOW . "Step 1: Connecting to PostgreSQL server...\n" . $NC;
    
    // Connect to postgres database to create our database
    $postgresConn = pg_connect("host=" . DB_HOST . " port=" . DB_PORT . " dbname=postgres user=" . DB_USER . " password=" . DB_PASS);
    
    if (!$postgresConn) {
        throw new Exception("Failed to connect to PostgreSQL server: " . pg_last_error());
    }
    
    echo $GREEN . "✓ Connected to PostgreSQL server\n\n" . $NC;
    
    // Check if database exists
    echo $YELLOW . "Step 2: Checking if database exists...\n" . $NC;
    $checkDb = pg_query($postgresConn, "SELECT 1 FROM pg_database WHERE datname = '" . DB_NAME . "'");
    
    if (pg_num_rows($checkDb) > 0) {
        echo $YELLOW . "⚠ Database '" . DB_NAME . "' already exists.\n" . $NC;
        echo "Do you want to drop and recreate it? (yes/no): ";
        $handle = fopen("php://stdin", "r");
        $line = trim(fgets($handle));
        fclose($handle);
        
        if (strtolower($line) === 'yes') {
            // Terminate existing connections
            pg_query($postgresConn, "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '" . DB_NAME . "' AND pid <> pg_backend_pid()");
            
            // Drop database
            $dropResult = pg_query($postgresConn, "DROP DATABASE IF EXISTS " . DB_NAME);
            if (!$dropResult) {
                throw new Exception("Failed to drop database: " . pg_last_error($postgresConn));
            }
            echo $GREEN . "✓ Database dropped\n" . $NC;
        } else {
            echo $YELLOW . "Skipping database creation...\n" . $NC;
        }
    }
    
    // Create database if it doesn't exist
    if (pg_num_rows($checkDb) === 0 || strtolower($line) === 'yes') {
        echo $YELLOW . "Creating database '" . DB_NAME . "' with UTF-8 encoding...\n" . $NC;
        // Create database with UTF-8 encoding
        $createDb = pg_query($postgresConn, "CREATE DATABASE " . DB_NAME . " WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8'");
        
        if (!$createDb) {
            throw new Exception("Failed to create database: " . pg_last_error($postgresConn));
        }
        
        echo $GREEN . "✓ Database '" . DB_NAME . "' created successfully with UTF-8 encoding\n\n" . $NC;
    }
    
    pg_close($postgresConn);
    
    // Now connect to our database
    echo $YELLOW . "Step 3: Connecting to '" . DB_NAME . "' database...\n" . $NC;
    $conn = getDbConnection();
    
    if (!$conn) {
        throw new Exception("Failed to connect to database");
    }
    
    // Verify client encoding
    $encodingResult = pg_query($conn, "SHOW client_encoding");
    if ($encodingResult) {
        $encodingRow = pg_fetch_assoc($encodingResult);
        $clientEncoding = $encodingRow['client_encoding'] ?? 'unknown';
        if (strtoupper($clientEncoding) === 'UTF8') {
            echo $GREEN . "✓ Connected to database (encoding: UTF8)\n\n" . $NC;
        } else {
            echo $YELLOW . "⚠ Warning: Client encoding is '{$clientEncoding}', expected 'UTF8'\n" . $NC;
            echo $GREEN . "✓ Connected to database\n\n" . $NC;
        }
    } else {
        echo $GREEN . "✓ Connected to database\n\n" . $NC;
    }
    
    // Read SQL file
    echo $YELLOW . "Step 4: Reading SQL schema file...\n" . $NC;
    $sqlFile = __DIR__ . '/create_database.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: " . $sqlFile);
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && 
                   !preg_match('/^--/', $stmt) && 
                   !preg_match('/^\/\*/', $stmt);
        }
    );
    
    echo $GREEN . "✓ SQL file loaded\n\n" . $NC;
    
    // Execute each statement
    echo $YELLOW . "Step 5: Creating tables and indexes...\n" . $NC;
    $tablesCreated = 0;
    $functionsCreated = 0;
    
    foreach ($statements as $statement) {
        // Skip comments and empty lines
        $cleanStmt = trim($statement);
        if (empty($cleanStmt) || strpos($cleanStmt, '--') === 0) {
            continue;
        }
        
        // Remove multi-line comments
        $cleanStmt = preg_replace('/\/\*.*?\*\//s', '', $cleanStmt);
        $cleanStmt = trim($cleanStmt);
        
        if (empty($cleanStmt)) {
            continue;
        }
        
        $result = pg_query($conn, $cleanStmt);
        
        if (!$result) {
            $error = pg_last_error($conn);
            // Some errors are expected (like IF NOT EXISTS failures)
            if (strpos($error, 'already exists') === false && 
                strpos($error, 'duplicate key') === false) {
                echo $RED . "⚠ Warning: " . substr($error, 0, 100) . "\n" . $NC;
            }
        } else {
            if (stripos($cleanStmt, 'CREATE TABLE') !== false) {
                $tablesCreated++;
            } elseif (stripos($cleanStmt, 'CREATE FUNCTION') !== false || 
                      stripos($cleanStmt, 'CREATE OR REPLACE FUNCTION') !== false) {
                $functionsCreated++;
            }
        }
    }
    
    echo $GREEN . "✓ Tables created: " . $tablesCreated . "\n" . $NC;
    echo $GREEN . "✓ Functions created: " . $functionsCreated . "\n\n" . $NC;
    
    // Verify tables
    echo $YELLOW . "Step 6: Verifying tables...\n" . $NC;
    $verifyQuery = "SELECT table_name FROM information_schema.tables 
                     WHERE table_schema = 'public' 
                     ORDER BY table_name";
    $verifyResult = pg_query($conn, $verifyQuery);
    
    if ($verifyResult) {
        $tables = pg_fetch_all($verifyResult);
        if ($tables) {
            foreach ($tables as $table) {
                echo $GREEN . "  ✓ " . $table['table_name'] . "\n" . $NC;
            }
        }
    }
    
    echo "\n" . $GREEN . "===========================================\n";
    echo "Database setup completed successfully!\n";
    echo "===========================================\n" . $NC;
    
    closeDbConnection($conn);
    
} catch (Exception $e) {
    echo $RED . "\n✗ Error: " . $e->getMessage() . "\n" . $NC;
    if (isset($conn)) {
        closeDbConnection($conn);
    }
    exit(1);
}

