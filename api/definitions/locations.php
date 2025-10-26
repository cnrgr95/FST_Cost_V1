<?php
/**
 * Locations API
 * Handles all CRUD operations for locations (countries, regions, cities)
 */

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Database configuration (inline to avoid include issues)
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
            $country_id = $_GET['country_id'] ?? null;
            getRegions($conn, $country_id);
            break;
        case 'cities':
            $region_id = $_GET['region_id'] ?? null;
            getCities($conn, $region_id);
            break;
        case 'sub_regions':
            $city_id = $_GET['city_id'] ?? null;
            getSubRegions($conn, $city_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'country':
            createCountry($conn, $data);
            break;
        case 'region':
            createRegion($conn, $data);
            break;
        case 'city':
            createCity($conn, $data);
            break;
        case 'sub_region':
            createSubRegion($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'country':
            updateCountry($conn, $data);
            break;
        case 'region':
            updateRegion($conn, $data);
            break;
        case 'city':
            updateCity($conn, $data);
            break;
        case 'sub_region':
            updateSubRegion($conn, $data);
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
        case 'country':
            deleteCountry($conn, $id);
            break;
        case 'region':
            deleteRegion($conn, $id);
            break;
        case 'city':
            deleteCity($conn, $id);
            break;
        case 'sub_region':
            deleteSubRegion($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Country functions
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

function createCountry($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $code = pg_escape_string($conn, $data['code'] ?? '');
    
    $query = "INSERT INTO countries (name, code, created_at) VALUES ('$name', '$code', NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updateCountry($conn, $data) {
    $id = $data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $code = pg_escape_string($conn, $data['code'] ?? '');
    
    $query = "UPDATE countries SET name = '$name', code = '$code', updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deleteCountry($conn, $id) {
    $query = "DELETE FROM countries WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Region functions
function getRegions($conn, $country_id = null) {
    if ($country_id) {
        $query = "SELECT * FROM regions WHERE country_id = $country_id ORDER BY name ASC";
    } else {
        $query = "SELECT r.*, c.name as country_name FROM regions r LEFT JOIN countries c ON r.country_id = c.id ORDER BY r.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $regions = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $regions]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function createRegion($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $country_id = $data['country_id'];
    
    $query = "INSERT INTO regions (name, country_id, created_at) VALUES ('$name', $country_id, NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updateRegion($conn, $data) {
    $id = $data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $country_id = $data['country_id'];
    
    $query = "UPDATE regions SET name = '$name', country_id = $country_id, updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deleteRegion($conn, $id) {
    $query = "DELETE FROM regions WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// City functions
function getCities($conn, $region_id = null) {
    if ($region_id) {
        $query = "SELECT * FROM cities WHERE region_id = $region_id ORDER BY name ASC";
    } else {
        $query = "SELECT c.*, r.name as region_name, co.name as country_name 
                  FROM cities c 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id 
                  ORDER BY c.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $cities = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $cities]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function createCity($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $region_id = $data['region_id'];
    
    $query = "INSERT INTO cities (name, region_id, created_at) VALUES ('$name', $region_id, NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updateCity($conn, $data) {
    $id = $data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $region_id = $data['region_id'];
    
    $query = "UPDATE cities SET name = '$name', region_id = $region_id, updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deleteCity($conn, $id) {
    $query = "DELETE FROM cities WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Sub Region functions
function getSubRegions($conn, $city_id = null) {
    if ($city_id) {
        $query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM sub_regions sr 
                  LEFT JOIN cities c ON sr.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE sr.city_id = $city_id 
                  ORDER BY sr.name ASC";
    } else {
        $query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM sub_regions sr 
                  LEFT JOIN cities c ON sr.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY sr.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $subRegions = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $subRegions]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function createSubRegion($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $city_id = $data['city_id'];
    
    $query = "INSERT INTO sub_regions (name, city_id, created_at) VALUES ('$name', $city_id, NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updateSubRegion($conn, $data) {
    $id = $data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $city_id = $data['city_id'];
    
    $query = "UPDATE sub_regions SET name = '$name', city_id = $city_id, updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deleteSubRegion($conn, $id) {
    $query = "DELETE FROM sub_regions WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}
?>

