<?php
/**
 * Contract Detail Page
 * Manages contract prices and vehicle type mappings
 */

session_start();

// Define base path
$basePath = '../../';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . $basePath . 'login.php');
    exit;
}

// Get contract ID
$contractId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($contractId <= 0) {
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
    <title><?php echo $t_vehicles['contract_detail'] ?? 'Contract Detail'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
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
                    <h1 id="contractDetailTitle"><?php echo $t_vehicles['contract_detail'] ?? 'Contract Detail'; ?></h1>
                    <a class="btn-add" href="<?php echo $basePath; ?>app/definitions/vehicles.php">
                        <span class="material-symbols-rounded">arrow_back</span>
                        <?php echo $t_common['back'] ?? 'Back'; ?>
                    </a>
                </div>
                
                <!-- Contract Info -->
                <div id="contractInfo" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
                        <div>
                            <strong><?php echo $t_vehicles['contract_code'] ?? 'Contract Code'; ?>:</strong>
                            <span id="contractCodeDisplay">-</span>
                        </div>
                        <div>
                            <strong><?php echo $t_vehicles['vehicle_company'] ?? 'Vehicle Company'; ?>:</strong>
                            <span id="companyNameDisplay">-</span>
                        </div>
                        <div>
                            <strong><?php echo $t_vehicles['start_date'] ?? 'Start Date'; ?>:</strong>
                            <span id="startDateDisplay">-</span>
                        </div>
                        <div>
                            <strong><?php echo $t_vehicles['end_date'] ?? 'End Date'; ?>:</strong>
                            <span id="endDateDisplay">-</span>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button type="button" class="btn-primary" id="openAddRouteModalBtn">
                        <span class="material-symbols-rounded">add</span>
                        <?php echo $t_vehicles['add_route'] ?? 'Add Route'; ?>
                    </button>
                    <button type="button" class="btn-secondary" id="openUploadModalBtn">
                        <span class="material-symbols-rounded">upload_file</span>
                        <?php echo $t_vehicles['upload_price_list'] ?? 'Upload Price List'; ?>
                    </button>
                </div>
                
                <!-- Routes List Table -->
                <div class="section-header">
                    <h2><?php echo $t_vehicles['routes_price_list'] ?? 'Routes & Price List'; ?></h2>
                </div>
                <div class="vehicles-table-section">
                    <div id="contractRoutesContainer">
                        <div class="loading">
                            <span class="material-symbols-rounded">sync</span>
                            <p><?php echo $t_vehicles['loading_data'] ?? 'Loading data...'; ?></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Add Route Modal -->
    <div class="modal" id="addRouteModal" style="display:none;">
        <div class="modal-content" style="max-width: 700px; width: 90%;">
            <div class="modal-header">
                <h2><?php echo $t_vehicles['add_route'] ?? 'Add Route'; ?></h2>
                <button class="btn-close" id="closeAddRouteModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="addRouteForm">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label><?php echo $t_vehicles['from_location'] ?? 'Nerden'; ?> *</label>
                            <input type="text" id="add_from_location" name="from_location" required>
                        </div>
                        <div class="form-group">
                            <label><?php echo $t_vehicles['to_location'] ?? 'Nereye'; ?> *</label>
                            <input type="text" id="add_to_location" name="to_location" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_vehicles['currency'] ?? 'Currency'; ?></label>
                        <select id="add_currency_code" name="currency_code">
                            <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                        </select>
                    </div>
                    
                    <div id="addVehicleTypesContainer">
                        <!-- Vehicle type price inputs will be dynamically added here -->
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelAddRouteBtn">
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
    
    <!-- Edit Route Modal -->
    <div class="modal" id="editRouteModal" style="display:none;">
        <div class="modal-content" style="max-width: 700px; width: 90%;">
            <div class="modal-header">
                <h2><?php echo $t_vehicles['edit_route'] ?? 'Edit Route'; ?></h2>
                <button class="btn-close" id="closeEditRouteModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="editRouteForm">
                <input type="hidden" id="edit_route_id" name="route_id">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label><?php echo $t_vehicles['from_location'] ?? 'Nerden'; ?> *</label>
                            <input type="text" id="edit_from_location" name="from_location" required>
                        </div>
                        <div class="form-group">
                            <label><?php echo $t_vehicles['to_location'] ?? 'Nereye'; ?> *</label>
                            <input type="text" id="edit_to_location" name="to_location" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_vehicles['currency'] ?? 'Currency'; ?></label>
                        <select id="edit_currency_code" name="currency_code">
                            <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                        </select>
                    </div>
                    
                    <div id="editVehicleTypesContainer">
                        <!-- Vehicle type price inputs will be dynamically added here -->
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelEditRouteBtn">
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
    
    <!-- Upload and Mapping Modal -->
    <div class="modal" id="uploadMappingModal" style="display:none;">
        <div class="modal-content" style="max-width: 900px; width: 90%;">
            <div class="modal-header">
                <h2 id="uploadModalTitle"><?php echo $t_vehicles['upload_price_list'] ?? 'Upload Price List'; ?></h2>
                <button class="btn-close" id="closeUploadModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <div class="modal-body" style="max-height: 80vh; overflow-y: auto; padding: 0;">
                <!-- Step 1: Excel Upload Section -->
                <div id="uploadStepSection">
                    <form id="excelUploadForm" enctype="multipart/form-data">
                        <div class="form-group">
                            <label><?php echo $t_vehicles['excel_file'] ?? 'Excel File'; ?> *</label>
                            <input type="file" id="excelFile" name="excel_file" accept=".xlsx,.xls" required>
                            <small style="display: block; margin-top: 8px; color: #6b7280;">
                                <?php echo $t_vehicles['excel_format_hint'] ?? 'Excel dosyasında gerekli alanlar: Nerden, Nereye, Vip Vito, Vip Mini, Vito, Mini, Midi, Bus. Sütunlar farklı sırada olabilir, yüklemeden sonra eşleştirme yapabilirsiniz.'; ?>
                            </small>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" id="cancelUploadBtn">
                                <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                            </button>
                            <button type="submit" class="btn-primary">
                                <span class="material-symbols-rounded">upload_file</span>
                                <?php echo $t_vehicles['upload_and_map'] ?? 'Upload and Map Columns'; ?>
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Step 2: Column Mapping Section -->
                <div id="mappingStepSection" style="display: none;">
                    <div style="margin-bottom: 15px;">
                        <h3 style="margin: 0 0 10px 0; font-size: 18px;"><?php echo $t_vehicles['map_columns'] ?? 'Map Columns'; ?></h3>
                        <p style="color: #6b7280; margin: 0;">
                            <?php echo $t_vehicles['map_columns_hint'] ?? 'Excel dosyasındaki sütunları sistem alanlarıyla eşleştirin:'; ?>
                        </p>
                    </div>
                    <div id="columnMappingContainer"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" id="backToUploadBtn">
                            <span class="material-symbols-rounded">arrow_back</span>
                            <?php echo $t_common['back'] ?? 'Back'; ?>
                        </button>
                        <button type="button" class="btn-primary" id="saveColumnMappingBtn">
                            <span class="material-symbols-rounded">save</span>
                            <?php echo $t_common['save'] ?? 'Save and Import'; ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBase' => $basePath . 'api/definitions/vehicles.php',
        'contractId' => $contractId,
        'translations' => [
            'vehicles' => $t_vehicles,
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
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/contract-detail.js"></script>
</body>
</html>

