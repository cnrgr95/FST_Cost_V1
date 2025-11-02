<?php
/**
 * Tours API
 * Handles all CRUD operations for tours
 * Hierarchy: Country -> Region -> City -> Sub Region -> Merchant -> Tour
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

// Load API helper for translations
require_once __DIR__ . '/../../includes/ApiHelper.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    ob_end_clean();
    sendApiError('unauthorized', 401);
}

// Load central configuration with error handling
try {
    require_once __DIR__ . '/../../config.php';
    // Load security helpers for CSRF protection
    require_once __DIR__ . '/../../includes/security.php';
    
    // Initialize CSRF token in session if not exists
    generateCsrfToken();
    } catch (Throwable $e) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    if (!function_exists('sendApiError')) {
        require_once __DIR__ . '/../../includes/ApiHelper.php';
    }
    $msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : getApiTranslation('error_occurred');
    echo json_encode(['success' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// Clear any output that might have been generated
if (ob_get_level() > 0) {
    ob_end_clean();
}

// Ensure JSON header is set
header('Content-Type: application/json; charset=utf-8');

// Get database connection
try {
    if (!function_exists('getDbConnection')) {
        throw new Exception('getDbConnection function not found');
    }
    $conn = getDbConnection();
    if (!$conn) {
        throw new Exception('Database connection returned null');
    }
} catch (Throwable $e) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    $msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() : 'Database connection failed';
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Require CSRF token for state-changing requests
if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE' || $method === 'PATCH') {
    // Always regenerate token after validation to prevent expiration
    requireCsrfToken();
    // Regenerate token for next request
    generateCsrfToken();
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
            sendApiError('invalid_request_method', 405);
    }
} catch (Exception $e) {
    error_log("API Error in tours.php: " . $e->getMessage());
    $message = APP_DEBUG ? $e->getMessage() : getApiTranslation('error_occurred');
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
} finally {
    // Always close database connection
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
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
        case 'merchants':
            $sub_region_id = isset($_GET['sub_region_id']) ? (int)$_GET['sub_region_id'] : null;
            getMerchantsBySubRegion($conn, $sub_region_id);
            break;
        case 'tours':
            getTours($conn);
            break;
        case 'vehicle_contracts':
            getVehicleContracts($conn);
            break;
        case 'contract_routes':
            $contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : null;
            getContractRoutes($conn, $contract_id);
            break;
        case 'tour_routes':
            $tour_id = isset($_GET['tour_id']) ? (int)$_GET['tour_id'] : null;
            getTourRoutes($conn, $tour_id);
            break;
        default:
            sendApiError('invalid_action', 400);
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
            sendApiError('invalid_action', 400);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'tour':
            updateTour($conn, $data);
            break;
        case 'link_contract':
            linkTourContract($conn, $data);
            break;
        case 'save_tour_routes':
            saveTourRoutes($conn, $data['tour_id'], $data['routes'] ?? []);
            break;
        default:
            sendApiError('invalid_action', 400);
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
            sendApiError('invalid_action', 400);
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get regions
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

// Get cities
function getCities($conn, $region_id = null) {
    if ($region_id) {
        $region_id = (int)$region_id;
        $query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name 
                  FROM cities c 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id 
                  WHERE c.region_id = $region_id
                  ORDER BY c.name ASC";
    } else {
        $query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name 
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

// Get sub regions
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

// Get merchants by sub region
function getMerchantsBySubRegion($conn, $sub_region_id) {
    if (!$sub_region_id) {
        echo json_encode(['success' => false, 'message' => 'sub_region_id is required']);
        return;
    }
    
    $sub_region_id = (int)$sub_region_id;
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get tours
function getTours($conn) {
    $query = "SELECT t.*, 
                     t.country_id, t.region_id, t.city_id,
                     co.name as country_name, 
                     r.name as region_name, 
                     c.name as city_name
              FROM tours t 
              LEFT JOIN countries co ON t.country_id = co.id 
              LEFT JOIN regions r ON t.region_id = r.id 
              LEFT JOIN cities c ON t.city_id = c.id
              ORDER BY t.sejour_tour_code, t.name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $tours = pg_fetch_all($result) ?: [];
        
        // Get sub regions for each tour
        foreach ($tours as &$tour) {
            $tour_id = $tour['id'];
            $subRegionsQuery = "SELECT tsr.sub_region_id, sr.name as sub_region_name
                              FROM tour_sub_regions tsr
                              LEFT JOIN sub_regions sr ON tsr.sub_region_id = sr.id
                              WHERE tsr.tour_id = $tour_id";
            $subRegionsResult = pg_query($conn, $subRegionsQuery);
            if ($subRegionsResult) {
                $subRegions = pg_fetch_all($subRegionsResult) ?: [];
                $tour['sub_region_ids'] = array_column($subRegions, 'sub_region_id');
            } else {
                $tour['sub_region_ids'] = [];
            }
        }
        
        echo json_encode(['success' => true, 'data' => $tours ?: []]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Create tour
function createTour($conn, $data) {
    $sejour_tour_code = !empty($data['sejour_tour_code']) ? strtoupper(trim($data['sejour_tour_code'])) : null;
    $name = trim($data['name'] ?? '');
    
    // Validate required fields
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Tour name is required']);
        return;
    }
    
    if (empty($sejour_tour_code)) {
        echo json_encode(['success' => false, 'message' => 'Sejour Tour Code is required']);
        return;
    }
    
    // Check if sejour tour code already exists
    $checkCodeQuery = "SELECT id FROM tours WHERE sejour_tour_code = $1";
    $checkCodeResult = pg_query_params($conn, $checkCodeQuery, [$sejour_tour_code]);
    if ($checkCodeResult && pg_num_rows($checkCodeResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A tour with this Sejour Tour Code already exists']);
        return;
    }
    
    // Check if tour name already exists
    $checkNameQuery = "SELECT id FROM tours WHERE LOWER(name) = LOWER($1)";
    $checkNameResult = pg_query_params($conn, $checkNameQuery, [$name]);
    if ($checkNameResult && pg_num_rows($checkNameResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A tour with this name already exists']);
        return;
    }
    
    // Get location IDs
    $country_id = isset($data['country_id']) && !empty($data['country_id']) ? (int)$data['country_id'] : null;
    $region_id = isset($data['region_id']) && !empty($data['region_id']) ? (int)$data['region_id'] : null;
    $city_id = isset($data['city_id']) && !empty($data['city_id']) ? (int)$data['city_id'] : null;
    
    // Validate required fields
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Tour name is required']);
        return;
    }
    
    if (!$country_id || !$region_id || !$city_id) {
        echo json_encode(['success' => false, 'message' => 'Country, Region, and City are required']);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO tours (sejour_tour_code, name, country_id, region_id, city_id, created_at) 
              VALUES ($1, $2, $3, $4, $5, NOW()) 
              RETURNING id";
    $result = pg_query_params($conn, $query, [
        $sejour_tour_code,
        $name,
        $country_id,
        $region_id,
        $city_id
    ]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        $tour_id = $row['id'];
        
        echo json_encode(['success' => true, 'id' => $tour_id]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Update tour
function updateTour($conn, $data) {
    $id = (int)$data['id'];
    $sejour_tour_code = !empty($data['sejour_tour_code']) ? strtoupper(trim($data['sejour_tour_code'])) : null;
    $name = trim($data['name'] ?? '');
    
    // Validate required fields
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Tour name is required']);
        return;
    }
    
    if (empty($sejour_tour_code)) {
        echo json_encode(['success' => false, 'message' => 'Sejour Tour Code is required']);
        return;
    }
    
    // Check if sejour tour code already exists for another tour
    $checkCodeQuery = "SELECT id FROM tours WHERE sejour_tour_code = $1 AND id != $2";
    $checkCodeResult = pg_query_params($conn, $checkCodeQuery, [$sejour_tour_code, $id]);
    if ($checkCodeResult && pg_num_rows($checkCodeResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A tour with this Sejour Tour Code already exists']);
        return;
    }
    
    // Check if tour name already exists for another tour
    $checkNameQuery = "SELECT id FROM tours WHERE LOWER(name) = LOWER($1) AND id != $2";
    $checkNameResult = pg_query_params($conn, $checkNameQuery, [$name, $id]);
    if ($checkNameResult && pg_num_rows($checkNameResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A tour with this name already exists']);
        return;
    }
    
    // Get location IDs
    $country_id = isset($data['country_id']) && !empty($data['country_id']) ? (int)$data['country_id'] : null;
    $region_id = isset($data['region_id']) && !empty($data['region_id']) ? (int)$data['region_id'] : null;
    $city_id = isset($data['city_id']) && !empty($data['city_id']) ? (int)$data['city_id'] : null;
    
    // Validate required fields
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Tour name is required']);
        return;
    }
    
    if (!$country_id || !$region_id || !$city_id) {
        echo json_encode(['success' => false, 'message' => 'Country, Region, and City are required']);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE tours SET 
                sejour_tour_code = $1,
                name = $2, 
                country_id = $3,
                region_id = $4,
                city_id = $5,
                updated_at = NOW() 
              WHERE id = $6";
    $result = pg_query_params($conn, $query, [
        $sejour_tour_code,
        $name,
        $country_id,
        $region_id,
        $city_id,
        $id
    ]);
    
    if ($result) {
        // Update tour sub regions if provided
        if (isset($data['sub_region_ids']) && is_array($data['sub_region_ids'])) {
            saveTourSubRegions($conn, $id, $data['sub_region_ids']);
        }
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Save tour sub regions
function saveTourSubRegions($conn, $tour_id, $sub_region_ids) {
    // Delete existing associations - use parameterized query
    $deleteQuery = "DELETE FROM tour_sub_regions WHERE tour_id = $1";
    pg_query_params($conn, $deleteQuery, [$tour_id]);
    
    // Insert new associations using parameterized query
    if (!empty($sub_region_ids)) {
        foreach ($sub_region_ids as $sub_region_id) {
            $sub_region_id = (int)$sub_region_id;
            if ($sub_region_id > 0) {
                $insertQuery = "INSERT INTO tour_sub_regions (tour_id, sub_region_id) VALUES ($1, $2) ON CONFLICT (tour_id, sub_region_id) DO NOTHING";
                pg_query_params($conn, $insertQuery, [$tour_id, $sub_region_id]);
            }
        }
    }
}

// Delete tour
function deleteTour($conn, $id) {
    $id = (int)$id;
    
    // Check if tour has any contract routes
    $checkRoutesQuery = "SELECT COUNT(*) as count FROM tour_contract_routes WHERE tour_id = $1";
    $checkRoutesResult = pg_query_params($conn, $checkRoutesQuery, [$id]);
    if ($checkRoutesResult) {
        $row = pg_fetch_assoc($checkRoutesResult);
        if ($row && (int)$row['count'] > 0) {
            echo json_encode(['success' => false, 'message' => 'Cannot delete tour because it has associated contract routes']);
            return;
        }
    }
    
    $query = "DELETE FROM tours WHERE id = $1";
    $result = pg_query_params($conn, $query, [$id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get vehicle contracts for linking
function getVehicleContracts($conn) {
    $query = "SELECT vc.id, vc.contract_code, vc.start_date, vc.end_date,
                     vc2.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
              FROM vehicle_contracts vc
              LEFT JOIN vehicle_companies vc2 ON vc.vehicle_company_id = vc2.id
              LEFT JOIN cities c ON vc2.city_id = c.id
              LEFT JOIN regions r ON c.region_id = r.id
              LEFT JOIN countries co ON r.country_id = co.id
              ORDER BY vc.start_date DESC, vc.contract_code ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $contracts = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $contracts]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Link tour to vehicle contract
function linkTourContract($conn, $data) {
    $tour_id = (int)$data['tour_id'];
    $vehicle_contract_id = isset($data['vehicle_contract_id']) ? (int)$data['vehicle_contract_id'] : null;
    
    if (!$tour_id) {
        echo json_encode(['success' => false, 'message' => 'Tour ID is required']);
        return;
    }
    
    $contract_id_val = $vehicle_contract_id ? $vehicle_contract_id : 'NULL';
    
    $query = "UPDATE tours SET 
                vehicle_contract_id = $contract_id_val,
                updated_at = NOW() 
              WHERE id = $tour_id";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get contract routes by contract_id
function getContractRoutes($conn, $contract_id = null) {
    if (!$contract_id) {
        echo json_encode(['success' => false, 'message' => 'Contract ID is required']);
        return;
    }
    
    $contract_id = (int)$contract_id;
    $query = "SELECT vcr.*, vc.contract_code
              FROM vehicle_contract_routes vcr
              INNER JOIN vehicle_contracts vc ON vcr.vehicle_contract_id = vc.id
              WHERE vcr.vehicle_contract_id = $contract_id
              ORDER BY vcr.from_location ASC, vcr.to_location ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $routes = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $routes]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get tour routes (region-route mappings)
function getTourRoutes($conn, $tour_id) {
    if (!$tour_id) {
        echo json_encode(['success' => false, 'message' => 'Tour ID is required']);
        return;
    }
    
    $tour_id = (int)$tour_id;
    
    // Check if table exists
    $tableCheck = "SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tour_contract_routes'
    )";
    $tableExists = pg_query($conn, $tableCheck);
    
    if (!$tableExists) {
        echo json_encode(['success' => true, 'data' => []]);
        return;
    }
    
    $exists = pg_fetch_result($tableExists, 0, 0);
    if ($exists !== 't') {
        echo json_encode(['success' => true, 'data' => []]);
        return;
    }
    
    $query = "SELECT tcr.*, sr.name as sub_region_name, vcr.from_location, vcr.to_location
              FROM tour_contract_routes tcr
              LEFT JOIN sub_regions sr ON tcr.sub_region_id = sr.id
              LEFT JOIN vehicle_contract_routes vcr ON tcr.vehicle_contract_route_id = vcr.id
              WHERE tcr.tour_id = $tour_id";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $routes = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $routes]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Save tour region routes
function saveTourRoutes($conn, $tour_id, $routes) {
    if (!$tour_id) {
        echo json_encode(['success' => false, 'message' => 'Tour ID is required']);
        return;
    }
    
    $tour_id = (int)$tour_id;
    
    // Check if table exists
    $tableCheck = "SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tour_contract_routes'
    )";
    $tableExists = pg_query($conn, $tableCheck);
    
    if (!$tableExists) {
        echo json_encode(['success' => false, 'message' => 'tour_contract_routes table does not exist. Please run migration first.']);
        return;
    }
    
    $exists = pg_fetch_result($tableExists, 0, 0);
    if ($exists !== 't') {
        echo json_encode(['success' => false, 'message' => 'tour_contract_routes table does not exist. Please run migration first.']);
        return;
    }
    
    // Delete existing mappings
    $deleteQuery = "DELETE FROM tour_contract_routes WHERE tour_id = $tour_id";
    $deleteResult = pg_query($conn, $deleteQuery);
    
    if (!$deleteResult) {
        echo json_encode(['success' => false, 'message' => 'Failed to delete existing routes: ' . getDbErrorMessage($conn)]);
        return;
    }
    
    // Insert new mappings
    if (!empty($routes) && is_array($routes)) {
        foreach ($routes as $route) {
            $sub_region_id = (int)$route['sub_region_id'];
            $route_id = (int)$route['vehicle_contract_route_id'];
            
            if ($sub_region_id > 0 && $route_id > 0) {
                $insertQuery = "INSERT INTO tour_contract_routes (tour_id, sub_region_id, vehicle_contract_route_id, created_at)
                              VALUES ($tour_id, $sub_region_id, $route_id, NOW())
                              ON CONFLICT (tour_id, sub_region_id) 
                              DO UPDATE SET vehicle_contract_route_id = $route_id, updated_at = NOW()";
                $insertResult = pg_query($conn, $insertQuery);
                
                if (!$insertResult) {
                    echo json_encode(['success' => false, 'message' => 'Failed to save route: ' . getDbErrorMessage($conn)]);
                    return;
                }
            }
        }
    }
    
    echo json_encode(['success' => true]);
}
?>

