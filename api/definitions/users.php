<?php
/**
 * Users API
 * Handles all CRUD operations for users
 * Note: No passwords stored, LDAP authentication will be used
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
        case 'users':
            getUsers($conn);
            break;
        case 'check_username':
            checkUsername($conn);
            break;
        case 'departments':
            getDepartments($conn);
            break;
        case 'cities':
            getCities($conn);
            break;
        case 'regions':
            $country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : null;
            getRegions($conn, $country_id);
            break;
        case 'countries':
            getCountries($conn);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'user':
            createUser($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'user':
            updateUser($conn, $data);
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
        case 'user':
            deleteUser($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get users
function getUsers($conn) {
    $query = "SELECT u.*, 
                     d.name as department_name,
                     c.name as city_name,
                     r.name as region_name,
                     co.name as country_name
              FROM users u
              LEFT JOIN departments d ON u.department_id = d.id
              LEFT JOIN cities c ON u.city_id = c.id
              LEFT JOIN regions r ON c.region_id = r.id
              LEFT JOIN countries co ON r.country_id = co.id
              ORDER BY u.username ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $users = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $users]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Check username exists
function checkUsername($conn) {
    $username = trim($_GET['username'] ?? '');
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    if (empty($username)) {
        echo json_encode(['success' => false, 'message' => 'Username is required']);
        return;
    }
    
    // Use prepared statement to prevent SQL injection
    if ($id) {
        $query = "SELECT id FROM users WHERE username = $1 AND id != $2";
        $params = [$username, $id];
    } else {
        $query = "SELECT id FROM users WHERE username = $1";
        $params = [$username];
    }
    
    $result = pg_query_params($conn, $query, $params);
    
    if ($result) {
        $exists = pg_num_rows($result) > 0;
        echo json_encode(['success' => true, 'exists' => $exists]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get departments
function getDepartments($conn) {
    $query = "SELECT d.*, c.name as city_name 
              FROM departments d 
              LEFT JOIN cities c ON d.city_id = c.id 
              ORDER BY d.name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $departments = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $departments]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get cities
function getCities($conn) {
    $region_id = isset($_GET['region_id']) ? (int)$_GET['region_id'] : null;
    
    if ($region_id) {
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

// Create user
function createUser($conn, $data) {
    $username = trim($data['username']);
    $full_name = trim($data['full_name'] ?? '');
    $department_id = isset($data['department_id']) ? (int)$data['department_id'] : null;
    $city_id = isset($data['city_id']) ? (int)$data['city_id'] : null;
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $status = trim($data['status'] ?? 'active');
    
    // Validate email if provided
    if (!empty($email) && !validateEmail($email)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    // Validate phone if provided
    if (!empty($phone) && !validatePhone($phone)) {
        echo json_encode(['success' => false, 'message' => 'Invalid phone format']);
        return;
    }
    
    // Check if username already exists using prepared statement
    $checkQuery = "SELECT id FROM users WHERE username = $1";
    $checkResult = pg_query_params($conn, $checkQuery, [$username]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'This username already exists']);
        return;
    }
    
    // Use prepared statement to prevent SQL injection
    $query = "INSERT INTO users (username, full_name, department_id, city_id, email, phone, status, created_at) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
              RETURNING id";
    
    $params = [$username, $full_name, $department_id, $city_id, $email, $phone, $status];
    
    $result = pg_query_params($conn, $query, $params);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Update user
function updateUser($conn, $data) {
    $id = (int)$data['id'];
    $username = pg_escape_string($conn, $data['username']);
    $full_name = pg_escape_string($conn, $data['full_name'] ?? '');
    $department_id = isset($data['department_id']) ? (int)$data['department_id'] : null;
    $city_id = isset($data['city_id']) ? (int)$data['city_id'] : null;
    $email = pg_escape_string($conn, $data['email'] ?? '');
    $phone = pg_escape_string($conn, $data['phone'] ?? '');
    $status = pg_escape_string($conn, $data['status'] ?? 'active');
    
    // Validate email if provided
    if (!empty($email) && !validateEmail($email)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    // Validate phone if provided
    if (!empty($phone) && !validatePhone($phone)) {
        echo json_encode(['success' => false, 'message' => 'Invalid phone format']);
        return;
    }
    
    // Username and full_name are readonly (LDAP), so we don't update them
    
    $department_id_val = $department_id ? $department_id : 'NULL';
    $city_id_val = $city_id ? $city_id : 'NULL';
    $email_val = $email ? "'$email'" : 'NULL';
    $phone_val = $phone ? "'$phone'" : 'NULL';
    
    $query = "UPDATE users SET 
                department_id = $department_id_val,
                city_id = $city_id_val,
                phone = $phone_val,
                status = '$status',
                updated_at = NOW() 
              WHERE id = $id";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Delete user
function deleteUser($conn, $id) {
    $id = (int)$id;
    
    $query = "DELETE FROM users WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Check username exists
function checkUsernameExists($conn) {
    $username = pg_escape_string($conn, $_GET['username'] ?? '');
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    $query = "SELECT id FROM users WHERE username = '$username'";
    if ($id > 0) {
        $query .= " AND id != $id";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result && pg_num_rows($result) > 0) {
        echo json_encode(['success' => true, 'exists' => true]);
    } else {
        echo json_encode(['success' => true, 'exists' => false]);
    }
}
?>

