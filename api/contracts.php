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

// Set JSON header early with performance headers
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

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
        case 'actions':
            $contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : null;
            getContractActions($conn, $contract_id);
            break;
        case 'price_periods':
            $contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : null;
            getContractPricePeriods($conn, $contract_id);
            break;
        case 'kickback_periods':
            $contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : null;
            getContractKickbackPeriods($conn, $contract_id);
            break;
        case 'transfer_periods':
            $contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : null;
            getContractTransferPeriods($conn, $contract_id);
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
        case 'action':
            createContractAction($conn, $data);
            break;
        case 'price_period':
            createContractPricePeriod($conn, $data);
            break;
        case 'kickback_period':
            createContractKickbackPeriod($conn, $data);
            break;
        case 'transfer_period':
            createContractTransferPeriod($conn, $data);
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
        case 'action':
            updateContractAction($conn, $data);
            break;
        case 'price_period':
            updateContractPricePeriod($conn, $data);
            break;
        case 'kickback_period':
            updateContractKickbackPeriod($conn, $data);
            break;
        case 'transfer_period':
            updateContractTransferPeriod($conn, $data);
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
        case 'action':
            deleteContractAction($conn, $id);
            break;
        case 'price_period':
            deleteContractPricePeriod($conn, $id);
            break;
        case 'kickback_period':
            deleteContractKickbackPeriod($conn, $id);
            break;
        case 'transfer_period':
            deleteContractTransferPeriod($conn, $id);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get contracts
function getContracts($conn) {
    try {
        // Set query timeout and enable query optimization
        @pg_query($conn, "SET statement_timeout = '30s'");
        @pg_query($conn, "SET enable_seqscan = on"); // Use sequential scan when faster
        @pg_query($conn, "SET enable_indexscan = on"); // Enable index scans
        
        // Optimized query - only select necessary columns (using actual table structure)
        // Using EXISTS for sub_regions to avoid unnecessary joins if not needed
        $query = "SELECT c.id, c.sub_region_id, c.merchant_id, c.tour_id,
                         c.price_type, c.contract_currency, c.fixed_adult_price, c.fixed_child_price, c.fixed_infant_price,
                         c.start_date, c.end_date, c.vat_included, c.vat_rate,
                         c.transfer_owner, c.transfer_price_type, c.transfer_price,
                         c.transfer_currency, c.transfer_price_mini, c.transfer_price_midi,
                         c.transfer_price_bus, c.transfer_currency_fixed, c.kickback_type,
                         c.kickback_value, c.kickback_currency, c.kickback_per_person, c.kickback_min_persons,
                         c.included_content, c.created_at, c.period_type, c.period_value, c.period_unit,
                         c.tour_departure_days, c.adult_age, c.child_age_range, c.infant_age_range,
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
                  ORDER BY c.created_at DESC NULLS LAST
                  LIMIT 500";
        
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
            echo json_encode(['success' => true, 'data' => []], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        // OPTIMIZATION: Lazy load regional prices - only fetch summary for list view
        // This dramatically improves performance by avoiding expensive JOIN with sub_regions
        $contract_ids = array_column($contracts, 'id');
        $priceSummary = [];
        
        if (!empty($contract_ids) && count($contract_ids) <= 100) {
            // Only fetch first price per contract for display - much faster (no JOIN with sub_regions)
            $ids_str = implode(',', array_map('intval', $contract_ids));
            // Optimized query using index-friendly approach
            // DISTINCT ON is faster than GROUP BY for this use case
            $contracts_count = count($contract_ids);
            $pricesQuery = "SELECT DISTINCT ON (crp.contract_id) 
                                  crp.contract_id, crp.adult_price, crp.adult_currency
                           FROM contract_regional_prices crp
                           WHERE crp.contract_id = ANY(ARRAY[$ids_str]::integer[])
                           ORDER BY crp.contract_id, crp.adult_price DESC NULLS LAST
                           LIMIT $contracts_count";
            
            $pricesResult = @pg_query($conn, $pricesQuery);
            if ($pricesResult) {
                $firstPrices = pg_fetch_all($pricesResult);
                if ($firstPrices !== false) {
                    foreach ($firstPrices as $price) {
                        $cid = (int)$price['contract_id'];
                        $priceSummary[$cid] = [
                            'price' => $price['adult_price'],
                            'currency' => $price['adult_currency']
                        ];
                    }
                }
            }
        }
        
        // Attach prices to contracts - optimized loop with minimal operations
        $contractsCount = count($contracts);
        for ($i = 0; $i < $contractsCount; $i++) {
            $contract_id = (int)$contracts[$i]['id'];
            
            // Set empty regional_prices array - will be loaded on demand if needed (modal/view)
            $contracts[$i]['regional_prices'] = [];
            
            // Default price_type if not set
            if (!isset($contracts[$i]['price_type'])) {
                $contracts[$i]['price_type'] = 'regional';
            }
            
            // Calculate display price based on price_type
            if ($contracts[$i]['price_type'] === 'fixed') {
                $contracts[$i]['price'] = $contracts[$i]['fixed_adult_price'] ?? null;
                $contracts[$i]['currency'] = $contracts[$i]['contract_currency'] ?? 'USD';
            } else {
                // Use summary price if available
                if (isset($priceSummary[$contract_id])) {
                    $contracts[$i]['price'] = $priceSummary[$contract_id]['price'];
                    $contracts[$i]['currency'] = $priceSummary[$contract_id]['currency'];
                } else {
                    $contracts[$i]['price'] = null;
                    $contracts[$i]['currency'] = $contracts[$i]['contract_currency'] ?? 'USD';
                }
            }
        }
        
        echo json_encode(['success' => true, 'data' => $contracts], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'An error occurred';
        echo json_encode(['success' => false, 'message' => $errorMsg], JSON_UNESCAPED_UNICODE);
    }
}

// Get sub regions
function getSubRegions($conn) {
    $query = "SELECT sr.id, sr.name, sr.city_id, c.name as city_name 
              FROM sub_regions sr 
              LEFT JOIN cities c ON sr.city_id = c.id 
              ORDER BY sr.name ASC
              LIMIT 1000";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $subRegions = pg_fetch_all($result);
        if ($subRegions === false) {
            $subRegions = [];
        }
        echo json_encode(['success' => true, 'data' => $subRegions], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
    }
}

// Get merchants by sub region
function getMerchants($conn, $sub_region_id) {
    if (!$sub_region_id) {
        echo json_encode(['success' => false, 'message' => 'Sub region ID is required'], JSON_UNESCAPED_UNICODE);
        return;
    }
    
    $sub_region_id = (int)$sub_region_id;
    $query = "SELECT id, name, official_title, authorized_person, authorized_email 
              FROM merchants 
              WHERE sub_region_id = $sub_region_id 
              ORDER BY name ASC
              LIMIT 500";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $merchants = pg_fetch_all($result);
        if ($merchants === false) {
            $merchants = [];
        }
        echo json_encode(['success' => true, 'data' => $merchants], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
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
              ORDER BY name ASC
              LIMIT 500";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $tours = pg_fetch_all($result);
        if ($tours === false) {
            $tours = [];
        }
        echo json_encode(['success' => true, 'data' => $tours], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
    }
}

// Get currencies
function getCurrencies($conn) {
    $query = "SELECT code, name, symbol FROM currencies WHERE is_active = true ORDER BY code ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $currencies = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $currencies], JSON_UNESCAPED_UNICODE);
    } else {
        // If table doesn't exist, return default currencies
        echo json_encode(['success' => true, 'data' => [
            ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
            ['code' => 'TL', 'name' => 'Turkish Lira', 'symbol' => '₺'],
            ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£']
        ]], JSON_UNESCAPED_UNICODE);
    }
}

// Get tour regions
function getTourRegions($conn, $tour_id) {
    if (!$tour_id) {
        echo json_encode(['success' => false, 'message' => 'Tour ID is required'], JSON_UNESCAPED_UNICODE);
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
              ORDER BY sr.name ASC
              LIMIT 200";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $regions = pg_fetch_all($result);
        if ($regions === false) {
            $regions = [];
        }
        echo json_encode(['success' => true, 'data' => $regions], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
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
    
    // Period fields
    $period_type = pg_escape_string($conn, $data['period_type'] ?? '');
    $period_value = isset($data['period_value']) && $data['period_value'] !== '' ? (int)$data['period_value'] : null;
    $period_unit = pg_escape_string($conn, $data['period_unit'] ?? '');
    
    // Tour departure days
    $tour_departure_days = pg_escape_string($conn, $data['tour_departure_days'] ?? '');
    
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
        $period_type_val = !empty($period_type) ? "'$period_type'" : 'NULL';
        $period_value_val = $period_value !== null ? $period_value : 'NULL';
        $period_unit_val = !empty($period_unit) ? "'$period_unit'" : 'NULL';
        
        $query = "INSERT INTO contracts (
                    sub_region_id, merchant_id, tour_id, vat_included, vat_rate,
                    adult_age, child_age_range, infant_age_range,
                    kickback_type, kickback_value, kickback_currency, kickback_per_person, kickback_min_persons, 
                    price_type, contract_currency, fixed_adult_price, fixed_child_price, fixed_infant_price,
                    transfer_owner, transfer_price_type, transfer_price, transfer_currency,
                    transfer_price_mini, transfer_price_midi, transfer_price_bus, transfer_currency_fixed,
                    included_content, start_date, end_date, period_type, period_value, period_unit, tour_departure_days, created_at
                  ) VALUES (
                    $sub_region_id, $merchant_id, $tour_id, " . ($vat_included ? 'true' : 'false') . ", 
                    $vat_rate_val, '$adult_age', '$child_age_range', '$infant_age_range',
                    '$kickback_type', $kickback_value_val, $kickback_currency_val, " . ($kickback_per_person ? 'true' : 'false') . ",
                    $kickback_min_persons_val, '$price_type', '$contract_currency', $fixed_adult_price_val, $fixed_child_price_val, $fixed_infant_price_val,
                    '$transfer_owner', '$transfer_price_type', $transfer_price_val, $transfer_currency_val,
                    $transfer_price_mini_val, $transfer_price_midi_val, $transfer_price_bus_val, $transfer_currency_fixed_val,
                    '$included_content', '$start_date', '$end_date', $period_type_val, $period_value_val, $period_unit_val, '$tour_departure_days', NOW()
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
    
    // Period fields
    $period_type = pg_escape_string($conn, $data['period_type'] ?? '');
    $period_value = isset($data['period_value']) && $data['period_value'] !== '' ? (int)$data['period_value'] : null;
    $period_unit = pg_escape_string($conn, $data['period_unit'] ?? '');
    
    // Tour departure days
    $tour_departure_days = pg_escape_string($conn, $data['tour_departure_days'] ?? '');
    
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
        $period_type_val = !empty($period_type) ? "'$period_type'" : 'NULL';
        $period_value_val = $period_value !== null ? $period_value : 'NULL';
        $period_unit_val = !empty($period_unit) ? "'$period_unit'" : 'NULL';
        
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
                    period_type = $period_type_val,
                    period_value = $period_value_val,
                    period_unit = $period_unit_val,
                    tour_departure_days = '$tour_departure_days',
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
        
        // Delete actions first (cascade)
        $deleteActionsQuery = "DELETE FROM contract_actions WHERE contract_id = $id";
        pg_query($conn, $deleteActionsQuery);
        
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

// Get contract actions
function getContractActions($conn, $contract_id) {
    try {
        if (!$contract_id) {
            echo json_encode(['success' => false, 'message' => 'Contract ID is required'], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        $contract_id = (int)$contract_id;
        $query = "SELECT id, contract_id, action_name, action_description, 
                         action_start_date, action_end_date, action_duration_type, 
                         action_duration_days, is_active, created_at, updated_at
                  FROM contract_actions 
                  WHERE contract_id = $contract_id 
                  ORDER BY action_start_date DESC";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $actions = pg_fetch_all($result);
            if ($actions === false) {
                $actions = [];
            }
            echo json_encode(['success' => true, 'data' => $actions], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => 'An error occurred'], JSON_UNESCAPED_UNICODE);
    }
}

// Create contract action
function createContractAction($conn, $data) {
    try {
        if (empty($data['contract_id']) || empty($data['action_name'])) {
            echo json_encode(['success' => false, 'message' => 'Contract ID and action name are required']);
            return;
        }
        
        if (empty($data['action_start_date']) || empty($data['action_end_date'])) {
            echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
            return;
        }
        
        $contract_id = (int)$data['contract_id'];
        $action_name = pg_escape_string($conn, $data['action_name']);
        $action_description = pg_escape_string($conn, $data['action_description'] ?? '');
        $action_start_date = pg_escape_string($conn, $data['action_start_date']);
        $action_end_date = pg_escape_string($conn, $data['action_end_date']);
        $action_duration_type = pg_escape_string($conn, $data['action_duration_type'] ?? 'day');
        $action_duration_days = isset($data['action_duration_days']) && $data['action_duration_days'] !== '' ? (int)$data['action_duration_days'] : null;
        $is_active = isset($data['is_active']) ? (bool)$data['is_active'] : true;
        
        // Validate dates
        if ($action_start_date && $action_end_date && $action_end_date < $action_start_date) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        $action_duration_days_val = $action_duration_days !== null ? $action_duration_days : 'NULL';
        
        $query = "INSERT INTO contract_actions (
                    contract_id, action_name, action_description, action_start_date, action_end_date,
                    action_duration_type, action_duration_days, is_active, created_at
                  ) VALUES (
                    $contract_id, '$action_name', '$action_description', '$action_start_date', '$action_end_date',
                    '$action_duration_type', $action_duration_days_val, " . ($is_active ? 'true' : 'false') . ", NOW()
                  ) RETURNING id";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $row = pg_fetch_assoc($result);
            echo json_encode(['success' => true, 'id' => $row['id'], 'message' => 'Action created successfully']);
        } else {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Failed to create action';
            echo json_encode(['success' => false, 'message' => $errorMsg]);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => APP_DEBUG ? $e->getMessage() : 'Failed to create action']);
    }
}

// Update contract action
function updateContractAction($conn, $data) {
    try {
        if (empty($data['id']) || empty($data['contract_id']) || empty($data['action_name'])) {
            echo json_encode(['success' => false, 'message' => 'ID, contract ID and action name are required']);
            return;
        }
        
        if (empty($data['action_start_date']) || empty($data['action_end_date'])) {
            echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
            return;
        }
        
        $id = (int)$data['id'];
        $contract_id = (int)$data['contract_id'];
        $action_name = pg_escape_string($conn, $data['action_name']);
        $action_description = pg_escape_string($conn, $data['action_description'] ?? '');
        $action_start_date = pg_escape_string($conn, $data['action_start_date']);
        $action_end_date = pg_escape_string($conn, $data['action_end_date']);
        $action_duration_type = pg_escape_string($conn, $data['action_duration_type'] ?? 'day');
        $action_duration_days = isset($data['action_duration_days']) && $data['action_duration_days'] !== '' ? (int)$data['action_duration_days'] : null;
        $is_active = isset($data['is_active']) ? (bool)$data['is_active'] : true;
        
        // Validate dates
        if ($action_start_date && $action_end_date && $action_end_date < $action_start_date) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        $action_duration_days_val = $action_duration_days !== null ? $action_duration_days : 'NULL';
        
        $query = "UPDATE contract_actions SET 
                    contract_id = $contract_id,
                    action_name = '$action_name',
                    action_description = '$action_description',
                    action_start_date = '$action_start_date',
                    action_end_date = '$action_end_date',
                    action_duration_type = '$action_duration_type',
                    action_duration_days = $action_duration_days_val,
                    is_active = " . ($is_active ? 'true' : 'false') . ",
                    updated_at = NOW()
                  WHERE id = $id";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Action updated successfully']);
        } else {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Failed to update action';
            echo json_encode(['success' => false, 'message' => $errorMsg]);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => APP_DEBUG ? $e->getMessage() : 'Failed to update action']);
    }
}

    // Delete contract action
function deleteContractAction($conn, $id) {
    try {
        $id = (int)$id;
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid action ID']);
            return;
        }
        
        $query = "DELETE FROM contract_actions WHERE id = $id";
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Failed to delete action';
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

// Get contract price periods
function getContractPricePeriods($conn, $contract_id) {
    try {
        if (!$contract_id) {
            echo json_encode(['success' => false, 'message' => 'Contract ID is required'], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        $contract_id = (int)$contract_id;
        
        // Check if new columns exist
        $columnsCheck = pg_query($conn, "SELECT column_name FROM information_schema.columns 
                                         WHERE table_name = 'contract_price_periods' AND column_name = 'price_type'");
        $hasNewColumns = pg_num_rows($columnsCheck) > 0;
        
        if ($hasNewColumns) {
            $query = "SELECT id, contract_id, period_name, start_date, end_date, days_of_week,
                             adult_price, child_price, infant_price, currency, 
                             price_type, adult_age, child_age_range, infant_age_range,
                             is_active, notes, created_at, updated_at
                      FROM contract_price_periods 
                      WHERE contract_id = $contract_id 
                      ORDER BY start_date ASC";
        } else {
            $query = "SELECT id, contract_id, period_name, start_date, end_date, days_of_week,
                             adult_price, child_price, infant_price, currency, 
                             is_active, notes, created_at, updated_at
                      FROM contract_price_periods 
                      WHERE contract_id = $contract_id 
                      ORDER BY start_date ASC";
        }
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            $periods = pg_fetch_all($result);
            if ($periods === false) {
                $periods = [];
            }
            
            // Load regional prices for each period if table exists
            if ($hasNewColumns) {
                foreach ($periods as &$period) {
                    $period['price_type'] = $period['price_type'] ?? 'regional';
                    if ($period['price_type'] === 'regional') {
                        $period_id = (int)$period['id'];
                        $regionalQuery = "SELECT sub_region_id, adult_price, child_price, infant_price, currency
                                         FROM contract_price_period_regional_prices
                                         WHERE price_period_id = $period_id";
                        $regionalResult = @pg_query($conn, $regionalQuery);
                        if ($regionalResult) {
                            $regionalPrices = pg_fetch_all($regionalResult);
                            $period['regional_prices'] = $regionalPrices !== false ? $regionalPrices : [];
                        } else {
                            $period['regional_prices'] = [];
                        }
                    } else {
                        $period['regional_prices'] = [];
                    }
                }
            } else {
                // Old schema - set defaults
                foreach ($periods as &$period) {
                    $period['price_type'] = 'regional';
                    $period['regional_prices'] = [];
                }
            }
            
            echo json_encode(['success' => true, 'data' => $periods], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => 'An error occurred'], JSON_UNESCAPED_UNICODE);
    }
}

// Create contract price period
function createContractPricePeriod($conn, $data) {
    try {
        if (empty($data['contract_id']) || empty($data['period_name'])) {
            echo json_encode(['success' => false, 'message' => 'Contract ID and period name are required']);
            return;
        }
        
        if (empty($data['start_date']) || empty($data['end_date'])) {
            echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
            return;
        }
        
        $contract_id = (int)$data['contract_id'];
        $period_name = pg_escape_string($conn, $data['period_name']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        $days_of_week = pg_escape_string($conn, $data['days_of_week'] ?? '');
        $notes = pg_escape_string($conn, $data['notes'] ?? '');
        $price_type = pg_escape_string($conn, $data['price_type'] ?? 'regional');
        $adult_age = pg_escape_string($conn, $data['adult_age'] ?? '');
        $child_age_range = pg_escape_string($conn, $data['child_age_range'] ?? '');
        $infant_age_range = pg_escape_string($conn, $data['infant_age_range'] ?? '');
        $adult_price = isset($data['adult_price']) && $data['adult_price'] !== '' ? (float)$data['adult_price'] : null;
        $child_price = isset($data['child_price']) && $data['child_price'] !== '' ? (float)$data['child_price'] : null;
        $infant_price = isset($data['infant_price']) && $data['infant_price'] !== '' ? (float)$data['infant_price'] : null;
        $currency = pg_escape_string($conn, $data['currency'] ?? 'USD');
        $is_active = isset($data['is_active']) ? (bool)$data['is_active'] : true;
        
        // Validate dates
        if ($start_date && $end_date && $end_date < $start_date) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        $adult_price_val = $adult_price !== null ? $adult_price : 'NULL';
        $child_price_val = $child_price !== null ? $child_price : 'NULL';
        $infant_price_val = $infant_price !== null ? $infant_price : 'NULL';
        $days_of_week_val = !empty($days_of_week) ? "'$days_of_week'" : 'NULL';
        $notes_val = !empty($notes) ? "'$notes'" : 'NULL';
        
        // Check if new columns exist
        $columnsCheck = pg_query($conn, "SELECT column_name FROM information_schema.columns 
                                         WHERE table_name = 'contract_price_periods' AND column_name = 'price_type'");
        $hasNewColumns = pg_num_rows($columnsCheck) > 0;
        
        pg_query($conn, 'BEGIN');
        
        try {
            if ($hasNewColumns) {
                $query = "INSERT INTO contract_price_periods (
                            contract_id, period_name, start_date, end_date, days_of_week,
                            adult_price, child_price, infant_price, currency, notes, is_active, 
                            price_type, adult_age, child_age_range, infant_age_range, created_at
                          ) VALUES (
                            $contract_id, '$period_name', '$start_date', '$end_date', $days_of_week_val,
                            $adult_price_val, $child_price_val, $infant_price_val, '$currency', $notes_val, " . ($is_active ? 'true' : 'false') . ",
                            '$price_type', '$adult_age', '$child_age_range', '$infant_age_range', NOW()
                          ) RETURNING id";
            } else {
                // Fallback for old schema (before migration)
                $query = "INSERT INTO contract_price_periods (
                            contract_id, period_name, start_date, end_date, days_of_week,
                            adult_price, child_price, infant_price, currency, notes, is_active, created_at
                          ) VALUES (
                            $contract_id, '$period_name', '$start_date', '$end_date', $days_of_week_val,
                            $adult_price_val, $child_price_val, $infant_price_val, '$currency', $notes_val, " . ($is_active ? 'true' : 'false') . ", NOW()
                          ) RETURNING id";
            }
            
            $result = pg_query($conn, $query);
            
            if (!$result) {
                throw new Exception(getDbErrorMessage($conn));
            }
            
            $row = pg_fetch_assoc($result);
            $period_id = $row['id'];
            
            // Save regional prices if price_type is regional and table exists
            if ($hasNewColumns && $price_type === 'regional' && isset($data['regional_prices']) && is_array($data['regional_prices'])) {
                savePricePeriodRegionalPrices($conn, $period_id, $data['regional_prices']);
            }
            
            pg_query($conn, 'COMMIT');
            echo json_encode(['success' => true, 'id' => $period_id, 'message' => 'Price period created successfully']);
        } catch (Exception $e) {
            pg_query($conn, 'ROLLBACK');
            throw $e;
        }
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => APP_DEBUG ? $e->getMessage() : 'Failed to create price period']);
    }
}

// Update contract price period
function updateContractPricePeriod($conn, $data) {
    try {
        if (empty($data['id']) || empty($data['contract_id']) || empty($data['period_name'])) {
            echo json_encode(['success' => false, 'message' => 'ID, contract ID and period name are required']);
            return;
        }
        
        if (empty($data['start_date']) || empty($data['end_date'])) {
            echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
            return;
        }
        
        $id = (int)$data['id'];
        $contract_id = (int)$data['contract_id'];
        $period_name = pg_escape_string($conn, $data['period_name']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        $days_of_week = pg_escape_string($conn, $data['days_of_week'] ?? '');
        $notes = pg_escape_string($conn, $data['notes'] ?? '');
        $price_type = pg_escape_string($conn, $data['price_type'] ?? 'regional');
        $adult_age = pg_escape_string($conn, $data['adult_age'] ?? '');
        $child_age_range = pg_escape_string($conn, $data['child_age_range'] ?? '');
        $infant_age_range = pg_escape_string($conn, $data['infant_age_range'] ?? '');
        $adult_price = isset($data['adult_price']) && $data['adult_price'] !== '' ? (float)$data['adult_price'] : null;
        $child_price = isset($data['child_price']) && $data['child_price'] !== '' ? (float)$data['child_price'] : null;
        $infant_price = isset($data['infant_price']) && $data['infant_price'] !== '' ? (float)$data['infant_price'] : null;
        $currency = pg_escape_string($conn, $data['currency'] ?? 'USD');
        $is_active = isset($data['is_active']) ? (bool)$data['is_active'] : true;
        
        // Validate dates
        if ($start_date && $end_date && $end_date < $start_date) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        $adult_price_val = $adult_price !== null ? $adult_price : 'NULL';
        $child_price_val = $child_price !== null ? $child_price : 'NULL';
        $infant_price_val = $infant_price !== null ? $infant_price : 'NULL';
        $days_of_week_val = !empty($days_of_week) ? "'$days_of_week'" : 'NULL';
        $notes_val = !empty($notes) ? "'$notes'" : 'NULL';
        
        // Check if new columns exist
        $columnsCheck = pg_query($conn, "SELECT column_name FROM information_schema.columns 
                                         WHERE table_name = 'contract_price_periods' AND column_name = 'price_type'");
        $hasNewColumns = pg_num_rows($columnsCheck) > 0;
        
        pg_query($conn, 'BEGIN');
        
        try {
            if ($hasNewColumns) {
                $query = "UPDATE contract_price_periods SET 
                            contract_id = $contract_id,
                            period_name = '$period_name',
                            start_date = '$start_date',
                            end_date = '$end_date',
                            days_of_week = $days_of_week_val,
                            adult_price = $adult_price_val,
                            child_price = $child_price_val,
                            infant_price = $infant_price_val,
                            currency = '$currency',
                            notes = $notes_val,
                            price_type = '$price_type',
                            adult_age = '$adult_age',
                            child_age_range = '$child_age_range',
                            infant_age_range = '$infant_age_range',
                            is_active = " . ($is_active ? 'true' : 'false') . ",
                            updated_at = NOW()
                          WHERE id = $id";
            } else {
                // Fallback for old schema
                $query = "UPDATE contract_price_periods SET 
                            contract_id = $contract_id,
                            period_name = '$period_name',
                            start_date = '$start_date',
                            end_date = '$end_date',
                            days_of_week = $days_of_week_val,
                            adult_price = $adult_price_val,
                            child_price = $child_price_val,
                            infant_price = $infant_price_val,
                            currency = '$currency',
                            notes = $notes_val,
                            is_active = " . ($is_active ? 'true' : 'false') . ",
                            updated_at = NOW()
                          WHERE id = $id";
            }
            
            $result = pg_query($conn, $query);
            
            if (!$result) {
                throw new Exception(getDbErrorMessage($conn));
            }
            
            // Update regional prices if price_type is regional and table exists
            if ($hasNewColumns && $price_type === 'regional' && isset($data['regional_prices']) && is_array($data['regional_prices'])) {
                savePricePeriodRegionalPrices($conn, $id, $data['regional_prices']);
            }
            
            pg_query($conn, 'COMMIT');
            echo json_encode(['success' => true, 'message' => 'Price period updated successfully']);
        } catch (Exception $e) {
            pg_query($conn, 'ROLLBACK');
            throw $e;
        }
    } catch (Exception $e) {
        if (function_exists('logError')) {
            logError($e->getMessage(), __FILE__, __LINE__);
        }
        echo json_encode(['success' => false, 'message' => APP_DEBUG ? $e->getMessage() : 'Failed to update price period']);
    }
}

// Delete contract price period
function deleteContractPricePeriod($conn, $id) {
    try {
        $id = (int)$id;
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid price period ID']);
            return;
        }
        
        $query = "DELETE FROM contract_price_periods WHERE id = $id";
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Failed to delete price period';
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

// Get contract kickback periods
function getContractKickbackPeriods($conn, $contract_id) {
    try {
        if (!$contract_id) {
            echo json_encode(['success' => false, 'message' => 'Contract ID is required'], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        $contract_id = (int)$contract_id;
        $query = "SELECT * FROM contract_kickback_periods WHERE contract_id = $contract_id ORDER BY start_date DESC";
        $result = pg_query($conn, $query);
        
        if ($result) {
            $periods = pg_fetch_all($result);
            if ($periods === false) $periods = [];
            echo json_encode(['success' => true, 'data' => $periods], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        echo json_encode(['success' => false, 'message' => 'An error occurred'], JSON_UNESCAPED_UNICODE);
    }
}

// Create contract kickback period
function createContractKickbackPeriod($conn, $data) {
    try {
        if (empty($data['contract_id']) || empty($data['period_name'])) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing']);
            return;
        }
        
        $contract_id = (int)$data['contract_id'];
        $period_name = pg_escape_string($conn, $data['period_name']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        $kickback_type = pg_escape_string($conn, $data['kickback_type'] ?? '');
        $kickback_value = isset($data['kickback_value']) ? (float)$data['kickback_value'] : null;
        $kickback_currency = pg_escape_string($conn, $data['kickback_currency'] ?? 'USD');
        $kickback_per_person = isset($data['kickback_per_person']) ? ($data['kickback_per_person'] ? 1 : 0) : 0;
        $kickback_min_persons = isset($data['kickback_min_persons']) ? (int)$data['kickback_min_persons'] : null;
        
        $query = "INSERT INTO contract_kickback_periods 
                  (contract_id, period_name, start_date, end_date, kickback_type, kickback_value, 
                   kickback_currency, kickback_per_person, kickback_min_persons, is_active, created_at) 
                  VALUES ($contract_id, '$period_name', '$start_date', '$end_date', '$kickback_type', 
                          '$kickback_value', '$kickback_currency', $kickback_per_person, 
                          '$kickback_min_persons', 1, NOW())";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Kickback period created successfully'], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        echo json_encode(['success' => false, 'message' => 'An error occurred'], JSON_UNESCAPED_UNICODE);
    }
}

// Update contract kickback period
function updateContractKickbackPeriod($conn, $data) {
    try {
        if (empty($data['id']) || empty($data['period_name'])) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing']);
            return;
        }
        
        $id = (int)$data['id'];
        $period_name = pg_escape_string($conn, $data['period_name']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        $kickback_type = pg_escape_string($conn, $data['kickback_type'] ?? '');
        $kickback_value = isset($data['kickback_value']) ? (float)$data['kickback_value'] : null;
        $kickback_currency = pg_escape_string($conn, $data['kickback_currency'] ?? 'USD');
        $kickback_per_person = isset($data['kickback_per_person']) ? ($data['kickback_per_person'] ? 1 : 0) : 0;
        $kickback_min_persons = isset($data['kickback_min_persons']) ? (int)$data['kickback_min_persons'] : null;
        
        $query = "UPDATE contract_kickback_periods SET 
                  period_name = '$period_name', start_date = '$start_date', end_date = '$end_date',
                  kickback_type = '$kickback_type', kickback_value = '$kickback_value',
                  kickback_currency = '$kickback_currency', kickback_per_person = $kickback_per_person,
                  kickback_min_persons = '$kickback_min_persons', updated_at = NOW()
                  WHERE id = $id";
        
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Kickback period updated successfully'], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        echo json_encode(['success' => false, 'message' => 'An error occurred'], JSON_UNESCAPED_UNICODE);
    }
}

// Delete contract kickback period
function deleteContractKickbackPeriod($conn, $id) {
    try {
        $id = (int)$id;
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid kickback period ID']);
            return;
        }
        
        $query = "DELETE FROM contract_kickback_periods WHERE id = $id";
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Failed to delete kickback period';
            echo json_encode(['success' => false, 'message' => $errorMsg]);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'An error occurred';
        echo json_encode(['success' => false, 'message' => $errorMsg]);
    }
}

// Get contract transfer periods
function getContractTransferPeriods($conn, $contract_id) {
    try {
        if (!$contract_id) {
            echo json_encode(['success' => false, 'message' => 'Contract ID is required'], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        $contract_id = (int)$contract_id;
        $query = "SELECT * FROM contract_transfer_periods WHERE contract_id = $contract_id ORDER BY created_at DESC";
        $result = pg_query($conn, $query);
        
        if ($result) {
            $periods = pg_fetch_all($result);
            if ($periods === false) $periods = [];
            
            // Check if new columns exist
            $columnsCheck = pg_query($conn, "SELECT column_name FROM information_schema.columns 
                                             WHERE table_name = 'contract_transfer_periods' AND column_name = 'pricing_method'");
            $hasNewColumns = pg_num_rows($columnsCheck) > 0;
            
            // Load additional data for each period
            if ($hasNewColumns) {
                foreach ($periods as &$period) {
                    $period_id = (int)$period['id'];
                    $pricing_method = $period['pricing_method'] ?? 'fixed_price';
                    
                    $regional_price_type = $period['regional_price_type'] ?? 'per_person';
                    $fixed_price_type = $period['fixed_price_type'] ?? 'per_person';
                    
                    if ($pricing_method === 'fixed_price' && $fixed_price_type === 'group') {
                        // Load fixed group ranges
                        $groupQuery = "SELECT min_persons, max_persons, price, currency
                                      FROM transfer_period_group_ranges
                                      WHERE transfer_period_id = $period_id
                                      ORDER BY min_persons ASC";
                        $groupResult = @pg_query($conn, $groupQuery);
                        if ($groupResult) {
                            $groupRanges = pg_fetch_all($groupResult);
                            $period['fixed_group_ranges'] = $groupRanges !== false ? $groupRanges : [];
                        } else {
                            $period['fixed_group_ranges'] = [];
                        }
                    } else if ($pricing_method === 'regional_price') {
                        if ($regional_price_type === 'per_person') {
                            // Load regional prices (per person)
                            $regionalQuery = "SELECT sub_region_id, adult_price, child_price, infant_price
                                             FROM transfer_period_regional_prices
                                             WHERE transfer_period_id = $period_id";
                            $regionalResult = @pg_query($conn, $regionalQuery);
                            if ($regionalResult) {
                                $regionalPrices = pg_fetch_all($regionalResult);
                                $period['regional_prices'] = $regionalPrices !== false ? $regionalPrices : [];
                            } else {
                                $period['regional_prices'] = [];
                            }
                        } else if ($regional_price_type === 'group') {
                            // Load regional group ranges
                            $regionalGroupQuery = "SELECT sub_region_id, min_persons, max_persons, price, currency
                                                  FROM transfer_period_regional_group_ranges
                                                  WHERE transfer_period_id = $period_id
                                                  ORDER BY sub_region_id, min_persons ASC";
                            $regionalGroupResult = @pg_query($conn, $regionalGroupQuery);
                            if ($regionalGroupResult) {
                                $regionalGroupRanges = pg_fetch_all($regionalGroupResult);
                                $period['regional_group_ranges'] = $regionalGroupRanges !== false ? $regionalGroupRanges : [];
                            } else {
                                $period['regional_group_ranges'] = [];
                            }
                        }
                    }
                    
                    // Set empty arrays for unused fields
                    if (!isset($period['regional_prices'])) $period['regional_prices'] = [];
                    if (!isset($period['fixed_group_ranges'])) $period['fixed_group_ranges'] = [];
                    if (!isset($period['regional_group_ranges'])) $period['regional_group_ranges'] = [];
                }
            }
            
            echo json_encode(['success' => true, 'data' => $periods], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)], JSON_UNESCAPED_UNICODE);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        echo json_encode(['success' => false, 'message' => 'An error occurred'], JSON_UNESCAPED_UNICODE);
    }
}

// Create contract transfer period
function createContractTransferPeriod($conn, $data) {
    try {
        // Log received data for debugging
        error_log('Transfer Period Create - Received data: ' . json_encode($data));
        
        if (empty($data['contract_id']) || empty($data['period_name'])) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing: contract_id or period_name']);
            return;
        }
        
        if (empty($data['start_date']) || empty($data['end_date'])) {
            echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
            return;
        }
        
        $contract_id = (int)$data['contract_id'];
        $period_name = pg_escape_string($conn, $data['period_name']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        $transfer_owner = pg_escape_string($conn, $data['transfer_owner'] ?? 'agency');
        
        // Validate dates
        if ($start_date && $end_date && $end_date < $start_date) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        // New pricing fields
        $pricing_method = pg_escape_string($conn, $data['pricing_method'] ?? 'fixed_price');
        $fixed_price_type = pg_escape_string($conn, $data['fixed_price_type'] ?? '');
        $regional_price_type = pg_escape_string($conn, $data['regional_price_type'] ?? '');
        $adult_age = pg_escape_string($conn, $data['adult_age'] ?? '');
        $child_age_range = pg_escape_string($conn, $data['child_age_range'] ?? '');
        $infant_age_range = pg_escape_string($conn, $data['infant_age_range'] ?? '');
        $adult_price = isset($data['adult_price']) && $data['adult_price'] !== '' ? (float)$data['adult_price'] : null;
        $child_price = isset($data['child_price']) && $data['child_price'] !== '' ? (float)$data['child_price'] : null;
        $infant_price = isset($data['infant_price']) && $data['infant_price'] !== '' ? (float)$data['infant_price'] : null;
        $fixed_currency = pg_escape_string($conn, $data['fixed_currency'] ?? 'USD');
        $group_price = isset($data['group_price']) && $data['group_price'] !== '' ? (float)$data['group_price'] : null;
        $group_currency = pg_escape_string($conn, $data['group_currency'] ?? 'USD');
        $regional_adult_age = pg_escape_string($conn, $data['regional_adult_age'] ?? '');
        $regional_child_age = pg_escape_string($conn, $data['regional_child_age'] ?? '');
        $regional_infant_age = pg_escape_string($conn, $data['regional_infant_age'] ?? '');
        
        // Old fields (backward compatibility)
        $transfer_price_type = pg_escape_string($conn, $data['transfer_price_type'] ?? '');
        $transfer_price = isset($data['transfer_price']) ? (float)$data['transfer_price'] : null;
        $transfer_currency = pg_escape_string($conn, $data['transfer_currency'] ?? 'USD');
        $transfer_price_mini = isset($data['transfer_price_mini']) ? (float)$data['transfer_price_mini'] : null;
        $transfer_price_midi = isset($data['transfer_price_midi']) ? (float)$data['transfer_price_midi'] : null;
        $transfer_price_bus = isset($data['transfer_price_bus']) ? (float)$data['transfer_price_bus'] : null;
        $transfer_currency_fixed = pg_escape_string($conn, $data['transfer_currency_fixed'] ?? 'USD');
        
        // Check if new columns exist
        $columnsCheck = pg_query($conn, "SELECT column_name FROM information_schema.columns 
                                         WHERE table_name = 'contract_transfer_periods' AND column_name = 'pricing_method'");
        $hasNewColumns = pg_num_rows($columnsCheck) > 0;
        
        error_log('Has new columns: ' . ($hasNewColumns ? 'YES' : 'NO'));
        
        pg_query($conn, 'BEGIN');
        
        try {
            if ($hasNewColumns) {
                error_log('Using NEW schema for transfer period');
                $query = "INSERT INTO contract_transfer_periods (
                            contract_id, period_name, start_date, end_date, transfer_owner,
                            pricing_method, fixed_price_type, regional_price_type, adult_age, child_age_range, infant_age_range,
                            adult_price, child_price, infant_price, fixed_currency,
                            group_price, group_currency, regional_adult_age, regional_child_age, regional_infant_age,
                            transfer_price_type, transfer_price, transfer_currency,
                            transfer_price_mini, transfer_price_midi, transfer_price_bus, transfer_currency_fixed,
                            is_active, created_at
                          ) VALUES (
                            $contract_id, '$period_name', '$start_date', '$end_date', '$transfer_owner',
                            '$pricing_method', '$fixed_price_type', '$regional_price_type', '$adult_age', '$child_age_range', '$infant_age_range',
                            " . ($adult_price !== null ? $adult_price : "NULL") . ", " . ($child_price !== null ? $child_price : "NULL") . ", " . ($infant_price !== null ? $infant_price : "NULL") . ", '$fixed_currency',
                            " . ($group_price !== null ? $group_price : "NULL") . ", '$group_currency', '$regional_adult_age', '$regional_child_age', '$regional_infant_age',
                            '$transfer_price_type', " . ($transfer_price !== null ? $transfer_price : "NULL") . ", '$transfer_currency',
                            " . ($transfer_price_mini !== null ? $transfer_price_mini : "NULL") . ", " . ($transfer_price_midi !== null ? $transfer_price_midi : "NULL") . ", " . ($transfer_price_bus !== null ? $transfer_price_bus : "NULL") . ", '$transfer_currency_fixed',
                            true, NOW()
                          ) RETURNING id";
            } else {
                error_log('Using OLD schema for transfer period');
                // Fallback for old schema
                $query = "INSERT INTO contract_transfer_periods 
                          (contract_id, period_name, start_date, end_date, transfer_owner, transfer_price_type,
                           transfer_price, transfer_currency, transfer_price_mini, transfer_price_midi,
                           transfer_price_bus, transfer_currency_fixed, is_active, created_at) 
                          VALUES ($contract_id, '$period_name', '$start_date', '$end_date', '$transfer_owner', 
                                  '$transfer_price_type', " . ($transfer_price !== null ? $transfer_price : "NULL") . ", '$transfer_currency', " . ($transfer_price_mini !== null ? $transfer_price_mini : "NULL") . ",
                                  " . ($transfer_price_midi !== null ? $transfer_price_midi : "NULL") . ", " . ($transfer_price_bus !== null ? $transfer_price_bus : "NULL") . ", '$transfer_currency_fixed', true, NOW()
                          ) RETURNING id";
            }
            
            error_log('Executing query: ' . substr($query, 0, 200) . '...');
            $result = pg_query($conn, $query);
            
            if (!$result) {
                $error = getDbErrorMessage($conn);
                error_log('Query failed: ' . $error);
                throw new Exception($error);
            }
            
            $row = pg_fetch_assoc($result);
            $transfer_period_id = $row['id'];
            error_log('Transfer period created with ID: ' . $transfer_period_id);
            
            // Save additional data based on pricing method
            if ($hasNewColumns) {
                if ($pricing_method === 'fixed_price') {
                    // Save fixed group ranges if applicable
                    if (isset($data['fixed_group_ranges']) && is_array($data['fixed_group_ranges'])) {
                        saveTransferGroupRanges($conn, $transfer_period_id, $data['fixed_group_ranges']);
                    }
                } else if ($pricing_method === 'regional_price') {
                    $regional_price_type = $data['regional_price_type'] ?? 'per_person';
                    if ($regional_price_type === 'per_person' && isset($data['regional_prices']) && is_array($data['regional_prices'])) {
                        saveTransferRegionalPrices($conn, $transfer_period_id, $data['regional_prices']);
                    } else if ($regional_price_type === 'group' && isset($data['regional_group_ranges']) && is_array($data['regional_group_ranges'])) {
                        saveTransferRegionalGroupRanges($conn, $transfer_period_id, $data['regional_group_ranges']);
                    }
                }
            }
            
            pg_query($conn, 'COMMIT');
            error_log('Transfer period committed successfully');
            echo json_encode(['success' => true, 'id' => $transfer_period_id, 'message' => 'Transfer period created successfully'], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            pg_query($conn, 'ROLLBACK');
            error_log('Transfer period transaction rolled back: ' . $e->getMessage());
            throw $e;
        }
    } catch (Exception $e) {
        error_log('Transfer Period Create OUTER Exception: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        $errorMsg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() : 'An error occurred';
        echo json_encode(['success' => false, 'message' => $errorMsg, 'debug_error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}

// Update contract transfer period
function updateContractTransferPeriod($conn, $data) {
    try {
        if (empty($data['id']) || empty($data['period_name'])) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing']);
            return;
        }
        
        if (empty($data['start_date']) || empty($data['end_date'])) {
            echo json_encode(['success' => false, 'message' => 'Start date and end date are required']);
            return;
        }
        
        $id = (int)$data['id'];
        $period_name = pg_escape_string($conn, $data['period_name']);
        $start_date = pg_escape_string($conn, $data['start_date']);
        $end_date = pg_escape_string($conn, $data['end_date']);
        $transfer_owner = pg_escape_string($conn, $data['transfer_owner'] ?? 'agency');
        
        // Validate dates
        if ($start_date && $end_date && $end_date < $start_date) {
            echo json_encode(['success' => false, 'message' => 'End date must be after start date']);
            return;
        }
        
        // New pricing fields
        $pricing_method = pg_escape_string($conn, $data['pricing_method'] ?? 'fixed_price');
        $fixed_price_type = pg_escape_string($conn, $data['fixed_price_type'] ?? '');
        $regional_price_type = pg_escape_string($conn, $data['regional_price_type'] ?? '');
        $adult_age = pg_escape_string($conn, $data['adult_age'] ?? '');
        $child_age_range = pg_escape_string($conn, $data['child_age_range'] ?? '');
        $infant_age_range = pg_escape_string($conn, $data['infant_age_range'] ?? '');
        $adult_price = isset($data['adult_price']) && $data['adult_price'] !== '' ? (float)$data['adult_price'] : null;
        $child_price = isset($data['child_price']) && $data['child_price'] !== '' ? (float)$data['child_price'] : null;
        $infant_price = isset($data['infant_price']) && $data['infant_price'] !== '' ? (float)$data['infant_price'] : null;
        $fixed_currency = pg_escape_string($conn, $data['fixed_currency'] ?? 'USD');
        $group_price = isset($data['group_price']) && $data['group_price'] !== '' ? (float)$data['group_price'] : null;
        $group_currency = pg_escape_string($conn, $data['group_currency'] ?? 'USD');
        $regional_adult_age = pg_escape_string($conn, $data['regional_adult_age'] ?? '');
        $regional_child_age = pg_escape_string($conn, $data['regional_child_age'] ?? '');
        $regional_infant_age = pg_escape_string($conn, $data['regional_infant_age'] ?? '');
        
        // Old fields
        $transfer_price_type = pg_escape_string($conn, $data['transfer_price_type'] ?? '');
        $transfer_price = isset($data['transfer_price']) ? (float)$data['transfer_price'] : null;
        $transfer_currency = pg_escape_string($conn, $data['transfer_currency'] ?? 'USD');
        $transfer_price_mini = isset($data['transfer_price_mini']) ? (float)$data['transfer_price_mini'] : null;
        $transfer_price_midi = isset($data['transfer_price_midi']) ? (float)$data['transfer_price_midi'] : null;
        $transfer_price_bus = isset($data['transfer_price_bus']) ? (float)$data['transfer_price_bus'] : null;
        $transfer_currency_fixed = pg_escape_string($conn, $data['transfer_currency_fixed'] ?? 'USD');
        
        // Check if new columns exist
        $columnsCheck = pg_query($conn, "SELECT column_name FROM information_schema.columns 
                                         WHERE table_name = 'contract_transfer_periods' AND column_name = 'pricing_method'");
        $hasNewColumns = pg_num_rows($columnsCheck) > 0;
        
        pg_query($conn, 'BEGIN');
        
        try {
            if ($hasNewColumns) {
                $query = "UPDATE contract_transfer_periods SET 
                          period_name = '$period_name', 
                          start_date = '$start_date', 
                          end_date = '$end_date',
                          transfer_owner = '$transfer_owner',
                          pricing_method = '$pricing_method',
                          fixed_price_type = '$fixed_price_type',
                          regional_price_type = '$regional_price_type',
                          adult_age = '$adult_age',
                          child_age_range = '$child_age_range',
                          infant_age_range = '$infant_age_range',
                          adult_price = " . ($adult_price !== null ? $adult_price : "NULL") . ",
                          child_price = " . ($child_price !== null ? $child_price : "NULL") . ",
                          infant_price = " . ($infant_price !== null ? $infant_price : "NULL") . ",
                          fixed_currency = '$fixed_currency',
                          group_price = " . ($group_price !== null ? $group_price : "NULL") . ",
                          group_currency = '$group_currency',
                          regional_adult_age = '$regional_adult_age',
                          regional_child_age = '$regional_child_age',
                          regional_infant_age = '$regional_infant_age',
                          transfer_price_type = '$transfer_price_type',
                          transfer_price = " . ($transfer_price !== null ? $transfer_price : "NULL") . ",
                          transfer_currency = '$transfer_currency',
                          transfer_price_mini = " . ($transfer_price_mini !== null ? $transfer_price_mini : "NULL") . ",
                          transfer_price_midi = " . ($transfer_price_midi !== null ? $transfer_price_midi : "NULL") . ",
                          transfer_price_bus = " . ($transfer_price_bus !== null ? $transfer_price_bus : "NULL") . ",
                          transfer_currency_fixed = '$transfer_currency_fixed',
                          updated_at = NOW() 
                          WHERE id = $id";
            } else {
                // Fallback for old schema
                $query = "UPDATE contract_transfer_periods SET 
                          period_name = '$period_name', 
                          start_date = '$start_date', 
                          end_date = '$end_date',
                          transfer_owner = '$transfer_owner', 
                          transfer_price_type = '$transfer_price_type',
                          transfer_price = " . ($transfer_price !== null ? $transfer_price : "NULL") . ", 
                          transfer_currency = '$transfer_currency',
                          transfer_price_mini = " . ($transfer_price_mini !== null ? $transfer_price_mini : "NULL") . ", 
                          transfer_price_midi = " . ($transfer_price_midi !== null ? $transfer_price_midi : "NULL") . ",
                          transfer_price_bus = " . ($transfer_price_bus !== null ? $transfer_price_bus : "NULL") . ", 
                          transfer_currency_fixed = '$transfer_currency_fixed',
                          updated_at = NOW() WHERE id = $id";
            }
            
            $result = pg_query($conn, $query);
            
            if (!$result) {
                throw new Exception(getDbErrorMessage($conn));
            }
            
            // Update additional data based on pricing method
            if ($hasNewColumns) {
                if ($pricing_method === 'fixed_price') {
                    // Save fixed group ranges if applicable
                    if (isset($data['fixed_group_ranges']) && is_array($data['fixed_group_ranges'])) {
                        saveTransferGroupRanges($conn, $id, $data['fixed_group_ranges']);
                    }
                } else if ($pricing_method === 'regional_price') {
                    $regional_price_type = $data['regional_price_type'] ?? 'per_person';
                    if ($regional_price_type === 'per_person' && isset($data['regional_prices']) && is_array($data['regional_prices'])) {
                        saveTransferRegionalPrices($conn, $id, $data['regional_prices']);
                    } else if ($regional_price_type === 'group' && isset($data['regional_group_ranges']) && is_array($data['regional_group_ranges'])) {
                        saveTransferRegionalGroupRanges($conn, $id, $data['regional_group_ranges']);
                    }
                }
            }
            
            pg_query($conn, 'COMMIT');
            echo json_encode(['success' => true, 'message' => 'Transfer period updated successfully'], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            pg_query($conn, 'ROLLBACK');
            error_log('Transfer period update rolled back: ' . $e->getMessage());
            throw $e;
        }
    } catch (Exception $e) {
        error_log('Transfer Period Update Exception: ' . $e->getMessage());
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        $errorMsg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() : 'An error occurred';
        echo json_encode(['success' => false, 'message' => $errorMsg, 'debug_error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}

// Delete contract transfer period
function deleteContractTransferPeriod($conn, $id) {
    try {
        $id = (int)$id;
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid transfer period ID']);
            return;
        }
        
        $query = "DELETE FROM contract_transfer_periods WHERE id = $id";
        $result = pg_query($conn, $query);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'Failed to delete transfer period';
            echo json_encode(['success' => false, 'message' => $errorMsg]);
        }
    } catch (Exception $e) {
        if (function_exists('logError')) logError($e->getMessage(), __FILE__, __LINE__);
        $errorMsg = function_exists('getDbErrorMessage') ? getDbErrorMessage($conn) : 'An error occurred';
        echo json_encode(['success' => false, 'message' => $errorMsg]);
    }
}

// Save price period regional prices
function savePricePeriodRegionalPrices($conn, $period_id, $regional_prices) {
    // Delete existing regional prices
    $deleteQuery = "DELETE FROM contract_price_period_regional_prices WHERE price_period_id = $period_id";
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
            $child_price = isset($priceData['child_price']) && $priceData['child_price'] !== '' ? (float)$priceData['child_price'] : null;
            $infant_price = isset($priceData['infant_price']) && $priceData['infant_price'] !== '' ? (float)$priceData['infant_price'] : null;
            $currency = pg_escape_string($conn, $priceData['currency'] ?? 'USD');
            
            $adult_price_val = $adult_price !== null ? $adult_price : 'NULL';
            $child_price_val = $child_price !== null ? $child_price : 'NULL';
            $infant_price_val = $infant_price !== null ? $infant_price : 'NULL';
            
            $insertQuery = "INSERT INTO contract_price_period_regional_prices 
                           (price_period_id, sub_region_id, adult_price, child_price, infant_price, currency, created_at)
                           VALUES ($period_id, $sub_region_id, $adult_price_val, $child_price_val, $infant_price_val, '$currency', NOW())";
            $insertResult = pg_query($conn, $insertQuery);
            if (!$insertResult) {
                throw new Exception('Failed to insert regional price: ' . getDbErrorMessage($conn));
            }
        }
    }
}

// Save transfer regional prices
function saveTransferRegionalPrices($conn, $transfer_period_id, $regional_prices) {
    // Delete existing regional prices
    $deleteQuery = "DELETE FROM transfer_period_regional_prices WHERE transfer_period_id = $transfer_period_id";
    $deleteResult = @pg_query($conn, $deleteQuery);
    if (!$deleteResult) {
        throw new Exception('Failed to delete existing transfer regional prices: ' . getDbErrorMessage($conn));
    }
    
    // Insert new regional prices
    if (!empty($regional_prices)) {
        foreach ($regional_prices as $priceData) {
            $sub_region_id = (int)$priceData['sub_region_id'];
            if ($sub_region_id <= 0) continue;
            
            $adult_price = isset($priceData['adult_price']) && $priceData['adult_price'] !== '' ? (float)$priceData['adult_price'] : null;
            $child_price = isset($priceData['child_price']) && $priceData['child_price'] !== '' ? (float)$priceData['child_price'] : null;
            $infant_price = isset($priceData['infant_price']) && $priceData['infant_price'] !== '' ? (float)$priceData['infant_price'] : null;
            
            $adult_price_val = $adult_price !== null ? $adult_price : 'NULL';
            $child_price_val = $child_price !== null ? $child_price : 'NULL';
            $infant_price_val = $infant_price !== null ? $infant_price : 'NULL';
            
            $insertQuery = "INSERT INTO transfer_period_regional_prices 
                           (transfer_period_id, sub_region_id, adult_price, child_price, infant_price, created_at)
                           VALUES ($transfer_period_id, $sub_region_id, $adult_price_val, $child_price_val, $infant_price_val, NOW())";
            $insertResult = pg_query($conn, $insertQuery);
            if (!$insertResult) {
                throw new Exception('Failed to insert transfer regional price: ' . getDbErrorMessage($conn));
            }
        }
    }
}

// Save transfer group ranges (for Fixed Price - Group Total)
function saveTransferGroupRanges($conn, $transfer_period_id, $group_ranges) {
    // Delete existing group ranges
    $deleteQuery = "DELETE FROM transfer_period_group_ranges WHERE transfer_period_id = $transfer_period_id";
    $deleteResult = @pg_query($conn, $deleteQuery);
    if (!$deleteResult) {
        throw new Exception('Failed to delete existing group ranges: ' . getDbErrorMessage($conn));
    }
    
    // Insert new group ranges
    if (!empty($group_ranges)) {
        foreach ($group_ranges as $range) {
            $min_persons = (int)$range['min_persons'];
            $max_persons = (int)$range['max_persons'];
            $price = (float)$range['price'];
            $currency = pg_escape_string($conn, $range['currency'] ?? 'USD');
            
            if ($min_persons <= 0 || $max_persons <= 0 || $price <= 0) continue;
            
            $insertQuery = "INSERT INTO transfer_period_group_ranges 
                           (transfer_period_id, min_persons, max_persons, price, currency, created_at)
                           VALUES ($transfer_period_id, $min_persons, $max_persons, $price, '$currency', NOW())";
            $insertResult = pg_query($conn, $insertQuery);
            if (!$insertResult) {
                throw new Exception('Failed to insert group range: ' . getDbErrorMessage($conn));
            }
        }
    }
}

// Save transfer regional group ranges (for Regional Price - Group)
function saveTransferRegionalGroupRanges($conn, $transfer_period_id, $regional_group_ranges) {
    // Delete existing regional group ranges
    $deleteQuery = "DELETE FROM transfer_period_regional_group_ranges WHERE transfer_period_id = $transfer_period_id";
    $deleteResult = @pg_query($conn, $deleteQuery);
    if (!$deleteResult) {
        throw new Exception('Failed to delete existing regional group ranges: ' . getDbErrorMessage($conn));
    }
    
    // Insert new regional group ranges
    if (!empty($regional_group_ranges)) {
        foreach ($regional_group_ranges as $range) {
            $sub_region_id = (int)$range['sub_region_id'];
            $min_persons = (int)$range['min_persons'];
            $max_persons = (int)$range['max_persons'];
            $price = (float)$range['price'];
            $currency = pg_escape_string($conn, $range['currency'] ?? 'USD');
            
            if ($sub_region_id <= 0 || $min_persons <= 0 || $max_persons <= 0 || $price <= 0) continue;
            
            $insertQuery = "INSERT INTO transfer_period_regional_group_ranges 
                           (transfer_period_id, sub_region_id, min_persons, max_persons, price, currency, created_at)
                           VALUES ($transfer_period_id, $sub_region_id, $min_persons, $max_persons, $price, '$currency', NOW())";
            $insertResult = pg_query($conn, $insertQuery);
            if (!$insertResult) {
                throw new Exception('Failed to insert regional group range: ' . getDbErrorMessage($conn));
            }
        }
    }
}
?>

