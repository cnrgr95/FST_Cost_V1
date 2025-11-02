<?php
/**
 * Tours Management Page
 * Manages Tours with hierarchical location selection
 * Hierarchy: Country -> Region -> City -> Sub Region -> Merchant -> Tour
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

// Load security helpers for CSRF token
require_once $basePath . 'includes/security.php';

// Get translations
$t_sidebar = $all_translations['sidebar'] ?? [];
$t_common = $all_translations['common'] ?? [];
$t_tours = $all_translations['tours'] ?? [];
$t_vehicles = $all_translations['vehicles'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_tours['tours'] ?? 'Tours'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
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
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/tours.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="tours-container">
                <!-- Page Header -->
                <div class="tours-header">
                    <h1 id="toursPageTitle"><?php echo $t_tours['tours'] ?? 'Tours'; ?></h1>
                </div>
                
                <!-- Tab Content -->
                <div class="tours-content" id="tours-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- Tour Modal -->
    <div class="modal" id="toursModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="tourModalTitle"><?php echo $t_tours['add_tour'] ?? 'Add Tour'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="tourForm" novalidate>
                <div class="modal-body">
                    <div class="form-group">
                        <label><?php echo $t_tours['sejour_tour_code'] ?? 'Sejour Tour Code'; ?> *</label>
                        <input type="text" name="sejour_tour_code" placeholder="<?php echo $t_tours['sejour_tour_code'] ?? 'Sejour Tour Code'; ?>" required data-error="<?php echo ($t_tours['sejour_tour_code'] ?? 'Sejour Tour Code') . ' ' . ($t_common['is_required'] ?? 'is required'); ?>">
                        <span class="input-error-message"></span>
                    </div>
                
                    <div class="form-group">
                        <label><?php echo $t_tours['tour_name'] ?? 'Sejour Tour Name'; ?> *</label>
                        <input type="text" name="name" placeholder="<?php echo $t_tours['tour_name'] ?? 'Tour Name'; ?>" required data-error="<?php echo ($t_tours['tour_name'] ?? 'Tour Name') . ' ' . ($t_common['is_required'] ?? 'is required'); ?>">
                        <span class="input-error-message"></span>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_sidebar['country'] ?? 'Country'; ?> *</label>
                        <select name="country_id" id="countrySelect" required data-error="<?php echo ($t_sidebar['country'] ?? 'Country') . ' ' . ($t_common['is_required'] ?? 'is required'); ?>">
                            <option value=""><?php echo $t_tours['select_country'] ?? 'Select Country'; ?></option>
                        </select>
                        <span class="input-error-message"></span>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_sidebar['region'] ?? 'Region'; ?> *</label>
                        <select name="region_id" id="regionSelect" required disabled data-error="<?php echo ($t_sidebar['region'] ?? 'Region') . ' ' . ($t_common['is_required'] ?? 'is required'); ?>">
                            <option value=""><?php echo $t_tours['select_region'] ?? 'Select Region'; ?></option>
                        </select>
                        <span class="input-error-message"></span>
                    </div>
                    
                    <div class="form-group">
                        <label><?php echo $t_sidebar['city'] ?? 'City'; ?> *</label>
                        <select name="city_id" id="citySelect" required disabled data-error="<?php echo ($t_sidebar['city'] ?? 'City') . ' ' . ($t_common['is_required'] ?? 'is required'); ?>">
                            <option value=""><?php echo $t_tours['select_city'] ?? 'Select City'; ?></option>
                        </select>
                        <span class="input-error-message"></span>
                    </div>
                    
                    <div class="form-group" id="subRegionsGroup" style="display: none;">
                        <label><?php echo $t_tours['sub_regions'] ?? 'Sub Regions'; ?></label>
                        <div class="checkbox-group-header">
                            <label><?php echo $t_tours['select_sub_regions'] ?? 'Select Sub Regions'; ?></label>
                            <div class="checkbox-actions">
                                <button type="button" class="btn-select-all" onclick="selectAllSubRegions()" style="display: none;">
                                    <span class="material-symbols-rounded">check_box</span>
                                    <?php echo $t_tours['select_all'] ?? 'Select All'; ?>
                                </button>
                                <button type="button" class="btn-deselect-all" onclick="deselectAllSubRegions()" style="display: none;">
                                    <span class="material-symbols-rounded">check_box_outline_blank</span>
                                    <?php echo $t_tours['deselect_all'] ?? 'Deselect All'; ?>
                                </button>
                            </div>
                        </div>
                        <div class="checkbox-search" style="display: none;">
                            <input type="text" id="sub_region_search" placeholder="<?php echo $t_tours['search_sub_regions'] ?? 'Search sub regions...'; ?>" onkeyup="filterSubRegions(this.value)">
                            <span class="material-symbols-rounded">search</span>
                        </div>
                        <div id="sub_regions_checkbox_container" class="checkbox-container">
                            <div class="checkbox-message"><?php echo $t_tours['select_city_first'] ?? 'Please select city first'; ?></div>
                        </div>
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
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBase' => $basePath . 'api/definitions/tours.php',
        'csrfToken' => csrfToken(),
        'translations' => [
            'tours' => $t_tours,
            'common' => $t_common,
            'sidebar' => $t_sidebar,
            'vehicles' => $t_vehicles
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
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/tours.js"></script>
</body>
</html>
