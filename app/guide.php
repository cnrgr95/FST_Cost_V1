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
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
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
                
                <!-- Tabs -->
                <div class="guide-tabs">
                    <button class="guide-tab" data-tab="merchants">
                        <?php echo $t_guide['merchants'] ?? 'Merchants'; ?>
                    </button>
                    <button class="guide-tab" data-tab="companies">
                        <?php echo $t_guide['vehicle_companies'] ?? 'Vehicle Companies'; ?>
                    </button>
                    <button class="guide-tab" data-tab="users">
                        <?php echo $t_guide['users'] ?? 'Users'; ?>
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div class="guide-content" id="merchants-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="guide-content" id="companies-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="guide-content" id="users-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBaseMerchants' => $basePath . 'api/definitions/merchants.php',
        'apiBaseVehicles' => $basePath . 'api/definitions/vehicles.php',
        'apiBaseUsers' => $basePath . 'api/definitions/users.php',
        'translations' => [
            'guide' => $t_guide,
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
    <script src="<?php echo $basePath; ?>assets/js/app/guide.js"></script>
</body>
</html>

