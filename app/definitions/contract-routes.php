<?php
/**
 * Contract Routes Management Page
 * Manages routes and prices for vehicle contracts
 */

session_start();

// Define base path
$basePath = '../../';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . $basePath . 'login.php');
    exit;
}

// Get contract ID from URL
$contract_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$contract_id) {
    header('Location: ' . $basePath . 'app/definitions/vehicles.php');
    exit;
}

// Load translation helper
require_once $basePath . 'includes/translations.php';

// Get translations
$t_sidebar = $all_translations['sidebar'] ?? [];
$t_common = $all_translations['common'] ?? [];
$t_vehicles = $all_translations['vehicles'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_vehicles['contract_routes'] ?? 'Contract Routes'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/vehicles.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="vehicles-container">
                <!-- Page Header -->
                <div class="vehicles-header">
                    <div>
                        <a href="<?php echo $basePath; ?>app/definitions/vehicles.php#contracts" style="text-decoration: none; color: #6b7280; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span class="material-symbols-rounded" style="font-size: 20px;">arrow_back</span>
                            <?php echo $t_common['back'] ?? 'Back'; ?>
                        </a>
                        <h1><?php echo $t_vehicles['contract_routes'] ?? 'Contract Routes'; ?></h1>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-add" onclick="window.openExcelUploadModal()" style="background: #28a745;">
                            <span class="material-symbols-rounded">upload</span>
                            <?php echo $t_vehicles['upload_excel'] ?? 'Upload Excel'; ?>
                        </button>
                        <button class="btn-add" onclick="window.openRouteModal()">
                            <span class="material-symbols-rounded">add</span>
                            <?php echo $t_vehicles['add_route'] ?? 'Add Route'; ?>
                        </button>
                    </div>
                </div>
                
                <!-- Contract Info -->
                <div id="contractInfo" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <small style="color: #6b7280; font-size: 12px;"><?php echo $t_vehicles['contract_code'] ?? 'Contract Code'; ?></small>
                            <div id="contractCode" style="font-weight: 600; color: #1f2937;"></div>
                        </div>
                        <div>
                            <small style="color: #6b7280; font-size: 12px;"><?php echo $t_vehicles['vehicle_company'] ?? 'Vehicle Company'; ?></small>
                            <div id="contractCompany" style="font-weight: 600; color: #1f2937;"></div>
                        </div>
                        <div>
                            <small style="color: #6b7280; font-size: 12px;"><?php echo $t_vehicles['start_date'] ?? 'Start Date'; ?></small>
                            <div id="contractStartDate" style="font-weight: 600; color: #1f2937;"></div>
                        </div>
                        <div>
                            <small style="color: #6b7280; font-size: 12px;"><?php echo $t_vehicles['end_date'] ?? 'End Date'; ?></small>
                            <div id="contractEndDate" style="font-weight: 600; color: #1f2937;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Routes Table -->
                <div id="routesContent">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- Route Modal -->
    <div class="modal" id="routeModal" style="max-width: 800px;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="routeModalTitle"><?php echo $t_vehicles['add_route'] ?? 'Add Route'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="routeForm">
                <input type="hidden" id="routeId" name="id">
                <input type="hidden" id="routeContractId" name="vehicle_contract_id" value="<?php echo $contract_id; ?>">
                
                <div class="form-row">
                    <div class="form-group">
                        <label><?php echo $t_vehicles['from_location'] ?? 'From'; ?> *</label>
                        <input type="text" id="route_from_location" name="from_location" required>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_vehicles['to_location'] ?? 'To'; ?> *</label>
                        <input type="text" id="route_to_location" name="to_location" required>
                    </div>
                </div>
                
                <div class="form-section-title"><?php echo $t_vehicles['prices'] ?? 'Prices'; ?></div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><?php echo $t_vehicles['vip_mini'] ?? 'Vip Mini'; ?></label>
                        <input type="number" id="route_vip_mini_price" name="vip_mini_price" step="0.01" min="0" placeholder="0.00">
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_vehicles['mini'] ?? 'Mini'; ?></label>
                        <input type="number" id="route_mini_price" name="mini_price" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><?php echo $t_vehicles['midi'] ?? 'Midi'; ?></label>
                        <input type="number" id="route_midi_price" name="midi_price" step="0.01" min="0" placeholder="0.00">
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_vehicles['bus'] ?? 'Bus'; ?></label>
                        <input type="number" id="route_bus_price" name="bus_price" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><?php echo $t_vehicles['currency'] ?? 'Currency'; ?></label>
                        <select id="route_currency" name="currency">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="TL">TL</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal()">
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Excel Upload Modal -->
    <div class="modal" id="excelUploadModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><?php echo $t_vehicles['upload_excel'] ?? 'Upload Excel'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="excelUploadForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label><?php echo $t_vehicles['select_excel_file'] ?? 'Select Excel File'; ?> *</label>
                    <input type="file" id="excel_file" name="excel_file" accept=".xlsx,.xls" required>
                    <small style="color: #6b7280; margin-top: 4px; display: block;">
                        <?php echo $t_vehicles['excel_format_hint'] ?? 'Supported formats: .xlsx, .xls'; ?>
                    </small>
                    <div style="margin-top: 12px; padding: 12px; background: #f3f4f6; border-radius: 8px; font-size: 13px; color: #374151;">
                        <strong><?php echo $t_vehicles['excel_format'] ?? 'Excel Format'; ?>:</strong><br>
                        A: <?php echo $t_vehicles['from_location'] ?? 'From'; ?><br>
                        B: <?php echo $t_vehicles['to_location'] ?? 'To'; ?><br>
                        C: <?php echo $t_vehicles['vip_mini'] ?? 'Vip Mini'; ?><br>
                        D: <?php echo $t_vehicles['mini'] ?? 'Mini'; ?><br>
                        E: <?php echo $t_vehicles['midi'] ?? 'Midi'; ?><br>
                        F: <?php echo $t_vehicles['bus'] ?? 'Bus'; ?>
                    </div>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_vehicles['currency'] ?? 'Currency'; ?> *</label>
                    <select id="excel_currency" name="currency" required>
                        <option value=""><?php echo $t_vehicles['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal()">
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <?php echo $t_vehicles['upload'] ?? 'Upload'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <style>
        /* Main Content Styles */
        .main-content {
            margin-left: var(--sidebar-width);
            min-height: 100vh;
            transition: margin-left 0.4s ease;
        }
        
        .sidebar.collapsed ~ .main-content {
            margin-left: var(--sidebar-collapsed-width);
        }
        
        .content-wrapper {
            margin-top: 70px;
            padding: 30px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .main-content {
                margin-left: 0 !important;
            }
            
            .sidebar.collapsed ~ .main-content {
                margin-left: 0 !important;
            }
            
            .sidebar.active ~ .main-content {
                margin-left: 0 !important;
            }
            
            .content-wrapper {
                padding: 20px;
            }
        }
    </style>
    
    <!-- Define API base path and translations for JavaScript -->
    <script>
        const BASE_PATH = '<?php echo $basePath; ?>';
        const CONTRACT_ID = <?php echo $contract_id; ?>;
        window.CONTRACT_ID = CONTRACT_ID;
        window.API_BASE = BASE_PATH + 'api/definitions/contract-routes.php';
        window.Translations = {
            vehicles: <?php echo json_encode($t_vehicles); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>
        };
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/contract-routes.js"></script>
</body>
</html>

