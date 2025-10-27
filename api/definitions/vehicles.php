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
} finally {
    // Always close database connection
    if (isset($conn)) {
        closeDbConnection($conn);
    }
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
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
    
    $query = "UPDATE vehicle_companies SET name = '$name', city_id = $city_id, 
              contact_person = " . ($contact_person ? "'$contact_person'" : 'NULL') . ", 
              contact_email = " . ($contact_email ? "'$contact_email'" : 'NULL') . ", 
              contact_phone = " . ($contact_phone ? "'$contact_phone'" : 'NULL') . ", 
              updated_at = NOW() WHERE id = $id";
    $result = pg_query($conn, $query);
    
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
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
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
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
        $query = "SELECT vc.*, vc2.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
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
                echo json_encode(['success' => true, 'data' => [$contract]]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Contract not found']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } else if ($company_id) {
        $company_id = (int)$company_id;
        $query = "SELECT vc.*, vc2.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
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
            echo json_encode(['success' => true, 'data' => $contracts]);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } else {
        $query = "SELECT vc.*, vc2.name as company_name, c.name as city_name, r.name as region_name, co.name as country_name
                  FROM vehicle_contracts vc
                  LEFT JOIN vehicle_companies vc2 ON vc.vehicle_company_id = vc2.id
                  LEFT JOIN cities c ON vc2.city_id = c.id
                  LEFT JOIN regions r ON c.region_id = r.id
                  LEFT JOIN countries co ON r.country_id = co.id
                  ORDER BY vc.start_date DESC, vc.contract_code ASC";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $contracts = pg_fetch_all($result);
            echo json_encode(['success' => true, 'data' => $contracts]);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
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
        
        $query = "INSERT INTO vehicle_contracts (vehicle_company_id, contract_code, start_date, end_date, created_at)
                  VALUES ($vehicle_company_id, '$contract_code', '$start_date', '$end_date', NOW()) RETURNING id";
        
        $result = pg_query($conn, $query);
        
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
        
        $query = "UPDATE vehicle_contracts SET 
                  vehicle_company_id = $vehicle_company_id,
                  contract_code = '$contract_code',
                  start_date = '$start_date',
                  end_date = '$end_date',
                  updated_at = NOW()
                  WHERE id = $id";
        
        $result = pg_query($conn, $query);
        
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
        
        // Check file extension
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['xlsx', 'xls'])) {
            echo json_encode(['success' => false, 'message' => 'Invalid file format. Only .xlsx and .xls files are allowed']);
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
            
            $contract_code = pg_escape_string($conn, $contract_code);
            $start_date = pg_escape_string($conn, $start_date);
            $end_date = pg_escape_string($conn, $end_date);
            
            $query = "INSERT INTO vehicle_contracts (vehicle_company_id, contract_code, start_date, end_date, created_at)
                      VALUES ($vehicle_company_id, '$contract_code', '$start_date', '$end_date', NOW())";
            
            $result = pg_query($conn, $query);
            
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
?>

