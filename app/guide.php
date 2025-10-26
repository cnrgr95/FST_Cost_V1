<?php
/**
 * Guide Page
 * Shows contact information for Merchants and Vehicle Companies
 */

session_start();

// Define base path
$basePath = '../';

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
$t_guide = $all_translations['guide'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_guide['title'] ?? 'Guide'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/guide.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="guide-container">
                <!-- Page Header -->
                <div class="guide-header">
                    <h1><?php echo $t_guide['title'] ?? 'Guide'; ?></h1>
                </div>
                
                <!-- Search/Filter Section -->
                <div class="guide-search-section">
                    <div class="search-box">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="<?php echo $t_guide['search_placeholder'] ?? 'İsim, telefon, e-posta ile ara...'; ?>" autocomplete="off">
                        <button id="clearSearch" class="clear-btn" style="display: none;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div class="guide-tabs">
                    <button class="guide-tab active" data-tab="merchants">
                        <?php echo $t_guide['merchants'] ?? 'Merchants'; ?>
                    </button>
                    <button class="guide-tab" data-tab="companies">
                        <?php echo $t_guide['vehicle_companies'] ?? 'Vehicle Companies'; ?>
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div class="guide-content active" id="merchants-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="guide-content" id="companies-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
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
        window.API_BASE_MERCHANTS = BASE_PATH + 'api/definitions/merchants.php';
        window.API_BASE_VEHICLES = BASE_PATH + 'api/definitions/vehicles.php';
        window.Translations = {
            guide: <?php echo json_encode($t_guide); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>
        };
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/guide.js"></script>
</body>
</html>

