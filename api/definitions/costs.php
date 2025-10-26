<?php
/**
 * Costs API
 * Handles all CRUD operations for costs
 * Linked to Countries
 */

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Database configuration (inline)
if (!defined('DB_HOST')) {
    define('DB_HOST', 'localhost');
    define('DB_PORT', '5432');
    define('DB_NAME', 'fst_cost_db');
    define('DB_USER', 'postgres');
    define('DB_PASS', '123456789');
}

// Database connection function
if (!function_exists('getDbConnection')) {
    function getDbConnection() {
        $conn = pg_connect("host=" . DB_HOST . " port=" . DB_PORT . " dbname=" . DB_NAME . " user=" . DB_USER . " password=" . DB_PASS);
        if (!$conn) {
            throw new Exception("Database connection failed: " . pg_last_error());
        }
        return $conn;
    }
}

if (!function_exists('closeDbConnection')) {
    function closeDbConnection($conn) {
        if ($conn) {
            pg_close($conn);
        }
    }
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
}

closeDbConnection($conn);

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
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
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
            echo json_encode(['success' => false, 'message' => 'Maliyet adı gereklidir']);
            return;
        }
        
        // First try with all fields NULL
        $query = "INSERT INTO costs (cost_code, cost_name, country_id, region_id, city_id, created_at) 
                  VALUES ('$cost_code', '$cost_name', NULL, NULL, NULL, NOW()) 
                  RETURNING id, cost_code";
        $result = pg_query($conn, $query);
        
        if ($result) {
            $row = pg_fetch_assoc($result);
            echo json_encode(['success' => true, 'id' => $row['id'], 'cost_code' => $row['cost_code']]);
        } else {
            $error = pg_last_error($conn);
            echo json_encode(['success' => false, 'message' => 'Veritabanı hatası: ' . $error]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Hata: ' . $e->getMessage()]);
    }
}

// Update cost
function updateCost($conn, $data) {
    $id = $data['id'];
    $cost_code = pg_escape_string($conn, $data['cost_code'] ?? '');
    $cost_name = pg_escape_string($conn, $data['cost_name'] ?? '');
    
    $query = "UPDATE costs SET 
                cost_code = '$cost_code', 
                cost_name = '$cost_name',
                updated_at = NOW() 
              WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Delete cost
function deleteCost($conn, $id) {
    $query = "DELETE FROM costs WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}
?>

