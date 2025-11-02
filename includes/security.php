<?php
/**
 * Security Helper Functions
 * CSRF protection, input validation, output sanitization
 */

/**
 * Generate CSRF token
 */
function generateCsrfToken() {
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Generate token if it doesn't exist
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF token
 */
function validateCsrfToken($token) {
    // Session should already be started for API requests
    if (session_status() === PHP_SESSION_NONE) {
        if (defined('API_REQUEST')) {
            return false; // Can't validate without session
        }
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Get CSRF token input field
 */
function csrfField() {
    $token = generateCsrfToken();
    return '<input type="hidden" name="' . CSRF_TOKEN_NAME . '" value="' . h($token) . '">';
}

/**
 * Get CSRF token for JSON requests
 */
function csrfToken() {
    return generateCsrfToken();
}

/**
 * Validate CSRF token from POST/GET or JSON
 */
function requireCsrfToken() {
    $token = null;
    
    // Check POST first
    if (isset($_POST[CSRF_TOKEN_NAME])) {
        $token = $_POST[CSRF_TOKEN_NAME];
    }
    // Check GET
    elseif (isset($_GET[CSRF_TOKEN_NAME])) {
        $token = $_GET[CSRF_TOKEN_NAME];
    }
    // Check JSON body
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (isset($data[CSRF_TOKEN_NAME])) {
            $token = $data[CSRF_TOKEN_NAME];
        }
    }
    
    if (!$token || !validateCsrfToken($token)) {
        if (defined('API_REQUEST')) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'CSRF token validation failed']);
            exit;
        } else {
            die('CSRF token validation failed');
        }
    }
}

/**
 * Safe database query with prepared statements
 */
function dbQuery($conn, $query, $params = []) {
    if (empty($params)) {
        $result = pg_query($conn, $query);
        if (!$result) {
            throw new Exception('Database query failed: ' . getDbErrorMessage($conn));
        }
        return $result;
    }
    
    // Use prepared statements with pg_query_params
    $result = pg_query_params($conn, $query, $params);
    if (!$result) {
        throw new Exception('Database query failed: ' . getDbErrorMessage($conn));
    }
    
    return $result;
}

/**
 * Safe database query and fetch all
 */
function dbQueryAll($conn, $query, $params = []) {
    $result = dbQuery($conn, $query, $params);
    return pg_fetch_all($result) ?: [];
}

/**
 * Safe database query and fetch one row
 */
function dbQueryOne($conn, $query, $params = []) {
    $result = dbQuery($conn, $query, $params);
    return pg_fetch_assoc($result);
}

/**
 * Validate and sanitize integer input
 */
function validateInt($value, $min = null, $max = null) {
    if (!is_numeric($value)) {
        throw new InvalidArgumentException('Invalid integer value');
    }
    
    $int = (int)$value;
    
    if ($min !== null && $int < $min) {
        throw new InvalidArgumentException("Value must be at least $min");
    }
    
    if ($max !== null && $int > $max) {
        throw new InvalidArgumentException("Value must be at most $max");
    }
    
    return $int;
}

/**
 * Validate and sanitize string input
 */
function validateString($value, $maxLength = null, $allowEmpty = true) {
    if (!is_string($value)) {
        throw new InvalidArgumentException('Invalid string value');
    }
    
    $value = trim($value);
    
    if (!$allowEmpty && empty($value)) {
        throw new InvalidArgumentException('Value cannot be empty');
    }
    
    if ($maxLength !== null && strlen($value) > $maxLength) {
        throw new InvalidArgumentException("Value must be at most $maxLength characters");
    }
    
    return $value;
}

/**
 * Validate email
 */
function validateEmailInput($email) {
    $email = filter_var($email, FILTER_VALIDATE_EMAIL);
    if ($email === false) {
        throw new InvalidArgumentException('Invalid email format');
    }
    return $email;
}

/**
 * Validate date format
 */
function validateDate($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date);
    if ($d && $d->format($format) === $date) {
        return $date;
    }
    throw new InvalidArgumentException('Invalid date format');
}

/**
 * Escape JavaScript string
 */
function jsEscape($string) {
    return json_encode($string, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
function checkRateLimit($key, $maxRequests = 10, $timeWindow = 60) {
    // Session should already be started
    if (session_status() === PHP_SESSION_NONE) {
        if (defined('API_REQUEST')) {
            return true; // Skip rate limiting if no session
        }
        session_start();
    }
    
    $rateLimitKey = 'rate_limit_' . $key;
    $now = time();
    
    if (!isset($_SESSION[$rateLimitKey])) {
        $_SESSION[$rateLimitKey] = [
            'count' => 1,
            'reset_time' => $now + $timeWindow
        ];
        return true;
    }
    
    $rateLimit = $_SESSION[$rateLimitKey];
    
    // Reset if time window passed
    if ($now > $rateLimit['reset_time']) {
        $_SESSION[$rateLimitKey] = [
            'count' => 1,
            'reset_time' => $now + $timeWindow
        ];
        return true;
    }
    
    // Check limit
    if ($rateLimit['count'] >= $maxRequests) {
        return false;
    }
    
    $_SESSION[$rateLimitKey]['count']++;
    return true;
}

/**
 * Initialize secure session
 */
function initSecureSession() {
    // Secure session configuration (must be set before session_start)
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_samesite', 'Strict');
    
    // Set secure flag if HTTPS
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        ini_set('session.cookie_secure', 1);
    }
    
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Check session timeout
    if (isset($_SESSION['last_activity'])) {
        if (time() - $_SESSION['last_activity'] > SESSION_LIFETIME) {
            session_destroy();
            session_start();
        }
    }
    
    $_SESSION['last_activity'] = time();
    
    // Regenerate session ID periodically (every 30 minutes)
    if (!isset($_SESSION['created'])) {
        $_SESSION['created'] = time();
    } elseif (time() - $_SESSION['created'] > 1800) {
        session_regenerate_id(true);
        $_SESSION['created'] = time();
    }
}

?>

