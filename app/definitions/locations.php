<?php
/**
 * Locations Management Page
 * Manages Countries, Regions, and Cities
 */

session_start();

// Define base path - for files in app/definitions, use ../../ to reach root
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
$t_locations = $all_translations['locations'] ?? [];
$t_dependencies = $all_translations['dependencies'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_sidebar['locations'] ?? 'Locations'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/locations.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="locations-container">
                <!-- Page Header -->
                <div class="locations-header">
                    <h1><?php echo $t_sidebar['locations'] ?? 'Locations'; ?></h1>
                </div>
                
                <!-- Search/Filter Section -->
                <div class="locations-search-section">
                    <div class="search-box">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="<?php echo $t_locations['search_placeholder'] ?? 'Search...'; ?>" autocomplete="off">
                        <button id="clearSearch" class="clear-btn" style="display: none;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div class="locations-tabs">
                    <button class="locations-tab active" data-tab="countries">
                        <?php echo $t_sidebar['country'] ?? 'Countries'; ?>
                    </button>
                    <button class="locations-tab" data-tab="regions">
                        <?php echo $t_sidebar['region'] ?? 'Regions'; ?>
                    </button>
                    <button class="locations-tab" data-tab="cities">
                        <?php echo $t_sidebar['city'] ?? 'Cities'; ?>
                    </button>
                    <button class="locations-tab" data-tab="sub_regions">
                        <?php echo $t_locations['sub_regions'] ?? 'Sub Regions'; ?>
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div class="locations-content active" id="countries-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="locations-content" id="regions-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="locations-content" id="cities-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="locations-content" id="sub_regions-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- Country Modal -->
    <div class="modal" id="countriesModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="countryModalTitle">Add Country</h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="countryForm">
                <div class="form-group">
                    <label><?php echo $t_locations['country_name'] ?? 'Country Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_locations['country_code'] ?? 'Country Code'; ?></label>
                    <input type="text" name="code" maxlength="3" placeholder="e.g., TR, US">
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
    
    <!-- Region Modal -->
    <div class="modal" id="regionsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="regionModalTitle">Add Region</h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="regionForm">
                <div class="form-group">
                    <label><?php echo $t_locations['region_name'] ?? 'Region Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_sidebar['country'] ?? 'Country'; ?> *</label>
                    <select name="country_id" required>
                        <option value=""><?php echo $t_locations['loading_data'] ?? 'Loading...'; ?></option>
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
    
    <!-- City Modal -->
    <div class="modal" id="citiesModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="cityModalTitle">Add City</h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="cityForm">
                <div class="form-group">
                    <label><?php echo $t_locations['city_name'] ?? 'City Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_sidebar['region'] ?? 'Region'; ?> *</label>
                    <select name="region_id" required>
                        <option value=""><?php echo $t_locations['loading_data'] ?? 'Loading...'; ?></option>
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
    
    <!-- Sub Region Modal -->
    <div class="modal" id="sub_regionsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="subRegionModalTitle">Add Sub Region</h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="sub_regionsForm">
                <div class="form-group">
                    <label><?php echo $t_locations['sub_region_name'] ?? 'Sub Region Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_sidebar['city'] ?? 'City'; ?> *</label>
                    <select name="city_id" required>
                        <option value=""><?php echo $t_locations['loading_data'] ?? 'Loading...'; ?></option>
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
        window.API_BASE = BASE_PATH + 'api/definitions/locations.php';
        window.Translations = {
            locations: <?php echo json_encode($t_locations); ?>,
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
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/locations.js"></script>
</body>
</html>

