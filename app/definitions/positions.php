<?php
/**
 * Positions Management Page
 * Manages Departments and Positions
 * Hierarchy: Country -> Region -> City -> Department -> Position
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
$t_positions = $all_translations['positions'] ?? [];
$t_dependencies = $all_translations['dependencies'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_positions['title'] ?? 'Positions'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
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
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/positions.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="positions-container">
                <!-- Page Header -->
                <div class="positions-header">
                    <h1><?php echo $t_positions['title'] ?? 'Positions'; ?></h1>
                </div>
                
                <!-- Tabs -->
                <div class="positions-tabs">
                    <button class="positions-tab active" data-tab="departments">
                        <?php echo $t_sidebar['department'] ?? 'Departments'; ?>
                    </button>
                    <button class="positions-tab" data-tab="positions">
                        <?php echo $t_sidebar['position'] ?? 'Positions'; ?>
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div class="positions-content active" id="departments-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
                
                <div class="positions-content" id="positions-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- Department Modal -->
    <div class="modal" id="departmentModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="departmentModalTitle">Add Department</h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="departmentForm">
                <div class="form-group">
                    <label><?php echo $t_positions['department_name'] ?? 'Department Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_positions['city'] ?? 'City'; ?> *</label>
                    <select name="city_id" required>
                        <option value=""><?php echo $t_common['loading'] ?? 'Loading...'; ?></option>
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
    
    <!-- Position Modal -->
    <div class="modal" id="positionModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="positionModalTitle">Add Position</h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="positionForm">
                <div class="form-group">
                    <label><?php echo $t_positions['position_name'] ?? 'Position Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label><?php echo $t_sidebar['department'] ?? 'Department'; ?> *</label>
                    <select name="department_id" required>
                        <option value=""><?php echo $t_common['loading'] ?? 'Loading...'; ?></option>
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
    
    <!-- Data attributes for JavaScript configuration -->
    <script type="application/json" id="page-config">
    {
        "basePath": "<?php echo htmlspecialchars($basePath, ENT_QUOTES, 'UTF-8'); ?>",
        "apiBase": "<?php echo htmlspecialchars($basePath, ENT_QUOTES, 'UTF-8'); ?>api/definitions/positions.php",
        "translations": <?php echo json_encode([
            'positions' => $t_positions,
            'common' => $t_common,
            'sidebar' => $t_sidebar,
            'dependencies' => $t_dependencies
        ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>
    }
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/select-search.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/positions.js"></script>
</body>
</html>

