<?php
/**
 * Languages API
 * Handles all CRUD operations for language files
 */

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

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
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($action, $langDir) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'language') {
        createLanguage($langDir, $data);
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

// Get all languages
function getLanguages($langDir) {
    $languages = [];
    
    if (is_dir($langDir)) {
        $files = scandir($langDir);
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                $code = pathinfo($file, PATHINFO_FILENAME);
                $filePath = $langDir . $file;
                $content = file_get_contents($filePath);
                $data = json_decode($content, true);
                
                $languages[] = [
                    'code' => $code,
                    'name' => $data['languages'][$code] ?? ucfirst($code),
                    'file' => $file
                ];
            }
        }
    }
    
    echo json_encode(['success' => true, 'data' => $languages]);
}

// Create new language file
function createLanguage($langDir, $data) {
    $code = strtolower($data['code'] ?? '');
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
    $code = strtolower($data['code'] ?? '');
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
    $code = strtolower($code);
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
    $code = strtolower($code);
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
    $code = strtolower($code);
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
