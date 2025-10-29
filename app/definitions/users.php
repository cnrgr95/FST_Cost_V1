<?php
/**
 * Users Management Page
 * Manages Users with LDAP authentication (demo mode)
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
$t_users = $all_translations['users'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_users['title'] ?? 'Users'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/users.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="users-container">
                <!-- Page Header -->
                <div class="users-header">
                    <h1><?php echo $t_users['title'] ?? 'User Management'; ?></h1>
                </div>
                
                <!-- Users Content -->
                <div class="users-content" id="users-content">
                    <!-- Content will be loaded by JavaScript -->
                </div>
            </div>
        </div>
    </div>
    
    <!-- User Modal -->
    <div class="modal" id="userModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="userModalTitle"><?php echo $t_users['add_user'] ?? 'Add User'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="userForm">
                <div class="form-group">
                    <label><?php echo $t_users['username'] ?? 'Username'; ?> *</label>
                    <input type="text" name="username" required readonly style="background-color: #f3f4f6; color: #6b7280;">
                    <small style="color: #6b7280;"><?php echo $t_users['username_ldap'] ?? 'LDAP username - cannot be changed'; ?></small>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['full_name'] ?? 'Full Name'; ?> *</label>
                    <input type="text" name="full_name" required readonly style="background-color: #f3f4f6; color: #6b7280;">
                    <small style="color: #6b7280;"><?php echo $t_users['full_name_ldap'] ?? 'LDAP full name - cannot be changed'; ?></small>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['country'] ?? 'Country'; ?></label>
                    <select name="country_id" id="countrySelect">
                        <option value=""><?php echo $t_users['select_country'] ?? 'Select Country'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['region'] ?? 'Region'; ?></label>
                    <select name="region_id" id="regionSelect" disabled>
                        <option value=""><?php echo $t_users['select_region'] ?? 'Select Region'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['city'] ?? 'City'; ?></label>
                    <select name="city_id" id="citySelect" disabled>
                        <option value=""><?php echo $t_users['select_city'] ?? 'Select City'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['department'] ?? 'Department'; ?></label>
                    <select name="department_id" id="departmentSelect" disabled>
                        <option value=""><?php echo $t_users['select_department'] ?? 'Select Department'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['position'] ?? 'Position'; ?></label>
                    <select name="position_id" id="positionSelect" disabled>
                        <option value=""><?php echo $t_users['select_position'] ?? 'Select Position'; ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['email'] ?? 'Email'; ?></label>
                    <input type="email" name="email" readonly style="background-color: #f3f4f6; color: #6b7280;">
                    <small style="color: #6b7280;"><?php echo $t_users['email_ldap'] ?? 'LDAP email - cannot be changed'; ?></small>
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['phone'] ?? 'Phone'; ?></label>
                    <input type="text" name="phone">
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_users['status'] ?? 'Status'; ?></label>
                    <select name="status">
                        <option value="active"><?php echo $t_users['active'] ?? 'Active'; ?></option>
                        <option value="inactive"><?php echo $t_users['inactive'] ?? 'Inactive'; ?></option>
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
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBase' => $basePath . 'api/definitions/users.php',
        'currentUserId' => $_SESSION['user_id'] ?? null,
        'translations' => [
            'users' => $t_users,
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
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/users.js"></script>
</body>
</html>

