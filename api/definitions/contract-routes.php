<?php
/**
 * Contract Routes API
 * Handles all CRUD operations for vehicle contract routes
 */

// Start output buffering to catch any errors
ob_start();

// Define API_REQUEST before loading config to prevent error display
define('API_REQUEST', true);

// Disable error display for API requests (errors will still be logged)
ini_set('display_errors', 0);
error_reporting(E_ALL); // Still log errors but don't display

session_start();

// Check if user is logged in first
if (!isset($_SESSION['user_id'])) {
    ob_end_clean();
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Load central configuration
require_once __DIR__ . '/../../config.php';

// Clear any output that might have been generated
ob_end_clean();

// Set JSON header for all responses
header('Content-Type: application/json');

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
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    while (ob_get_level()) ob_end_clean();
    $errorMsg = APP_DEBUG ? $e->getMessage() : 'An error occurred';
    echo json_encode(['success' => false, 'message' => $errorMsg, 'debug' => APP_DEBUG ? [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ] : null]);
} catch (Error $e) {
    while (ob_get_level()) ob_end_clean();
    $errorMsg = APP_DEBUG ? $e->getMessage() : 'An error occurred';
    echo json_encode(['success' => false, 'message' => $errorMsg, 'debug' => APP_DEBUG ? [
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ] : null]);
} finally {
    // Always close database connection
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'routes':
            $contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : null;
            getRoutes($conn, $contract_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    switch ($action) {
        case 'route':
            $data = json_decode(file_get_contents('php://input'), true);
            createRoute($conn, $data);
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
        case 'route':
            updateRoute($conn, $data);
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
        case 'route':
            deleteRoute($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get routes
function getRoutes($conn, $contract_id = null) {
    if ($contract_id) {
        $contract_id = (int)$contract_id;
        $query = "SELECT * FROM vehicle_contract_routes 
                  WHERE vehicle_contract_id = $contract_id 
                  ORDER BY from_location ASC, to_location ASC";
    } else {
        $query = "SELECT * FROM vehicle_contract_routes 
                  ORDER BY vehicle_contract_id ASC, from_location ASC, to_location ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $routes = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $routes]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Create route
function createRoute($conn, $data) {
    try {
        $vehicle_contract_id = (int)$data['vehicle_contract_id'];
        $from_location = pg_escape_string($conn, $data['from_location']);
        $to_location = pg_escape_string($conn, $data['to_location']);
        $vip_mini_price = isset($data['vip_mini_price']) && $data['vip_mini_price'] !== '' ? (float)$data['vip_mini_price'] : null;
        $mini_price = isset($data['mini_price']) && $data['mini_price'] !== '' ? (float)$data['mini_price'] : null;
        $midi_price = isset($data['midi_price']) && $data['midi_price'] !== '' ? (float)$data['midi_price'] : null;
        $bus_price = isset($data['bus_price']) && $data['bus_price'] !== '' ? (float)$data['bus_price'] : null;
        $currency = pg_escape_string($conn, $data['currency'] ?? 'USD');
        
        // Validate required fields
        if (empty($from_location) || empty($to_location)) {
            echo json_encode(['success' => false, 'message' => 'From and To locations are required']);
            return;
        }
        
        $query = "INSERT INTO vehicle_contract_routes (
                  vehicle_contract_id, from_location, to_location, 
                  vip_mini_price, mini_price, midi_price, bus_price, currency, created_at)
                  VALUES ($vehicle_contract_id, '$from_location', '$to_location', " . 
                  ($vip_mini_price !== null ? $vip_mini_price : 'NULL') . ", " .
                  ($mini_price !== null ? $mini_price : 'NULL') . ", " .
                  ($midi_price !== null ? $midi_price : 'NULL') . ", " .
                  ($bus_price !== null ? $bus_price : 'NULL') . ", 
                  '$currency', NOW()) RETURNING id";
        
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

// Update route
function updateRoute($conn, $data) {
    try {
        $id = (int)$data['id'];
        $vehicle_contract_id = (int)$data['vehicle_contract_id'];
        $from_location = pg_escape_string($conn, $data['from_location']);
        $to_location = pg_escape_string($conn, $data['to_location']);
        $vip_mini_price = isset($data['vip_mini_price']) && $data['vip_mini_price'] !== '' ? (float)$data['vip_mini_price'] : null;
        $mini_price = isset($data['mini_price']) && $data['mini_price'] !== '' ? (float)$data['mini_price'] : null;
        $midi_price = isset($data['midi_price']) && $data['midi_price'] !== '' ? (float)$data['midi_price'] : null;
        $bus_price = isset($data['bus_price']) && $data['bus_price'] !== '' ? (float)$data['bus_price'] : null;
        $currency = pg_escape_string($conn, $data['currency'] ?? 'USD');
        
        // Validate required fields
        if (empty($from_location) || empty($to_location)) {
            echo json_encode(['success' => false, 'message' => 'From and To locations are required']);
            return;
        }
        
        $query = "UPDATE vehicle_contract_routes SET 
                  vehicle_contract_id = $vehicle_contract_id,
                  from_location = '$from_location',
                  to_location = '$to_location',
                  vip_mini_price = " . ($vip_mini_price !== null ? $vip_mini_price : 'NULL') . ",
                  mini_price = " . ($mini_price !== null ? $mini_price : 'NULL') . ",
                  midi_price = " . ($midi_price !== null ? $midi_price : 'NULL') . ",
                  bus_price = " . ($bus_price !== null ? $bus_price : 'NULL') . ",
                  currency = '$currency',
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

// Delete route
function deleteRoute($conn, $id) {
    $id = (int)$id;
    $query = "DELETE FROM vehicle_contract_routes WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Upload Excel
function uploadExcel($conn) {
    // Clear any output buffer
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    try {
        // Check if file was uploaded
        if (!isset($_FILES['excel_file'])) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'No file uploaded']);
            exit;
        }
        
        // Check upload error
        if ($_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
            ];
            $errorMsg = $errorMessages[$_FILES['excel_file']['error']] ?? 'Unknown upload error: ' . $_FILES['excel_file']['error'];
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'File upload failed: ' . $errorMsg]);
            exit;
        }
        
        // Check required POST fields
        if (!isset($_POST['contract_id']) || empty($_POST['contract_id'])) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Contract ID is required']);
            exit;
        }
        
        if (!isset($_POST['currency']) || empty($_POST['currency'])) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Currency is required']);
            exit;
        }
        
        $contract_id = (int)$_POST['contract_id'];
        $currency = pg_escape_string($conn, $_POST['currency']);
        $file = $_FILES['excel_file'];
        
        // Check file extension
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['xlsx', 'xls'])) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Invalid file format. Only .xlsx and .xls files are allowed']);
            exit;
        }
        
        // Check if PhpSpreadsheet is available
        if (!file_exists(__DIR__ . '/../../vendor/autoload.php')) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Composer autoload not found. Please run: composer install']);
            exit;
        }
        
        require_once __DIR__ . '/../../vendor/autoload.php';
        
        if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'PhpSpreadsheet library not found. Please run: composer install']);
            exit;
        }
        
        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file['tmp_name']);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
        } catch (Exception $e) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Failed to read Excel file: ' . $e->getMessage()]);
            exit;
        }
        
        // Skip header row
        if (count($rows) > 0) {
            array_shift($rows);
        }
        
        $successCount = 0;
        $errorCount = 0;
        $errors = [];
        
        if (empty($rows)) {
            while (ob_get_level()) ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Excel file is empty or has no data rows']);
            exit;
        }
        
        foreach ($rows as $index => $row) {
            try {
                // Expected format: From (A), To (B), Vip Mini (C), Mini (D), Midi (E), Bus (F)
                if (count($row) < 2) continue;
                
                $from_location = trim($row[0] ?? '');
                $to_location = trim($row[1] ?? '');
                $vip_mini_price = !empty($row[2]) && is_numeric($row[2]) ? (float)$row[2] : null;
                $mini_price = !empty($row[3]) && is_numeric($row[3]) ? (float)$row[3] : null;
                $midi_price = !empty($row[4]) && is_numeric($row[4]) ? (float)$row[4] : null;
                $bus_price = !empty($row[5]) && is_numeric($row[5]) ? (float)$row[5] : null;
                
                if (empty($from_location) || empty($to_location)) {
                    $errorCount++;
                    $errors[] = "Row " . ($index + 2) . ": Missing required fields (From or To)";
                    continue;
                }
                
                $from_location = pg_escape_string($conn, $from_location);
                $to_location = pg_escape_string($conn, $to_location);
                
                // Check if route already exists
                $checkQuery = "SELECT id FROM vehicle_contract_routes 
                              WHERE vehicle_contract_id = $contract_id 
                              AND from_location = '$from_location' 
                              AND to_location = '$to_location'";
                $checkResult = pg_query($conn, $checkQuery);
                
                if (!$checkResult) {
                    $errorCount++;
                    $errors[] = "Row " . ($index + 2) . ": Database query error - " . getDbErrorMessage($conn);
                    continue;
                }
                
                if (pg_num_rows($checkResult) > 0) {
                    // Update existing route
                    $updateQuery = "UPDATE vehicle_contract_routes SET 
                                  vip_mini_price = " . ($vip_mini_price !== null ? $vip_mini_price : 'NULL') . ",
                                  mini_price = " . ($mini_price !== null ? $mini_price : 'NULL') . ",
                                  midi_price = " . ($midi_price !== null ? $midi_price : 'NULL') . ",
                                  bus_price = " . ($bus_price !== null ? $bus_price : 'NULL') . ",
                                  updated_at = NOW()
                                  WHERE vehicle_contract_id = $contract_id 
                                  AND from_location = '$from_location' 
                                  AND to_location = '$to_location'";
                    
                    $result = pg_query($conn, $updateQuery);
                    if ($result) {
                        $successCount++;
                    } else {
                        $errorCount++;
                        $errors[] = "Row " . ($index + 2) . ": " . getDbErrorMessage($conn);
                    }
                } else {
                    // Insert new route
                    $insertQuery = "INSERT INTO vehicle_contract_routes (
                                  vehicle_contract_id, from_location, to_location, 
                                  vip_mini_price, mini_price, midi_price, bus_price, currency, created_at)
                                  VALUES ($contract_id, '$from_location', '$to_location', " . 
                                  ($vip_mini_price !== null ? $vip_mini_price : 'NULL') . ", " .
                                  ($mini_price !== null ? $mini_price : 'NULL') . ", " .
                                  ($midi_price !== null ? $midi_price : 'NULL') . ", " .
                                  ($bus_price !== null ? $bus_price : 'NULL') . ", 
                                  '$currency', NOW())";
                    
                    $result = pg_query($conn, $insertQuery);
                    if ($result) {
                        $successCount++;
                    } else {
                        $errorCount++;
                        $errors[] = "Row " . ($index + 2) . ": " . getDbErrorMessage($conn);
                    }
                }
            } catch (Exception $rowError) {
                $errorCount++;
                $errors[] = "Row " . ($index + 2) . ": " . $rowError->getMessage();
            }
        }
        
        $response = [
            'success' => $errorCount === 0,
            'message' => "Imported $successCount routes successfully" . ($errorCount > 0 ? ". $errorCount errors occurred." : ''),
            'success_count' => $successCount,
            'error_count' => $errorCount,
            'errors' => $errors
        ];
        
        // Clear output and send JSON
        while (ob_get_level()) {
            ob_end_clean();
        }
        echo json_encode($response);
        exit;
    } catch (Exception $e) {
        // Clear output and send error JSON
        while (ob_get_level()) {
            ob_end_clean();
        }
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}
?>

