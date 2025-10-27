<?php
/**
 * Contracts API
 * Handles all CRUD operations for contracts
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
header('Content-Type: application/json');

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
    require_once __DIR__ . '/../config.php';
} catch (Throwable $e) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    header('Content-Type: application/json');
    $msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'Configuration error';
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

// Clear any output that might have been generated
if (ob_get_level() > 0) {
    ob_end_clean();
}

// Ensure JSON header is set
header('Content-Type: application/json');

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
    header('Content-Type: application/json');
    $msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() : 'Database connection failed';
    echo json_encode(['success' => false, 'message' => $msg]);
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
} catch (Throwable $e) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    header('Content-Type: application/json');
    $errorMsg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() : 'An error occurred';
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
        case 'contracts':
            getContracts($conn);
            break;
        case 'sub_regions':
            getSubRegions($conn);
            break;
        case 'merchants':
            $sub_region_id = isset($_GET['sub_region_id']) ? (int)$_GET['sub_region_id'] : null;
            getMerchants($conn, $sub_region_id);
            break;
        case 'tours':
            $merchant_id = isset($_GET['merchant_id']) ? (int)$_GET['merchant_id'] : null;
            getTours($conn, $merchant_id);
            break;
        case 'currencies':
            getCurrencies($conn);
            break;
        case 'tour_regions':
            $tour_id = isset($_GET['tour_id']) ? (int)$_GET['tour_id'] : null;
            getTourRegions($conn, $tour_id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // CSRF protection for POST requests (only if token is provided)
    if (isset($data[CSRF_TOKEN_NAME])) {
        requireCsrfToken();
    }
    
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
    
    // CSRF protection for PUT requests (only if token is provided)
    if (isset($data[CSRF_TOKEN_NAME])) {
        requireCsrfToken();
    }
    
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
    $id = $_GET['id'] ?? null;
    
    // CSRF protection for DELETE requests (optional for now, will be enforced later)
    if (isset($_GET[CSRF_TOKEN_NAME])) {
        requireCsrfToken();
    }
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID is required']);
        return;
    }
    
    switch ($action) {
        case 'contract':
            deleteContract($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get contracts
function getContracts($conn) {
    try {
        // Main query - safe (no user input)
        $query = "SELECT c.*, 
                         sr.name as sub_region_name,
                         m.name as merchant_name,
                         m.official_title as merchant_official_title,
                         m.authorized_person as merchant_authorized_person,
                         m.authorized_email as merchant_authorized_email,
                         t.name as tour_name
                  FROM contracts c
                  LEFT JOIN sub_regions sr ON c.sub_region_id = sr.id
                  LEFT JOIN merchants m ON c.merchant_id = m.id
                  LEFT JOIN tours t ON c.tour_id = t.id
                  ORDER BY c.created_at DESC";
        
        // Use pg_query for now (dbQueryAll might have issues)
        $result = pg_query($conn, $query);
        
        if (!$result) {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Database query failed';
            echo json_encode(['success' => false, 'message' => $errorMsg]);
            return;
        }
        
        $contracts = pg_fetch_all($result);
        if ($contracts === false) {
            $contracts = [];
        }
        
        if (empty($contracts)) {
            echo json_encode(['success' => true, 'data' => []]);
            return;
        }
        
        // Optimize: Get all regional prices in one query instead of N+1
        $contract_ids = array_column($contracts, 'id');
        
        if (!empty($contract_ids)) {
            // Get all regional prices at once using IN clause
            $ids_str = implode(',', array_map('intval', $contract_ids));
            $pricesQuery = "SELECT crp.*, sr.name as sub_region_name
                           FROM contract_regional_prices crp
                           LEFT JOIN sub_regions sr ON crp.sub_region_id = sr.id
                           WHERE crp.contract_id IN ($ids_str)";
            
            $pricesResult = pg_query($conn, $pricesQuery);
            if ($pricesResult) {
                $allPrices = pg_fetch_all($pricesResult);
                if ($allPrices === false) {
                    $allPrices = [];
                }
            } else {
                $allPrices = [];
            }
        } else {
            $allPrices = [];
        }
        
        // Group prices by contract_id
        $pricesByContract = [];
        foreach ($allPrices as $price) {
            $pricesByContract[$price['contract_id']][] = $price;
        }
        
        // Attach prices to contracts
        foreach ($contracts as &$contract) {
            $contract_id = $contract['id'];
            $contract['regional_prices'] = $pricesByContract[$contract_id] ?? [];
            
            // Default price_type if not set
            if (!isset($contract['price_type'])) {
                $contract['price_type'] = 'regional';
            }
        }
        
        echo json_encode(['success' => true, 'data' => $contracts]);
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'An error occurred';
        echo json_encode(['success' => false, 'message' => $errorMsg]);
    }
}

// Get sub regions
function getSubRegions($conn) {
    $query = "SELECT sr.*, c.name as city_name 
              FROM sub_regions sr 
              LEFT JOIN cities c ON sr.city_id = c.id 
              ORDER BY sr.name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $subRegions = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $subRegions]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get merchants by sub region
function getMerchants($conn, $sub_region_id) {
    if (!$sub_region_id) {
        echo json_encode(['success' => false, 'message' => 'Sub region ID is required']);
        return;
    }
    
    $sub_region_id = (int)$sub_region_id;
    $query = "SELECT id, name, official_title, authorized_person, authorized_email 
              FROM merchants 
              WHERE sub_region_id = $sub_region_id 
              ORDER BY name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $merchants = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $merchants]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get tours by merchant
function getTours($conn, $merchant_id) {
    if (!$merchant_id) {
        echo json_encode(['success' => false, 'message' => 'Merchant ID is required']);
        return;
    }
    
    $merchant_id = (int)$merchant_id;
    $query = "SELECT id, name, sejour_tour_code 
              FROM tours 
              WHERE merchant_id = $merchant_id 
              ORDER BY name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $tours = pg_fetch_all($result);
        echo json_encode(['success' => true, 'data' => $tours]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get currencies
function getCurrencies($conn) {
    $query = "SELECT code, name, symbol FROM currencies WHERE is_active = true ORDER BY code ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $currencies = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $currencies]);
    } else {
        // If table doesn't exist, return default currencies
        echo json_encode(['success' => true, 'data' => [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
            ['code' => 'TL', 'name' => 'Turkish Lira', 'symbol' => '₺'],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£']
        ]]);
    }
}

// Get tour regions
function getTourRegions($conn, $tour_id) {
    if (!$tour_id) {
        echo json_encode(['success' => false, 'message' => 'Tour ID is required']);
        return;
    }
    
    $tour_id = (int)$tour_id;
    $query = "SELECT tsr.sub_region_id, sr.name as sub_region_name, sr.city_id,
                     c.name as city_name, r.name as region_name, co.name as country_name
              FROM tour_sub_regions tsr
              LEFT JOIN sub_regions sr ON tsr.sub_region_id = sr.id
              LEFT JOIN cities c ON sr.city_id = c.id
              LEFT JOIN regions r ON c.region_id = r.id
              LEFT JOIN countries co ON r.country_id = co.id
              WHERE tsr.tour_id = $tour_id
              ORDER BY sr.name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $regions = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $regions]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Create contract
function createContract($conn, $data) {
    // Validate required fields
    if (empty($data['sub_region_id']) || empty($data['merchant_id']) || empty($data['tour_id'])) {
        echo json_encode(['success' => false, 'message' => 'Sub region, merchant, and tour are required']);
        return;
    }
    
    if (empty($data['start_date']) || empty($data['end_date'])) {
        echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
        return;
    }
    
    $sub_region_id = (int)$data['sub_region_id'];
    $merchant_id = (int)$data['merchant_id'];
    $tour_id = (int)$data['tour_id'];
    $vat_included = $data['vat_included'] === 'included' ? true : false;
    $vat_rate = isset($data['vat_rate']) && $data['vat_rate'] !== '' ? (float)$data['vat_rate'] : null;
    $price = isset($data['price']) && $data['price'] !== '' ? (float)$data['price'] : null;
    $adult_age = pg_escape_string($conn, $data['adult_age'] ?? '');
    $adult_price = isset($data['adult_price']) && $data['adult_price'] !== '' ? (float)$data['adult_price'] : null;
    $adult_currency = pg_escape_string($conn, $data['adult_currency'] ?? 'USD');
    $child_age_range = pg_escape_string($conn, $data['child_age_range'] ?? '');
    $child_price = isset($data['child_price']) && $data['child_price'] !== '' ? (float)$data['child_price'] : null;
    $child_currency = pg_escape_string($conn, $data['child_currency'] ?? 'USD');
    $infant_age_range = pg_escape_string($conn, $data['infant_age_range'] ?? '');
    $infant_price = isset($data['infant_price']) && $data['infant_price'] !== '' ? (float)$data['infant_price'] : null;
    $infant_currency = pg_escape_string($conn, $data['infant_currency'] ?? 'USD');
    $kickback_type = pg_escape_string($conn, $data['kickback_type'] ?? '');
    $kickback_value = isset($data['kickback_value']) && $data['kickback_value'] !== '' ? (float)$data['kickback_value'] : null;
    $kickback_currency = pg_escape_string($conn, $data['kickback_currency'] ?? '');
    $kickback_per_person = isset($data['kickback_per_person']) ? (bool)$data['kickback_per_person'] : false;
    $kickback_min_persons = isset($data['kickback_min_persons']) && $data['kickback_min_persons'] !== '' ? (int)$data['kickback_min_persons'] : null;
    $price_type = pg_escape_string($conn, $data['price_type'] ?? 'regional');
    $contract_currency = pg_escape_string($conn, $data['contract_currency'] ?? 'USD');
    $included_content = pg_escape_string($conn, $data['included_content'] ?? '');
    $start_date = pg_escape_string($conn, $data['start_date']);
    $end_date = pg_escape_string($conn, $data['end_date']);
    
    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        echo json_encode(['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
        return;
    }
    
    // Validate dates
    if ($start_date && $end_date && $end_date < $start_date) {
        echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
        return;
    }
    
    // Transfer fields - CRITICAL FIX: These were missing!
    $transfer_owner = pg_escape_string($conn, $data['transfer_owner'] ?? '');
    $transfer_price_type = pg_escape_string($conn, $data['transfer_price_type'] ?? '');
    $transfer_price = isset($data['transfer_price']) && $data['transfer_price'] !== '' ? (float)$data['transfer_price'] : null;
    $transfer_currency = pg_escape_string($conn, $data['transfer_currency'] ?? '');
    $transfer_price_mini = isset($data['transfer_price_mini']) && $data['transfer_price_mini'] !== '' ? (float)$data['transfer_price_mini'] : null;
    $transfer_price_midi = isset($data['transfer_price_midi']) && $data['transfer_price_midi'] !== '' ? (float)$data['transfer_price_midi'] : null;
    $transfer_price_bus = isset($data['transfer_price_bus']) && $data['transfer_price_bus'] !== '' ? (float)$data['transfer_price_bus'] : null;
    $transfer_currency_fixed = pg_escape_string($conn, $data['transfer_currency_fixed'] ?? '');
    
    // Validate currency codes (basic validation)
    $validCurrencies = ['USD', 'EUR', 'TL', 'GBP', 'TRY'];
    if (!empty($contract_currency) && !in_array(strtoupper($contract_currency), $validCurrencies)) {
        // Allow other currencies but log warning
        $contract_currency = strtoupper(substr($contract_currency, 0, 3));
    }
    
    // Handle fixed prices if price_type is 'fixed'
    if ($price_type === 'fixed') {
        $fixed_adult_price = isset($data['fixed_adult_price']) && $data['fixed_adult_price'] !== '' ? (float)$data['fixed_adult_price'] : null;
        $fixed_child_price = isset($data['fixed_child_price']) && $data['fixed_child_price'] !== '' ? (float)$data['fixed_child_price'] : null;
        $fixed_infant_price = isset($data['fixed_infant_price']) && $data['fixed_infant_price'] !== '' ? (float)$data['fixed_infant_price'] : null;
    } else {
        $fixed_adult_price = null;
        $fixed_child_price = null;
        $fixed_infant_price = null;
    }
    
    $vat_rate_val = $vat_rate !== null ? $vat_rate : 'NULL';
    $kickback_value_val = $kickback_value !== null ? $kickback_value : 'NULL';
    $kickback_min_persons_val = $kickback_min_persons !== null ? $kickback_min_persons : 'NULL';
    
    $kickback_currency_val = !empty($kickback_currency) ? "'$kickback_currency'" : 'NULL';
    $fixed_adult_price_val = $fixed_adult_price !== null ? $fixed_adult_price : 'NULL';
    $fixed_child_price_val = $fixed_child_price !== null ? $fixed_child_price : 'NULL';
    $fixed_infant_price_val = $fixed_infant_price !== null ? $fixed_infant_price : 'NULL';
    
    $transfer_price_val = $transfer_price !== null ? $transfer_price : 'NULL';
    $transfer_currency_val = !empty($transfer_currency) ? "'$transfer_currency'" : 'NULL';
    $transfer_price_mini_val = $transfer_price_mini !== null ? $transfer_price_mini : 'NULL';
    $transfer_price_midi_val = $transfer_price_midi !== null ? $transfer_price_midi : 'NULL';
    $transfer_price_bus_val = $transfer_price_bus !== null ? $transfer_price_bus : 'NULL';
    $transfer_currency_fixed_val = !empty($transfer_currency_fixed) ? "'$transfer_currency_fixed'" : 'NULL';
    
    // Start transaction for data consistency
    pg_query($conn, 'BEGIN');
    
    try {
        $query = "INSERT INTO contracts (
                    sub_region_id, merchant_id, tour_id, vat_included, vat_rate,
                    adult_age, child_age_range, infant_age_range,
                    kickback_type, kickback_value, kickback_currency, kickback_per_person, kickback_min_persons, 
                    price_type, contract_currency, fixed_adult_price, fixed_child_price, fixed_infant_price,
                    transfer_owner, transfer_price_type, transfer_price, transfer_currency,
                    transfer_price_mini, transfer_price_midi, transfer_price_bus, transfer_currency_fixed,
                    included_content, start_date, end_date, created_at
                  ) VALUES (
                    $sub_region_id, $merchant_id, $tour_id, " . ($vat_included ? 'true' : 'false') . ", 
                    $vat_rate_val, '$adult_age', '$child_age_range', '$infant_age_range',
                    '$kickback_type', $kickback_value_val, $kickback_currency_val, " . ($kickback_per_person ? 'true' : 'false') . ",
                    $kickback_min_persons_val, '$price_type', '$contract_currency', $fixed_adult_price_val, $fixed_child_price_val, $fixed_infant_price_val,
                    '$transfer_owner', '$transfer_price_type', $transfer_price_val, $transfer_currency_val,
                    $transfer_price_mini_val, $transfer_price_midi_val, $transfer_price_bus_val, $transfer_currency_fixed_val,
                    '$included_content', '$start_date', '$end_date', NOW()
                  ) RETURNING id";
        
        $result = pg_query($conn, $query);
        
        if (!$result) {
            throw new Exception(getDbErrorMessage($conn));
        }
        
        $row = pg_fetch_assoc($result);
        if (!$row) {
            throw new Exception('Failed to retrieve contract ID');
        }
        $contract_id = $row['id'];
        
        // Save regional prices (only if price_type is regional)
        if ($price_type === 'regional' && isset($data['regional_prices']) && is_array($data['regional_prices'])) {
            saveRegionalPrices($conn, $contract_id, $data['regional_prices'], $data);
        } else if ($price_type === 'fixed') {
            // For fixed prices, save to all tour regions
            saveFixedPricesToRegions($conn, $contract_id, $tour_id, $fixed_adult_price, $fixed_child_price, $fixed_infant_price, $contract_currency);
        }
        
        // Commit transaction
        pg_query($conn, 'COMMIT');
        
        echo json_encode(['success' => true, 'id' => $contract_id, 'message' => 'Contract created successfully']);
    } catch (Exception $e) {
        // Rollback transaction on error
        pg_query($conn, 'ROLLBACK');
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => APP_DEBUG ? $e->getMessage() : 'Failed to create contract']);
    }
}

// Update contract
function updateContract($conn, $data) {
    // Validate required fields
    if (empty($data['id']) || empty($data['sub_region_id']) || empty($data['merchant_id']) || empty($data['tour_id'])) {
        echo json_encode(['success' => false, 'message' => 'ID, sub region, merchant, and tour are required']);
        return;
    }
    
    if (empty($data['start_date']) || empty($data['end_date'])) {
        echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
        return;
    }
    
    $id = (int)$data['id'];
    $sub_region_id = (int)$data['sub_region_id'];
    $merchant_id = (int)$data['merchant_id'];
    $tour_id = (int)$data['tour_id'];
    $vat_included = $data['vat_included'] === 'included' ? true : false;
    $vat_rate = isset($data['vat_rate']) && $data['vat_rate'] !== '' ? (float)$data['vat_rate'] : null;
    $adult_age = pg_escape_string($conn, $data['adult_age'] ?? '');
    $child_age_range = pg_escape_string($conn, $data['child_age_range'] ?? '');
    $infant_age_range = pg_escape_string($conn, $data['infant_age_range'] ?? '');
    $kickback_type = pg_escape_string($conn, $data['kickback_type'] ?? '');
    $kickback_value = isset($data['kickback_value']) && $data['kickback_value'] !== '' ? (float)$data['kickback_value'] : null;
    $kickback_currency = pg_escape_string($conn, $data['kickback_currency'] ?? '');
    $kickback_per_person = isset($data['kickback_per_person']) ? (bool)$data['kickback_per_person'] : false;
    $kickback_min_persons = isset($data['kickback_min_persons']) && $data['kickback_min_persons'] !== '' ? (int)$data['kickback_min_persons'] : null;
    $price_type = pg_escape_string($conn, $data['price_type'] ?? 'regional');
    $contract_currency = pg_escape_string($conn, $data['contract_currency'] ?? 'USD');
    $included_content = pg_escape_string($conn, $data['included_content'] ?? '');
    $start_date = pg_escape_string($conn, $data['start_date']);
    $end_date = pg_escape_string($conn, $data['end_date']);
    
    // Transfer fields
    $transfer_owner = pg_escape_string($conn, $data['transfer_owner'] ?? '');
    $transfer_price_type = pg_escape_string($conn, $data['transfer_price_type'] ?? '');
    $transfer_price = isset($data['transfer_price']) && $data['transfer_price'] !== '' ? (float)$data['transfer_price'] : null;
    $transfer_currency = pg_escape_string($conn, $data['transfer_currency'] ?? '');
    $transfer_price_mini = isset($data['transfer_price_mini']) && $data['transfer_price_mini'] !== '' ? (float)$data['transfer_price_mini'] : null;
    $transfer_price_midi = isset($data['transfer_price_midi']) && $data['transfer_price_midi'] !== '' ? (float)$data['transfer_price_midi'] : null;
    $transfer_price_bus = isset($data['transfer_price_bus']) && $data['transfer_price_bus'] !== '' ? (float)$data['transfer_price_bus'] : null;
    $transfer_currency_fixed = pg_escape_string($conn, $data['transfer_currency_fixed'] ?? '');
    
    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        echo json_encode(['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
        return;
    }
    
    // Validate dates
    if ($start_date && $end_date && $end_date < $start_date) {
        echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
        return;
    }
    
    // Handle fixed prices if price_type is 'fixed'
    if ($price_type === 'fixed') {
        $fixed_adult_price = isset($data['fixed_adult_price']) && $data['fixed_adult_price'] !== '' ? (float)$data['fixed_adult_price'] : null;
        $fixed_child_price = isset($data['fixed_child_price']) && $data['fixed_child_price'] !== '' ? (float)$data['fixed_child_price'] : null;
        $fixed_infant_price = isset($data['fixed_infant_price']) && $data['fixed_infant_price'] !== '' ? (float)$data['fixed_infant_price'] : null;
    } else {
        $fixed_adult_price = null;
        $fixed_child_price = null;
        $fixed_infant_price = null;
    }
    
    $vat_rate_val = $vat_rate !== null ? $vat_rate : 'NULL';
    $kickback_value_val = $kickback_value !== null ? $kickback_value : 'NULL';
    $kickback_min_persons_val = $kickback_min_persons !== null ? $kickback_min_persons : 'NULL';
    
    $kickback_currency_val = !empty($kickback_currency) ? "'$kickback_currency'" : 'NULL';
    $fixed_adult_price_val = $fixed_adult_price !== null ? $fixed_adult_price : 'NULL';
    $fixed_child_price_val = $fixed_child_price !== null ? $fixed_child_price : 'NULL';
    $fixed_infant_price_val = $fixed_infant_price !== null ? $fixed_infant_price : 'NULL';
    
    $transfer_price_val = $transfer_price !== null ? $transfer_price : 'NULL';
    $transfer_currency_val = !empty($transfer_currency) ? "'$transfer_currency'" : 'NULL';
    $transfer_price_mini_val = $transfer_price_mini !== null ? $transfer_price_mini : 'NULL';
    $transfer_price_midi_val = $transfer_price_midi !== null ? $transfer_price_midi : 'NULL';
    $transfer_price_bus_val = $transfer_price_bus !== null ? $transfer_price_bus : 'NULL';
    $transfer_currency_fixed_val = !empty($transfer_currency_fixed) ? "'$transfer_currency_fixed'" : 'NULL';
    
    // Start transaction for data consistency
    pg_query($conn, 'BEGIN');
    
    try {
        $query = "UPDATE contracts SET 
                    sub_region_id = $sub_region_id,
                    merchant_id = $merchant_id,
                    tour_id = $tour_id,
                    vat_included = " . ($vat_included ? 'true' : 'false') . ",
                    vat_rate = $vat_rate_val,
                    adult_age = '$adult_age',
                    child_age_range = '$child_age_range',
                    infant_age_range = '$infant_age_range',
                    kickback_type = '$kickback_type',
                    kickback_value = $kickback_value_val,
                    kickback_currency = $kickback_currency_val,
                    kickback_per_person = " . ($kickback_per_person ? 'true' : 'false') . ",
                    kickback_min_persons = $kickback_min_persons_val,
                    price_type = '$price_type',
                    contract_currency = '$contract_currency',
                    fixed_adult_price = $fixed_adult_price_val,
                    fixed_child_price = $fixed_child_price_val,
                    fixed_infant_price = $fixed_infant_price_val,
                    transfer_owner = '$transfer_owner',
                    transfer_price_type = '$transfer_price_type',
                    transfer_price = $transfer_price_val,
                    transfer_currency = $transfer_currency_val,
                    transfer_price_mini = $transfer_price_mini_val,
                    transfer_price_midi = $transfer_price_midi_val,
                    transfer_price_bus = $transfer_price_bus_val,
                    transfer_currency_fixed = $transfer_currency_fixed_val,
                    included_content = '$included_content',
                    start_date = '$start_date',
                    end_date = '$end_date',
                    updated_at = NOW()
                  WHERE id = $id";
        
        $result = pg_query($conn, $query);
        
        if (!$result) {
            throw new Exception(getDbErrorMessage($conn));
        }
        
        // Update regional prices (only if price_type is regional)
        if ($price_type === 'regional' && isset($data['regional_prices']) && is_array($data['regional_prices'])) {
            saveRegionalPrices($conn, $id, $data['regional_prices'], $data);
        } else if ($price_type === 'fixed') {
            // For fixed prices, save to all tour regions
            saveFixedPricesToRegions($conn, $id, $tour_id, $fixed_adult_price, $fixed_child_price, $fixed_infant_price, $contract_currency);
        }
        
        // Commit transaction
        pg_query($conn, 'COMMIT');
        
        echo json_encode(['success' => true, 'message' => 'Contract updated successfully']);
    } catch (Exception $e) {
        // Rollback transaction on error
        pg_query($conn, 'ROLLBACK');
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => APP_DEBUG ? $e->getMessage() : 'Failed to update contract']);
    }
}

// Save fixed prices to all tour regions
function saveFixedPricesToRegions($conn, $contract_id, $tour_id, $adult_price, $child_price, $infant_price, $currency) {
    // Escape currency for SQL
    $currency = pg_escape_string($conn, $currency);
    
    // Get all tour regions
    $regionsQuery = "SELECT sub_region_id FROM tour_sub_regions WHERE tour_id = $tour_id";
    $regionsResult = pg_query($conn, $regionsQuery);
    
    if (!$regionsResult) {
        throw new Exception('Failed to fetch tour regions: ' . getDbErrorMessage($conn));
    }
    
    // Delete existing regional prices
    $deleteQuery = "DELETE FROM contract_regional_prices WHERE contract_id = $contract_id";
    $deleteResult = pg_query($conn, $deleteQuery);
    if (!$deleteResult) {
        throw new Exception('Failed to delete existing regional prices: ' . getDbErrorMessage($conn));
    }
    
    // Insert fixed prices for all regions
    $adult_price_val = $adult_price !== null ? $adult_price : 'NULL';
    $child_price_val = $child_price !== null ? $child_price : 'NULL';
    $infant_price_val = $infant_price !== null ? $infant_price : 'NULL';
    
    while ($row = pg_fetch_assoc($regionsResult)) {
        $sub_region_id = (int)$row['sub_region_id'];
        $insertQuery = "INSERT INTO contract_regional_prices 
                       (contract_id, sub_region_id, adult_price, adult_currency, child_price, child_currency, infant_price, infant_currency)
                       VALUES ($contract_id, $sub_region_id, $adult_price_val, '$currency', $child_price_val, '$currency', $infant_price_val, '$currency')
                       ON CONFLICT (contract_id, sub_region_id) 
                       DO UPDATE SET 
                           adult_price = $adult_price_val,
                           adult_currency = '$currency',
                           child_price = $child_price_val,
                           child_currency = '$currency',
                           infant_price = $infant_price_val,
                           infant_currency = '$currency',
                           updated_at = NOW()";
        $insertResult = pg_query($conn, $insertQuery);
        if (!$insertResult) {
            throw new Exception('Failed to insert regional price: ' . getDbErrorMessage($conn));
        }
    }
}

// Save regional prices
function saveRegionalPrices($conn, $contract_id, $regional_prices, $data = []) {
    // Delete existing regional prices
    $deleteQuery = "DELETE FROM contract_regional_prices WHERE contract_id = $contract_id";
    $deleteResult = pg_query($conn, $deleteQuery);
    if (!$deleteResult) {
        throw new Exception('Failed to delete existing regional prices: ' . getDbErrorMessage($conn));
    }
    
    // Insert new regional prices
    if (!empty($regional_prices)) {
        foreach ($regional_prices as $priceData) {
            $sub_region_id = (int)$priceData['sub_region_id'];
            if ($sub_region_id <= 0) continue;
            
            $adult_price = isset($priceData['adult_price']) && $priceData['adult_price'] !== '' ? (float)$priceData['adult_price'] : null;
            $adult_currency = pg_escape_string($conn, $priceData['adult_currency'] ?? $data['contract_currency'] ?? 'USD');
            $child_price = isset($priceData['child_price']) && $priceData['child_price'] !== '' ? (float)$priceData['child_price'] : null;
            $child_currency = pg_escape_string($conn, $priceData['child_currency'] ?? $data['contract_currency'] ?? 'USD');
            $infant_price = isset($priceData['infant_price']) && $priceData['infant_price'] !== '' ? (float)$priceData['infant_price'] : null;
            $infant_currency = pg_escape_string($conn, $priceData['infant_currency'] ?? $data['contract_currency'] ?? 'USD');
            
            $adult_price_val = $adult_price !== null ? $adult_price : 'NULL';
            $child_price_val = $child_price !== null ? $child_price : 'NULL';
            $infant_price_val = $infant_price !== null ? $infant_price : 'NULL';
            
            $insertQuery = "INSERT INTO contract_regional_prices 
                           (contract_id, sub_region_id, adult_price, adult_currency, child_price, child_currency, infant_price, infant_currency)
                           VALUES ($contract_id, $sub_region_id, $adult_price_val, '$adult_currency', $child_price_val, '$child_currency', $infant_price_val, '$infant_currency')
                           ON CONFLICT (contract_id, sub_region_id) 
                           DO UPDATE SET 
                               adult_price = $adult_price_val,
                               adult_currency = '$adult_currency',
                               child_price = $child_price_val,
                               child_currency = '$child_currency',
                               infant_price = $infant_price_val,
                               infant_currency = '$infant_currency',
                               updated_at = NOW()";
            $insertResult = pg_query($conn, $insertQuery);
            if (!$insertResult) {
                throw new Exception('Failed to insert regional price: ' . getDbErrorMessage($conn));
            }
        }
    }
}

// Delete contract
function deleteContract($conn, $id) {
    try {
        // Validate ID
        $id = (int)$id;
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid contract ID']);
            return;
        }
        
        // Delete regional prices first (cascade)
        $deletePricesQuery = "DELETE FROM contract_regional_prices WHERE contract_id = $id";
        pg_query($conn, $deletePricesQuery);
        
        // Delete contract
        $query = "DELETE FROM contracts WHERE id = $id";
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Failed to delete contract';
            echo json_encode(['success' => false, 'message' => $errorMsg]);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'An error occurred';
        echo json_encode(['success' => false, 'message' => $errorMsg]);
    }
}
?>

