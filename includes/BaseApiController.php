<?php
/**
 * Base API Controller
 * Provides common functionality for all API endpoints
 * Reduces code duplication and ensures consistency
 */

// Load translations helper
if (!function_exists('loadTranslations')) {
    require_once __DIR__ . '/translations.php';
}

/**
 * Base API Controller Class
 */
class BaseApiController {
    
    protected $conn;
    protected $method;
    protected $action;
    protected $csrfTokenName;
    protected $translations;
    
    /**
     * Constructor
     * Initializes common API functionality
     */
    public function __construct($conn, $method, $action) {
        $this->conn = $conn;
        $this->method = $method;
        $this->action = $action;
        $this->csrfTokenName = defined('CSRF_TOKEN_NAME') ? CSRF_TOKEN_NAME : 'csrf_token';
        
        // Load translations based on session language or default to English
        $lang = isset($_SESSION['language']) ? $_SESSION['language'] : 'en';
        $allTranslations = loadTranslations($lang);
        $this->translations = $allTranslations['api_validation'] ?? [];
    }
    
    /**
     * Get translated message
     * @param string $key Translation key
     * @param array $params Parameters to replace
     * @return string Translated message or key if not found
     */
    protected function getTranslation($key, $params = []) {
        $message = $this->translations[$key] ?? $key;
        
        // Replace parameters
        foreach ($params as $param => $value) {
            $message = str_replace('{' . $param . '}', $value, $message);
        }
        
        return $message;
    }
    
    /**
     * Check if user is authenticated
     * @return bool
     */
    protected function checkAuthentication() {
        if (!isset($_SESSION['user_id'])) {
            $this->sendError($this->getTranslation('unauthorized'), 401);
            return false;
        }
        return true;
    }
    
    /**
     * Check CSRF token for state-changing methods
     * @return bool
     */
    protected function checkCsrf() {
        if (in_array($this->method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            if (!function_exists('requireCsrfToken')) {
                require_once __DIR__ . '/security.php';
            }
            requireCsrfToken();
        }
        return true;
    }
    
    /**
     * Validate required fields in data
     * @param array $data Input data
     * @param array $requiredFields List of required field names
     * @return bool
     */
    protected function validateRequired($data, $requiredFields) {
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                $this->sendError($this->getTranslation('missing_required_field', ['field' => $field]));
                return false;
            }
        }
        return true;
    }
    
    /**
     * Validate integer field
     * @param mixed $value Value to validate
     * @param string $fieldName Field name for error message
     * @param int|null $min Optional minimum value
     * @param int|null $max Optional maximum value
     * @return int|false Returns integer value or false on failure
     */
    protected function validateInt($value, $fieldName = 'field', $min = null, $max = null) {
        if (!is_numeric($value)) {
            $this->sendError($this->getTranslation('invalid_field_number', ['field' => $fieldName]));
            return false;
        }
        
        $intValue = (int)$value;
        
        if ($min !== null && $intValue < $min) {
            $this->sendError($this->getTranslation('invalid_field_min', ['field' => $fieldName, 'min' => $min]));
            return false;
        }
        
        if ($max !== null && $intValue > $max) {
            $this->sendError($this->getTranslation('invalid_field_max', ['field' => $fieldName, 'max' => $max]));
            return false;
        }
        
        return $intValue;
    }
    
    /**
     * Validate string field
     * @param mixed $value Value to validate
     * @param string $fieldName Field name for error message
     * @param int|null $maxLength Optional maximum length
     * @param bool $allowEmpty Whether to allow empty strings
     * @return string|false Returns string value or false on failure
     */
    protected function validateString($value, $fieldName = 'field', $maxLength = null, $allowEmpty = true) {
        if (!is_string($value)) {
            $this->sendError($this->getTranslation('invalid_field_string', ['field' => $fieldName]));
            return false;
        }
        
        $trimmed = trim($value);
        
        if (!$allowEmpty && empty($trimmed)) {
            $this->sendError($this->getTranslation('invalid_field_empty', ['field' => $fieldName]));
            return false;
        }
        
        if ($maxLength !== null && strlen($trimmed) > $maxLength) {
            $this->sendError($this->getTranslation('invalid_field_length', ['field' => $fieldName, 'max' => $maxLength]));
            return false;
        }
        
        return $trimmed;
    }
    
    /**
     * Validate email format
     * @param string $email Email address
     * @return bool
     */
    protected function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Send success response
     * @param mixed $data Response data
     * @param string|null $message Optional message
     * @param int $statusCode HTTP status code
     */
    protected function sendSuccess($data = null, $message = null, $statusCode = 200) {
        http_response_code($statusCode);
        $response = ['success' => true];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if ($message !== null) {
            $response['message'] = $message;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Send error response
     * @param string $message Error message
     * @param int $statusCode HTTP status code
     */
    protected function sendError($message, $statusCode = 400) {
        http_response_code($statusCode);
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }
    
    /**
     * Execute database query with error handling
     * @param string $query SQL query with placeholders
     * @param array $params Query parameters
     * @return resource|false Query result or false on failure
     */
    protected function executeQuery($query, $params = []) {
        try {
            if (empty($params)) {
                $result = pg_query($this->conn, $query);
            } else {
                $result = pg_query_params($this->conn, $query, $params);
            }
            
            if (!$result) {
                $error = getDbErrorMessage($this->conn);
                error_log("Database query failed: {$error}");
                throw new Exception($error);
            }
            
            return $result;
        } catch (Exception $e) {
            $error = getDbErrorMessage($this->conn);
            error_log("Database query failed: {$error}");
            throw $e;
        }
    }
    
    /**
     * Fetch all results from query
     * @param resource $result Query result
     * @return array
     */
    protected function fetchAll($result) {
        return pg_fetch_all($result) ?: [];
    }
    
    /**
     * Fetch single row from query
     * @param resource $result Query result
     * @return array|null
     */
    protected function fetchOne($result) {
        return pg_fetch_assoc($result) ?: null;
    }
    
    /**
     * Log error for debugging
     * @param string $message Error message
     * @param string|null $file File name
     * @param int|null $line Line number
     */
    protected function logError($message, $file = null, $line = null) {
        $logMessage = "[" . date('Y-m-d H:i:s') . "] {$message}";
        if ($file) {
            $logMessage .= " in {$file}";
        }
        if ($line) {
            $logMessage .= ":{$line}";
        }
        error_log($logMessage);
    }
}

