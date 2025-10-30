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

// Get translations
$t_sidebar = $all_translations['sidebar'] ?? [];
$t_common = $all_translations['common'] ?? [];
$t_currencies = $all_translations['currencies'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                    <button class="btn-add" id="addCurrencyBtn">
                        <span class="material-symbols-rounded">add</span>
                        <?php echo $t_currencies['add_currency'] ?? 'Add Currency'; ?>
                    </button>
                </div>
                
                <!-- Table Section -->
                <div class="currencies-table-section">
                    <table class="currencies-table">
                        <thead>
                            <tr>
                                <th><?php echo $t_currencies['country'] ?? 'Country'; ?></th>
                                <th><?php echo $t_currencies['country_code'] ?? 'Code'; ?></th>
                                <th><?php echo $t_currencies['local_currency'] ?? 'Local Currency'; ?></th>
                                <th><?php echo $t_common['actions'] ?? 'Actions'; ?></th>
                            </tr>
                        </thead>
                        <tbody id="currenciesTableBody">
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 40px;">
                                    <span class="material-symbols-rounded" style="font-size: 48px; color: #9ca3af;">currency_exchange</span>
                                    <p style="color: #9ca3af; margin-top: 10px;"><?php echo $t_currencies['loading_data'] ?? 'Loading data...'; ?></p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Currency Modal -->
    <div class="modal" id="currencyModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="currencyModalTitle"><?php echo $t_currencies['add_currency'] ?? 'Add Currency'; ?></h2>
                <button class="btn-close" id="closeModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="currencyForm">
                <input type="hidden" id="currencyId">
                
                <div class="form-group">
                    <label for="code"><?php echo $t_currencies['code'] ?? 'Code'; ?> *</label>
                    <input type="text" id="code" name="code" placeholder="USD" required maxlength="3" style="text-transform: uppercase;">
                    <small><?php echo $t_currencies['code_hint'] ?? 'ISO 4217 currency code (3 letters)'; ?></small>
                </div>
                
                <div class="form-group">
                    <label for="name"><?php echo $t_currencies['name'] ?? 'Name'; ?> *</label>
                    <input type="text" id="name" name="name" placeholder="US Dollar" required>
                </div>
                
                <div class="form-group">
                    <label for="symbol"><?php echo $t_currencies['symbol'] ?? 'Symbol'; ?></label>
                    <input type="text" id="symbol" name="symbol" placeholder="$" maxlength="10">
                </div>
                
                <div class="form-group">
                    <label for="is_active">
                        <input type="checkbox" id="is_active" name="is_active" checked>
                        <?php echo $t_currencies['is_active'] ?? 'Active'; ?>
                    </label>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelBtn">
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Country Manage Modal -->
    <div class="modal" id="countryManageModal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="countryManageTitle">Manage Country</h2>
                <button class="btn-close" id="closeCountryManageModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="form-group">
                <div id="countryManageBody" style="padding:8px 0; color:#4b5563;"></div>
            </div>
            <div class="form-group">
                <label><?php echo $t_currencies['base_currency'] ?? 'Base currency of country'; ?></label>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <select id="manageBaseCurrencySelect" style="min-width:220px;"></select>
                    <button class="btn-primary" id="manageSaveBaseCurrencyBtn">
                        <span class="material-symbols-rounded">save</span>
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label><?php echo $t_currencies['add_country_currency'] ?? 'Add currency to country'; ?></label>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <select id="manageCurrencySelect" style="min-width:220px;"></select>
                    <input id="manageUnitName" type="text" placeholder="<?php echo $t_currencies['unit_name'] ?? 'Unit name (optional)'; ?>" style="min-width:200px;" />
                    <label style="display:flex; align-items:center; gap:6px;">
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
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/currencies.js"></script>
</body>
</html>

