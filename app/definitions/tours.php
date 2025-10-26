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
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
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
                
                <!-- Search/Filter Section -->
                <div class="tours-search-section">
                    <div class="search-box">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="<?php echo $t_tours['sejour_tour_code'] ?? 'Sejour Tour Code'; ?>, tur adı, ülke, bölge, şehir, esnaf..." autocomplete="off">
                        <button id="clearSearch" class="clear-btn" style="display: none;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
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
            <form id="tourForm">
                <div class="form-group">
                    <label><?php echo $t_tours['sejour_tour_code'] ?? 'Sejour Tour Code'; ?> *</label>
                    <input type="text" name="sejour_tour_code" placeholder="<?php echo $t_tours['sejour_tour_code'] ?? 'Sejour Tour Code'; ?>" required style="text-transform: uppercase;">
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_tours['tour_name'] ?? 'Tour Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_sidebar['sub_region'] ?? 'Sub Region'; ?> *</label>
                    <select name="sub_region_id" required>
                        <option value=""><?php echo $t_tours['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_sidebar['merchant'] ?? 'Merchant'; ?> *</label>
                    <select name="merchant_id" required>
                        <option value=""><?php echo $t_tours['select_merchant'] ?? 'Select Merchant'; ?></option>
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
        window.API_BASE = BASE_PATH + 'api/definitions/tours.php';
        window.Translations = {
            tours: <?php echo json_encode($t_tours); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>
        };
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/tours.js"></script>
</body>
</html>
