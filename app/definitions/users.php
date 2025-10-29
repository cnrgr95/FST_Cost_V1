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
                    <label><?php echo $t_users['department'] ?? 'Department'; ?></label>
                    <select name="department_id">
                        <option value=""><?php echo $t_users['select_department'] ?? 'Select Department'; ?></option>
                    </select>
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
    
    <style>
        /* Page-specific styles */
        .users-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        
        .users-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .users-header h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
        }
        
        .users-search-section {
            padding: 20px 30px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .users-content {
            padding: 20px 30px;
        }
        
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-header h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
        }
        
        .btn-close {
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .btn-close:hover {
            color: #374151;
        }
        
        form {
            padding: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #374151;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #151A2D;
        }
        
        .form-group small {
            display: block;
            margin-top: 4px;
            font-size: 12px;
        }
        
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 30px;
            border-top: 1px solid #e5e7eb;
        }
        
        .btn-secondary,
        .btn-primary {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        
        .btn-secondary:hover {
            background: #e5e7eb;
        }
        
        .btn-primary {
            background: #151A2D;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0f1119;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .modal-content {
                width: 95%;
            }
        }
    </style>
    
    <!-- Define API base path and translations for JavaScript -->
    <script>
        const BASE_PATH = '<?php echo $basePath; ?>';
        window.API_BASE = BASE_PATH + 'api/definitions/users.php';
        window.Translations = {
            users: <?php echo json_encode($t_users); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>
        };
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/users.js"></script>
</body>
</html>

