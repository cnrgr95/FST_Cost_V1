<?php
/**
 * Costs API
 * Handles all CRUD operations for costs
 * Hierarchy: Country -> Region -> City -> Cost -> Period -> Item -> Prices
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

// Load API helper for translations
require_once __DIR__ . '/../../includes/ApiHelper.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    ob_end_clean();
    sendApiError('unauthorized', 401);
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
    if (!function_exists('sendApiError')) {
        require_once __DIR__ . '/../../includes/ApiHelper.php';
    }
    $msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : getApiTranslation('error_occurred');
    echo json_encode(['success' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE);
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
        $msg = defined('APP_DEBUG') ? $e->getMessage() : getApiTranslation('database_connection_failed');
        echo json_encode(['success' => false, 'message' => $msg]);
        exit;
    }

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Require CSRF token for state-changing requests
if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE' || $method === 'PATCH') {
    // Always regenerate token after validation to prevent expiration
    requireCsrfToken();
    // Regenerate token for next request
    generateCsrfToken();
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
            sendApiError('invalid_request_method', 405);
    }
} catch (Exception $e) {
    error_log("API Error in costs.php: " . $e->getMessage());
    $message = APP_DEBUG ? $e->getMessage() : getApiTranslation('error_occurred');
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
} finally {
    // Always close database connection
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}

// GET request handler
function handleGet($conn, $action) {
    switch ($action) {
        case 'countries':
            getCountries($conn);
            break;
        case 'regions':
            $country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : null;
            getRegions($conn, $country_id);
            break;
        case 'cities':
            $region_id = isset($_GET['region_id']) ? (int)$_GET['region_id'] : null;
            getCities($conn, $region_id);
            break;
        case 'sub_regions':
            $city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
            getSubRegions($conn, $city_id);
            break;
        case 'currencies':
            getCurrencies($conn);
            break;
        case 'costs':
            getCosts($conn);
            break;
        case 'cost':
            $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
            getCost($conn, $id);
            break;
        default:
            sendApiError('invalid_action', 400);
    }
}

// POST request handler
function handlePost($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'cost':
            createCost($conn, $data);
            break;
        default:
            sendApiError('invalid_action', 400);
    }
}

// PUT request handler
function handlePut($conn, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'cost':
            updateCost($conn, $data);
            break;
        default:
            sendApiError('invalid_action', 400);
    }
}

// DELETE request handler
function handleDelete($conn, $action) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendApiError('id_required', 400);
        return;
    }
    
    switch ($action) {
        case 'cost':
            deleteCost($conn, $id);
            break;
        default:
            sendApiError('invalid_action', 400);
    }
}

// Get countries
function getCountries($conn) {
    $query = "SELECT * FROM countries ORDER BY name ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $countries = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $countries]);
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
        $regions = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $regions]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get cities
function getCities($conn, $region_id = null) {
    if ($region_id) {
        $region_id = (int)$region_id;
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
        $cities = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $cities]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get sub regions
function getSubRegions($conn, $city_id = null) {
    if ($city_id) {
        $city_id = (int)$city_id;
        $query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM sub_regions sr 
                  LEFT JOIN cities c ON sr.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id 
                  WHERE sr.city_id = $city_id 
                  ORDER BY sr.name ASC";
    } else {
        $query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name 
                  FROM sub_regions sr 
                  LEFT JOIN cities c ON sr.city_id = c.id 
                  LEFT JOIN regions r ON c.region_id = r.id 
                  LEFT JOIN countries co ON r.country_id = co.id 
                  ORDER BY sr.name ASC";
    }
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $subRegions = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $subRegions]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get currencies
function getCurrencies($conn) {
    $query = "SELECT * FROM currencies WHERE is_active = true ORDER BY code ASC";
    $result = pg_query($conn, $query);
    
    if ($result) {
        $currencies = pg_fetch_all($result) ?: [];
        echo json_encode(['success' => true, 'data' => $currencies]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get costs
function getCosts($conn) {
    $query = "SELECT c.*, 
                     co.name as country_name, 
                     r.name as region_name, 
                     ci.name as city_name
              FROM costs c 
              LEFT JOIN countries co ON c.country_id = co.id 
              LEFT JOIN regions r ON c.region_id = r.id 
              LEFT JOIN cities ci ON c.city_id = ci.id
              ORDER BY c.cost_code, c.name ASC";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $costs = pg_fetch_all($result) ?: [];
        
        // Get periods for each cost
        foreach ($costs as &$cost) {
            $cost_id = $cost['id'];
            $cost['periods'] = getCostPeriods($conn, $cost_id);
        }
        
        echo json_encode(['success' => true, 'data' => $costs]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Get cost periods
function getCostPeriods($conn, $cost_id) {
    $cost_id = (int)$cost_id;
    
    // Order: First periods with dates (by start_date DESC - newest first), then periods without dates (by created_at DESC - newest first)
    $query = "SELECT * FROM cost_periods WHERE cost_id = $cost_id 
              ORDER BY 
                CASE WHEN start_date IS NULL THEN 1 ELSE 0 END,
                start_date DESC NULLS LAST,
                created_at DESC";
    $result = pg_query($conn, $query);
    
    if (!$result) {
        if (defined('APP_DEBUG') && APP_DEBUG) {
            error_log("getCostPeriods query failed: " . pg_last_error($conn));
        }
        return [];
    }
    
    $periods = pg_fetch_all($result);
    
    if (!is_array($periods)) {
        $periods = [];
    }
    
    // Get items for each period
    foreach ($periods as &$period) {
        $period_id = (int)$period['id'];
        $period['items'] = getCostItems($conn, $period_id);
        
        // Ensure items is always an array
        if (!is_array($period['items'])) {
            $period['items'] = [];
        }
    }
    
    return $periods;
}

// Get cost items
function getCostItems($conn, $period_id) {
    $period_id = (int)$period_id;
    
    $query = "SELECT * FROM cost_items WHERE cost_period_id = $period_id ORDER BY id ASC";
    $result = pg_query($conn, $query);
    
    if (!$result) {
        if (defined('APP_DEBUG') && APP_DEBUG) {
            error_log("getCostItems query failed: " . pg_last_error($conn));
        }
        return [];
    }
    
    $items = pg_fetch_all($result);
    
    if (!is_array($items)) {
        $items = [];
    }
    
    // Get prices for each item
    foreach ($items as &$item) {
        $item_id = (int)$item['id'];
        if ($item['item_type'] === 'fixed') {
            if ($item['pricing_type'] === 'general') {
                $item['prices'] = getCostGeneralPrices($conn, $item_id);
            } else {
                $item['prices'] = getCostPersonPrices($conn, $item_id);
            }
        } else { // regional
            if ($item['pricing_type'] === 'general') {
                $item['prices'] = getCostRegionalGeneralPrices($conn, $item_id);
            } else {
                $item['prices'] = getCostRegionalPersonPrices($conn, $item_id);
            }
        }
        
        // Ensure prices is always an array
        if (!isset($item['prices']) || !is_array($item['prices'])) {
            $item['prices'] = [];
        }
    }
    
    return $items;
}

// Get general prices
function getCostGeneralPrices($conn, $item_id) {
    $query = "SELECT cgp.*, cu.code as currency_code, cu.name as currency_name
              FROM cost_general_prices cgp
              LEFT JOIN currencies cu ON cgp.currency_id = cu.id
              WHERE cgp.cost_item_id = $item_id";
    $result = pg_query($conn, $query);
    return $result ? pg_fetch_all($result) ?: [] : [];
}

// Get person prices
function getCostPersonPrices($conn, $item_id) {
    $query = "SELECT cpp.*, cu.code as currency_code, cu.name as currency_name
              FROM cost_person_prices cpp
              LEFT JOIN currencies cu ON cpp.currency_id = cu.id
              WHERE cpp.cost_item_id = $item_id
              ORDER BY CASE cpp.age_group 
                  WHEN 'adult' THEN 1 
                  WHEN 'child' THEN 2 
                  WHEN 'infant' THEN 3 
              END";
    $result = pg_query($conn, $query);
    return $result ? pg_fetch_all($result) ?: [] : [];
}

// Get regional general prices
function getCostRegionalGeneralPrices($conn, $item_id) {
    $query = "SELECT crgp.*, sr.name as sub_region_name, cu.code as currency_code, cu.name as currency_name
              FROM cost_regional_general_prices crgp
              LEFT JOIN sub_regions sr ON crgp.sub_region_id = sr.id
              LEFT JOIN currencies cu ON crgp.currency_id = cu.id
              WHERE crgp.cost_item_id = $item_id
              ORDER BY sr.name ASC";
    $result = pg_query($conn, $query);
    return $result ? pg_fetch_all($result) ?: [] : [];
}

// Get regional person prices
function getCostRegionalPersonPrices($conn, $item_id) {
    $query = "SELECT crpp.*, sr.name as sub_region_name, cu.code as currency_code, cu.name as currency_name
              FROM cost_regional_person_prices crpp
              LEFT JOIN sub_regions sr ON crpp.sub_region_id = sr.id
              LEFT JOIN currencies cu ON crpp.currency_id = cu.id
              WHERE crpp.cost_item_id = $item_id
              ORDER BY sr.name ASC, 
                       CASE crpp.age_group 
                           WHEN 'adult' THEN 1 
                           WHEN 'child' THEN 2 
                           WHEN 'infant' THEN 3 
                       END";
    $result = pg_query($conn, $query);
    return $result ? pg_fetch_all($result) ?: [] : [];
}

// Get single cost with all details
function getCost($conn, $id) {
    if (!$id) {
        sendApiError('id_required', 400);
        return;
    }
    
    $id = (int)$id;
    $query = "SELECT c.*, 
                     co.name as country_name, 
                     r.name as region_name, 
                     ci.name as city_name
              FROM costs c 
              LEFT JOIN countries co ON c.country_id = co.id 
              LEFT JOIN regions r ON c.region_id = r.id 
              LEFT JOIN cities ci ON c.city_id = ci.id
              WHERE c.id = $id";
    
    $result = pg_query($conn, $query);
    
    if ($result) {
        $cost = pg_fetch_assoc($result);
        if ($cost) {
            $cost['periods'] = getCostPeriods($conn, $id);
            
            // Ensure periods is always an array
            if (!isset($cost['periods']) || !is_array($cost['periods'])) {
                $cost['periods'] = [];
            }
            
            echo json_encode(['success' => true, 'data' => $cost], JSON_NUMERIC_CHECK);
        } else {
            echo json_encode(['success' => false, 'message' => getApiTranslation('cost_not_found')]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}

// Create cost
function createCost($conn, $data) {
    pg_query($conn, "BEGIN");
    
    try {
        $name = trim($data['name'] ?? '');
        
        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => getApiTranslation('cost_name_required')]);
            pg_query($conn, "ROLLBACK");
            return;
        }
        
        // Get location IDs
        $country_id = isset($data['country_id']) && !empty($data['country_id']) ? (int)$data['country_id'] : null;
        $region_id = isset($data['region_id']) && !empty($data['region_id']) ? (int)$data['region_id'] : null;
        $city_id = isset($data['city_id']) && !empty($data['city_id']) ? (int)$data['city_id'] : null;
        
        // Check if cost name already exists in the same city
        if ($city_id) {
            $checkQuery = "SELECT id FROM costs WHERE LOWER(name) = LOWER($1) AND city_id = $2";
            $checkResult = pg_query_params($conn, $checkQuery, [$name, $city_id]);
            if ($checkResult && pg_num_rows($checkResult) > 0) {
                echo json_encode(['success' => false, 'message' => 'A cost with this name already exists in this city. Cost names must be unique within a city.']);
                pg_query($conn, "ROLLBACK");
                return;
            }
        } else {
            // If no city specified, check globally
            $checkQuery = "SELECT id FROM costs WHERE LOWER(name) = LOWER($1) AND city_id IS NULL";
            $checkResult = pg_query_params($conn, $checkQuery, [$name]);
            if ($checkResult && pg_num_rows($checkResult) > 0) {
                echo json_encode(['success' => false, 'message' => 'A cost with this name already exists without a city. Cost names must be unique.']);
                pg_query($conn, "ROLLBACK");
                return;
            }
        }
        
        // Insert cost (cost_code will be auto-generated by trigger)
        $query = "INSERT INTO costs (name, country_id, region_id, city_id, created_at) 
                  VALUES ($1, $2, $3, $4, NOW()) 
                  RETURNING id, cost_code";
        $result = pg_query_params($conn, $query, [
            $name,
            $country_id,
            $region_id,
            $city_id
        ]);
        
        if (!$result) {
            throw new Exception(getDbErrorMessage($conn));
        }
        
        $row = pg_fetch_assoc($result);
        $cost_id = $row['id'];
        
        // Save periods if provided
        if (isset($data['periods']) && is_array($data['periods'])) {
            saveCostPeriods($conn, $cost_id, $data['periods']);
        }
        
        pg_query($conn, "COMMIT");
        
        echo json_encode(['success' => true, 'id' => $cost_id, 'cost_code' => $row['cost_code']]);
    } catch (Exception $e) {
        pg_query($conn, "ROLLBACK");
        error_log("Error creating cost: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Save cost periods
function saveCostPeriods($conn, $cost_id, $periods, $skipDbChecks = false) {
    $cost_id = (int)$cost_id;
    
    // First, validate all periods before inserting any
    foreach ($periods as $index => $period) {
        $period_name = trim($period['period_name'] ?? '');
        if (empty($period_name)) {
            throw new Exception('Period name is required for all periods.');
        }
        
        $start_date = !empty($period['start_date']) ? $period['start_date'] : null;
        $end_date = !empty($period['end_date']) ? $period['end_date'] : null;
        
        // Check if period name already exists in this cost (for current periods being saved)
        for ($i = 0; $i < $index; $i++) {
            if (isset($periods[$i]['period_name']) && strtolower(trim($periods[$i]['period_name'])) === strtolower($period_name)) {
                throw new Exception("Period name '{$period_name}' is duplicate. Period names must be unique within a cost.");
            }
        }
        
        // Check if period name already exists in database for this cost (skip if we just deleted all periods)
        if (!$skipDbChecks) {
            $nameCheckQuery = "SELECT id FROM cost_periods WHERE cost_id = $1 AND LOWER(TRIM(period_name)) = LOWER(TRIM($2))";
            $nameCheckResult = pg_query_params($conn, $nameCheckQuery, [$cost_id, $period_name]);
            if (!$nameCheckResult) {
                throw new Exception(getDbErrorMessage($conn));
            }
            if (pg_num_rows($nameCheckResult) > 0) {
                throw new Exception("A period with the name '{$period_name}' already exists in this cost. Period names must be unique within a cost.");
            }
        }
        
        // Check for date overlap if dates are provided
        if ($start_date && $end_date) {
            // Validate date range
            if ($start_date > $end_date) {
                throw new Exception("Start date ({$start_date}) must be before or equal to end date ({$end_date}).");
            }
            
            // Check overlap with existing periods in database (skip if we just deleted all periods)
            if (!$skipDbChecks) {
                $overlapQuery = "SELECT id, period_name FROM cost_periods 
                                WHERE cost_id = $1 
                                AND start_date IS NOT NULL 
                                AND end_date IS NOT NULL
                                AND (
                                    (start_date <= $2 AND end_date >= $3) OR
                                    (start_date BETWEEN $3 AND $2) OR
                                    (end_date BETWEEN $3 AND $2)
                                )";
                $overlapResult = pg_query_params($conn, $overlapQuery, [$cost_id, $end_date, $start_date]);
                if (!$overlapResult) {
                    throw new Exception(getDbErrorMessage($conn));
                }
                if (pg_num_rows($overlapResult) > 0) {
                    $existing = pg_fetch_assoc($overlapResult);
                    throw new Exception("The date range ({$start_date} to {$end_date}) overlaps with an existing period '{$existing['period_name']}'. Date ranges must not overlap within the same cost.");
                }
            }
            
            // Check overlap with other periods being saved in the same batch
            for ($i = 0; $i < $index; $i++) {
                $otherStart = !empty($periods[$i]['start_date']) ? $periods[$i]['start_date'] : null;
                $otherEnd = !empty($periods[$i]['end_date']) ? $periods[$i]['end_date'] : null;
                if ($otherStart && $otherEnd) {
                    // Check if ranges overlap: (start1 <= end2 AND end1 >= start2)
                    if ($start_date <= $otherEnd && $end_date >= $otherStart) {
                        $otherName = trim($periods[$i]['period_name'] ?? '');
                        throw new Exception("The date range ({$start_date} to {$end_date}) overlaps with period '{$otherName}'. Date ranges must not overlap.");
                    }
                }
            }
        }
    }
    
    // Now insert all periods (validation passed)
    foreach ($periods as $period) {
        $period_name = trim($period['period_name'] ?? '');
        if (empty($period_name)) {
            continue;
        }
        
        $start_date = !empty($period['start_date']) ? $period['start_date'] : null;
        $end_date = !empty($period['end_date']) ? $period['end_date'] : null;
        
        $query = "INSERT INTO cost_periods (cost_id, period_name, start_date, end_date, created_at)
                  VALUES ($1, $2, $3, $4, NOW())
                  RETURNING id";
        $result = pg_query_params($conn, $query, [$cost_id, $period_name, $start_date, $end_date]);
        
        if (!$result) {
            if (defined('APP_DEBUG') && APP_DEBUG) {
                error_log("Failed to insert cost_period: " . pg_last_error($conn));
            }
            continue;
        }
        
        $period_row = pg_fetch_assoc($result);
        if (!$period_row) {
            if (defined('APP_DEBUG') && APP_DEBUG) {
                error_log("Failed to get inserted period_id");
            }
            continue;
        }
        
        $period_id = $period_row['id'];
        
        // Save items for this period
        if (isset($period['items']) && is_array($period['items']) && count($period['items']) > 0) {
            saveCostItems($conn, $period_id, $period['items']);
        }
    }
}

// Save cost items
function saveCostItems($conn, $period_id, $items) {
    foreach ($items as $item) {
        $item_type = $item['item_type'] ?? 'fixed';
        $pricing_type = $item['pricing_type'] ?? 'general';
        
        if (!in_array($item_type, ['fixed', 'regional']) || !in_array($pricing_type, ['general', 'person_based'])) {
            continue;
        }
        
        $query = "INSERT INTO cost_items (cost_period_id, item_type, pricing_type, created_at)
                  VALUES ($1, $2, $3, NOW())
                  RETURNING id";
        $result = pg_query_params($conn, $query, [$period_id, $item_type, $pricing_type]);
        
        if (!$result) {
            if (defined('APP_DEBUG') && APP_DEBUG) {
                error_log("Failed to insert cost_item: " . pg_last_error($conn));
            }
            continue;
        }
        
        $item_row = pg_fetch_assoc($result);
        if (!$item_row) {
            if (defined('APP_DEBUG') && APP_DEBUG) {
                error_log("Failed to get inserted item_id");
            }
            continue;
        }
        
        $item_id = $item_row['id'];
        
        // Save prices based on type
        if ($item_type === 'fixed') {
            if ($pricing_type === 'general') {
                saveCostGeneralPrices($conn, $item_id, $item['prices'] ?? []);
            } else {
                saveCostPersonPrices($conn, $item_id, $item['prices'] ?? []);
            }
        } else { // regional
            if ($pricing_type === 'general') {
                saveCostRegionalGeneralPrices($conn, $item_id, $item['prices'] ?? []);
            } else {
                saveCostRegionalPersonPrices($conn, $item_id, $item['prices'] ?? []);
            }
        }
    }
}

// Save general prices
function saveCostGeneralPrices($conn, $item_id, $prices) {
    if (empty($prices) || !is_array($prices)) return;
    
    foreach ($prices as $price) {
        $amount = isset($price['amount']) ? (float)$price['amount'] : 0;
        $currency_id = isset($price['currency_id']) ? (int)$price['currency_id'] : null;
        
        if ($currency_id && $amount > 0) {
            // Delete existing general price if any (only one allowed per item)
            $deleteQuery = "DELETE FROM cost_general_prices WHERE cost_item_id = $1";
            pg_query_params($conn, $deleteQuery, [$item_id]);
            
            $query = "INSERT INTO cost_general_prices (cost_item_id, amount, currency_id, created_at)
                      VALUES ($1, $2, $3, NOW())";
            pg_query_params($conn, $query, [$item_id, $amount, $currency_id]);
        }
    }
}

// Save person prices
function saveCostPersonPrices($conn, $item_id, $prices) {
    if (empty($prices) || !is_array($prices)) return;
    
    foreach ($prices as $price) {
        $age_group = $price['age_group'] ?? '';
        $amount = isset($price['amount']) ? (float)$price['amount'] : 0;
        $currency_id = isset($price['currency_id']) ? (int)$price['currency_id'] : null;
        
        if (in_array($age_group, ['adult', 'child', 'infant']) && $currency_id && $amount >= 0) {
            $query = "INSERT INTO cost_person_prices (cost_item_id, age_group, amount, currency_id, created_at)
                      VALUES ($1, $2, $3, $4, NOW())
                      ON CONFLICT (cost_item_id, age_group) 
                      DO UPDATE SET amount = $3, currency_id = $4";
            pg_query_params($conn, $query, [$item_id, $age_group, $amount, $currency_id]);
        }
    }
}

// Save regional general prices
function saveCostRegionalGeneralPrices($conn, $item_id, $prices) {
    if (empty($prices) || !is_array($prices)) return;
    
    foreach ($prices as $price) {
        $sub_region_id = isset($price['sub_region_id']) ? (int)$price['sub_region_id'] : null;
        $amount = isset($price['amount']) ? (float)$price['amount'] : 0;
        $currency_id = isset($price['currency_id']) ? (int)$price['currency_id'] : null;
        
        if ($sub_region_id && $currency_id && $amount > 0) {
            $query = "INSERT INTO cost_regional_general_prices (cost_item_id, sub_region_id, amount, currency_id, created_at)
                      VALUES ($1, $2, $3, $4, NOW())
                      ON CONFLICT (cost_item_id, sub_region_id) 
                      DO UPDATE SET amount = $3, currency_id = $4";
            pg_query_params($conn, $query, [$item_id, $sub_region_id, $amount, $currency_id]);
        }
    }
}

// Save regional person prices
function saveCostRegionalPersonPrices($conn, $item_id, $prices) {
    if (empty($prices) || !is_array($prices)) return;
    
    foreach ($prices as $price) {
        $sub_region_id = isset($price['sub_region_id']) ? (int)$price['sub_region_id'] : null;
        $age_group = $price['age_group'] ?? '';
        $amount = isset($price['amount']) ? (float)$price['amount'] : 0;
        $currency_id = isset($price['currency_id']) ? (int)$price['currency_id'] : null;
        
        if ($sub_region_id && in_array($age_group, ['adult', 'child', 'infant']) && $currency_id && $amount >= 0) {
            $query = "INSERT INTO cost_regional_person_prices (cost_item_id, sub_region_id, age_group, amount, currency_id, created_at)
                      VALUES ($1, $2, $3, $4, $5, NOW())
                      ON CONFLICT (cost_item_id, sub_region_id, age_group) 
                      DO UPDATE SET amount = $4, currency_id = $5";
            pg_query_params($conn, $query, [$item_id, $sub_region_id, $age_group, $amount, $currency_id]);
        }
    }
}

// Update cost
function updateCost($conn, $data) {
    pg_query($conn, "BEGIN");
    
    try {
        $id = (int)$data['id'];
        $name = trim($data['name'] ?? '');
        
        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => getApiTranslation('cost_name_required')]);
            pg_query($conn, "ROLLBACK");
            return;
        }
        
        // Get location IDs
        $country_id = isset($data['country_id']) && !empty($data['country_id']) ? (int)$data['country_id'] : null;
        $region_id = isset($data['region_id']) && !empty($data['region_id']) ? (int)$data['region_id'] : null;
        $city_id = isset($data['city_id']) && !empty($data['city_id']) ? (int)$data['city_id'] : null;
        
        // Get current cost data to check if name or city is actually changing
        $currentQuery = "SELECT name, city_id FROM costs WHERE id = $1";
        $currentResult = pg_query_params($conn, $currentQuery, [$id]);
        if (!$currentResult || pg_num_rows($currentResult) === 0) {
            echo json_encode(['success' => false, 'message' => 'Cost not found.']);
            pg_query($conn, "ROLLBACK");
            return;
        }
        $current = pg_fetch_assoc($currentResult);
        $currentName = trim($current['name'] ?? '');
        $currentCityId = $current['city_id'];
        
        // Only check for duplicates if name or city is actually changing
        $nameChanged = strtolower(trim($name)) !== strtolower($currentName);
        // Compare city_id properly handling NULL values
        $currentCityIdInt = $currentCityId !== null ? (int)$currentCityId : null;
        $cityChanged = ($city_id !== $currentCityIdInt);
        
        // Only perform duplicate check if name or city is changing
        if ($nameChanged || $cityChanged) {
            // Check if cost name already exists in the same city for another cost
            if ($city_id) {
                $checkQuery = "SELECT id FROM costs WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND city_id = $2 AND id != $3";
                $checkResult = pg_query_params($conn, $checkQuery, [$name, $city_id, $id]);
                if (!$checkResult) {
                    throw new Exception(getDbErrorMessage($conn));
                }
                if (pg_num_rows($checkResult) > 0) {
                    echo json_encode(['success' => false, 'message' => 'A cost with this name already exists in this city. Cost names must be unique within a city.']);
                    pg_query($conn, "ROLLBACK");
                    return;
                }
            } else {
                // If no city specified, check globally
                $checkQuery = "SELECT id FROM costs WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND (city_id IS NULL OR city_id = 0) AND id != $2";
                $checkResult = pg_query_params($conn, $checkQuery, [$name, $id]);
                if (!$checkResult) {
                    throw new Exception(getDbErrorMessage($conn));
                }
                if (pg_num_rows($checkResult) > 0) {
                    echo json_encode(['success' => false, 'message' => 'A cost with this name already exists without a city. Cost names must be unique.']);
                    pg_query($conn, "ROLLBACK");
                    return;
                }
            }
        }
        
        // Update cost
        $query = "UPDATE costs SET 
                    name = $1,
                    country_id = $2,
                    region_id = $3,
                    city_id = $4,
                    updated_at = NOW() 
                  WHERE id = $5";
        $result = pg_query_params($conn, $query, [
            $name,
            $country_id,
            $region_id,
            $city_id,
            $id
        ]);
        
        if (!$result) {
            throw new Exception(getDbErrorMessage($conn));
        }
        
        // Delete existing periods and recreate
        // But first, we need to exclude existing periods from validation
        $deleteQuery = "DELETE FROM cost_periods WHERE cost_id = $1";
        pg_query_params($conn, $deleteQuery, [$id]);
        
        // Save periods if provided
        if (isset($data['periods']) && is_array($data['periods'])) {
            saveCostPeriods($conn, $id, $data['periods'], true); // Pass flag to skip DB checks (since we just deleted all)
        }
        
        pg_query($conn, "COMMIT");
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        pg_query($conn, "ROLLBACK");
        error_log("Error updating cost: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Delete cost
function deleteCost($conn, $id) {
    $id = (int)$id;
    
    $query = "DELETE FROM costs WHERE id = $1";
    $result = pg_query_params($conn, $query, [$id]);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => getDbErrorMessage($conn)]);
    }
}
?>

