<?php
/**
 * Currencies API
 * Handles all CRUD operations for currencies
 */

// Start output buffering to catch any errors
ob_start();

// Define API_REQUEST before loading config to prevent error display
define('API_REQUEST', true);

// Disable error display for API requests (errors will still be logged)
ini_set('display_errors', 0);
error_reporting(E_ALL);

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

// Clear any output that might have been generated
ob_end_clean();

// Ensure output is only JSON
if (ob_get_level() > 0) {
    ob_clean();
}

// Get database connection
try {
    $conn = getDbConnection();
} catch (Exception $e) {
    error_log("Database connection failed in currencies.php: " . $e->getMessage());
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
    error_log("API Error in currencies.php: " . $e->getMessage());
    $message = APP_DEBUG ? $e->getMessage() : 'An error occurred while processing your request';
    echo json_encode(['success' => false, 'message' => $message]);
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'currencies':
            getCurrencies($conn);
            break;
        case 'countries':
            getCountriesForCurrency($conn);
            break;
        case 'country_currencies':
            $country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : 0;
            if ($country_id <= 0) {
                echo json_encode(['success' => false, 'message' => 'country_id is required']);
                return;
            }
            getCountryCurrencies($conn, $country_id);
            break;
        case 'rates':
            $country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : 0;
            if ($country_id <= 0) {
                echo json_encode(['success' => false, 'message' => 'country_id is required']);
                return;
            }
            $start = $_GET['start'] ?? null;
            $end = $_GET['end'] ?? null;
            getExchangeRates($conn, $country_id, $start, $end);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'currency':
            createCurrency($conn, $data);
            break;
        case 'country':
            updateCountryBase($conn, $data); // Upsert-like for base fields
            break;
        case 'country_currency':
            createCountryCurrency($conn, $data);
            break;
        case 'rate_manual':
            createManualRates($conn, $data);
            break;
        case 'rate_cbrt':
            createCbrtRates($conn, $data);
            break;
        case 'rate':
            updateRate($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'currency':
            updateCurrency($conn, $data);
            break;
        case 'country':
            updateCountryBase($conn, $data);
            break;
        case 'country_currency':
            updateCountryCurrency($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// DELETE request handler
function handleDelete($conn, $action) {
    $id = $_GET['id'] ?? null;
    
    switch ($action) {
        case 'currency':
            if (!$id) { echo json_encode(['success'=>false,'message'=>'ID is required']); return; }
            deleteCurrency($conn, $id);
            break;
        case 'country_currency':
            if (!$id) { echo json_encode(['success'=>false,'message'=>'ID is required']); return; }
            deleteCountryCurrency($conn, $id);
            break;
        case 'rate':
            if (!$id) { echo json_encode(['success'=>false,'message'=>'ID is required']); return; }
            deleteRate($conn, $id);
            break;
        case 'rates_by_date':
            $country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : 0;
            $date = $_GET['date'] ?? null;
            if ($country_id <= 0 || !$date) { echo json_encode(['success'=>false,'message'=>'country_id and date are required']); return; }
            deleteRatesByDate($conn, $country_id, $date);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

// Get currencies
function getCurrencies($conn) {
    $query = "SELECT * FROM currencies ORDER BY code ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $currencies = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $currencies]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get all countries
function getCountriesForCurrency($conn) {
    $query = "SELECT id, name, code, local_currency_code FROM countries ORDER BY name ASC";
    $result = pg_query($conn, $query);
    if ($result) {
        $rows = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $rows]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Update country's base settings (local currency code). Requires id
function updateCountryBase($conn, $data) {
    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'id is required']);
        return;
    }
    $hasLcc = array_key_exists('local_currency_code', $data);
    if (!$hasLcc) {
        echo json_encode(['success' => true]);
        return;
    }
    $local_currency_code_raw = strtoupper((string)($data['local_currency_code'] ?? ''));
    if ($local_currency_code_raw === '') {
        $query = "UPDATE countries SET local_currency_code = NULL, updated_at = NOW() WHERE id = $1";
        $result = pg_query_params($conn, $query, [$id]);
    } else {
        $query = "UPDATE countries SET local_currency_code = $1, updated_at = NOW() WHERE id = $2";
        $result = pg_query_params($conn, $query, [$local_currency_code_raw, $id]);
    }
    if ($result) echo json_encode(['success' => true]); else echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
}

// Country currencies: list
function getCountryCurrencies($conn, $country_id) {
    $query = "SELECT cc.id, cc.country_id, cc.currency_code, cc.unit_name, cc.is_active, c.name as currency_name, c.symbol
              FROM country_currencies cc
              LEFT JOIN currencies c ON c.code = cc.currency_code
              WHERE cc.country_id = $1
              ORDER BY cc.currency_code ASC";
    $result = pg_query_params($conn, $query, [$country_id]);
    if ($result) {
        $rows = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $rows]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Rates: list
function getExchangeRates($conn, $country_id, $start = null, $end = null) {
    $params = [$country_id];
    $clauses = ["country_id = $1"];
    if ($start) { $params[] = $start; $clauses[] = "rate_date >= $" . count($params); }
    if ($end) { $params[] = $end; $clauses[] = "rate_date <= $" . count($params); }
    $where = implode(' AND ', $clauses);
    $query = "SELECT id, country_id, currency_code, rate_date, rate, source FROM exchange_rates WHERE $where ORDER BY rate_date DESC, currency_code ASC";
    $result = pg_query_params($conn, $query, $params);
    if ($result) {
        $rows = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $rows]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Manual rates: support single date or range
function createManualRates($conn, $data) {
    $country_id = (int)($data['country_id'] ?? 0);
    $currency_code = strtoupper(pg_escape_string($conn, $data['currency_code'] ?? ''));
    $rate = isset($data['rate']) ? (float)$data['rate'] : 0;
    $date = $data['rate_date'] ?? null;
    $start = $data['start_date'] ?? null;
    $end = $data['end_date'] ?? null;
    if ($country_id <= 0 || empty($currency_code)) {
        echo json_encode(['success' => false, 'message' => 'country_id and currency_code are required']);
        return;
    }
    if ($rate <= 0) {
        echo json_encode(['success' => false, 'message' => 'rate must be > 0']);
        return;
    }
    $dates = [];
    if ($date) {
        $dates[] = $date;
    } elseif ($start && $end) {
        $dates = expandDateRange($start, $end);
    } else {
        echo json_encode(['success' => false, 'message' => 'Provide rate_date or start_date and end_date']);
        return;
    }
    $inserted = 0; $skipped = 0;
    foreach ($dates as $d) {
        // Use prepared statements to prevent SQL injection
        $query = "INSERT INTO exchange_rates (country_id, currency_code, rate_date, rate, source, created_at) VALUES ($1, $2, $3, $4, 'manual', NOW())";
        $params = [$country_id, $currency_code, $d, $rate];
        $res = @pg_query_params($conn, $query, $params);
        if ($res) { $inserted++; } else { $skipped++; }
    }
    echo json_encode(['success' => true, 'inserted' => $inserted, 'skipped' => $skipped]);
}

// CBRT rates: only for Turkey (optional restriction) and for supported codes
function createCbrtRates($conn, $data) {
    $country_id = (int)($data['country_id'] ?? 0);
    $currency_code = strtoupper(pg_escape_string($conn, $data['currency_code'] ?? ''));
    $date = $data['rate_date'] ?? null;
    $start = $data['start_date'] ?? null;
    $end = $data['end_date'] ?? null;
    if ($country_id <= 0 || empty($currency_code)) {
        echo json_encode(['success' => false, 'message' => 'country_id and currency_code are required']);
        return;
    }
    // Optional: ensure country is Turkey - use parameterized query
    $countryRes = pg_query_params($conn, "SELECT code, name FROM countries WHERE id = $1", [$country_id]);
    $country = $countryRes ? pg_fetch_assoc($countryRes) : null;
    if (!$country) { echo json_encode(['success'=>false,'message'=>'Country not found']); return; }
    // Enforce CBRT only for Turkey
    if (strtoupper($country['code'] ?? '') !== 'TR') {
        echo json_encode(['success'=>false,'message'=>'CBRT fetch is only available for Turkey']);
        return;
    }
    $dates = [];
    if ($date) { $dates[] = $date; }
    elseif ($start && $end) { $dates = expandDateRange($start, $end); }
    else { echo json_encode(['success'=>false,'message'=>'Provide rate_date or start_date and end_date']); return; }

    $inserted = 0; $skipped = 0; $notFound = 0; $alreadyExists = 0;
    $notFoundDates = []; // Track which dates had no rates
    foreach ($dates as $d) {
        // Check if rate already exists for this date - use parameterized query
        $checkQuery = "SELECT id FROM exchange_rates WHERE country_id = $1 AND currency_code = $2 AND rate_date = $3";
        $checkRes = pg_query_params($conn, $checkQuery, [$country_id, $currency_code, $d]);
        if ($checkRes && pg_num_rows($checkRes) > 0) {
            $alreadyExists++;
            continue; // Skip API call if rate already exists
        }
        
        // Try exact date only - NO FALLBACK to previous dates
        // If rate doesn't exist for the exact date, don't add anything
        $fetched = fetchCbrtRate($d, $currency_code);
        if ($fetched === null) { 
            $notFound++; 
            $notFoundDates[] = $d; // Track the date
            continue; 
        }
        
        // Use parameterized query to prevent SQL injection
        $query = "INSERT INTO exchange_rates (country_id, currency_code, rate_date, rate, source, created_at) VALUES ($1, $2, $3, $4, 'cbrt', NOW())";
        $res = @pg_query_params($conn, $query, [$country_id, $currency_code, $d, $fetched]);
        if ($res) { $inserted++; } else { $skipped++; }
    }
    echo json_encode(['success'=>true,'inserted'=>$inserted,'skipped'=>$skipped,'not_found'=>$notFound,'already_exists'=>$alreadyExists,'not_found_dates'=>$notFoundDates]);
}

// Update single rate value by id
function updateRate($conn, $data) {
    $id = (int)($data['id'] ?? 0);
    $rate = isset($data['rate']) ? (float)$data['rate'] : 0;
    if ($id <= 0 || $rate <= 0) {
        echo json_encode(['success'=>false,'message'=>'Valid id and rate > 0 required']);
        return;
    }
    // Use prepared statement to prevent SQL injection
    $q = "UPDATE exchange_rates SET rate = $1, updated_at = NOW() WHERE id = $2";
    $r = pg_query_params($conn, $q, [$rate, $id]);
    if ($r) echo json_encode(['success'=>true]); else echo json_encode(['success'=>false,'message'=>getDbErrorMessage($conn)]);
}

function expandDateRange($start, $end) {
    $out = [];
    try {
        $s = new DateTime($start); $e = new DateTime($end);
        if ($e < $s) { $tmp = $s; $s = $e; $e = $tmp; }
        for ($d = clone $s; $d <= $e; $d->modify('+1 day')) {
            $out[] = $d->format('Y-m-d');
        }
    } catch (Exception $ex) {}
    return $out;
}

// Fetch CBRT daily XML for a date and code; returns float or null
function fetchCbrtRate($date, $currencyCode) {
    // TCMB URL patterns: today: https://www.tcmb.gov.tr/kurlar/today.xml
    // specific: https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dt) return null;
    $todayStr = (new DateTime())->format('Y-m-d');
    if ($date === $todayStr) {
        $url = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    } else {
        $y = $dt->format('Y'); $m = $dt->format('m'); $d = $dt->format('d');
        $url = "https://www.tcmb.gov.tr/kurlar/{$y}{$m}/{$d}{$m}{$y}.xml";
    }
    $xmlStr = httpGet($url);
    if (!$xmlStr) return null;
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlStr);
    if ($xml === false) return null;
    foreach ($xml->Currency as $cur) {
        $code = (string)$cur['CurrencyCode'];
        if (strtoupper($code) === strtoupper($currencyCode)) {
            // Prefer ForexSelling; fallback to BanknoteSelling; values with comma decimal
            $val = (string)$cur->ForexSelling;
            if ($val === '' || $val === '0') $val = (string)$cur->BanknoteSelling;
            $val = str_replace(',', '.', $val);
            $num = floatval($val);
            return $num > 0 ? $num : null;
        }
    }
    return null;
}

// Try up to $maxBackDays previous days to find the last available CBRT rate
function fetchCbrtRateWithFallback($date, $currencyCode, $maxBackDays = 3) {
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dt) return null;
    for ($i = 0; $i <= $maxBackDays; $i++) {
        $tryDate = (clone $dt)->modify($i === 0 ? '+0 day' : "-{$i} day")->format('Y-m-d');
        $val = fetchCbrtRate($tryDate, $currencyCode);
        if ($val !== null) return $val;
    }
    return null;
}

function httpGet($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $out = curl_exec($ch);
        curl_close($ch);
        return $out;
    }
    return @file_get_contents($url);
}

// Country currency: create
function createCountryCurrency($conn, $data) {
    $country_id = (int)($data['country_id'] ?? 0);
    $currency_code = strtoupper(pg_escape_string($conn, $data['currency_code'] ?? ''));
    $unit_name = isset($data['unit_name']) ? pg_escape_string($conn, $data['unit_name']) : null;
    $is_active = isset($data['is_active']) ? ((bool)$data['is_active'] ? 'true' : 'false') : 'true';
    
    if ($country_id <= 0 || empty($currency_code)) {
        echo json_encode(['success' => false, 'message' => 'country_id and currency_code are required']);
        return;
    }
    
    // Check currency exists using parameterized query
    $checkCur = pg_query_params($conn, "SELECT id FROM currencies WHERE code = $1", [$currency_code]);
    if (!$checkCur || pg_num_rows($checkCur) === 0) {
        echo json_encode(['success' => false, 'message' => 'Currency code not found']);
        return;
    }
    
    // Insert using parameterized query
    $query = "INSERT INTO country_currencies (country_id, currency_code, unit_name, is_active, created_at) 
              VALUES ($1, $2, $3, $4, NOW()) RETURNING id";
    $result = pg_query_params($conn, $query, [
        $country_id,
        $currency_code,
        ($unit_name === null || $unit_name === '') ? null : $unit_name,
        $is_active === 'true'
    ]);
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        $err = getDbErrorMessage($conn);
        if (strpos(strtolower($err), 'unique') !== false) {
            echo json_encode(['success' => false, 'message' => 'This currency is already added to the country']);
        } else {
            echo json_encode(['success' => false, 'message' => $err]);
        }
    }
}

// Country currency: update
function updateCountryCurrency($conn, $data) {
    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'id is required']);
        return;
    }
    $unit_present = array_key_exists('unit_name', $data);
    $is_active_present = array_key_exists('is_active', $data);
    $sets = [];
    $params = [];
    if ($unit_present) {
        $unit_name = (string)($data['unit_name'] ?? '');
        if ($unit_name === '') {
            $sets[] = "unit_name = NULL";
        } else {
            $params[] = $unit_name;
            $sets[] = "unit_name = $" . count($params);
        }
    }
    if ($is_active_present) {
        $params[] = (bool)$data['is_active'] ? 'true' : 'false';
        $sets[] = "is_active = $" . count($params);
    }
    $sets[] = "updated_at = NOW()";
    $params[] = $id;
    $query = "UPDATE country_currencies SET " . implode(', ', $sets) . " WHERE id = $" . count($params);
    $result = pg_query_params($conn, $query, $params);
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Country currency: delete
function deleteCountryCurrency($conn, $id) {
    $id = (int)$id;
    $query = "DELETE FROM country_currencies WHERE id = $id";
    $result = pg_query($conn, $query);
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

function deleteRate($conn, $id) {
    $id = (int)$id;
    $q = "DELETE FROM exchange_rates WHERE id = $id";
    $r = pg_query($conn, $q);
    if ($r) echo json_encode(['success'=>true]); else echo json_encode(['success'=>false,'message'=>getDbErrorMessage($conn)]);
}

function deleteRatesByDate($conn, $country_id, $date) {
    $country_id = (int)$country_id;
    // Use parameterized query to prevent SQL injection
    $q = "DELETE FROM exchange_rates WHERE country_id = $1 AND rate_date = $2";
    $r = pg_query_params($conn, $q, [$country_id, $date]);
    if ($r) echo json_encode(['success'=>true]); else echo json_encode(['success'=>false,'message'=>getDbErrorMessage($conn)]);
}

// Create currency
function createCurrency($conn, $data) {
    $code = strtoupper(pg_escape_string($conn, $data['code'] ?? ''));
    $name = pg_escape_string($conn, $data['name'] ?? '');
    $symbol = pg_escape_string($conn, $data['symbol'] ?? '');
    $is_active = isset($data['is_active']) ? ($data['is_active'] ? 'true' : 'false') : 'true';
    
    if (empty($code) || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Code and name are required']);
        return;
    }
    
    // Check if code already exists - use parameterized query
    $checkQuery = "SELECT id FROM currencies WHERE code = $1";
    $checkResult = pg_query_params($conn, $checkQuery, [$code]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'Currency code already exists']);
        return;
    }
    
    if (!$checkResult) {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "INSERT INTO currencies (code, name, symbol, is_active, created_at) 
              VALUES ($1, $2, $3, $4, NOW()) RETURNING id";
    
    $result = pg_query_params($conn, $query, [
        $code,
        $name,
        empty($symbol) ? null : $symbol,
        $is_active === 'true'
    ]);
    
    if ($result) {
        $row = pg_fetch_assoc($result);
        echo json_encode(['success' => true, 'id' => $row['id']]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Update currency
function updateCurrency($conn, $data) {
    $id = (int)$data['id'];
    $code = strtoupper(pg_escape_string($conn, $data['code'] ?? ''));
    $name = pg_escape_string($conn, $data['name'] ?? '');
    $symbol = pg_escape_string($conn, $data['symbol'] ?? '');
    $is_active = isset($data['is_active']) ? ($data['is_active'] ? 'true' : 'false') : 'true';
    
    if (empty($code) || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Code and name are required']);
        return;
    }
    
    // Check if code already exists for another currency - use parameterized query
    $checkQuery = "SELECT id FROM currencies WHERE code = $1 AND id != $2";
    $checkResult = pg_query_params($conn, $checkQuery, [$code, $id]);
    if ($checkResult && pg_num_rows($checkResult) > 0) {
        echo json_encode(['success' => false, 'message' => 'Currency code already exists']);
        return;
    }
    
    if (!$checkResult) {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
        return;
    }
    
    // Use parameterized query to prevent SQL injection
    $query = "UPDATE currencies SET 
                code = $1,
                name = $2,
                symbol = $3,
                is_active = $4,
                updated_at = NOW()
              WHERE id = $5";
    
    $result = pg_query_params($conn, $query, [
        $code,
        $name,
        empty($symbol) ? null : $symbol,
        $is_active === 'true',
        $id
    ]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Delete currency
function deleteCurrency($conn, $id) {
    $id = (int)$id;
    
    // Note: contracts table check removed as contracts module has been removed
    
    $query = "DELETE FROM currencies WHERE id = $id";
    $result = pg_query($conn, $query);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}
?>

