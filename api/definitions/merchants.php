<?php
/**
 * Merchants API
 * Handles all CRUD operations for merchants
 * Hierarchy: Country -> Region -> City -> Sub Region -> Merchant
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
    // Always close database connection
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'sub_regions':
            getSubRegions($conn);
            break;
        case 'merchants':
            $sub_region_id = isset($_GET['sub_region_id']) ? (int)$_GET['sub_region_id'] : null;
            getMerchants($conn, $sub_region_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'merchant':
            createMerchant($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'merchant':
            updateMerchant($conn, $data);
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
        case 'merchant':
            deleteMerchant($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get sub regions from locations API
function getSubRegions($conn) {
    $query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name 
              FROM sub_regions sr 
              LEFT JOIN cities c ON sr.city_id = c.id 
              LEFT JOIN regions r ON c.region_id = r.id 
              LEFT JOIN countries co ON r.country_id = co.id 
              ORDER BY sr.name ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $subRegions = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $subRegions]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Merchant functions
function getMerchants($conn, $sub_region_id = null) {
    if ($sub_region_id) {
        $sub_region_id = (int)$sub_region_id;
        $query = "SELECT m.*, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM merchants m 
                  LEFT JOIN sub_regions sr ON m.sub_region_id = sr.id 
                  LEFT JOIN cities c ON sr.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE m.sub_region_id = $sub_region_id 
                  ORDER BY m.name ASC";
    } else {
        $query = "SELECT m.*, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM merchants m 
                  LEFT JOIN sub_regions sr ON m.sub_region_id = sr.id 
                  LEFT JOIN cities c ON sr.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY m.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $merchants = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $merchants]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function createMerchant($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    
    // Check if merchant name already exists
    $checkQuery = "SELECT id FROM merchants WHERE name = '$name'";
    $checkResult = pg_query($conn, $checkQuery);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A merchant with this name already exists']);
        return;
    }
    
    $official_title = pg_escape_string($conn, $data['official_title'] ?? '');
    $sub_region_id = (int)$data['sub_region_id'];
    $authorized_person = pg_escape_string($conn, $data['authorized_person'] ?? '');
    $authorized_email = pg_escape_string($conn, $data['authorized_email'] ?? '');
    $authorized_phone = pg_escape_string($conn, $data['authorized_phone'] ?? '');
    $operasyon_name = pg_escape_string($conn, $data['operasyon_name'] ?? '');
    $operasyon_email = pg_escape_string($conn, $data['operasyon_email'] ?? '');
    $operasyon_phone = pg_escape_string($conn, $data['operasyon_phone'] ?? '');
    $location_url = pg_escape_string($conn, $data['location_url'] ?? '');
    
    $query = "INSERT INTO merchants (name, official_title, sub_region_id, authorized_person, authorized_email, authorized_phone, operasyon_name, operasyon_email, operasyon_phone, location_url, created_at) 
              VALUES ('$name', '$official_title', $sub_region_id, '$authorized_person', '$authorized_email', '$authorized_phone', '$operasyon_name', '$operasyon_email', '$operasyon_phone', '$location_url', NOW()) 
              RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function updateMerchant($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $official_title = pg_escape_string($conn, $data['official_title'] ?? '');
    $sub_region_id = (int)$data['sub_region_id'];
    $authorized_person = pg_escape_string($conn, $data['authorized_person'] ?? '');
    $authorized_email = pg_escape_string($conn, $data['authorized_email'] ?? '');
    $authorized_phone = pg_escape_string($conn, $data['authorized_phone'] ?? '');
    $operasyon_name = pg_escape_string($conn, $data['operasyon_name'] ?? '');
    $operasyon_email = pg_escape_string($conn, $data['operasyon_email'] ?? '');
    $operasyon_phone = pg_escape_string($conn, $data['operasyon_phone'] ?? '');
    $location_url = pg_escape_string($conn, $data['location_url'] ?? '');
    
    $query = "UPDATE merchants SET 
                name = '$name', 
                official_title = '$official_title', 
                sub_region_id = $sub_region_id, 
                authorized_person = '$authorized_person', 
                authorized_email = '$authorized_email', 
                authorized_phone = '$authorized_phone', 
                operasyon_name = '$operasyon_name', 
                operasyon_email = '$operasyon_email', 
                operasyon_phone = '$operasyon_phone', 
                location_url = '$location_url', 
                updated_at = NOW() 
              WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function deleteMerchant($conn, $id) {
    $id = (int)$id;
    // Check if merchant has tours
    $checkQuery = "SELECT COUNT(*) as count FROM tours WHERE merchant_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This merchant cannot be deleted because it has ' . $row['count'] . ' tour(s) associated with it. Please delete all tours first.'
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM merchants WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}
?>

