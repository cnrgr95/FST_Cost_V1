<?php
/**
 * Positions API
 * Handles all CRUD operations for departments and positions
 * Hierarchy: Country -> Region -> City -> Department -> Position
 */

session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Database configuration
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
        case 'cities':
            getCities($conn);
            break;
        case 'departments':
            $city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
            getDepartments($conn, $city_id);
            break;
        case 'positions':
            $dept_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
            getPositions($conn, $dept_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'department':
            createDepartment($conn, $data);
            break;
        case 'position':
            createPosition($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'department':
            updateDepartment($conn, $data);
            break;
        case 'position':
            updatePosition($conn, $data);
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
        case 'department':
            deleteDepartment($conn, $id);
            break;
        case 'position':
            deletePosition($conn, $id);
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

// Department functions
function getDepartments($conn, $city_id = null) {
    if ($city_id) {
        $city_id = (int)$city_id;
        $query = "SELECT d.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM departments d 
                  LEFT JOIN cities c ON d.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE d.city_id = $city_id 
                  ORDER BY d.name ASC";
    } else {
        $query = "SELECT d.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM departments d 
                  LEFT JOIN cities c ON d.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY d.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $departments = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $departments]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function createDepartment($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    
    // Check if department name already exists in the same city
    $checkQuery = "SELECT id FROM departments WHERE name = '$name' AND city_id = $city_id";
    $checkResult = pg_query($conn, $checkQuery);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A department with this name already exists in this city']);
        return;
    }
    
    $query = "INSERT INTO departments (name, city_id, created_at) VALUES ('$name', $city_id, NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updateDepartment($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    
    $query = "UPDATE departments SET name = '$name', city_id = $city_id, updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deleteDepartment($conn, $id) {
    $id = (int)$id;
    // Check if department has positions
    $checkQuery = "SELECT COUNT(*) as count FROM positions WHERE department_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This department cannot be deleted because it has ' . $row['count'] . ' position(s) associated with it. Please delete all positions first.'
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM departments WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

// Position functions
function getPositions($conn, $dept_id = null) {
    if ($dept_id) {
        $dept_id = (int)$dept_id;
        $query = "SELECT p.*, d.name as department_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM positions p 
                  LEFT JOIN departments d ON p.department_id = d.id 
                  LEFT JOIN cities c ON d.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE p.department_id = $dept_id 
                  ORDER BY p.name ASC";
    } else {
        $query = "SELECT p.*, d.name as department_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM positions p 
                  LEFT JOIN departments d ON p.department_id = d.id 
                  LEFT JOIN cities c ON d.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY p.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $positions = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $positions]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function createPosition($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $department_id = (int)$data['department_id'];
    
    // Check if position name already exists in the same department
    $checkQuery = "SELECT id FROM positions WHERE name = '$name' AND department_id = $department_id";
    $checkResult = pg_query($conn, $checkQuery);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A position with this name already exists in this department']);
        return;
    }
    
    $query = "INSERT INTO positions (name, department_id, created_at) VALUES ('$name', $department_id, NOW()) RETURNING id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function updatePosition($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $department_id = (int)$data['department_id'];
    
    $query = "UPDATE positions SET name = '$name', department_id = $department_id, updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}

function deletePosition($conn, $id) {
    $id = (int)$id;
    $query = "DELETE FROM positions WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => pg_last_error($conn)]);
    }
}
?>

