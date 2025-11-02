<?php
/**
 * API Helper Functions
 * Provides common utilities for API endpoints
 * Reduces code duplication and ensures consistency
 */

if (!function_exists('loadTranslations')) {
    require_once __DIR__ . '/translations.php';
}

/**
 * Get translated API message
 * @param string $key Translation key from api_validation section
 * @param array $params Parameters to replace in message
 * @return string Translated message
 */
function getApiTranslation($key, $params = []) {
    // Load translations based on session language or default to English
    $lang = isset($_SESSION['language']) ? $_SESSION['language'] : 'en';
    $translations = loadTranslations($lang);
    $apiTranslations = $translations['api_validation'] ?? [];
    
    $message = $apiTranslations[$key] ?? $key;
    
    // Replace parameters
    foreach ($params as $param => $value) {
        $message = str_replace('{' . $param . '}', $value, $message);
    }
    
    return $message;
}

/**
 * Send standardized API error response
 * @param string $key Translation key
 * @param int $statusCode HTTP status code
 * @param array $params Parameters for translation
 */
function sendApiError($key, $statusCode = 400, $params = []) {
    http_response_code($statusCode);
    $message = getApiTranslation($key, $params);
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send standardized API success response
 * @param mixed $data Response data
 * @param string|null $message Optional message (can use translation key)
 * @param int $statusCode HTTP status code
 */
function sendApiSuccess($data = null, $message = null, $statusCode = 200) {
    http_response_code($statusCode);
    $response = ['success' => true];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($message !== null) {
        // Try to get translation if it looks like a translation key
        if (strpos($message, ' ') === false && strpos($message, '_') !== false) {
            $translated = getApiTranslation($message);
            if ($translated !== $message) {
                $response['message'] = $translated;
            } else {
                $response['message'] = $message;
            }
        } else {
            $response['message'] = $message;
        }
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

