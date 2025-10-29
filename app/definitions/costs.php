<?php
/**
 * Costs Management Page
 * Manages Costs per Country
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
$t_costs = $all_translations['costs'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_costs['title'] ?? 'Costs'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/costs.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="costs-container">
                <!-- Page Header -->
                <div class="costs-header">
                    <h1><?php echo $t_costs['title'] ?? 'Cost Management'; ?></h1>
                </div>
                
                <!-- Content -->
                <div class="costs-content" id="costs-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- Cost Modal -->
    <div class="modal" id="costsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="costModalTitle"><?php echo $t_costs['add_cost'] ?? 'Add Cost'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="costForm">
                <div class="form-group">
                    <label><?php echo $t_costs['cost_code'] ?? 'Cost Code'; ?></label>
                    <input type="text" name="cost_code" disabled placeholder="<?php echo $t_costs['code_auto'] ?? 'Will be generated automatically'; ?>" style="background-color: #f3f4f6; color: #6b7280;">
                    <small style="color: #6b7280;"><?php echo $t_costs['code_auto'] ?? 'Will be generated automatically'; ?></small>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_costs['cost_name'] ?? 'Cost Name'; ?> *</label>
                    <input type="text" name="cost_name" placeholder="<?php echo $t_costs['cost_name'] ?? 'Cost Name'; ?>" required>
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
        'apiBase' => $basePath . 'api/definitions/costs.php',
        'translations' => [
            'costs' => $t_costs,
            'common' => $t_common,
            'sidebar' => $t_sidebar
        ]
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_PRETTY_PRINT);
    ?>
    </script>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/costs.js"></script>
    
    <script>
        // Handle form submission
        document.addEventListener('DOMContentLoaded', function() {
            const costForm = document.getElementById('costForm');
            
            // Override form submission
            costForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(costForm);
                
                const costName = formData.get('cost_name');
                
                if (!costName || costName.trim() === '') {
                    const tCosts = window.Translations?.costs || {};
                    showToast('error', tCosts.cost_name_required || 'Cost name is required');
                    return;
                }
                
                const data = {
                    cost_name: costName
                };
                
                // Don't send cost_code when creating (it will be auto-generated)
                // Only send cost_code when editing
                if (costForm.dataset.id) {
                    data.id = costForm.dataset.id;
                    data.cost_code = formData.get('cost_code');
                    updateCost(data);
                } else {
                    // Empty string means auto-generate
                    data.cost_code = '';
                    createCost(data);
                }
            });
        });
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
</body>
</html>
