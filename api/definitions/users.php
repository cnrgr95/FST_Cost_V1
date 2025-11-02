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

// Initialize CSRF token in session if not exists
generateCsrfToken();

// Clear any output that might have been generated
ob_end_clean();

// Get database connection
try {
    $conn = getDbConnection();
} catch (Exception $e) {
    error_log("Database connection failed in users.php: " . $e->getMessage());
    $message = APP_DEBUG ? 'Database connection failed: ' . $e->getMessage() : 'Database connection failed';
    echo json_encode(['success' => false, 'message' => $message]);
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
    error_log("API Error in users.php: " . $e->getMessage());
    $message = APP_DEBUG ? $e->getMessage() : 'An error occurred while processing your request';
    echo json_encode(['success' => false, 'message' => $message]);
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
            $city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
            getDepartments($conn, $city_id);
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
        case 'positions':
            $department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
            getPositions($conn, $department_id);
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
    try {
        $query = "SELECT u.*, 
                         d.name as department_name,
                         p.name as position_name,
                         c.name as city_name,
                         c.region_id as region_id,
                         r.name as region_name,
                         r.country_id as country_id,
                         co.name as country_name
                  FROM users u
                  LEFT JOIN departments d ON u.department_id = d.id
                  LEFT JOIN positions p ON u.position_id = p.id
                  LEFT JOIN cities c ON u.city_id = c.id
                  LEFT JOIN regions r ON c.region_id = r.id
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY u.username ASC";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $users = pg_fetch_all($result) ?: [];
            echo json_encode(['success' => true, 'data' => $users], JSON_NUMERIC_CHECK);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        error_log("Error loading users: " . $e->getMessage());
        $message = APP_DEBUG ? 'Error loading users: ' . $e->getMessage() : 'An error occurred while loading users';
        echo json_encode(['success' => false, 'message' => $message]);
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
function getDepartments($conn, $city_id = null) {
    try {
        if ($city_id) {
            $city_id = (int)$city_id;
            $query = "SELECT d.*, c.name as city_name 
                      FROM departments d 
                      LEFT JOIN cities c ON d.city_id = c.id 
                      WHERE d.city_id = $1
                      ORDER BY d.name ASC";
            $result = pg_query_params($conn, $query, [$city_id]);
        } else {
            $query = "SELECT d.*, c.name as city_name 
                      FROM departments d 
                      LEFT JOIN cities c ON d.city_id = c.id 
                      ORDER BY d.name ASC";
            $result = pg_query($conn, $query);
        }
        
        if ($result) {
            $departments = pg_fetch_all($result) ?: [];
            echo json_encode(['success' => true, 'data' => $departments], JSON_NUMERIC_CHECK);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        error_log("Error loading departments: " . $e->getMessage());
        $message = APP_DEBUG ? 'Error loading departments: ' . $e->getMessage() : 'An error occurred while loading departments';
        echo json_encode(['success' => false, 'message' => $message]);
    }
}

// Get cities
function getCities($conn) {
    $region_id = isset($_GET['region_id']) ? (int)$_GET['region_id'] : null;
    
    try {
        if ($region_id) {
            $query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name 
                      FROM cities c 
                      LEFT JOIN regions r ON c.region_id = r.id 
                      LEFT JOIN countries co ON r.country_id = co.id 
                      WHERE c.region_id = $1
                      ORDER BY c.name ASC";
            $result = pg_query_params($conn, $query, [$region_id]);
        } else {
            $query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name 
                      FROM cities c 
                      LEFT JOIN regions r ON c.region_id = r.id 
                      LEFT JOIN countries co ON r.country_id = co.id 
                      ORDER BY c.name ASC";
            $result = pg_query($conn, $query);
        }
        
        if ($result) {
            $cities = pg_fetch_all($result) ?: [];
            echo json_encode(['success' => true, 'data' => $cities], JSON_NUMERIC_CHECK);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        error_log("Error loading cities: " . $e->getMessage());
        $message = APP_DEBUG ? 'Error loading cities: ' . $e->getMessage() : 'An error occurred while loading cities';
        echo json_encode(['success' => false, 'message' => $message]);
    }
}

// Get regions
function getRegions($conn, $country_id = null) {
    try {
        if ($country_id) {
            $query = "SELECT * FROM regions WHERE country_id = $1 ORDER BY name ASC";
            $result = pg_query_params($conn, $query, [$country_id]);
        } else {
            $query = "SELECT r.*, c.name as country_name FROM regions r LEFT JOIN countries c ON r.country_id = c.id ORDER BY r.name ASC";
            $result = pg_query($conn, $query);
        }
        
        if ($result) {
            $regions = pg_fetch_all($result) ?: [];
            echo json_encode(['success' => true, 'data' => $regions], JSON_NUMERIC_CHECK);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        error_log("Error loading regions: " . $e->getMessage());
        $message = APP_DEBUG ? 'Error loading regions: ' . $e->getMessage() : 'An error occurred while loading regions';
        echo json_encode(['success' => false, 'message' => $message]);
    }
}

// Get countries
function getCountries($conn) {
    try {
        $query = "SELECT * FROM countries ORDER BY name ASC";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $countries = pg_fetch_all($result) ?: [];
            echo json_encode(['success' => true, 'data' => $countries], JSON_NUMERIC_CHECK);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        error_log("Error loading countries: " . $e->getMessage());
        $message = APP_DEBUG ? 'Error loading countries: ' . $e->getMessage() : 'An error occurred while loading countries';
        echo json_encode(['success' => false, 'message' => $message]);
    }
}

// Get positions by department
function getPositions($conn, $department_id = null) {
    try {
        if ($department_id) {
            $department_id = (int)$department_id;
            $query = "SELECT p.*, d.name as department_name
                      FROM positions p
                      LEFT JOIN departments d ON p.department_id = d.id
                      WHERE p.department_id = $department_id
                      ORDER BY p.name ASC";
        } else {
            $query = "SELECT p.*, d.name as department_name
                      FROM positions p
                      LEFT JOIN departments d ON p.department_id = d.id
                      ORDER BY p.name ASC";
        }
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $positions = pg_fetch_all($result) ?: [];
            echo json_encode(['success' => true, 'data' => $positions], JSON_NUMERIC_CHECK);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error loading positions: ' . $e->getMessage()]);
    }
}

// Create user
function createUser($conn, $data) {
    $username = trim($data['username']);
    $full_name = trim($data['full_name'] ?? '');
    $department_id = isset($data['department_id']) ? (int)$data['department_id'] : null;
    $position_id = isset($data['position_id']) ? (int)$data['position_id'] : null;
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
    $query = "INSERT INTO users (username, full_name, department_id, position_id, city_id, email, phone, status, created_at) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
              RETURNING id";
    
    $params = [$username, $full_name, $department_id, $position_id, $city_id, $email, $phone, $status];
    
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
    $phone = isset($data['phone']) ? trim($data['phone']) : '';
    $status = isset($data['status']) ? trim($data['status']) : 'active';
    $department_id = isset($data['department_id']) ? (int)$data['department_id'] : null;
    $position_id = isset($data['position_id']) ? (int)$data['position_id'] : null;
    $city_id = isset($data['city_id']) ? (int)$data['city_id'] : null;
    
    // Prevent users from deactivating themselves
    $current_user_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    if ($id === $current_user_id && $status !== 'active') {
        echo json_encode(['success' => false, 'message' => 'You cannot change your own status']);
        return;
    }
    
    // Validate email if provided
    if (!empty($data['email'] ?? '') && !validateEmail($data['email'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    // Validate phone if provided
    if (!empty($phone) && !validatePhone($phone)) {
        echo json_encode(['success' => false, 'message' => 'Invalid phone format']);
        return;
    }
    
    // Username and full_name are readonly (LDAP), so we don't update them
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE users SET 
                department_id = $1,
                position_id = $2,
                city_id = $3,
                phone = $4,
                status = $5,
                updated_at = NOW() 
              WHERE id = $6";
    
    $result = pg_query_params($conn, $query, [
        $department_id,
        $position_id,
        $city_id,
        $phone ? $phone : null,
        $status,
        $id
    ]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Delete user
function deleteUser($conn, $id) {
    $id = (int)$id;
    
    $query = "DELETE FROM users WHERE id = $1";
    $result = pg_query_params($conn, $query, [$id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Check username exists
function checkUsernameExists($conn) {
    $username = $_GET['username'] ?? '';
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    // Use parameterized query to prevent SQL injection
    if ($id > 0) {
        $query = "SELECT id FROM users WHERE username = $1 AND id != $2";
        $result = pg_query_params($conn, $query, [$username, $id]);
    } else {
        $query = "SELECT id FROM users WHERE username = $1";
        $result = pg_query_params($conn, $query, [$username]);
    }
    
    if ($result && pg_num_rows($result) > 0) {
        echo json_encode(['success' => true, 'exists' => true]);
    } else {
        echo json_encode(['success' => true, 'exists' => false]);
    }
}
?>

