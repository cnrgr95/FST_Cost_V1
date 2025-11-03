<?php
/**
 * Merchant Contracts API
 * Handles contract operations for merchants
 */

// Start output buffering to catch any errors
ob_start();

// Define API_REQUEST before loading config to prevent error display
define('API_REQUEST', true);

// Disable error display for API requests (errors will still be logged)
ini_set('display_errors', 0);
error_reporting(E_ALL); // Still log errors but don't display

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON header early
header('Content-Type: application/json; charset=utf-8');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
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
    $msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'Configuration error';
    echo json_encode(['success' => false, 'message' => $msg]);
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
    error_log("API Error in merchant-contracts.php: " . $e->getMessage());
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    $errorMsg = APP_DEBUG ? $e->getMessage() : 'An error occurred';
    echo json_encode(['success' => false, 'message' => $errorMsg]);
    exit;
} catch (Error $e) {
    error_log("Fatal Error in merchant-contracts.php: " . $e->getMessage());
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    $errorMsg = APP_DEBUG ? $e->getMessage() : 'An error occurred';
    echo json_encode(['success' => false, 'message' => $errorMsg]);
    exit;
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
        case 'contracts':
            $merchant_id = isset($_GET['merchant_id']) ? (int)$_GET['merchant_id'] : null;
            getContracts($conn, $merchant_id);
            break;
        case 'contract':
            $contract_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            getContract($conn, $contract_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'contract':
            createContract($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'contract':
            updateContract($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// DELETE request handler
function handleDelete($conn, $action) {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    switch ($action) {
        case 'contract':
            deleteContract($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Generate contract code (FST-03-******)
function generateContractCode($conn) {
    try {
        // Check if merchant_contracts table exists
        $checkTableQuery = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'merchant_contracts'
        )";
        $checkResult = pg_query($conn, $checkTableQuery);
        
        if (!$checkResult) {
            throw new Exception('Failed to check table existence');
        }
        
        $tableExists = pg_fetch_result($checkResult, 0, 0) === 't';
        
        if (!$tableExists) {
            echo json_encode(['success' => false, 'message' => 'merchant_contracts table does not exist. Please create the table first.']);
            return;
        }
        
        // Get the highest contract code number with FST-03- prefix
        $query = "SELECT contract_code FROM merchant_contracts 
                  WHERE contract_code LIKE 'FST-03-%' 
                  ORDER BY contract_code DESC LIMIT 1";
        
        $result = pg_query($conn, $query);
        
        $nextNumber = 1;
        if ($result && pg_num_rows($result) > 0) {
            $row = pg_fetch_assoc($result);
            $lastCode = $row['contract_code'];
            // Extract number from format FST-03-00001
            if (preg_match('/FST-03-(\d+)$/', $lastCode, $matches)) {
                $nextNumber = (int)$matches[1] + 1;
            }
        }
        
        // Format: FST-03-00001 (5 digits)
        $contractCode = 'FST-03-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        
        echo json_encode(['success' => true, 'contract_code' => $contractCode]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get contracts
function getContracts($conn, $merchant_id = null) {
    try {
        // Check if merchant_contracts table exists
        $checkTableQuery = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'merchant_contracts'
        )";
        $checkResult = pg_query($conn, $checkTableQuery);
        
        if (!$checkResult) {
            throw new Exception('Failed to check table existence');
        }
        
        $tableExists = pg_fetch_result($checkResult, 0, 0) === 't';
        
        if (!$tableExists) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }
        
        if ($merchant_id) {
            $merchant_id = (int)$merchant_id;
            $query = "SELECT mc.*, m.name as merchant_name, m.official_title as merchant_official_title
                      FROM merchant_contracts mc
                      LEFT JOIN merchants m ON mc.merchant_id = m.id
                      WHERE mc.merchant_id = $1
                      ORDER BY mc.start_date DESC, mc.contract_code ASC";
            $result = pg_query_params($conn, $query, [$merchant_id]);
        } else {
            $query = "SELECT mc.*, m.name as merchant_name, m.official_title as merchant_official_title
                      FROM merchant_contracts mc
                      LEFT JOIN merchants m ON mc.merchant_id = m.id
                      ORDER BY mc.start_date DESC, mc.contract_code ASC";
            $result = pg_query($conn, $query);
        }
        
        if ($result) {
            $contracts = pg_fetch_all($result);
            if ($contracts === false) {
                $contracts = [];
            }
            echo json_encode(['success' => true, 'data' => $contracts]);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get single contract
function getContract($conn, $contract_id) {
    try {
        if ($contract_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid contract ID']);
            return;
        }
        
        // Check if merchant_contracts table exists
        $checkTableQuery = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'merchant_contracts'
        )";
        $checkResult = pg_query($conn, $checkTableQuery);
        
        if (!$checkResult) {
            throw new Exception('Failed to check table existence');
        }
        
        $tableExists = pg_fetch_result($checkResult, 0, 0) === 't';
        
        if (!$tableExists) {
            echo json_encode(['success' => false, 'message' => 'Contract not found']);
            return;
        }
        
        $query = "SELECT mc.*, m.name as merchant_name, m.official_title as merchant_official_title
                  FROM merchant_contracts mc
                  LEFT JOIN merchants m ON mc.merchant_id = m.id
                  WHERE mc.id = $1";
        
        $result = pg_query_params($conn, $query, [$contract_id]);
        
        if ($result && pg_num_rows($result) > 0) {
            $contract = pg_fetch_assoc($result);
            echo json_encode(['success' => true, 'data' => [$contract]]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contract not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Create contract
function createContract($conn, $data) {
    try {
        // Check if merchant_contracts table exists
        $checkTableQuery = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'merchant_contracts'
        )";
        $checkResult = pg_query($conn, $checkTableQuery);
        
        if (!$checkResult) {
            throw new Exception('Failed to check table existence');
        }
        
        $tableExists = pg_fetch_result($checkResult, 0, 0) === 't';
        
        if (!$tableExists) {
            echo json_encode(['success' => false, 'message' => 'merchant_contracts table does not exist. Please create the table first.']);
            return;
        }
        
        $merchant_id = (int)$data['merchant_id'];
        $tour_id = isset($data['tour_id']) && !empty($data['tour_id']) ? (int)$data['tour_id'] : null;
        $contract_code = pg_escape_string($conn, $data['contract_code']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        
        // Validate required fields
        if (empty($merchant_id) || $merchant_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Merchant ID is required']);
            return;
        }
        
        if (empty($contract_code) || empty($start_date) || empty($end_date)) {
            echo json_encode(['success' => false, 'message' => 'All required fields must be filled']);
            return;
        }
        
        // Validate dates
        if (strtotime($start_date) > strtotime($end_date)) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        // Check if merchant exists
        $merchantQuery = "SELECT id FROM merchants WHERE id = $1";
        $merchantResult = pg_query_params($conn, $merchantQuery, [$merchant_id]);
        
        if (!$merchantResult || pg_num_rows($merchantResult) === 0) {
            echo json_encode(['success' => false, 'message' => 'Merchant not found']);
            return;
        }
        
        // Check if contract code already exists
        $checkCodeQuery = "SELECT id FROM merchant_contracts WHERE contract_code = $1";
        $checkCodeResult = pg_query_params($conn, $checkCodeQuery, [$contract_code]);
        
        if ($checkCodeResult && pg_num_rows($checkCodeResult) > 0) {
            echo json_encode(['success' => false, 'message' => 'Contract code already exists']);
            return;
        }
        
        // Check for overlapping date ranges for the same merchant
        $overlapQuery = "SELECT id, contract_code, start_date, end_date 
                         FROM merchant_contracts 
                         WHERE merchant_id = $1 
                         AND (start_date <= $2 AND end_date >= $3)";
        $overlapResult = pg_query_params($conn, $overlapQuery, [
            $merchant_id,
            $end_date,
            $start_date
        ]);
        
        if ($overlapResult && pg_num_rows($overlapResult) > 0) {
            $overlapping = pg_fetch_assoc($overlapResult);
            echo json_encode([
                'success' => false, 
                'message' => 'A contract with overlapping date range already exists. Existing contract: ' . 
                           $overlapping['contract_code'] . ' (' . $overlapping['start_date'] . ' - ' . $overlapping['end_date'] . ')'
            ]);
            return;
        }
        
        // Insert contract
        if ($tour_id) {
            $query = "INSERT INTO merchant_contracts (merchant_id, tour_id, contract_code, start_date, end_date, created_at)
                      VALUES ($1, $2, $3, $4, $5, NOW())
                      RETURNING id";
            
            $result = pg_query_params($conn, $query, [
                $merchant_id,
                $tour_id,
                $contract_code,
                $start_date,
                $end_date
            ]);
        } else {
            $query = "INSERT INTO merchant_contracts (merchant_id, contract_code, start_date, end_date, created_at)
                      VALUES ($1, $2, $3, $4, NOW())
                      RETURNING id";
            
            $result = pg_query_params($conn, $query, [
                $merchant_id,
                $contract_code,
                $start_date,
                $end_date
            ]);
        }
        
        if ($result) {
            $row = pg_fetch_assoc($result);
            echo json_encode([
                'success' => true, 
                'id' => $row['id'],
                'message' => 'Contract created successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Update contract
function updateContract($conn, $data) {
    try {
        // Check if merchant_contracts table exists
        $checkTableQuery = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'merchant_contracts'
        )";
        $checkResult = pg_query($conn, $checkTableQuery);
        
        if (!$checkResult) {
            throw new Exception('Failed to check table existence');
        }
        
        $tableExists = pg_fetch_result($checkResult, 0, 0) === 't';
        
        if (!$tableExists) {
            echo json_encode(['success' => false, 'message' => 'merchant_contracts table does not exist. Please create the table first.']);
            return;
        }
        
        $id = (int)$data['id'];
        $merchant_id = (int)$data['merchant_id'];
        $tour_id = isset($data['tour_id']) && !empty($data['tour_id']) ? (int)$data['tour_id'] : null;
        $contract_code = pg_escape_string($conn, $data['contract_code']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        
        // Validate required fields
        if (empty($id) || $id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Contract ID is required']);
            return;
        }
        
        if (empty($contract_code) || empty($start_date) || empty($end_date)) {
            echo json_encode(['success' => false, 'message' => 'All required fields must be filled']);
            return;
        }
        
        // Validate dates
        if (strtotime($start_date) > strtotime($end_date)) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        // Check for overlapping date ranges (excluding current contract)
        $overlapQuery = "SELECT id, contract_code, start_date, end_date 
                         FROM merchant_contracts 
                         WHERE merchant_id = $1 
                         AND id != $2
                         AND (start_date <= $3 AND end_date >= $4)";
        $overlapResult = pg_query_params($conn, $overlapQuery, [
            $merchant_id,
            $id,
            $end_date,
            $start_date
        ]);
        
        if ($overlapResult && pg_num_rows($overlapResult) > 0) {
            $overlapping = pg_fetch_assoc($overlapResult);
            echo json_encode([
                'success' => false, 
                'message' => 'A contract with overlapping date range already exists. Existing contract: ' . 
                           $overlapping['contract_code'] . ' (' . $overlapping['start_date'] . ' - ' . $overlapping['end_date'] . ')'
            ]);
            return;
        }
        
        // Update contract
        if ($tour_id) {
            $query = "UPDATE merchant_contracts SET 
                      merchant_id = $1,
                      tour_id = $2,
                      contract_code = $3,
                      start_date = $4,
                      end_date = $5,
                      updated_at = NOW()
                      WHERE id = $6
                      RETURNING id";
            
            $result = pg_query_params($conn, $query, [
                $merchant_id,
                $tour_id,
                $contract_code,
                $start_date,
                $end_date,
                $id
            ]);
        } else {
            $query = "UPDATE merchant_contracts SET 
                      merchant_id = $1,
                      tour_id = NULL,
                      contract_code = $2,
                      start_date = $3,
                      end_date = $4,
                      updated_at = NOW()
                      WHERE id = $5
                      RETURNING id";
            
            $result = pg_query_params($conn, $query, [
                $merchant_id,
                $contract_code,
                $start_date,
                $end_date,
                $id
            ]);
        }
        
        if ($result && pg_num_rows($result) > 0) {
            echo json_encode([
                'success' => true, 
                'message' => 'Contract updated successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Delete contract
function deleteContract($conn, $id) {
    try {
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid contract ID']);
            return;
        }
        
        // Check if merchant_contracts table exists
        $checkTableQuery = "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'merchant_contracts'
        )";
        $checkResult = pg_query($conn, $checkTableQuery);
        
        if (!$checkResult) {
            throw new Exception('Failed to check table existence');
        }
        
        $tableExists = pg_fetch_result($checkResult, 0, 0) === 't';
        
        if (!$tableExists) {
            echo json_encode(['success' => false, 'message' => 'Contract not found']);
            return;
        }
        
        $query = "DELETE FROM merchant_contracts WHERE id = $1";
        $result = pg_query_params($conn, $query, [$id]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Contract deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

