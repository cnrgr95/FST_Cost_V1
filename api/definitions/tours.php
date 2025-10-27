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
                $tour['sub_regions'] = pg_fetch_all($subRegionsResult) ?: [];
            } else {
                $tour['sub_regions'] = [];
            }
        }
        
        echo json_encode(['success' => true, 'data' => $tours]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
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
    
    $sub_region_id = (int)$data['sub_region_id'];
    $merchant_id = (int)$data['merchant_id'];
    
    $sejour_tour_code_val = !empty($sejour_tour_code) ? "'$sejour_tour_code'" : 'NULL';
    
    $query = "INSERT INTO tours (sejour_tour_code, name, sub_region_id, merchant_id, created_at) 
              VALUES ($sejour_tour_code_val, '$name', $sub_region_id, $merchant_id, NOW()) 
              RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        $tour_id = $row['id'];
        
        // Save tour sub regions
        if (isset($data['sub_region_ids']) && is_array($data['sub_region_ids'])) {
            saveTourSubRegions($conn, $tour_id, $data['sub_region_ids']);
        }
        
        echo json_encode(['success' => true, 'id' => $tour_id]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Update tour
function updateTour($conn, $data) {
    $id = (int)$data['id'];
    $sejour_tour_code = strtoupper(pg_escape_string($conn, $data['sejour_tour_code'] ?? ''));
    $name = pg_escape_string($conn, $data['name']);
    $sub_region_id = (int)$data['sub_region_id'];
    $merchant_id = (int)$data['merchant_id'];
    
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
        // Update tour sub regions
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
    // Delete existing associations
    $deleteQuery = "DELETE FROM tour_sub_regions WHERE tour_id = $tour_id";
    pg_query($conn, $deleteQuery);
    
    // Insert new associations
    if (!empty($sub_region_ids)) {
        foreach ($sub_region_ids as $sub_region_id) {
            $sub_region_id = (int)$sub_region_id;
            if ($sub_region_id > 0) {
                $insertQuery = "INSERT INTO tour_sub_regions (tour_id, sub_region_id) VALUES ($tour_id, $sub_region_id) ON CONFLICT (tour_id, sub_region_id) DO NOTHING";
                pg_query($conn, $insertQuery);
            }
        }
    }
}

// Delete tour
function deleteTour($conn, $id) {
    $id = (int)$id;
    $query = "DELETE FROM tours WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}
?>

