<?php
/**
 * Currencies API
 * Handles all CRUD operations for currencies
 */

// Start output buffering to catch any errors
ob_start();

// Define API_REQUEST before loading config to prevent error display
define('API_REQUEST', true);

// Disable error display for API requests (errors will still be logged)
ini_set('display_errors', 0);
error_reporting(E_ALL);

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

// Ensure output is only JSON
if (ob_get_level() > 0) {
    ob_clean();
}

// Get database connection
try {
    $conn = getDbConnection();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            handleGet($conn, $action);
            break;
        case 'POST':
            handlePost($conn, $action);
            break;
        case 'PUT':
            handlePut($conn, $action);
            break;
        case 'DELETE':
            handleDelete($conn, $action);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'currencies':
            getCurrencies($conn);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'currency':
            createCurrency($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'currency':
            updateCurrency($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// DELETE request handler
function handleDelete($conn, $action) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID is required']);
        return;
    }
    
    switch ($action) {
        case 'currency':
            deleteCurrency($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get currencies
function getCurrencies($conn) {
    $query = "SELECT * FROM currencies ORDER BY code ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $currencies = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $currencies]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Create currency
function createCurrency($conn, $data) {
    $code = strtoupper(pg_escape_string($conn, $data['code'] ?? ''));
    $name = pg_escape_string($conn, $data['name'] ?? '');
    $symbol = pg_escape_string($conn, $data['symbol'] ?? '');
    $is_active = isset($data['is_active']) ? ($data['is_active'] ? 'true' : 'false') : 'true';
    
    if (empty($code) || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Code and name are required']);
        return;
    }
    
    // Check if code already exists
    $checkQuery = "SELECT id FROM currencies WHERE code = '$code'";
    $checkResult = pg_query($conn, $checkQuery);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'Currency code already exists']);
        return;
    }
    
    if (!$checkResult) {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        return;
    }
    
    $symbol_val = empty($symbol) ? 'NULL' : "'$symbol'";
    $query = "INSERT INTO currencies (code, name, symbol, is_active, created_at) 
              VALUES ('$code', '$name', $symbol_val, $is_active, NOW()) RETURNING id";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Update currency
function updateCurrency($conn, $data) {
    $id = (int)$data['id'];
    $code = strtoupper(pg_escape_string($conn, $data['code'] ?? ''));
    $name = pg_escape_string($conn, $data['name'] ?? '');
    $symbol = pg_escape_string($conn, $data['symbol'] ?? '');
    $is_active = isset($data['is_active']) ? ($data['is_active'] ? 'true' : 'false') : 'true';
    
    if (empty($code) || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Code and name are required']);
        return;
    }
    
    // Check if code already exists for another currency
    $checkQuery = "SELECT id FROM currencies WHERE code = '$code' AND id != $id";
    $checkResult = pg_query($conn, $checkQuery);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'Currency code already exists']);
        return;
    }
    
    if (!$checkResult) {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        return;
    }
    
    $symbol_val = empty($symbol) ? 'NULL' : "'$symbol'";
    $query = "UPDATE currencies SET 
                code = '$code',
                name = '$name',
                symbol = $symbol_val,
                is_active = $is_active,
                updated_at = NOW()
              WHERE id = $id";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Delete currency
function deleteCurrency($conn, $id) {
    $id = (int)$id;
    
    // Check if currency is used in contracts
    $checkQuery = "SELECT COUNT(*) as count FROM contracts 
                   WHERE adult_currency = (SELECT code FROM currencies WHERE id = $id)
                   OR child_currency = (SELECT code FROM currencies WHERE id = $id)
                   OR infant_currency = (SELECT code FROM currencies WHERE id = $id)";
    $checkResult = pg_query($conn, $checkQuery);
    
    if (!$checkResult) {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        return;
    }
    
    $row = pg_fetch_assoc($checkResult);
    
    if ($row && $row['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Currency is being used in contracts and cannot be deleted']);
        return;
    }
    
    $query = "DELETE FROM currencies WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}
?>

