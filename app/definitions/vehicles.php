<?php
/**
 * Vehicles Management Page
 * Manages Vehicle Companies and Vehicle Types
 * Hierarchy: City -> Vehicle Company -> Vehicle Type
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
$t_vehicles = $all_translations['vehicles'] ?? [];
$t_dependencies = $all_translations['dependencies'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
    <title><?php echo $t_vehicles['title'] ?? 'Vehicles'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/vehicles.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/date-range-picker.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/select-search.css">
    
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
                    <h1><?php echo $t_vehicles['title'] ?? 'Vehicles'; ?></h1>
                </div>
                
                <!-- Tabs -->
                <div class="vehicles-tabs">
                    <button class="vehicles-tab" data-tab="companies">
                        <?php echo $t_vehicles['vehicle_company'] ?? 'Vehicle Companies'; ?>
                    </button>
                    <button class="vehicles-tab" data-tab="types">
                        <?php echo $t_vehicles['vehicle_type'] ?? 'Vehicle Types'; ?>
                    </button>
                    <button class="vehicles-tab" data-tab="contracts">
                        <?php echo $t_vehicles['contracts'] ?? 'Contracts'; ?>
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div class="vehicles-content" id="companies-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="vehicles-content" id="types-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="vehicles-content" id="contracts-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- Company Modal -->
    <div class="modal" id="companyModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="companyModalTitle"><?php echo $t_vehicles['add_company'] ?? 'Add Vehicle Company'; ?></h2>
                <button class="btn-close" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="companyForm">
                <div class="form-group">
                    <label><?php echo $t_vehicles['company_name'] ?? 'Company Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_vehicles['city'] ?? 'City'; ?> *</label>
                    <select name="city_id" required>
                        <option value=""><?php echo $t_vehicles['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                </div>
                <div class="form-group">
                    <label><?php echo $t_vehicles['contact_person'] ?? 'Contact Person'; ?></label>
                    <input type="text" name="contact_person">
                </div>
                <div class="form-group">
                    <label><?php echo $t_vehicles['contact_email'] ?? 'Contact Email'; ?></label>
                    <input type="email" name="contact_email">
                </div>
                <div class="form-group">
                    <label><?php echo $t_vehicles['contact_phone'] ?? 'Contact Phone'; ?></label>
                    <input type="text" name="contact_phone">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal('companyModal')">
                        <span class="material-symbols-rounded" style="font-size: 18px; margin-right: 6px;">close</span>
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <span class="material-symbols-rounded" style="font-size: 18px; margin-right: 6px;">save</span>
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Type Modal -->
    <div class="modal" id="typeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="typeModalTitle"><?php echo $t_vehicles['add_type'] ?? 'Add Vehicle Type'; ?></h2>
                <button class="btn-close" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="typeForm">
                <div class="form-group">
                    <label><?php echo $t_vehicles['type_name'] ?? 'Vehicle Type Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_vehicles['vehicle_company'] ?? 'Vehicle Company'; ?> *</label>
                    <select name="vehicle_company_id" required>
                        <option value=""><?php echo $t_vehicles['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                </div>
                <div class="form-group">
                    <label><?php echo $t_vehicles['min_pax'] ?? 'Min Pax'; ?></label>
                    <input type="number" name="min_pax" min="0" step="1" placeholder="<?php echo $t_vehicles['min_pax'] ?? 'Min Pax'; ?>">
                </div>
                <div class="form-group">
                    <label><?php echo $t_vehicles['max_pax'] ?? 'Max Pax'; ?></label>
                    <input type="number" name="max_pax" min="0" step="1" placeholder="<?php echo $t_vehicles['max_pax'] ?? 'Max Pax'; ?>">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal('typeModal')">
                        <span class="material-symbols-rounded" style="font-size: 18px; margin-right: 6px;">close</span>
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <span class="material-symbols-rounded" style="font-size: 18px; margin-right: 6px;">save</span>
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Contract Modal -->
    <div class="modal" id="contractModal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2 id="contractModalTitle"><?php echo $t_vehicles['add_contract'] ?? 'Add Contract'; ?></h2>
                <button class="btn-close" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="contractForm">
                <input type="hidden" id="contractId" name="id">
                
                <div class="form-row">
                    <div class="form-group">
                        <label><?php echo $t_vehicles['vehicle_company'] ?? 'Vehicle Company'; ?> *</label>
                        <select id="contract_vehicle_company_id" name="vehicle_company_id" required>
                            <option value=""><?php echo $t_vehicles['loading_data'] ?? 'Loading...'; ?></option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_vehicles['contract_code'] ?? 'Contract Code'; ?> *</label>
                        <input type="text" id="contract_code" name="contract_code" required readonly style="background-color: #f3f4f6; cursor: not-allowed;">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label><?php echo ($t_vehicles['start_date'] ?? 'Start Date') . ' - ' . ($t_vehicles['end_date'] ?? 'End Date'); ?> *</label>
                        <div class="date-range-wrapper" style="position: relative;">
                            <input type="text" id="contract_date_range" placeholder="<?php echo $t_common['date_range_placeholder'] ?? 'Tarih seçin'; ?>" required style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;" />
                            <input type="date" id="contract_start_date" name="start_date" required style="display: none;" />
                            <input type="date" id="contract_end_date" name="end_date" required style="display: none;" />
                            <div id="contractRangePicker" class="range-picker" style="display: none; position: absolute; top: 100%; left: 0; z-index: 2000; background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top: 4px;"></div>
                        </div>
                    </div>
                </div>
                
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal('contractModal')">
                        <span class="material-symbols-rounded" style="font-size: 18px; margin-right: 6px;">close</span>
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <span class="material-symbols-rounded" style="font-size: 18px; margin-right: 6px;">save</span>
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBase' => $basePath . 'api/definitions/vehicles.php',
        'csrfToken' => csrfToken(),
        'translations' => [
            'vehicles' => $t_vehicles,
            'common' => $t_common,
            'sidebar' => $t_sidebar,
            'dependencies' => $t_dependencies
        ]
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_PRETTY_PRINT);
    ?>
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/date-range-picker.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/select-search.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/vehicles.js"></script>
</body>
</html>

