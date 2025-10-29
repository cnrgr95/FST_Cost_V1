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
                                <th><?php echo $t_currencies['code'] ?? 'Code'; ?></th>
                                <th><?php echo $t_currencies['name'] ?? 'Name'; ?></th>
                                <th><?php echo $t_currencies['symbol'] ?? 'Symbol'; ?></th>
                                <th><?php echo $t_currencies['status'] ?? 'Status'; ?></th>
                                <th><?php echo $t_common['actions'] ?? 'Actions'; ?></th>
                            </tr>
                        </thead>
                        <tbody id="currenciesTableBody">
                            <tr>
                                <td colspan="5" style="text-align: center; padding: 40px;">
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
    
    <style>
        /* Page-specific styles */
    </style>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <!-- Define API base path and translations for JavaScript -->
    <script>
        const BASE_PATH = '<?php echo $basePath; ?>';
        window.API_BASE = BASE_PATH + 'api/definitions/currencies.php';
        window.Translations = {
            currencies: <?php echo json_encode($t_currencies); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>
        };
    </script>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/currencies.js"></script>
</body>
</html>

