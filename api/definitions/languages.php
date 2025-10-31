<?php
/**
 * Languages API
 * Handles all CRUD operations for language files
 */

// Start output buffering to catch any errors
ob_start();

// Define API_REQUEST before loading config to prevent error display
define('API_REQUEST', true);

// Disable error display for API requests (errors will still be logged)
ini_set('display_errors', 0);
error_reporting(E_ALL); // Still log errors but don't display

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Load central configuration
require_once __DIR__ . '/../../config.php';

// Clear any output that might have been generated
ob_end_clean();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Languages directory
$langDir = __DIR__ . '/../../translations/';

try {
    switch ($method) {
        case 'GET':
            handleGet($action, $langDir);
            break;
        case 'POST':
            handlePost($action, $langDir);
            break;
        case 'PUT':
            handlePut($action, $langDir);
            break;
        case 'DELETE':
            handleDelete($action, $langDir);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// GET request handler
function handleGet($action, $langDir) {
    if ($action === 'languages') {
        getLanguages($langDir);
    } elseif ($action === 'translation') {
        $code = $_GET['code'] ?? null;
        if ($code) {
            getTranslation($langDir, $code);
        } else {
            echo json_encode(['success' => false, 'message' => 'Language code is required']);
        }
    } elseif ($action === 'language_order') {
        getLanguageOrder($langDir);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($action, $langDir) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'language') {
        createLanguage($langDir, $data);
    } elseif ($action === 'language_order') {
        saveLanguageOrder($langDir, $data);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($action, $langDir) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'language') {
        updateLanguage($langDir, $data);
    } elseif ($action === 'translation') {
        $code = $_GET['code'] ?? null;
        if ($code && $data) {
            updateTranslation($langDir, $code, $data);
        } else {
            echo json_encode(['success' => false, 'message' => 'Language code and data are required']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// DELETE request handler
function handleDelete($action, $langDir) {
    $code = $_GET['code'] ?? null;
    
    if ($action === 'language' && $code) {
        deleteLanguage($langDir, $code);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action or missing code']);
    }
}

// Get language order
function getLanguageOrder($langDir) {
    $orderFile = $langDir . 'language_order.json';
    $order = [];
    
    if (file_exists($orderFile)) {
        $content = @file_get_contents($orderFile);
        if ($content !== false) {
            $data = @json_decode($content, true);
            if ($data !== null && isset($data['order']) && is_array($data['order'])) {
                $order = $data['order'];
            }
        }
    }
    
    echo json_encode(['success' => true, 'data' => $order]);
}

// Save language order
function saveLanguageOrder($langDir, $data) {
    $order = $data['order'] ?? [];
    
    if (!is_array($order)) {
        echo json_encode(['success' => false, 'message' => 'Invalid order data']);
        return;
    }
    
    $orderFile = $langDir . 'language_order.json';
    $orderData = ['order' => $order];
    
    $result = @file_put_contents($orderFile, json_encode($orderData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result !== false) {
        echo json_encode(['success' => true, 'message' => 'Language order saved successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save language order']);
    }
}

// Get all languages (sorted by order)
function getLanguages($langDir) {
    $languages = [];
    $languageMap = [];
    
    // First, collect all languages
    if (is_dir($langDir)) {
        $files = scandir($langDir);
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'json' && $file !== 'language_order.json') {
                $code = pathinfo($file, PATHINFO_FILENAME);
                $filePath = $langDir . $file;
                $content = file_get_contents($filePath);
                $data = json_decode($content, true);
                
                $languageMap[$code] = [
                    'code' => $code,
                    'name' => $data['languages'][$code] ?? ucfirst($code),
                    'file' => $file
                ];
            }
        }
    }
    
    // Get order
    $orderFile = $langDir . 'language_order.json';
    $order = [];
    if (file_exists($orderFile)) {
        $content = @file_get_contents($orderFile);
        if ($content !== false) {
            $data = @json_decode($content, true);
            if ($data !== null && isset($data['order']) && is_array($data['order'])) {
                $order = $data['order'];
            }
        }
    }
    
    // Add languages in order
    foreach ($order as $code) {
        if (isset($languageMap[$code])) {
            $languages[] = $languageMap[$code];
            unset($languageMap[$code]);
        }
    }
    
    // Add remaining languages (not in order file)
    foreach ($languageMap as $lang) {
        $languages[] = $lang;
    }
    
    echo json_encode(['success' => true, 'data' => $languages]);
}

// Create new language file
function createLanguage($langDir, $data) {
    $code = strtolower(preg_replace('/[^a-z0-9]/', '', $data['code'] ?? '')); // Sanitize: only allow letters and numbers
    $name = $data['name'] ?? '';
    
    if (empty($code)) {
        echo json_encode(['success' => false, 'message' => 'Language code is required']);
        return;
    }
    
    $filePath = $langDir . $code . '.json';
    
    if (file_exists($filePath)) {
        echo json_encode(['success' => false, 'message' => 'Language file already exists']);
        return;
    }
    
    // Load base language (use en.json as template)
    $baseFilePath = $langDir . 'en.json';
    if (!file_exists($baseFilePath)) {
        echo json_encode(['success' => false, 'message' => 'Base language file not found']);
        return;
    }
    
    $baseContent = file_get_contents($baseFilePath);
    $baseData = json_decode($baseContent, true);
    
    // Add language name
    if (isset($baseData['languages'])) {
        $baseData['languages'][$code] = $name;
    }
    
    // Write new language file
    $result = file_put_contents($filePath, json_encode($baseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result !== false) {
        echo json_encode(['success' => true, 'message' => 'Language created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create language file']);
    }
}

// Update language name
function updateLanguage($langDir, $data) {
    $code = strtolower(preg_replace('/[^a-z0-9]/', '', $data['code'] ?? '')); // Sanitize: only allow letters and numbers
    $name = $data['name'] ?? '';
    
    if (empty($code)) {
        echo json_encode(['success' => false, 'message' => 'Language code is required']);
        return;
    }
    
    $filePath = $langDir . $code . '.json';
    
    if (!file_exists($filePath)) {
        echo json_encode(['success' => false, 'message' => 'Language file not found']);
        return;
    }
    
    $content = file_get_contents($filePath);
    $langData = json_decode($content, true);
    
    if (!is_array($langData)) {
        echo json_encode(['success' => false, 'message' => 'Invalid language file']);
        return;
    }
    
    // Update language name
    if (isset($langData['languages'])) {
        $langData['languages'][$code] = $name;
    }
    
    $result = file_put_contents($filePath, json_encode($langData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result !== false) {
        echo json_encode(['success' => true, 'message' => 'Language updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update language file']);
    }
}

// Delete language file
function deleteLanguage($langDir, $code) {
    $code = strtolower(preg_replace('/[^a-z0-9]/', '', $code)); // Sanitize: only allow letters and numbers
    $filePath = $langDir . $code . '.json';
    
    // Prevent deleting English as it's the base language
    if ($code === 'en') {
        echo json_encode(['success' => false, 'message' => 'Cannot delete the base language']);
        return;
    }
    
    if (!file_exists($filePath)) {
        echo json_encode(['success' => false, 'message' => 'Language file not found']);
        return;
    }
    
    $result = unlink($filePath);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Language deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete language file']);
    }
}

// Get translation content for a language
function getTranslation($langDir, $code) {
    $code = strtolower(preg_replace('/[^a-z0-9]/', '', $code)); // Sanitize: only allow letters and numbers
    $filePath = $langDir . $code . '.json';
    
    if (!file_exists($filePath)) {
        echo json_encode(['success' => false, 'message' => 'Language file not found']);
        return;
    }
    
    $content = file_get_contents($filePath);
    $data = json_decode($content, true);
    
    if ($data === null) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON in language file']);
        return;
    }
    
    echo json_encode(['success' => true, 'data' => $data]);
}

// Update translation content for a language
function updateTranslation($langDir, $code, $data) {
    $code = strtolower(preg_replace('/[^a-z0-9]/', '', $code)); // Sanitize: only allow letters and numbers
    $filePath = $langDir . $code . '.json';
    
    if (!file_exists($filePath)) {
        echo json_encode(['success' => false, 'message' => 'Language file not found']);
        return;
    }
    
    // Validate data is an array
    if (!is_array($data)) {
        echo json_encode(['success' => false, 'message' => 'Invalid data format']);
        return;
    }
    
    // Preserve languages section and update name if needed
    $existingContent = file_get_contents($filePath);
    $existingData = json_decode($existingContent, true);
    
    if (isset($existingData['languages']) && isset($data['languages'])) {
        $data['languages'] = $existingData['languages'];
    }
    
    // Preserve version and app info
    if (isset($existingData['version'])) {
        $data['version'] = $existingData['version'];
    }
    if (isset($existingData['app'])) {
        $data['app'] = $existingData['app'];
    }
    
    $result = file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result !== false) {
        echo json_encode(['success' => true, 'message' => 'Translations updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update translations']);
    }
}
?>
