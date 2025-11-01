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

// Performance headers
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

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
    error_log("Database connection failed in vehicles.php: " . $e->getMessage());
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
    // Log error for debugging
    error_log("API Error in vehicles.php: " . $e->getMessage());
    
    // Return safe error message - don't leak sensitive information
    $message = APP_DEBUG ? $e->getMessage() : 'An error occurred while processing your request';
    echo json_encode(['success' => false, 'message' => $message]);
} finally {
    // Always close database connection
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

/**
 * Validate Excel file upload - Check extension, MIME type, magic bytes, and size
 * Returns array with 'valid' boolean and 'message' string
 */
function validateExcelFile($file) {
    // 1. Check file exists and upload was successful
    if (!isset($file) || !isset($file['tmp_name']) || !file_exists($file['tmp_name'])) {
        return ['valid' => false, 'message' => 'File upload failed'];
    }
    
    // 2. Check file extension
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['xlsx', 'xls'])) {
        return ['valid' => false, 'message' => 'Invalid file format. Only .xlsx and .xls files are allowed'];
    }
    
    // 3. Check file size
    if (isset($file['size']) && $file['size'] > UPLOAD_MAX_SIZE) {
        return ['valid' => false, 'message' => 'File size exceeds maximum allowed size of ' . (UPLOAD_MAX_SIZE / 1024 / 1024) . ' MB'];
    }
    
    // 4. Check MIME type
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/zip', // Some Excel files return this
            'application/octet-stream' // Some Excel files return this
        ];
        
        if (!in_array($mimeType, $allowedMimeTypes)) {
            return ['valid' => false, 'message' => 'Invalid file type. MIME type: ' . $mimeType];
        }
    }
    
    // 5. Check magic bytes (file signature)
    $handle = fopen($file['tmp_name'], 'rb');
    if (!$handle) {
        return ['valid' => false, 'message' => 'Could not read file'];
    }
    
    $header = fread($handle, 8);
    fclose($handle);
    
    // Excel files have specific magic bytes
    // .xlsx files are ZIP archives, start with PK
    // .xls files have OLE format signature
    $isValidSignature = false;
    if (substr($header, 0, 2) === 'PK') {
        // ZIP-based format (.xlsx)
        $isValidSignature = true;
    } elseif (substr($header, 0, 8) === "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1") {
        // OLE format (.xls)
        $isValidSignature = true;
    }
    
    if (!$isValidSignature) {
        return ['valid' => false, 'message' => 'Invalid file format. File does not appear to be a valid Excel file'];
    }
    
    // 6. Sanitize filename
    $sanitizedFilename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    if ($sanitizedFilename !== $file['name']) {
        error_log("Filename sanitized: {$file['name']} -> {$sanitizedFilename}");
    }
    
    return ['valid' => true, 'message' => 'File is valid', 'sanitized_filename' => $sanitizedFilename];
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'generate_contract_code':
            generateContractCode($conn);
            break;
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
        case 'contracts':
            $company_id = isset($_GET['company_id']) ? (int)$_GET['company_id'] : null;
            getContracts($conn, $company_id);
            break;
        case 'contract_routes':
            $contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : 0;
            getContractRoutes($conn, $contract_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    switch ($action) {
        case 'company':
            $data = json_decode(file_get_contents('php://input'), true);
            createCompany($conn, $data);
            break;
        case 'type':
            $data = json_decode(file_get_contents('php://input'), true);
            createType($conn, $data);
            break;
        case 'contract':
            $data = json_decode(file_get_contents('php://input'), true);
            createContract($conn, $data);
            break;
        case 'upload_excel':
            uploadExcel($conn);
            break;
        case 'upload_contract_prices':
            uploadContractPrices($conn);
            break;
        case 'save_contract_routes':
            $data = json_decode(file_get_contents('php://input'), true);
            saveContractRoutes($conn, $data);
            break;
        case 'contract_route':
            $data = json_decode(file_get_contents('php://input'), true);
            createContractRoute($conn, $data);
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
        case 'contract':
            updateContract($conn, $data);
            break;
        case 'contract_route':
            updateContractRoute($conn, $data);
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
        case 'contract':
            deleteContract($conn, $id);
            break;
        case 'contract_route':
            deleteContractRoute($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get cities from locations
function getCities($conn) {
    $query = "SELECT c.id, c.name, c.region_id, r.name as region_name, co.name as country_name 
              FROM cities c 
              LEFT JOIN regions r ON c.region_id = r.id 
              LEFT JOIN countries co ON r.country_id = co.id 
              ORDER BY c.name ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $cities = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $cities], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
    }
}

// Company functions
function getCompanies($conn, $city_id = null) {
    if ($city_id) {
        $city_id = (int)$city_id;
        $query = "SELECT vc.id, vc.name, vc.city_id, vc.contact_person, vc.contact_email, vc.contact_phone,
                         c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM vehicle_companies vc 
                  LEFT JOIN cities c ON vc.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE vc.city_id = $city_id 
                  ORDER BY vc.name ASC";
    } else {
        $query = "SELECT vc.id, vc.name, vc.city_id, vc.contact_person, vc.contact_email, vc.contact_phone,
                         c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM vehicle_companies vc 
                  LEFT JOIN cities c ON vc.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY vc.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $companies = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $companies], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
    }
}

function createCompany($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    $contact_person = isset($data['contact_person']) ? pg_escape_string($conn, $data['contact_person']) : null;
    $contact_email = isset($data['contact_email']) ? pg_escape_string($conn, $data['contact_email']) : null;
    $contact_phone = isset($data['contact_phone']) ? pg_escape_string($conn, $data['contact_phone']) : null;
    
    // Check if company name already exists in the same city - use parameterized query
    $checkQuery = "SELECT id FROM vehicle_companies WHERE name = $1 AND city_id = $2";
    $checkResult = pg_query_params($conn, $checkQuery, [$name, $city_id]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A vehicle company with this name already exists in this city']);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO vehicle_companies (name, city_id, contact_person, contact_email, contact_phone, created_at) 
              VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id";
    $result = pg_query_params($conn, $query, [
        $name,
        $city_id,
        $contact_person,
        $contact_email,
        $contact_phone
    ]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function updateCompany($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $city_id = (int)$data['city_id'];
    $contact_person = isset($data['contact_person']) ? pg_escape_string($conn, $data['contact_person']) : null;
    $contact_email = isset($data['contact_email']) ? pg_escape_string($conn, $data['contact_email']) : null;
    $contact_phone = isset($data['contact_phone']) ? pg_escape_string($conn, $data['contact_phone']) : null;
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE vehicle_companies SET name = $1, city_id = $2, 
              contact_person = $3, 
              contact_email = $4, 
              contact_phone = $5, 
              updated_at = NOW() WHERE id = $6";
    $result = pg_query_params($conn, $query, [
        $name,
        $city_id,
        $contact_person ? $contact_person : null,
        $contact_email ? $contact_email : null,
        $contact_phone ? $contact_phone : null,
        $id
    ]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
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
                'message' => 'This vehicle company cannot be deleted because it has ' . $row['count'] . ' vehicle type(s) associated with it. Please delete all vehicle types first.',
                'dependency_type' => 'company_has_vehicle_types',
                'count' => $row['count']
            ]);
            return;
        }
    }
    
    // Check if company has contracts
    $checkQuery2 = "SELECT COUNT(*) as count FROM vehicle_contracts WHERE vehicle_company_id = $id";
    $checkResult2 = pg_query($conn, $checkQuery2);
    
    if ($checkResult2) {
        $row2 = pg_fetch_assoc($checkResult2);
        if ($row2['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This vehicle company cannot be deleted because it has ' . $row2['count'] . ' contract(s) associated with it. Please delete all contracts first.',
                'dependency_type' => 'company_has_contracts',
                'count' => $row2['count']
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM vehicle_companies WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Type functions
function getTypes($conn, $company_id = null) {
    if ($company_id) {
        $company_id = (int)$company_id;
        $query = "SELECT vt.id, vt.name, vt.vehicle_company_id, vt.min_pax, vt.max_pax,
                         vc.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM vehicle_types vt 
                  LEFT JOIN vehicle_companies vc ON vt.vehicle_company_id = vc.id 
                  LEFT JOIN cities c ON vc.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE vt.vehicle_company_id = $company_id 
                  ORDER BY vt.name ASC";
    } else {
        $query = "SELECT vt.id, vt.name, vt.vehicle_company_id, vt.min_pax, vt.max_pax,
                         vc.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
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
        echo json_encode(['success' => true, 'data' => $types], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
    }
}

function createType($conn, $data) {
    $name = pg_escape_string($conn, $data['name']);
    $company_id = (int)$data['vehicle_company_id'];
    $min_pax = isset($data['min_pax']) && $data['min_pax'] !== '' ? (int)$data['min_pax'] : null;
    $max_pax = isset($data['max_pax']) && $data['max_pax'] !== '' ? (int)$data['max_pax'] : null;
    
    // Check if type name already exists in the same company - use parameterized query
    $checkQuery = "SELECT id FROM vehicle_types WHERE name = $1 AND vehicle_company_id = $2";
    $checkResult = pg_query_params($conn, $checkQuery, [$name, $company_id]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'A vehicle type with this name already exists in this company']);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO vehicle_types (name, vehicle_company_id, min_pax, max_pax, created_at) 
              VALUES ($1, $2, $3, $4, NOW()) RETURNING id";
    $result = pg_query_params($conn, $query, [
        $name,
        $company_id,
        $min_pax,
        $max_pax
    ]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function updateType($conn, $data) {
    $id = (int)$data['id'];
    $name = pg_escape_string($conn, $data['name']);
    $company_id = (int)$data['vehicle_company_id'];
    $min_pax = isset($data['min_pax']) && $data['min_pax'] !== '' ? (int)$data['min_pax'] : null;
    $max_pax = isset($data['max_pax']) && $data['max_pax'] !== '' ? (int)$data['max_pax'] : null;
    
    $minPaxValue = $min_pax !== null ? $min_pax : 'NULL';
    $maxPaxValue = $max_pax !== null ? $max_pax : 'NULL';
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE vehicle_types SET name = $1, vehicle_company_id = $2, 
              min_pax = $3, max_pax = $4, updated_at = NOW() WHERE id = $5";
    $result = pg_query_params($conn, $query, [
        $name,
        $company_id,
        $min_pax,
        $max_pax,
        $id
    ]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function deleteType($conn, $id) {
    $id = (int)$id;
    
    // Check if the vehicle company (that this type belongs to) has contracts
    $checkQuery = "SELECT COUNT(*) as count FROM vehicle_contracts 
                   WHERE vehicle_company_id = (SELECT vehicle_company_id FROM vehicle_types WHERE id = $id)";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This vehicle type cannot be deleted because its vehicle company has ' . $row['count'] . ' contract(s) associated with it. Please delete all contracts first.',
                'dependency_type' => 'type_has_contracts',
                'count' => $row['count']
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM vehicle_types WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Contract functions
function getContracts($conn, $company_id = null) {
    $contract_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    if ($contract_id) {
        // Get single contract by ID
        $query = "SELECT vc.id, vc.vehicle_company_id, vc.contract_code, vc.start_date, vc.end_date,
                         vc2.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM vehicle_contracts vc
                  LEFT JOIN vehicle_companies vc2 ON vc.vehicle_company_id = vc2.id
                  LEFT JOIN cities c ON vc2.city_id = c.id
                  LEFT JOIN regions r ON c.region_id = r.id
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE vc.id = $contract_id";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $contract = pg_fetch_assoc($result);
            if ($contract) {
                echo json_encode(['success' => true, 'data' => [$contract]], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode(['success' => false, 'message' => 'Contract not found'], JSON_UNESCAPED_UNICODE);
            }
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } else if ($company_id) {
        $company_id = (int)$company_id;
        $query = "SELECT vc.id, vc.vehicle_company_id, vc.contract_code, vc.start_date, vc.end_date,
                         vc2.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM vehicle_contracts vc
                  LEFT JOIN vehicle_companies vc2 ON vc.vehicle_company_id = vc2.id
                  LEFT JOIN cities c ON vc2.city_id = c.id
                  LEFT JOIN regions r ON c.region_id = r.id
                  LEFT JOIN countries co ON r.country_id = co.id
                  WHERE vc.vehicle_company_id = $company_id
                  ORDER BY vc.start_date DESC, vc.contract_code ASC";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $contracts = pg_fetch_all($result);
            echo json_encode(['success' => true, 'data' => $contracts], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } else {
        $query = "SELECT vc.id, vc.vehicle_company_id, vc.contract_code, vc.start_date, vc.end_date,
                         vc2.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM vehicle_contracts vc
                  LEFT JOIN vehicle_companies vc2 ON vc.vehicle_company_id = vc2.id
                  LEFT JOIN cities c ON vc2.city_id = c.id
                  LEFT JOIN regions r ON c.region_id = r.id
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY vc.start_date DESC, vc.contract_code ASC";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $contracts = pg_fetch_all($result);
            echo json_encode(['success' => true, 'data' => $contracts], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    }
}

function generateContractCode($conn) {
    try {
        // Get the highest contract code number
        $query = "SELECT contract_code FROM vehicle_contracts 
                  WHERE contract_code LIKE 'FST-%' 
                  ORDER BY contract_code DESC LIMIT 1";
        
        $result = pg_query($conn, $query);
        
        $nextNumber = 1;
        if ($result && pg_num_rows($result) > 0) {
            $row = pg_fetch_assoc($result);
            $lastCode = $row['contract_code'];
            // Extract number from format FST-001
            if (preg_match('/FST-(\d+)$/', $lastCode, $matches)) {
                $nextNumber = (int)$matches[1] + 1;
            }
        }
        
        // Format with leading zeros (e.g., 001, 002, ... 999)
        $contractCode = 'FST-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        
        echo json_encode(['success' => true, 'contract_code' => $contractCode]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function createContract($conn, $data) {
    try {
        $vehicle_company_id = (int)$data['vehicle_company_id'];
        $contract_code = pg_escape_string($conn, $data['contract_code']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        
        // Validate required fields
        if (empty($contract_code) || empty($start_date) || empty($end_date)) {
            echo json_encode(['success' => false, 'message' => 'All required fields must be filled']);
            return;
        }
        
        // Validate dates
        if (strtotime($start_date) > strtotime($end_date)) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        // Use parameterized query to prevent SQL injection
        $query = "INSERT INTO vehicle_contracts (vehicle_company_id, contract_code, start_date, end_date, created_at)
                  VALUES ($1, $2, $3, $4, NOW()) RETURNING id";
        
        $result = pg_query_params($conn, $query, [
            $vehicle_company_id,
            $contract_code,
            $start_date,
            $end_date
        ]);
        
        if ($result) {
            $row = pg_fetch_assoc($result);
            echo json_encode(['success' => true, 'id' => $row['id']]);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function updateContract($conn, $data) {
    try {
        $id = (int)$data['id'];
        $vehicle_company_id = (int)$data['vehicle_company_id'];
        $contract_code = pg_escape_string($conn, $data['contract_code']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        
        // Validate required fields
        if (empty($contract_code) || empty($start_date) || empty($end_date)) {
            echo json_encode(['success' => false, 'message' => 'All required fields must be filled']);
            return;
        }
        
        // Validate dates
        if (strtotime($start_date) > strtotime($end_date)) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        // Use parameterized query to prevent SQL injection
        $query = "UPDATE vehicle_contracts SET 
                  vehicle_company_id = $1,
                  contract_code = $2,
                  start_date = $3,
                  end_date = $4,
                  updated_at = NOW()
                  WHERE id = $5";
        
        $result = pg_query_params($conn, $query, [
            $vehicle_company_id,
            $contract_code,
            $start_date,
            $end_date,
            $id
        ]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function deleteContract($conn, $id) {
    $id = (int)$id;
    
    // Check if contract has routes
    $checkQuery = "SELECT COUNT(*) as count FROM vehicle_contract_routes WHERE vehicle_contract_id = $id";
    $checkResult = pg_query($conn, $checkQuery);
    
    if ($checkResult) {
        $row = pg_fetch_assoc($checkResult);
        if ($row['count'] > 0) {
            echo json_encode([
                'success' => false, 
                'message' => 'This contract cannot be deleted because it has ' . $row['count'] . ' route(s) associated with it. Please delete all routes first.',
                'dependency_type' => 'contract_has_routes',
                'count' => $row['count']
            ]);
            return;
        }
    }
    
    $query = "DELETE FROM vehicle_contracts WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function uploadExcel($conn) {
    try {
        if (!isset($_FILES['excel_file']) || $_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'File upload failed']);
            return;
        }
        
        $vehicle_company_id = (int)$_POST['vehicle_company_id'];
        $file = $_FILES['excel_file'];
        
        // Validate file using comprehensive security checks
        $validation = validateExcelFile($file);
        if (!$validation['valid']) {
            echo json_encode(['success' => false, 'message' => $validation['message']]);
            return;
        }
        
        // Check if PhpSpreadsheet is available
        if (!file_exists(__DIR__ . '/../../vendor/autoload.php')) {
            echo json_encode(['success' => false, 'message' => 'Composer autoload not found. Please run: composer install']);
            return;
        }
        
        require_once __DIR__ . '/../../vendor/autoload.php';
        
        if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
            echo json_encode(['success' => false, 'message' => 'PhpSpreadsheet library not found. Please run: composer install']);
            return;
        }
        
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file['tmp_name']);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();
        
        // Skip header row
        array_shift($rows);
        
        $successCount = 0;
        $errorCount = 0;
        $errors = [];
        
        foreach ($rows as $index => $row) {
            // Expected format: Contract Code, Start Date, End Date
            if (count($row) < 3) continue;
            
            $contract_code = trim($row[0] ?? '');
            $start_date = trim($row[1] ?? '');
            $end_date = trim($row[2] ?? '');
            
            if (empty($contract_code) || empty($start_date) || empty($end_date)) {
                $errorCount++;
                $errors[] = "Row " . ($index + 2) . ": Missing required fields";
                continue;
            }
            
            // Convert dates from Excel format if needed
            if (is_numeric($start_date)) {
                $start_date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($start_date)->format('Y-m-d');
            }
            if (is_numeric($end_date)) {
                $end_date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($end_date)->format('Y-m-d');
            }
            
            // Use prepared statement to prevent SQL injection
            $query = "INSERT INTO vehicle_contracts (vehicle_company_id, contract_code, start_date, end_date, created_at)
                      VALUES ($1, $2, $3, $4, NOW())";
            
            $result = pg_query_params($conn, $query, [$vehicle_company_id, $contract_code, $start_date, $end_date]);
            
            if ($result) {
                $successCount++;
            } else {
                $errorCount++;
                $errors[] = "Row " . ($index + 2) . ": " . getDbErrorMessage($conn);
            }
        }
        
        echo json_encode([
            'success' => $errorCount === 0,
            'message' => "Imported $successCount contracts successfully" . ($errorCount > 0 ? ". $errorCount errors occurred." : ''),
            'success_count' => $successCount,
            'error_count' => $errorCount,
            'errors' => $errors
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}


function uploadContractPrices($conn) {
    try {
        // Better error handling - check for file upload errors
        if (!isset($_FILES['excel_file'])) {
            echo json_encode(['success' => false, 'message' => 'No file uploaded']);
            return;
        }
        
        $fileError = $_FILES['excel_file']['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($fileError !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
            ];
            $errorMsg = $errorMessages[$fileError] ?? 'File upload failed (error code: ' . $fileError . ')';
            echo json_encode(['success' => false, 'message' => $errorMsg]);
            return;
        }
        
        $contract_id = isset($_POST['contract_id']) ? (int)$_POST['contract_id'] : 0;
        if ($contract_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'contract_id is required']);
            return;
        }
        
        $file = $_FILES['excel_file'];
        
        // Validate file using comprehensive security checks
        $validation = validateExcelFile($file);
        if (!$validation['valid']) {
            echo json_encode(['success' => false, 'message' => $validation['message']]);
            return;
        }
        
        // Check if PhpSpreadsheet is available
        if (!file_exists(__DIR__ . '/../../vendor/autoload.php')) {
            echo json_encode(['success' => false, 'message' => 'Composer autoload not found. Please run: composer install']);
            return;
        }
        
        require_once __DIR__ . '/../../vendor/autoload.php';
        
        if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
            echo json_encode(['success' => false, 'message' => 'PhpSpreadsheet library not found. Please run: composer install']);
            return;
        }
        
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file['tmp_name']);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();
        
        // Get first row to detect columns
        $firstRow = $rows[0] ?? [];
        
        // Detect if first row is header (contains text that looks like column names)
        $isHeader = false;
        $hasTextualHeader = false;
        if (!empty($firstRow)) {
            // Check if first row contains common header keywords
            $headerKeywords = ['nerden', 'nereye', 'from', 'to', 'vip', 'vito', 'mini', 'midi', 'bus'];
            foreach ($firstRow as $cell) {
                $cellLower = strtolower(trim($cell ?? ''));
                foreach ($headerKeywords as $keyword) {
                    if (stripos($cellLower, $keyword) !== false) {
                        $hasTextualHeader = true;
                        break 2;
                    }
                }
            }
            
            if ($hasTextualHeader) {
                $isHeader = true;
                $headerRow = array_shift($rows); // Remove header row
            }
        }
        
        // If no header detected, use first row as sample data
        $sampleRow = !empty($rows) ? $rows[0] : [];
        $maxColumns = max(count($firstRow), count($sampleRow));
        
        // Build column options for mapping
        $excelColumns = [];
        for ($i = 0; $i < $maxColumns; $i++) {
            $headerValue = isset($firstRow[$i]) ? trim($firstRow[$i]) : '';
            $sampleValue = isset($sampleRow[$i]) ? trim($sampleRow[$i]) : '';
            
            $excelColumns[] = [
                'index' => $i,
                'header' => $headerValue ?: "Column " . ($i + 1),
                'sample' => $sampleValue
            ];
        }
        
        // Check if full data is requested
        $getFullData = isset($_POST['get_full_data']) && $_POST['get_full_data'] === '1';
        
        if ($getFullData) {
            // Return full Excel data for processing with mapping
            echo json_encode([
                'success' => true,
                'excel_rows' => $rows,
                'has_header' => $isHeader,
                'total_rows' => count($rows)
            ], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        // Return columns for manual mapping
        // Also send first few rows as sample data (without header if detected)
        $sampleRows = array_slice($rows, 0, min(5, count($rows)));
        
        echo json_encode([
            'success' => true,
            'mapping_required' => true,
            'excel_columns' => $excelColumns,
            'has_header' => $isHeader,
            'total_rows' => count($rows),
            'sample_data' => $sampleRows
        ], JSON_UNESCAPED_UNICODE);
        return;
    } catch (Exception $e) {
        error_log('Error in uploadContractPrices: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() . ' | Trace: ' . $e->getTraceAsString());
        echo json_encode(['success' => false, 'message' => 'An error occurred while processing the file: ' . $e->getMessage()]);
    } catch (Error $e) {
        error_log('Fatal error in uploadContractPrices: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() . ' | Trace: ' . $e->getTraceAsString());
        echo json_encode(['success' => false, 'message' => 'A fatal error occurred: ' . $e->getMessage()]);
    }
}


function getContractRoutes($conn, $contract_id) {
    if ($contract_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'contract_id is required']);
        return;
    }
    
    $query = "SELECT id, vehicle_contract_id, from_location, to_location,
                     vehicle_type_prices, currency_code, created_at, updated_at
              FROM vehicle_contract_routes
              WHERE vehicle_contract_id = $contract_id
              ORDER BY from_location ASC, to_location ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $routes = pg_fetch_all($result) ?: [];
        // Convert JSONB to PHP array for each route
        // PostgreSQL returns JSONB as string, need to decode
        foreach ($routes as &$route) {
            if (isset($route['vehicle_type_prices'])) {
                $pricesData = $route['vehicle_type_prices'];
                // PostgreSQL JSONB is returned as string, decode it
                if (is_string($pricesData)) {
                    $decoded = json_decode($pricesData, true);
                    // Ensure we have a valid array
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $route['vehicle_type_prices'] = $decoded;
                        error_log('Route ' . ($route['id'] ?? 'unknown') . ' prices: ' . json_encode($decoded));
                    } else {
                        error_log('JSON decode error for route ' . ($route['id'] ?? 'unknown') . ': ' . json_last_error_msg() . ' | Raw data: ' . substr($pricesData, 0, 200));
                        $route['vehicle_type_prices'] = [];
                    }
                } elseif (is_array($pricesData)) {
                    // Already an array (shouldn't happen with JSONB, but just in case)
                    $route['vehicle_type_prices'] = $pricesData;
                    error_log('Route ' . ($route['id'] ?? 'unknown') . ' prices already array: ' . json_encode($pricesData));
                } else {
                    $route['vehicle_type_prices'] = [];
                }
            } else {
                $route['vehicle_type_prices'] = [];
            }
        }
        unset($route); // Break reference
        echo json_encode(['success' => true, 'data' => $routes], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
    }
}

function updateContractRoute($conn, $data) {
    try {
        $route_id = isset($data['id']) ? (int)$data['id'] : 0;
        $from_location = isset($data['from_location']) ? trim($data['from_location']) : '';
        $to_location = isset($data['to_location']) ? trim($data['to_location']) : '';
        $vehicle_type_prices = isset($data['vehicle_type_prices']) ? $data['vehicle_type_prices'] : [];
        $currency_code = isset($data['currency_code']) ? strtoupper(trim($data['currency_code'])) : '';
        
        if ($route_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Route ID is required']);
            return;
        }
        
        if (empty($from_location) || empty($to_location)) {
            echo json_encode(['success' => false, 'message' => 'From and To locations are required']);
            return;
        }
        
        // Verify route exists and get contract_id
        // Use parameterized query to prevent SQL injection
        $checkQuery = "SELECT vehicle_contract_id FROM vehicle_contract_routes WHERE id = $1";
        $checkResult = pg_query_params($conn, $checkQuery, [$route_id]);
        if (!$checkResult || pg_num_rows($checkResult) === 0) {
            echo json_encode(['success' => false, 'message' => 'Route not found']);
            return;
        }
        $row = pg_fetch_assoc($checkResult);
        $contract_id = (int)$row['vehicle_contract_id'];
        
        // Validate currency if provided
        if (!empty($currency_code)) {
            // Use parameterized query to prevent SQL injection
            $currencyQuery = "SELECT code FROM currencies WHERE code = $1 AND is_active = true";
            $currencyResult = pg_query_params($conn, $currencyQuery, [$currency_code]);
            if (!$currencyResult || pg_num_rows($currencyResult) === 0) {
                echo json_encode(['success' => false, 'message' => 'Invalid currency code']);
                return;
            }
        }
        
        // Convert vehicle_type_prices to JSONB
        $vehicleTypePricesJson = json_encode($vehicle_type_prices, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
        
        if (!empty($vehicle_type_prices)) {
            error_log('Updating route ' . $route_id . ' with prices: ' . $vehicleTypePricesJson);
        }
        
        // Check if from/to combination already exists for another route using parameterized query
        $duplicateQuery = "SELECT id FROM vehicle_contract_routes 
                          WHERE vehicle_contract_id = $1 
                          AND from_location = $2 
                          AND to_location = $3 
                          AND id != $4";
        $duplicateResult = pg_query_params($conn, $duplicateQuery, [
            $contract_id,
            $from_location,
            $to_location,
            $route_id
        ]);
        if ($duplicateResult && pg_num_rows($duplicateResult) > 0) {
            echo json_encode(['success' => false, 'message' => 'A route with the same From/To locations already exists']);
            return;
        }
        
        // Update route using parameterized query
        $query = "UPDATE vehicle_contract_routes 
                 SET from_location = $1, 
                     to_location = $2,
                     vehicle_type_prices = $3::jsonb,
                     currency_code = $4,
                     updated_at = NOW()
                 WHERE id = $5";
        
        $updateResult = pg_query_params($conn, $query, [
            $from_location,
            $to_location,
            $vehicleTypePricesJson,
            !empty($currency_code) ? $currency_code : null,
            $route_id
        ]);
        
        if ($updateResult) {
            echo json_encode(['success' => true, 'message' => 'Route updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        error_log('Error in updateContractRoute: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
    }
}

function createContractRoute($conn, $data) {
    try {
        $contract_id = isset($data['contract_id']) ? (int)$data['contract_id'] : 0;
        $from_location = isset($data['from_location']) ? trim($data['from_location']) : '';
        $to_location = isset($data['to_location']) ? trim($data['to_location']) : '';
        $vehicle_type_prices = isset($data['vehicle_type_prices']) ? $data['vehicle_type_prices'] : [];
        $currency_code = isset($data['currency_code']) ? strtoupper(trim($data['currency_code'])) : '';
        
        if ($contract_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Contract ID is required']);
            return;
        }
        
        if (empty($from_location) || empty($to_location)) {
            echo json_encode(['success' => false, 'message' => 'From and To locations are required']);
            return;
        }
        
        // Verify contract exists - use parameterized query
        $contractQuery = "SELECT vehicle_company_id FROM vehicle_contracts WHERE id = $1";
        $contractResult = pg_query_params($conn, $contractQuery, [$contract_id]);
        if (!$contractResult || pg_num_rows($contractResult) === 0) {
            echo json_encode(['success' => false, 'message' => 'Contract not found']);
            return;
        }
        
        // Validate currency if provided
        if (!empty($currency_code)) {
            // Use parameterized query to prevent SQL injection
            $currencyQuery = "SELECT code FROM currencies WHERE code = $1 AND is_active = true";
            $currencyResult = pg_query_params($conn, $currencyQuery, [$currency_code]);
            if (!$currencyResult || pg_num_rows($currencyResult) === 0) {
                echo json_encode(['success' => false, 'message' => 'Invalid currency code']);
                return;
            }
        }
        
        // Check if from/to combination already exists - use parameterized query
        $duplicateQuery = "SELECT id FROM vehicle_contract_routes 
                          WHERE vehicle_contract_id = $1 
                          AND from_location = $2 
                          AND to_location = $3";
        $duplicateResult = pg_query_params($conn, $duplicateQuery, [
            $contract_id,
            $from_location,
            $to_location
        ]);
        if ($duplicateResult && pg_num_rows($duplicateResult) > 0) {
            echo json_encode(['success' => false, 'message' => 'A route with the same From/To locations already exists']);
            return;
        }
        
        // Convert vehicle_type_prices to JSONB
        $vehicleTypePricesJson = json_encode($vehicle_type_prices, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
        
        if (!empty($vehicle_type_prices)) {
            error_log('Creating route with prices: ' . $vehicleTypePricesJson);
        }
        
        // Insert route using parameterized query
        $query = "INSERT INTO vehicle_contract_routes 
                 (vehicle_contract_id, from_location, to_location, 
                  vehicle_type_prices, currency_code, created_at)
                 VALUES ($1, $2, $3, $4::jsonb, $5, NOW())";
        
        $insertResult = pg_query_params($conn, $query, [
            $contract_id,
            $from_location,
            $to_location,
            $vehicleTypePricesJson,
            !empty($currency_code) ? $currency_code : null
        ]);
        
        if ($insertResult) {
            echo json_encode(['success' => true, 'message' => 'Route added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        error_log('Error in createContractRoute: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
    }
}

function deleteContractRoute($conn, $id) {
    $id = (int)$id;
    
    $query = "DELETE FROM vehicle_contract_routes WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function saveContractRoutes($conn, $data) {
    try {
        $contract_id = (int)($data['contract_id'] ?? 0);
        $columnMapping = $data['column_mapping'] ?? []; // Maps field names to Excel column indices
        $excelData = $data['excel_data'] ?? []; // Raw Excel rows
        $hasHeader = isset($data['has_header']) ? (bool)$data['has_header'] : false;
        $manualCurrency = isset($data['manual_currency']) ? trim($data['manual_currency']) : null;
        
        if ($contract_id <= 0 || empty($columnMapping) || empty($excelData)) {
            echo json_encode(['success' => false, 'message' => 'contract_id, column_mapping, and excel_data are required']);
            return;
        }
        
        // Verify contract exists - use parameterized query
        $contractQuery = "SELECT vehicle_company_id FROM vehicle_contracts WHERE id = $1";
        $contractResult = pg_query_params($conn, $contractQuery, [$contract_id]);
        if (!$contractResult || pg_num_rows($contractResult) === 0) {
            echo json_encode(['success' => false, 'message' => 'Contract not found']);
            return;
        }
        
        // Default currency (if not manually selected or from Excel)
        $defaultCurrencyCode = 'USD';
        try {
            $currencyQuery = "SELECT co.local_currency_code FROM vehicle_contracts vc
                             LEFT JOIN vehicle_companies vc2 ON vc.vehicle_company_id = vc2.id
                             LEFT JOIN cities c ON vc2.city_id = c.id
                             LEFT JOIN regions r ON c.region_id = r.id
                             LEFT JOIN countries co ON r.country_id = co.id
                             WHERE vc.id = $contract_id";
            $currencyResult = pg_query($conn, $currencyQuery);
            if ($currencyResult && ($currRow = pg_fetch_assoc($currencyResult))) {
                $lcc = trim($currRow['local_currency_code'] ?? '');
                if (!empty($lcc)) {
                    $defaultCurrencyCode = strtoupper($lcc);
                }
            }
        } catch (Exception $e) {
            error_log('Error fetching currency code: ' . $e->getMessage());
        }
        
        $savedCount = 0;
        $skippedCount = 0;
        
        // Get vehicle type mappings: { type_id => excel_column_index }
        $vehicleTypeMappings = $columnMapping['vehicle_types'] ?? [];
        
        // Build mapping: vehicle_type_id => excel_column_index
        // This will be used to create JSONB object with vehicle_type_id as key
        $vehicleTypeColumnMap = []; // Maps vehicle_type_id => excel_column_index
        if (!empty($vehicleTypeMappings)) {
            foreach ($vehicleTypeMappings as $typeId => $colIndex) {
                $vehicleTypeColumnMap[(int)$typeId] = (int)$colIndex;
            }
        }
        
        // Process Excel rows with column mapping
        foreach ($excelData as $row) {
            // Normalize row to ensure numeric indices (PhpSpreadsheet may return associative or mixed arrays)
            $normalizedRow = [];
            $rowIndex = 0;
            foreach ($row as $key => $value) {
                $normalizedRow[$rowIndex] = $value;
                $rowIndex++;
            }
            $row = $normalizedRow;
            
            // Get values based on mapping
            $fromLocation = isset($columnMapping['from_location']) && isset($row[$columnMapping['from_location']]) 
                ? trim($row[$columnMapping['from_location']]) : '';
            $toLocation = isset($columnMapping['to_location']) && isset($row[$columnMapping['to_location']]) 
                ? trim($row[$columnMapping['to_location']]) : '';
            
            if (empty($fromLocation) || empty($toLocation)) {
                $skippedCount++;
                continue;
            }
            
            // Get currency: manual > default
            $currencyCode = $defaultCurrencyCode;
            if (!empty($manualCurrency)) {
                // Manual currency selected for all rows
                $currencyCode = strtoupper($manualCurrency);
            }
            
            // Build JSONB object for vehicle type prices
            // Format: { "vehicle_type_id": price, ... }
            $vehicleTypePrices = [];
            foreach ($vehicleTypeColumnMap as $typeId => $colIndex) {
                // Get price from Excel row
                if (!isset($row[$colIndex])) {
                    continue;
                }
                $value = trim((string)$row[$colIndex]);
                // Remove any non-numeric characters except decimal point
                $value = preg_replace('/[^0-9.]/', '', $value);
                if (!empty($value)) {
                    $price = (float)$value;
                    if ($price > 0) {
                        // Store as string key (JSON keys are always strings, but we'll ensure consistency)
                        $vehicleTypePrices[(string)$typeId] = $price;
                    }
                }
            }
            
            if (!empty($vehicleTypePrices)) {
                error_log('Saving prices for route: ' . $fromLocation . ' -> ' . $toLocation);
                error_log('Vehicle type prices: ' . json_encode($vehicleTypePrices));
            }
            
            // If no prices found, still create empty object
            if (empty($vehicleTypePrices)) {
                $vehicleTypePrices = [];
            }
            
            // Convert PHP array to JSONB string
            $vehicleTypePricesJson = json_encode($vehicleTypePrices, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
            
            // Use parameterized query for safer JSONB insertion (avoids escaping issues)
            $query = "INSERT INTO vehicle_contract_routes 
                     (vehicle_contract_id, from_location, to_location, 
                      vehicle_type_prices, currency_code, created_at)
                     VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
                     ON CONFLICT (vehicle_contract_id, from_location, to_location) 
                     DO UPDATE SET 
                         vehicle_type_prices = $4::jsonb,
                         currency_code = $5,
                         updated_at = NOW()";
            
            $insertResult = pg_query_params($conn, $query, [
                $contract_id,
                $fromLocation,
                $toLocation,
                $vehicleTypePricesJson,
                $currencyCode
            ]);
            
            if ($insertResult) {
                $savedCount++;
            } else {
                $errorMsg = getDbErrorMessage($conn);
                error_log('Error inserting contract route: ' . $errorMsg);
                error_log('Route: ' . $fromLocation . ' -> ' . $toLocation);
                error_log('Prices JSON: ' . $vehicleTypePricesJson);
                error_log('Vehicle type mappings: ' . json_encode($vehicleTypeColumnMap));
                $skippedCount++;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "$savedCount routes imported successfully" . ($skippedCount > 0 ? ", $skippedCount skipped" : ''),
            'saved_count' => $savedCount,
            'skipped_count' => $skippedCount
        ]);
    } catch (Exception $e) {
        error_log('Error in saveContractRoutes: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() . ' | Trace: ' . $e->getTraceAsString());
        echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
    } catch (Error $e) {
        error_log('Fatal error in saveContractRoutes: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() . ' | Trace: ' . $e->getTraceAsString());
        echo json_encode(['success' => false, 'message' => 'A fatal error occurred: ' . $e->getMessage()]);
    }
}
?>

