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

// Load security helper for CSRF token
require_once $basePath . 'includes/security.php';

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
    <title><?php echo $t_sidebar['locations'] ?? 'Locations'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/toast.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/select-search.css">
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
                
                <!-- Tabs -->
                <div class="locations-tabs">
                    <button class="locations-tab" data-tab="countries">
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
                <div class="locations-content" id="countries-content">
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
                <h2 id="countryModalTitle"><?php echo $t_locations['add_country'] ?? 'Add Country'; ?></h2>
                <button class="btn-close" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="countryForm">
                <div class="form-group">
                    <label><?php echo $t_locations['country_name'] ?? 'Country Name'; ?> *</label>
                    <input type="text" name="name" required>
                    <span class="input-error-message"></span>
                </div>
                <div class="form-group">
                    <label><?php echo $t_locations['country_code'] ?? 'Country Code'; ?> *</label>
                    <input type="text" name="code" maxlength="3" required placeholder="<?php echo $t_locations['code_placeholder'] ?? 'e.g., TR, US'; ?>">
                    <span class="input-error-message"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelCountriesBtn">
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
    
    <!-- Region Modal -->
    <div class="modal" id="regionsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="regionModalTitle"><?php echo $t_locations['add_region'] ?? 'Add Region'; ?></h2>
                <button class="btn-close" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="regionForm">
                <div class="form-group">
                    <label><?php echo $t_locations['region_name'] ?? 'Region Name'; ?> *</label>
                    <input type="text" name="name" required>
                    <span class="input-error-message"></span>
                </div>
                <div class="form-group">
                    <label><?php echo $t_sidebar['country'] ?? 'Country'; ?> *</label>
                    <select name="country_id" required>
                        <option value=""><?php echo $t_locations['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                    <span class="input-error-message"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelRegionsBtn">
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
    
    <!-- City Modal -->
    <div class="modal" id="citiesModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="cityModalTitle"><?php echo $t_locations['add_city'] ?? 'Add City'; ?></h2>
                <button class="btn-close" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="cityForm">
                <div class="form-group">
                    <label><?php echo $t_locations['city_name'] ?? 'City Name'; ?> *</label>
                    <input type="text" name="name" required>
                    <span class="input-error-message"></span>
                </div>
                <div class="form-group">
                    <label><?php echo $t_sidebar['region'] ?? 'Region'; ?> *</label>
                    <select name="region_id" required>
                        <option value=""><?php echo $t_locations['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                    <span class="input-error-message"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelCitiesBtn">
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
    
    <!-- Sub Region Modal -->
    <div class="modal" id="sub_regionsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="subRegionModalTitle"><?php echo $t_locations['add_sub_region'] ?? 'Add Sub Region'; ?></h2>
                <button class="btn-close" aria-label="<?php echo $t_common['close'] ?? 'Close'; ?>" title="<?php echo $t_common['close'] ?? 'Close'; ?>">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="sub_regionsForm">
                <div class="form-group">
                    <label><?php echo $t_locations['sub_region_name'] ?? 'Sub Region Name'; ?> *</label>
                    <input type="text" name="name" required>
                    <span class="input-error-message"></span>
                </div>
                <div class="form-group">
                    <label><?php echo $t_sidebar['city'] ?? 'City'; ?> *</label>
                    <select name="city_id" required>
                        <option value=""><?php echo $t_locations['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                    <span class="input-error-message"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelSubRegionsBtn">
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
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBase' => $basePath . 'api/definitions/locations.php',
        'csrfToken' => csrfToken(),
        'translations' => [
            'locations' => $t_locations,
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
    <!-- Modal, Form Validation & Handler Utilities -->
    <script src="<?php echo $basePath; ?>assets/js/modal-manager.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/form-validator.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/form-handler.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/select-search.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/locations.js"></script>
</body>
</html>

