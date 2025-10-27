<?php
/**
 * Merchants Management Page
 * Manages Merchants
 * Hierarchy: Country -> Region -> City -> Sub Region -> Merchant
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
$t_merchants = $all_translations['merchants'] ?? [];
$t_dependencies = $all_translations['dependencies'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_merchants['title'] ?? 'Merchants'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/merchants.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="merchants-container">
                <!-- Page Header -->
                <div class="merchants-header">
                    <h1><?php echo $t_merchants['title'] ?? 'Merchants'; ?></h1>
                </div>
                
                <!-- Search/Filter Section -->
                <div class="merchants-search-section">
                    <div class="search-box">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="<?php echo $t_merchants['search_placeholder'] ?? 'Esnaf adı, ülke, bölge, şehir, telefon, e-posta...'; ?>" autocomplete="off">
                        <button id="clearSearch" class="clear-btn" style="display: none;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="merchants-content" id="merchants-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- Merchant Modal -->
    <div class="modal" id="merchantsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="merchantModalTitle"><?php echo $t_merchants['add_merchant'] ?? 'Add Merchant'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="merchantForm">
                <div class="form-group">
                    <label><?php echo $t_merchants['merchant_name'] ?? 'Merchant Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_merchants['official_title'] ?? 'Official Title'; ?></label>
                    <input type="text" name="official_title">
                </div>
                <div class="form-group">
                    <label><?php echo $t_merchants['sub_region'] ?? 'Sub Region'; ?> *</label>
                    <select name="sub_region_id" required>
                        <option value=""><?php echo $t_merchants['loading_data'] ?? 'Loading...'; ?></option>
                    </select>
                </div>
                
                <h3 style="margin-top: 20px; color: #151A2D;"><?php echo $t_merchants['authorized_person'] ?? 'Authorized Person'; ?></h3>
                
                <div class="form-group">
                    <label><?php echo $t_merchants['authorized_person'] ?? 'Person'; ?></label>
                    <input type="text" name="authorized_person">
                </div>
                <div class="form-group">
                    <label><?php echo $t_merchants['authorized_email'] ?? 'Email'; ?></label>
                    <input type="email" name="authorized_email" pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" title="<?php echo htmlspecialchars($t_common['invalid_email'] ?? 'Please enter a valid email address'); ?>">
                </div>
                <div class="form-group">
                    <label><?php echo $t_merchants['authorized_phone'] ?? 'Phone'; ?></label>
                    <input type="tel" name="authorized_phone" pattern="[0-9+\-\s()]+" title="<?php echo htmlspecialchars($t_common['invalid_phone'] ?? 'Only numbers, +, -, (), and spaces are allowed'); ?>" onkeypress="return (event.charCode >= 48 && event.charCode <= 57) || event.charCode === 43 || event.charCode === 45 || event.charCode === 40 || event.charCode === 41 || event.charCode === 32">
                </div>
                
                <h3 style="margin-top: 20px; color: #151A2D;"><?php echo $t_merchants['operasyon'] ?? 'Operasyon'; ?></h3>
                
                <div class="form-group">
                    <label><?php echo $t_merchants['operasyon_name'] ?? 'Operasyon Adı'; ?></label>
                    <input type="text" name="operasyon_name">
                </div>
                <div class="form-group">
                    <label><?php echo $t_merchants['operasyon_email'] ?? 'Operasyon E-posta'; ?></label>
                    <input type="email" name="operasyon_email" pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" title="<?php echo htmlspecialchars($t_common['invalid_email'] ?? 'Please enter a valid email address'); ?>">
                </div>
                <div class="form-group">
                    <label><?php echo $t_merchants['operasyon_phone'] ?? 'Operasyon Telefon'; ?></label>
                    <input type="tel" name="operasyon_phone" pattern="[0-9+\-\s()]+" title="<?php echo htmlspecialchars($t_common['invalid_phone'] ?? 'Only numbers, +, -, (), and spaces are allowed'); ?>" onkeypress="return (event.charCode >= 48 && event.charCode <= 57) || event.charCode === 43 || event.charCode === 45 || event.charCode === 40 || event.charCode === 41 || event.charCode === 32">
                </div>
                
                <h3 style="margin-top: 20px; color: #151A2D;"><?php echo $t_merchants['location'] ?? 'Location'; ?></h3>
                
                <div class="form-group">
                    <label><?php echo $t_merchants['location_url'] ?? 'Location URL'; ?></label>
                    <input type="text" name="location_url" placeholder="https://www.google.com/maps/...">
                    <div class="location-buttons" style="margin-top: 10px;">
                        <button type="button" class="btn-location" onclick="getCurrentLocation()">
                            <span class="material-symbols-rounded">my_location</span>
                            <?php echo $t_merchants['get_location'] ?? 'Get Location'; ?>
                        </button>
                        <button type="button" class="btn-location" onclick="openLocationInMaps('<?php echo htmlspecialchars($t_merchants['location_url'] ?? ''); ?>')">
                            <span class="material-symbols-rounded">map</span>
                            <?php echo $t_merchants['open_in_maps'] ?? 'Open in Maps'; ?>
                        </button>
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
    
    
    <!-- Define API base path and translations for JavaScript -->
    <script>
        const BASE_PATH = '<?php echo $basePath; ?>';
        window.API_BASE = BASE_PATH + 'api/definitions/merchants.php';
        window.Translations = {
            merchants: <?php echo json_encode($t_merchants); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>,
            dependencies: <?php echo json_encode($t_dependencies); ?>,
            locations: {
                "country": "<?php echo $t_sidebar['country'] ?? 'Country'; ?>",
                "region": "<?php echo $t_sidebar['region'] ?? 'Region'; ?>",
                "city": "<?php echo $t_sidebar['city'] ?? 'City'; ?>",
                "actions": "<?php echo $t_common['actions'] ?? 'Actions'; ?>"
            }
        };
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/merchants.js"></script>
</body>
</html>
