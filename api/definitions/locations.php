<?php
/**
 * Locations API
 * Handles all CRUD operations for locations (countries, regions, cities)
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
        case 'check_country':
            checkCountryName($conn);
            break;
        case 'check_region':
            checkRegionName($conn);
            break;
        case 'check_city':
            checkCityName($conn);
            break;
        case 'check_sub_region':
            checkSubRegionName($conn);
            break;
        case 'countries':
            getCountries($conn);
            break;
        case 'regions':
            $country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : null;
            getRegions($conn, $country_id);
            break;
        case 'cities':
            $region_id = isset($_GET['region_id']) ? (int)$_GET['region_id'] : null;
            getCities($conn, $region_id);
            break;
        case 'sub_regions':
            $city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function createCountry($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    
    // Check if country name already exists - use parameterized query
    $checkQuery = "SELECT id FROM countries WHERE name = $1";
    $checkResult = pg_query_params($conn, $checkQuery, [$name]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A country with this name already exists']);
        return;
    }
    
    $code = $data['code'] ?? '';
    // local_currency_code is managed from currency-country.php, so it's set to NULL here
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO countries (name, code, local_currency_code, created_at) VALUES ($1, $2, NULL, NOW()) RETURNING id";
    $result = pg_query_params($conn, $query, [$name, $code]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function updateCountry($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $code = pg_escape_string($conn, $data['code'] ?? '');
    
    // use_in_currency is always true - all countries are available for currencies
    // local_currency_code is managed from currency-country.php, so we don't update it here
    // Only update name and code - use parameterized query to prevent SQL injection
    $query = "UPDATE countries SET name = $1, code = $2, updated_at = NOW() WHERE id = $3";
    $result = pg_query_params($conn, $query, [$name, $code, $id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function deleteCountry($conn, $id) {
    $id = (int)$id;
    // Check if country has regions
    $checkQuery = "SELECT COUNT(*) as count FROM regions WHERE country_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This country cannot be deleted because it has ' . $row['count'] . ' region(s) associated with it. Please delete all regions first.'
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM countries WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Region functions
function getRegions($conn, $country_id = null) {
    if ($country_id) {
        $country_id = (int)$country_id;
        $query = "SELECT * FROM regions WHERE country_id = $country_id ORDER BY name ASC";
    } else {
        $query = "SELECT r.*, c.name as country_name FROM regions r LEFT JOIN countries c ON r.country_id = c.id ORDER BY r.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $regions = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $regions]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function createRegion($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $country_id = (int)$data['country_id'];
    
    // Check if region name already exists in the same country - use parameterized query
    $checkQuery = "SELECT id FROM regions WHERE name = $1 AND country_id = $2";
    $checkResult = pg_query_params($conn, $checkQuery, [$name, $country_id]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A region with this name already exists in this country']);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO regions (name, country_id, created_at) VALUES ($1, $2, NOW()) RETURNING id";
    $result = pg_query_params($conn, $query, [$name, $country_id]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function updateRegion($conn, $data) {
    $id = (int)$data['id'];
    $name = $data['name'];
    $country_id = (int)$data['country_id'];
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE regions SET name = $1, country_id = $2, updated_at = NOW() WHERE id = $3";
    $result = pg_query_params($conn, $query, [$name, $country_id, $id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function deleteRegion($conn, $id) {
    $id = (int)$id;
    // Check if region has cities
    $checkQuery = "SELECT COUNT(*) as count FROM cities WHERE region_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This region cannot be deleted because it has ' . $row['count'] . ' city/cities associated with it. Please delete all cities first.'
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM regions WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// City functions
function getCities($conn, $region_id = null) {
    if ($region_id) {
        $region_id = (int)$region_id;
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function createCity($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $region_id = (int)$data['region_id'];
    
    // Check if city name already exists in the same region - use parameterized query
    $checkQuery = "SELECT id FROM cities WHERE name = $1 AND region_id = $2";
    $checkResult = pg_query_params($conn, $checkQuery, [$name, $region_id]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A city with this name already exists in this region']);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO cities (name, region_id, created_at) VALUES ($1, $2, NOW()) RETURNING id";
    $result = pg_query_params($conn, $query, [$name, $region_id]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function updateCity($conn, $data) {
    $id = (int)$data['id'];
    $name = $data['name'];
    $region_id = (int)$data['region_id'];
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE cities SET name = $1, region_id = $2, updated_at = NOW() WHERE id = $3";
    $result = pg_query_params($conn, $query, [$name, $region_id, $id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function deleteCity($conn, $id) {
    $id = (int)$id;
    // Check if city has sub regions
    $checkQuery = "SELECT COUNT(*) as count FROM sub_regions WHERE city_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This city cannot be deleted because it has ' . $row['count'] . ' sub region(s) associated with it. Please delete all sub regions first.'
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM cities WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Sub Region functions
function getSubRegions($conn, $city_id = null) {
    if ($city_id) {
        $city_id = (int)$city_id;
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function createSubRegion($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    
    // Check if sub region name already exists in the same city - use parameterized query
    $checkQuery = "SELECT id FROM sub_regions WHERE name = $1 AND city_id = $2";
    $checkResult = pg_query_params($conn, $checkQuery, [$name, $city_id]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A sub region with this name already exists in this city']);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO sub_regions (name, city_id, created_at) VALUES ($1, $2, NOW()) RETURNING id";
    $result = pg_query_params($conn, $query, [$name, $city_id]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function updateSubRegion($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE sub_regions SET name = $1, city_id = $2, updated_at = NOW() WHERE id = $3";
    $result = pg_query_params($conn, $query, [$name, $city_id, $id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function deleteSubRegion($conn, $id) {
    $id = (int)$id;
    // Check if sub region has merchants
    $checkQuery = "SELECT COUNT(*) as count FROM merchants WHERE sub_region_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This sub region cannot be deleted because it has ' . $row['count'] . ' merchant(s) associated with it. Please delete all merchants first.'
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM sub_regions WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Check functions
function checkCountryName($conn) {
    $name = $_GET['name'] ?? '';
    $id = $_GET['id'] ?? null;
    
    // Use parameterized query to prevent SQL injection
    if ($id) {
        $id = (int)$id;
        $query = "SELECT id FROM countries WHERE name = $1 AND id != $2";
        $result = pg_query_params($conn, $query, [$name, $id]);
    } else {
        $query = "SELECT id FROM countries WHERE name = $1";
        $result = pg_query_params($conn, $query, [$name]);
    }
    if ($result) {
        $exists = pg_num_rows($result) > 0;
        echo json_encode(['success' => true, 'exists' => $exists]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function checkRegionName($conn) {
    $name = $_GET['name'] ?? '';
    $country_id = $_GET['country_id'] ?? null;
    $id = $_GET['id'] ?? null;
    
    if (!$country_id) {
        echo json_encode(['success' => false, 'message' => 'country_id is required']);
        return;
    }
    
    $country_id = (int)$country_id;
    
    // Use parameterized query to prevent SQL injection
    if ($id) {
        $id = (int)$id;
        $query = "SELECT id FROM regions WHERE name = $1 AND country_id = $2 AND id != $3";
        $result = pg_query_params($conn, $query, [$name, $country_id, $id]);
    } else {
        $query = "SELECT id FROM regions WHERE name = $1 AND country_id = $2";
        $result = pg_query_params($conn, $query, [$name, $country_id]);
    }
    if ($result) {
        $exists = pg_num_rows($result) > 0;
        echo json_encode(['success' => true, 'exists' => $exists]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function checkCityName($conn) {
    $name = $_GET['name'] ?? '';
    $region_id = $_GET['region_id'] ?? null;
    $id = $_GET['id'] ?? null;
    
    if (!$region_id) {
        echo json_encode(['success' => false, 'message' => 'region_id is required']);
        return;
    }
    
    $region_id = (int)$region_id;
    
    // Use parameterized query to prevent SQL injection
    if ($id) {
        $id = (int)$id;
        $query = "SELECT id FROM cities WHERE name = $1 AND region_id = $2 AND id != $3";
        $result = pg_query_params($conn, $query, [$name, $region_id, $id]);
    } else {
        $query = "SELECT id FROM cities WHERE name = $1 AND region_id = $2";
        $result = pg_query_params($conn, $query, [$name, $region_id]);
    }
    if ($result) {
        $exists = pg_num_rows($result) > 0;
        echo json_encode(['success' => true, 'exists' => $exists]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function checkSubRegionName($conn) {
    $name = $_GET['name'] ?? '';
    $city_id = $_GET['city_id'] ?? null;
    $id = $_GET['id'] ?? null;
    
    if (!$city_id) {
        echo json_encode(['success' => false, 'message' => 'city_id is required']);
        return;
    }
    
    $city_id = (int)$city_id;
    
    // Use parameterized query to prevent SQL injection
    if ($id) {
        $id = (int)$id;
        $query = "SELECT id FROM sub_regions WHERE name = $1 AND city_id = $2 AND id != $3";
        $result = pg_query_params($conn, $query, [$name, $city_id, $id]);
    } else {
        $query = "SELECT id FROM sub_regions WHERE name = $1 AND city_id = $2";
        $result = pg_query_params($conn, $query, [$name, $city_id]);
    }
    if ($result) {
        $exists = pg_num_rows($result) > 0;
        echo json_encode(['success' => true, 'exists' => $exists]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}
?>

