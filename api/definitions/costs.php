<?php
/**
 * Costs API
 * Handles all CRUD operations for costs
 * Linked to Countries
 */

// Start output buffering to catch any errors
ob_start();

// Define API_REQUEST before loading config to prevent error display
define('API_REQUEST', true);

// Disable error display for API requests (errors will still be logged)
ini_set('display_errors', 0);
error_reporting(E_ALL); // Still log errors but don't display

session_start();
header('Content-Type: application/json; charset=utf-8');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Load central configuration
require_once __DIR__ . '/../../config.php';

// Load security helpers for CSRF protection
require_once __DIR__ . '/../../includes/security.php';

// Clear any output that might have been generated
ob_end_clean();

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

// Require CSRF token for state-changing requests
if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
    requireCsrfToken();
}

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
    // Always close database connection
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'costs':
            getCosts($conn);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'cost':
            createCost($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'cost':
            updateCost($conn, $data);
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
        case 'cost':
            deleteCost($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get costs
function getCosts($conn) {
    $query = "SELECT * FROM costs ORDER BY created_at DESC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $costs = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $costs]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Create cost
function createCost($conn, $data) {
    try {
        // Generate automatic cost_code if not provided
        if (empty($data['cost_code'])) {
            $query_seq = "SELECT COALESCE(MAX(CAST(SUBSTRING(cost_code FROM 'FST-([0-9]+)') AS INTEGER)), 0) + 1 as next_num FROM costs WHERE cost_code LIKE 'FST-%'";
            $result_seq = pg_query($conn, $query_seq);
            $row_seq = pg_fetch_assoc($result_seq);
            $next_num = $row_seq['next_num'];
            $cost_code = sprintf('FST-%05d', $next_num);
        } else {
            $cost_code = pg_escape_string($conn, $data['cost_code']);
        }
        
        $cost_name = pg_escape_string($conn, $data['cost_name'] ?? '');
        
        if (empty($cost_name)) {
            echo json_encode(['success' => false, 'message' => 'Cost name is required']);
            return;
        }
        
        // Use parameterized query to prevent SQL injection
        $query = "INSERT INTO costs (cost_code, cost_name, created_at) 
                  VALUES ($1, $2, NOW()) 
                  RETURNING id, cost_code";
        $result = pg_query_params($conn, $query, [$cost_code, $cost_name]);
        
        if ($result) {
            $row = pg_fetch_assoc($result);
            echo json_encode(['success' => true, 'id' => $row['id'], 'cost_code' => $row['cost_code']]);
        } else {
            $error = getDbErrorMessage($conn);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $error]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

// Update cost
function updateCost($conn, $data) {
    $id = (int)$data['id'];
    $cost_code = pg_escape_string($conn, $data['cost_code'] ?? '');
    $cost_name = pg_escape_string($conn, $data['cost_name'] ?? '');
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE costs SET 
                cost_code = $1, 
                cost_name = $2,
                updated_at = NOW() 
              WHERE id = $3";
    $result = pg_query_params($conn, $query, [$cost_code, $cost_name, $id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Delete cost
function deleteCost($conn, $id) {
    $id = (int)$id;
    $query = "DELETE FROM costs WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}
?>

