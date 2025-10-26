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
        case 'countries':
            getCountries($conn);
            break;
        case 'regions':
            getRegions($conn);
            break;
        case 'cities':
            getCities($conn);
            break;
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

// Get countries
function getCountries($conn) {
    $query = "SELECT * FROM countries ORDER BY name ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $countries = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $countries]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Get costs
function getCosts($conn) {
    $query = "SELECT c.*, 
                     co.name as country_name, co.code as country_code,
                     r.name as region_name,
                     ci.name as city_name
              FROM costs c 
              LEFT JOIN countries co ON c.country_id = co.id 
              LEFT JOIN regions r ON c.region_id = r.id
              LEFT JOIN cities ci ON c.city_id = ci.id
              ORDER BY c.created_at DESC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $costs = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $costs]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Get regions
function getRegions($conn) {
    $country_id = $_GET['country_id'] ?? null;
    
    if ($country_id) {
        $query = "SELECT * FROM regions WHERE country_id = $country_id ORDER BY name ASC";
    } else {
        $query = "SELECT * FROM regions ORDER BY name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $regions = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $regions]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Get cities
function getCities($conn) {
    $region_id = $_GET['region_id'] ?? null;
    
    if ($region_id) {
        $query = "SELECT * FROM cities WHERE region_id = $region_id ORDER BY name ASC";
    } else {
        $query = "SELECT * FROM cities ORDER BY name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $cities = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $cities]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Create cost
function createCost($conn, $data) {
    $country_id = !empty($data['country_id']) ? $data['country_id'] : null;
    $region_id = !empty($data['region_id']) ? $data['region_id'] : null;
    $city_id = !empty($data['city_id']) ? $data['city_id'] : null;
    
    // Check for duplicate in the same location scope
    $checkWhere = [];
    $checkParams = [];
    
    if ($country_id) {
        $checkWhere[] = "country_id = $country_id AND region_id IS NULL AND city_id IS NULL";
    } elseif ($region_id) {
        $checkWhere[] = "country_id IS NULL AND region_id = $region_id AND city_id IS NULL";
    } elseif ($city_id) {
        $checkWhere[] = "country_id IS NULL AND region_id IS NULL AND city_id = $city_id";
    }
    
    if (!empty($checkWhere)) {
        $checkQuery = "SELECT id FROM costs WHERE " . implode(' OR ', $checkWhere);
        $checkResult = pg_query($conn, $checkQuery);
        if ($checkResult && pg_num_rows($checkResult) > 0) {
            echo json_encode(['success' => false, 'message' => 'A cost already exists for this location']);
            return;
        }
    }
    
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
    $country_id = !empty($data['country_id']) ? $data['country_id'] : 'NULL';
    $region_id = !empty($data['region_id']) ? $data['region_id'] : 'NULL';
    $city_id = !empty($data['city_id']) ? $data['city_id'] : 'NULL';
    
    $query = "INSERT INTO costs (cost_code, cost_name, country_id, region_id, city_id, created_at) 
              VALUES ('$cost_code', '$cost_name', $country_id, $region_id, $city_id, NOW()) 
              RETURNING id, cost_code";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id'], 'cost_code' => $row['cost_code']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Update cost
function updateCost($conn, $data) {
    $id = $data['id'];
    $cost_code = pg_escape_string($conn, $data['cost_code'] ?? '');
    $cost_name = pg_escape_string($conn, $data['cost_name'] ?? '');
    $country_id = !empty($data['country_id']) ? $data['country_id'] : 'NULL';
    $region_id = !empty($data['region_id']) ? $data['region_id'] : 'NULL';
    $city_id = !empty($data['city_id']) ? $data['city_id'] : 'NULL';
    
    $query = "UPDATE costs SET 
                cost_code = '$cost_code', 
                cost_name = '$cost_name',
                country_id = $country_id,
                region_id = $region_id,
                city_id = $city_id,
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

