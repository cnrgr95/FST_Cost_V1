<?php
/**
 * Tours API
 * Handles all CRUD operations for tours
 * Hierarchy: Country -> Region -> City -> Sub Region -> Merchant -> Tour
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
        case 'sub_regions':
            getSubRegions($conn);
            break;
        case 'merchants':
            $sub_region_id = $_GET['sub_region_id'] ?? null;
            getMerchantsBySubRegion($conn, $sub_region_id);
            break;
        case 'tours':
            getTours($conn);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'tour':
            createTour($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'tour':
            updateTour($conn, $data);
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
        case 'tour':
            deleteTour($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get sub regions
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
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Get merchants by sub region
function getMerchantsBySubRegion($conn, $sub_region_id) {
    if (!$sub_region_id) {
        echo json_encode(['success' => false, 'message' => 'sub_region_id is required']);
        return;
    }
    
    $query = "SELECT m.*, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name
              FROM merchants m 
              LEFT JOIN sub_regions sr ON m.sub_region_id = sr.id 
              LEFT JOIN cities c ON sr.city_id = c.id 
              LEFT JOIN regions r ON c.region_id = r.id 
              LEFT JOIN countries co ON r.country_id = co.id
              WHERE m.sub_region_id = $sub_region_id 
              ORDER BY m.name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $merchants = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $merchants]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Get tours
function getTours($conn) {
    $query = "SELECT t.*, m.name as merchant_name, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name
              FROM tours t 
              LEFT JOIN merchants m ON t.merchant_id = m.id 
              LEFT JOIN sub_regions sr ON m.sub_region_id = sr.id 
              LEFT JOIN cities c ON sr.city_id = c.id 
              LEFT JOIN regions r ON c.region_id = r.id 
              LEFT JOIN countries co ON r.country_id = co.id
              ORDER BY t.sejour_tour_code, t.name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $tours = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $tours]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Create tour
function createTour($conn, $data) {
    $sejour_tour_code = strtoupper(pg_escape_string($conn, $data['sejour_tour_code'] ?? ''));
    $name = pg_escape_string($conn, $data['name']);
    
    // Check if sejour tour code already exists
    if (!empty($sejour_tour_code)) {
        $checkQuery = "SELECT id FROM tours WHERE sejour_tour_code = '$sejour_tour_code'";
        $checkResult = pg_query($conn, $checkQuery);
        if ($checkResult && pg_num_rows($checkResult) > 0) {
            echo json_encode(['success' => false, 'message' => 'This Sejour Tour Code already exists']);
            return;
        }
    }
    
    $sub_region_id = $data['sub_region_id'];
    $merchant_id = $data['merchant_id'];
    
    $sejour_tour_code_val = !empty($sejour_tour_code) ? "'$sejour_tour_code'" : 'NULL';
    
    $query = "INSERT INTO tours (sejour_tour_code, name, sub_region_id, merchant_id, created_at) 
              VALUES ($sejour_tour_code_val, '$name', $sub_region_id, $merchant_id, NOW()) 
              RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Update tour
function updateTour($conn, $data) {
    $id = $data['id'];
    $sejour_tour_code = strtoupper(pg_escape_string($conn, $data['sejour_tour_code'] ?? ''));
    $name = pg_escape_string($conn, $data['name']);
    $sub_region_id = $data['sub_region_id'];
    $merchant_id = $data['merchant_id'];
    
    // Check if sejour tour code already exists for another tour
    if (!empty($sejour_tour_code)) {
        $checkQuery = "SELECT id FROM tours WHERE sejour_tour_code = '$sejour_tour_code' AND id != $id";
        $checkResult = pg_query($conn, $checkQuery);
        if ($checkResult && pg_num_rows($checkResult) > 0) {
            echo json_encode(['success' => false, 'message' => 'This Sejour Tour Code already exists']);
            return;
        }
    }
    
    $sejour_tour_code_val = !empty($sejour_tour_code) ? "'$sejour_tour_code'" : 'NULL';
    
    $query = "UPDATE tours SET 
                sejour_tour_code = $sejour_tour_code_val,
                name = '$name', 
                sub_region_id = $sub_region_id, 
                merchant_id = $merchant_id, 
                updated_at = NOW() 
              WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Delete tour
function deleteTour($conn, $id) {
    $query = "DELETE FROM tours WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}
?>

