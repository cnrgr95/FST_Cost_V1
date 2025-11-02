<?php
/**
 * Currencies Management Page
 * Manages currency definitions
 */

session_start();

// Define base path
$basePath = '../../';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . $basePath . 'login.php');
    exit;
}

// Load translation helper
require_once $basePath . 'includes/translations.php';

// Load security helper for CSRF token
require_once $basePath . 'includes/security.php';

// Get translations
$t_sidebar = $all_translations['sidebar'] ?? [];
$t_common = $all_translations['common'] ?? [];
$t_currencies = $all_translations['currencies'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
    <title><?php echo $t_currencies['title'] ?? 'Currencies'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/select-search.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/currencies.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="currencies-container">
                <!-- Page Header -->
                <div class="currencies-header">
                    <h1><?php echo $t_currencies['title'] ?? 'Currencies'; ?></h1>
                    <div class="currencies-header-actions">
                        <button class="btn-add" id="manageMasterCurrenciesBtn">
                            <span class="material-symbols-rounded">currency_exchange</span>
                            <?php echo $t_currencies['master_currencies'] ?? 'Master Currencies'; ?>
                        </button>
                        <button class="btn-add" id="addCurrencyBtn">
                            <span class="material-symbols-rounded">add</span>
                            <?php echo $t_currencies['add_currency'] ?? 'Add Currency'; ?>
                        </button>
                    </div>
                </div>
                
                <!-- Countries Section -->
                <div class="currencies-table-container currencies-table-container-spaced">
                    <div class="currencies-table-header">
                        <div class="currencies-table-title">
                            <span class="material-symbols-rounded currencies-table-icon">public</span>
                            <?php echo $t_currencies['countries'] ?? 'Countries'; ?>
                            <span class="table-count-badge" id="currenciesCountBadge">0</span>
                        </div>
                        <div class="table-actions-group">
                            <div class="search-box">
                                <span class="material-symbols-rounded search-icon">search</span>
                                <input type="text" 
                                       id="currenciesSearchInput" 
                                       placeholder="<?php echo $t_common['search'] ?? 'Search...'; ?>" 
                                       class="search-input">
                                <button class="search-clear hidden" id="currenciesSearchClear">
                                    <span class="material-symbols-rounded">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="currencies-table-section">
                        <table class="currencies-table" id="currenciesTable">
                            <thead>
                                <tr>
                                    <th class="sortable" data-sort="name">
                                        <?php echo $t_currencies['country'] ?? 'Country'; ?>
                                        <span class="sort-icon">⇅</span>
                                    </th>
                                    <th class="sortable" data-sort="code">
                                        <?php echo $t_currencies['country_code'] ?? 'Code'; ?>
                                        <span class="sort-icon">⇅</span>
                                    </th>
                                    <th class="sortable" data-sort="local_currency_code">
                                        <?php echo $t_currencies['local_currency'] ?? 'Local Currency'; ?>
                                        <span class="sort-icon">⇅</span>
                                    </th>
                                    <th class="no-sort"><?php echo $t_common['actions'] ?? 'Actions'; ?></th>
                                </tr>
                            </thead>
                            <tbody id="currenciesTableBody">
                                <tr>
                                    <td colspan="4" class="table-loading-cell">
                                        <div class="loading">
                                            <span class="material-symbols-rounded">sync</span>
                                            <p><?php echo $t_currencies['loading_data'] ?? 'Loading data...'; ?></p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="table-footer">
                            <div class="table-info" id="currenciesTableInfo"><?php echo $t_common['showing'] ?? 'Showing'; ?> <strong>0</strong> items</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Master Currencies Modal -->
    <div class="modal" id="masterCurrenciesModal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h2><?php echo $t_currencies['master_currencies'] ?? 'Master Currencies'; ?></h2>
                <button class="btn-close" id="closeMasterCurrenciesModal" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="modal-body-padded">
                <div class="currencies-table-section">
                    <table class="currencies-table">
                        <thead>
                            <tr>
                                <th><?php echo $t_currencies['code'] ?? 'Code'; ?></th>
                                <th><?php echo $t_currencies['name'] ?? 'Name'; ?></th>
                                <th><?php echo $t_currencies['symbol'] ?? 'Symbol'; ?></th>
                                <th><?php echo $t_currencies['status'] ?? 'Status'; ?></th>
                                <th><?php echo $t_common['actions'] ?? 'Actions'; ?></th>
                            </tr>
                        </thead>
                        <tbody id="masterCurrenciesTableBody">
                            <tr>
                                <td colspan="5" class="table-loading-cell">
                                    <span class="material-symbols-rounded loading-icon-large">currency_exchange</span>
                                    <p class="loading-text"><?php echo $t_currencies['loading_data'] ?? 'Loading data...'; ?></p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" id="closeMasterCurrenciesModalFooter">
                    <span class="material-symbols-rounded">close</span>
                    <?php echo $t_common['close'] ?? 'Close'; ?>
                </button>
            </div>
        </div>
    </div>

    <!-- Currency Modal -->
    <div class="modal" id="currencyModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="currencyModalTitle"><?php echo $t_currencies['add_currency'] ?? 'Add Currency'; ?></h2>
                <button class="btn-close" id="closeModal" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="currencyForm">
                <input type="hidden" id="currencyId">
                
                <div class="form-group">
                    <label for="code"><?php echo $t_currencies['code'] ?? 'Code'; ?> *</label>
                    <input type="text" id="code" name="code" placeholder="<?php echo $t_currencies['code'] ?? 'Code'; ?>" required maxlength="3" class="input-uppercase">
                    <small><?php echo $t_currencies['code_hint'] ?? 'ISO 4217 currency code (3 letters)'; ?></small>
                </div>
                
                <div class="form-group">
                    <label for="name"><?php echo $t_currencies['name'] ?? 'Name'; ?> *</label>
                    <input type="text" id="name" name="name" placeholder="<?php echo $t_currencies['name'] ?? 'Name'; ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="symbol"><?php echo $t_currencies['symbol'] ?? 'Symbol'; ?></label>
                    <input type="text" id="symbol" name="symbol" placeholder="<?php echo $t_currencies['symbol'] ?? 'Symbol'; ?>" maxlength="10">
                </div>
                
                <div class="form-group">
                    <label for="is_active">
                        <input type="checkbox" id="is_active" name="is_active" checked>
                        <?php echo $t_currencies['is_active'] ?? 'Active'; ?>
                    </label>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelBtn">
                        <span class="material-symbols-rounded">close</span>
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <span class="material-symbols-rounded">save</span>
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Country Manage Modal -->
    <div class="modal hidden" id="countryManageModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="countryManageTitle"><?php echo $t_currencies['manage_country'] ?? 'Manage Country'; ?></h2>
                <button class="btn-close" id="closeCountryManageModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="form-group">
                <div id="countryManageBody" class="country-manage-body"></div>
            </div>
            <div class="form-group">
                <label><?php echo $t_currencies['base_currency'] ?? 'Base currency of country'; ?></label>
                <div class="manage-selects-row">
                    <select id="manageBaseCurrencySelect" class="manage-select"></select>
                    <button class="btn-primary" id="manageSaveBaseCurrencyBtn">
                        <span class="material-symbols-rounded">save</span>
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label><?php echo $t_currencies['add_country_currency'] ?? 'Add currency to country'; ?></label>
                <div class="manage-selects-row">
                    <select id="manageCurrencySelect" class="manage-select"></select>
                    <input id="manageUnitName" type="text" placeholder="<?php echo ($t_currencies['unit_name_placeholder'] ?? $t_currencies['unit_name'] ?? 'Unit name (optional)'); ?>" class="manage-input" />
                    <label class="manage-checkbox-label">
                        <input id="manageIsActive" type="checkbox" checked />
                        <?php echo $t_currencies['active'] ?? 'Active'; ?>
                    </label>
                    <button class="btn-primary" id="manageAddCurrencyBtn">
                        <span class="material-symbols-rounded">add</span>
                        <?php echo $t_currencies['add'] ?? 'Add'; ?>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <div id="countryCurrenciesList" class="table-wrapper"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" id="closeCountryManageFooter">
                    <span class="material-symbols-rounded">close</span>
                    <?php echo $t_common['close'] ?? 'Close'; ?>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBase' => $basePath . 'api/definitions/currencies.php',
        'csrfToken' => csrfToken(),
        'translations' => [
            'currencies' => $t_currencies,
            'common' => $t_common,
            'sidebar' => $t_sidebar
        ]
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_PRETTY_PRINT);
    ?>
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/select-search.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/currencies.js"></script>
</body>
</html>

