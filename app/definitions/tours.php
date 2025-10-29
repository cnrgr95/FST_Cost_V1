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
    <title><?php echo $t_tours['title'] ?? 'Tours'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
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
                    <h1><?php echo $t_tours['title'] ?? 'Tours'; ?></h1>
                </div>
                
                <!-- Content -->
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
            <form id="tourForm" style="display: block;">
                <div class="form-group">
                    <label><?php echo $t_tours['sejour_tour_code'] ?? 'Sejour Tour Code'; ?> *</label>
                    <input type="text" name="sejour_tour_code" placeholder="<?php echo $t_tours['sejour_tour_code'] ?? 'Sejour Tour Code'; ?>" required style="text-transform: uppercase; width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_tours['tour_name'] ?? 'Tour Name'; ?> *</label>
                    <input type="text" name="name" required style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_sidebar['sub_region'] ?? 'Sub Region'; ?> *</label>
                    <select name="sub_region_id" required style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value=""><?php echo $t_tours['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_sidebar['merchant'] ?? 'Merchant'; ?> *</label>
                    <select name="merchant_id" required style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value=""><?php echo $t_tours['select_merchant'] ?? 'Select Merchant'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_sidebar['country'] ?? 'Country'; ?></label>
                    <select id="filter_country_id" name="filter_country_id" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_sidebar['region'] ?? 'Region'; ?></label>
                    <select id="filter_region_id" name="filter_region_id" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_sidebar['city'] ?? 'City'; ?></label>
                    <select id="filter_city_id" name="filter_city_id" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <div class="checkbox-group-header">
                        <label><?php echo $t_tours['tour_regions'] ?? 'Bu Turun Gerçekleştiği Bölgeler'; ?></label>
                        <div class="checkbox-actions">
                            <button type="button" class="btn-select-all" onclick="selectAllRegions()" style="display: none;">
                                <span class="material-symbols-rounded">check_box</span>
                                <?php echo $t_tours['select_all'] ?? 'Tümünü Seç'; ?>
                            </button>
                            <button type="button" class="btn-deselect-all" onclick="deselectAllRegions()" style="display: none;">
                                <span class="material-symbols-rounded">check_box_outline_blank</span>
                                <?php echo $t_tours['deselect_all'] ?? 'Tümünü Temizle'; ?>
                            </button>
                            <span class="selected-count" id="selected_count" style="display: none;"></span>
                        </div>
                    </div>
                    <div class="checkbox-search" style="display: none;">
                        <input type="text" id="region_search" placeholder="<?php echo $t_tours['search_regions'] ?? 'Bölge ara...'; ?>" onkeyup="filterRegions(this.value)">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div id="sub_regions_checkbox_container" class="checkbox-container" style="min-height: 100px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
                        <div class="checkbox-message"><?php echo $t_tours['select_regions_first'] ?? 'Önce ülke, bölge ve şehir seçin'; ?></div>
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
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/tours.js"></script>
</body>
</html>
