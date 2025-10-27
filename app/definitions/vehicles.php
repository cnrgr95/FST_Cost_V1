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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_vehicles['title'] ?? 'Vehicles'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
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
                    <h1><?php echo $t_vehicles['title'] ?? 'Vehicles'; ?></h1>
                </div>
                
                <!-- Search/Filter Section -->
                <div class="vehicles-search-section">
                    <div class="search-box">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="<?php echo $t_vehicles['search_placeholder'] ?? 'Araç firması, araç tipi, şehir...'; ?>" autocomplete="off">
                        <button id="clearSearch" class="clear-btn" style="display: none;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div class="vehicles-tabs">
                    <button class="vehicles-tab active" data-tab="companies">
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
                <div class="vehicles-content active" id="companies-content">
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
                <button class="btn-close">
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
    
    <!-- Type Modal -->
    <div class="modal" id="typeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="typeModalTitle"><?php echo $t_vehicles['add_type'] ?? 'Add Vehicle Type'; ?></h2>
                <button class="btn-close">
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
    
    <!-- Contract Modal -->
    <div class="modal" id="contractModal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2 id="contractModalTitle"><?php echo $t_vehicles['add_contract'] ?? 'Add Contract'; ?></h2>
                <button class="btn-close">
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
                    <div class="form-group">
                        <label><?php echo $t_vehicles['start_date'] ?? 'Start Date'; ?> *</label>
                        <input type="date" id="contract_start_date" name="start_date" required>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_vehicles['end_date'] ?? 'End Date'; ?> *</label>
                        <input type="date" id="contract_end_date" name="end_date" required>
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
        
        .page-header {
            margin-bottom: 30px;
        }
        
        .page-header h1 {
            font-size: 28px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .page-header p {
            font-size: 16px;
            color: #6b7280;
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
        window.API_BASE = BASE_PATH + 'api/definitions/vehicles.php';
        window.Translations = {
            vehicles: <?php echo json_encode($t_vehicles); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>,
            dependencies: <?php echo json_encode($t_dependencies); ?>
        };
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/vehicles.js"></script>
</body>
</html>

