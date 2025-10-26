<?php
/**
 * Application Configuration File
 * Main configuration settings for FST Cost Management System
 */

// Prevent direct access
if (!defined('APP_INIT')) {
    define('APP_INIT', true);
}

// Environment Configuration
define('APP_ENV', 'development'); // development, production, testing
define('APP_DEBUG', true); // Set to false in production

// Base Path Configuration
if (!defined('BASE_PATH')) {
    $basePath = __DIR__ . DIRECTORY_SEPARATOR;
    define('BASE_PATH', $basePath);
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'fst_cost_db');
define('DB_USER', 'postgres');
define('DB_PASS', '123456789');

// Database Connection String
define('DB_CONNECTION_STRING', "host=" . DB_HOST . " port=" . DB_PORT . " dbname=" . DB_NAME . " user=" . DB_USER . " password=" . DB_PASS);

// Application Settings
define('APP_NAME', 'FST Cost Management');
define('APP_VERSION', '1.0.0');
define('APP_AUTHOR', 'FST Team');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS

// Timezone
date_default_timezone_set('Europe/Istanbul'); // Change as needed

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    // Don't display errors for API requests (they need clean JSON output)
    if (!defined('API_REQUEST')) {
        ini_set('display_errors', 1);
    } else {
        ini_set('display_errors', 0);
    }
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Logging
define('LOG_PATH', BASE_PATH . 'logs' . DIRECTORY_SEPARATOR);
if (!file_exists(LOG_PATH)) {
    mkdir(LOG_PATH, 0755, true);
}

// Upload Configuration
define('UPLOAD_PATH', BASE_PATH . 'uploads' . DIRECTORY_SEPARATOR);
define('UPLOAD_MAX_SIZE', 5242880); // 5 MB
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf']);

// Pagination
define('ITEMS_PER_PAGE', 20);

// Language Configuration
define('DEFAULT_LANGUAGE', 'tr');
define('SUPPORTED_LANGUAGES', ['tr', 'en']);

// Cache Configuration (if using cache)
define('CACHE_ENABLED', false);
define('CACHE_LIFETIME', 3600); // 1 hour

// Security
define('CSRF_TOKEN_NAME', 'csrf_token');
define('SESSION_LIFETIME', 7200); // 2 hours

// API Configuration
define('API_VERSION', 'v1');
define('API_TIMEOUT', 30);

// File Paths
define('ASSETS_PATH', BASE_PATH . 'assets' . DIRECTORY_SEPARATOR);
define('INCLUDES_PATH', BASE_PATH . 'includes' . DIRECTORY_SEPARATOR);
define('TRANSLATIONS_PATH', BASE_PATH . 'translations' . DIRECTORY_SEPARATOR);

// Helpers (only load translations for web pages, not API calls)
if (!defined('API_REQUEST')) {
    require_once INCLUDES_PATH . 'translations.php';
}

/**
 * Get database connection
 */
function getDbConnection() {
    try {
        $conn = pg_connect(DB_CONNECTION_STRING);
        
        if (!$conn) {
            throw new Exception("Database connection failed: " . pg_last_error());
        }
        
        return $conn;
    } catch (Exception $e) {
        error_log("Database connection error: " . $e->getMessage());
        
        // Don't use die() in API requests, let the caller handle the error
        if (APP_DEBUG && !defined('API_REQUEST')) {
            die("Database connection failed: " . $e->getMessage());
        }
        
        // For API requests, throw exception so it can be caught and returned as JSON
        if (defined('API_REQUEST')) {
            throw $e;
        }
        
        return null;
    }
}

/**
 * Close database connection
 */
function closeDbConnection($conn) {
    if ($conn) {
        pg_close($conn);
    }
}

/**
 * Log error
 */
function logError($message, $file = '', $line = 0) {
    $logMessage = sprintf(
        "[%s] %s in %s:%s",
        date('Y-m-d H:i:s'),
        $message,
        $file,
        $line
    );
    
    error_log($logMessage . PHP_EOL, 3, LOG_PATH . 'error_' . date('Y-m-d') . '.log');
}

/**
 * Sanitize output
 */
function h($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

/**
 * Get base path for includes/links
 */
function getBasePath() {
    return str_replace($_SERVER['DOCUMENT_ROOT'], '', BASE_PATH);
}

?>

