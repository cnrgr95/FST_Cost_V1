<?php
/**
 * Vehicles API
 * Handles all CRUD operations for vehicle companies and vehicle types
 * Hierarchy: City -> Vehicle Company -> Vehicle Type
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
}

closeDbConnection($conn);

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'cities':
            getCities($conn);
            break;
        case 'companies':
            $city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
            getCompanies($conn, $city_id);
            break;
        case 'types':
            $company_id = isset($_GET['company_id']) ? (int)$_GET['company_id'] : null;
            getTypes($conn, $company_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'company':
            createCompany($conn, $data);
            break;
        case 'type':
            createType($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'company':
            updateCompany($conn, $data);
            break;
        case 'type':
            updateType($conn, $data);
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
        case 'company':
            deleteCompany($conn, $id);
            break;
        case 'type':
            deleteType($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get cities from locations
function getCities($conn) {
    $query = "SELECT c.*, r.name as region_name, co.name as country_name 
              FROM cities c 
              LEFT JOIN regions r ON c.region_id = r.id 
              LEFT JOIN countries co ON r.country_id = co.id 
              ORDER BY c.name ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $cities = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $cities]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Company functions
function getCompanies($conn, $city_id = null) {
    if ($city_id) {
        $city_id = (int)$city_id;
        $query = "SELECT vc.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM vehicle_companies vc 
                  LEFT JOIN cities c ON vc.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE vc.city_id = $city_id 
                  ORDER BY vc.name ASC";
    } else {
        $query = "SELECT vc.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM vehicle_companies vc 
                  LEFT JOIN cities c ON vc.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY vc.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $companies = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $companies]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function createCompany($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    $contact_person = isset($data['contact_person']) ? pg_escape_string($conn, $data['contact_person']) : null;
    $contact_email = isset($data['contact_email']) ? pg_escape_string($conn, $data['contact_email']) : null;
    $contact_phone = isset($data['contact_phone']) ? pg_escape_string($conn, $data['contact_phone']) : null;
    
    // Check if company name already exists in the same city
    $checkQuery = "SELECT id FROM vehicle_companies WHERE name = '$name' AND city_id = $city_id";
    $checkResult = pg_query($conn, $checkQuery);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A vehicle company with this name already exists in this city']);
        return;
    }
    
    $query = "INSERT INTO vehicle_companies (name, city_id, contact_person, contact_email, contact_phone, created_at) 
              VALUES ('$name', $city_id, " . ($contact_person ? "'$contact_person'" : 'NULL') . ", " . 
              ($contact_email ? "'$contact_email'" : 'NULL') . ", " . 
              ($contact_phone ? "'$contact_phone'" : 'NULL') . ", NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updateCompany($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    $contact_person = isset($data['contact_person']) ? pg_escape_string($conn, $data['contact_person']) : null;
    $contact_email = isset($data['contact_email']) ? pg_escape_string($conn, $data['contact_email']) : null;
    $contact_phone = isset($data['contact_phone']) ? pg_escape_string($conn, $data['contact_phone']) : null;
    
    $query = "UPDATE vehicle_companies SET name = '$name', city_id = $city_id, 
              contact_person = " . ($contact_person ? "'$contact_person'" : 'NULL') . ", 
              contact_email = " . ($contact_email ? "'$contact_email'" : 'NULL') . ", 
              contact_phone = " . ($contact_phone ? "'$contact_phone'" : 'NULL') . ", 
              updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deleteCompany($conn, $id) {
    $id = (int)$id;
    // Check if company has vehicle types
    $checkQuery = "SELECT COUNT(*) as count FROM vehicle_types WHERE vehicle_company_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This vehicle company cannot be deleted because it has ' . $row['count'] . ' vehicle type(s) associated with it. Please delete all vehicle types first.'
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM vehicle_companies WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Type functions
function getTypes($conn, $company_id = null) {
    if ($company_id) {
        $company_id = (int)$company_id;
        $query = "SELECT vt.*, vc.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM vehicle_types vt 
                  LEFT JOIN vehicle_companies vc ON vt.vehicle_company_id = vc.id 
                  LEFT JOIN cities c ON vc.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE vt.vehicle_company_id = $company_id 
                  ORDER BY vt.name ASC";
    } else {
        $query = "SELECT vt.*, vc.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM vehicle_types vt 
                  LEFT JOIN vehicle_companies vc ON vt.vehicle_company_id = vc.id 
                  LEFT JOIN cities c ON vc.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY vt.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $types = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $types]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function createType($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $company_id = (int)$data['vehicle_company_id'];
    
    // Check if type name already exists in the same company
    $checkQuery = "SELECT id FROM vehicle_types WHERE name = '$name' AND vehicle_company_id = $company_id";
    $checkResult = pg_query($conn, $checkQuery);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A vehicle type with this name already exists in this company']);
        return;
    }
    
    $query = "INSERT INTO vehicle_types (name, vehicle_company_id, created_at) 
              VALUES ('$name', $company_id, NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updateType($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $company_id = (int)$data['vehicle_company_id'];
    
    $query = "UPDATE vehicle_types SET name = '$name', vehicle_company_id = $company_id, 
              updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deleteType($conn, $id) {
    $id = (int)$id;
    $query = "DELETE FROM vehicle_types WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}
?>

