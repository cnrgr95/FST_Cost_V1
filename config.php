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
// Load from .env file if exists, otherwise use defaults
$envFile = BASE_PATH . '.env';
if (file_exists($envFile)) {
    $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines !== false) {
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue; // Skip comments
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }
}

define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_PORT', $_ENV['DB_PORT'] ?? '5432');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'fst_cost_db');
define('DB_USER', $_ENV['DB_USER'] ?? 'postgres');
define('DB_PASS', $_ENV['DB_PASS'] ?? '123456789'); // Fallback to original password if .env not found

// Database Connection String
define('DB_CONNECTION_STRING', "host=" . DB_HOST . " port=" . DB_PORT . " dbname=" . DB_NAME . " user=" . DB_USER . " password=" . DB_PASS);

// Application Settings
define('APP_NAME', 'FST Cost Management');
define('APP_VERSION', '1.0.0');
define('APP_AUTHOR', 'FST Team');

// Session Configuration (will be enhanced in security.php)
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 1 : 0);

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

// Load security helpers only for web pages (not API)
if (!defined('API_REQUEST')) {
    if (file_exists(INCLUDES_PATH . 'security.php')) {
        require_once INCLUDES_PATH . 'security.php';
    }
}

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

/**
 * Get safe database error message
 * Prevents information leakage in production
 */
function getDbErrorMessage($conn) {
    if (APP_DEBUG) {
        return pg_last_error($conn) ?: 'Database operation failed';
    } else {
        return 'Database operation failed. Please contact administrator.';
    }
}

/**
 * Send JSON response
 */
function sendJsonResponse($success, $data = null, $message = null) {
    $response = ['success' => $success];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Validate email format
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone format (basic)
 */
function validatePhone($phone) {
    // Remove spaces, dashes, parentheses
    $phone = preg_replace('/[\s\-\(\)]/', '', $phone);
    // Check if it contains only digits and optional + at start
    return preg_match('/^\+?[0-9]{10,15}$/', $phone);
}

/**
 * Validate URL format
 */
function validateUrl($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

?>

