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
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
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
                
                <!-- Search/Filter Section -->
                <div class="costs-search-section">
                    <div class="search-box">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="Maliyet adı, ülke, bölge, şehir..." autocomplete="off">
                        <button id="clearSearch" class="clear-btn" style="display: none;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
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
                    <label><?php echo $t_costs['cost_name'] ?? 'Cost Name'; ?></label>
                    <input type="text" name="cost_name" placeholder="<?php echo $t_costs['cost_name'] ?? 'Cost Name'; ?>">
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_costs['location_type'] ?? 'Cost Scope'; ?> *</label>
                    <div class="scope-buttons">
                        <label class="scope-option">
                            <input type="radio" name="location_scope" value="country">
                            <span><?php echo $t_costs['for_country'] ?? 'By Country'; ?></span>
                        </label>
                        <label class="scope-option">
                            <input type="radio" name="location_scope" value="region">
                            <span><?php echo $t_costs['for_region'] ?? 'By Region'; ?></span>
                        </label>
                        <label class="scope-option">
                            <input type="radio" name="location_scope" value="city">
                            <span><?php echo $t_costs['for_city'] ?? 'By City'; ?></span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group" id="country-group" style="display: none;">
                    <label><?php echo $t_sidebar['country'] ?? 'Country'; ?> *</label>
                    <select name="country_id">
                        <option value=""><?php echo $t_costs['select_country'] ?? 'Select Country'; ?></option>
                    </select>
                </div>
                
                <div class="form-group" id="region-group" style="display: none;">
                    <label><?php echo $t_sidebar['region'] ?? 'Region'; ?> *</label>
                    <select name="region_id">
                        <option value=""><?php echo $t_costs['select_region'] ?? 'Select Region'; ?></option>
                    </select>
                </div>
                
                <div class="form-group" id="city-group" style="display: none;">
                    <label><?php echo $t_sidebar['city'] ?? 'City'; ?> *</label>
                    <select name="city_id">
                        <option value=""><?php echo $t_costs['select_city'] ?? 'Select City'; ?></option>
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
        window.API_BASE = BASE_PATH + 'api/definitions/costs.php';
        window.Translations = {
            costs: <?php echo json_encode($t_costs); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>
        };
    </script>
    
    <script src="<?php echo $basePath; ?>assets/js/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/costs.js"></script>
    
    <script>
        // Handle location scope selection and form submission
        document.addEventListener('DOMContentLoaded', function() {
            const costForm = document.getElementById('costForm');
            const countryGroup = document.getElementById('country-group');
            const regionGroup = document.getElementById('region-group');
            const cityGroup = document.getElementById('city-group');
            
            // Show/hide location groups based on scope
            function updateLocationGroups() {
                const selectedScope = costForm.querySelector('input[name="location_scope"]:checked');
                if (!selectedScope) {
                    countryGroup.style.display = 'none';
                    regionGroup.style.display = 'none';
                    cityGroup.style.display = 'none';
                    return;
                }
                
                const scope = selectedScope.value;
                countryGroup.style.display = scope === 'country' ? 'block' : 'none';
                regionGroup.style.display = scope === 'region' ? 'block' : 'none';
                cityGroup.style.display = scope === 'city' ? 'block' : 'none';
            }
            
            // Update when scope changes
            costForm.querySelectorAll('input[name="location_scope"]').forEach(radio => {
                radio.addEventListener('change', updateLocationGroups);
            });
            
            // Initialize
            updateLocationGroups();
            
            // Override form submission
            costForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(costForm);
                const selectedScope = formData.get('location_scope');
                
                const data = {
                    cost_name: formData.get('cost_name'),
                    country_id: null,
                    region_id: null,
                    city_id: null
                };
                
                // Set only the selected location
                if (selectedScope === 'country') {
                    data.country_id = formData.get('country_id');
                } else if (selectedScope === 'region') {
                    data.region_id = formData.get('region_id');
                } else if (selectedScope === 'city') {
                    data.city_id = formData.get('city_id');
                }
                
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
</body>
</html>
