<?php
/**
 * Dashboard Page
 */

session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// Load translation helper
require_once __DIR__ . '/includes/translations.php';

// Get dashboard translations
$t_dashboard = $all_translations['dashboard'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_dashboard['title'] ?? 'Dashboard'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="assets/css/sidebar.css">
    <link rel="stylesheet" href="assets/css/topbar.css">
    <link rel="stylesheet" href="assets/css/common.css">
    
    <link rel="icon" type="image/svg+xml" href="assets/images/logo.svg">
</head>
<body>
    <?php include 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="page-header">
                <h1><?php echo $t_dashboard['title'] ?? 'Dashboard'; ?></h1>
                <p><?php echo $t_dashboard['welcome_message'] ?? 'Welcome to FST Cost Management System'; ?></p>
            </div>
            
            <div class="dashboard-content">
                <!-- Welcome Card -->
                <div class="welcome-card">
                    <div class="welcome-icon">
                        <span class="material-symbols-rounded">dashboard</span>
                    </div>
                    <h2><?php echo $t_dashboard['welcome'] ?? 'Welcome'; ?>, <?php echo htmlspecialchars($_SESSION['username']); ?>!</h2>
                    <p><?php echo $t_dashboard['dashboard_description'] ?? 'You have successfully logged into the system. This is your main dashboard.'; ?></p>
                </div>
                
                <!-- Dashboard Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <span class="material-symbols-rounded">attach_money</span>
                        </div>
                        <div class="stat-info">
                            <h3>$125,000</h3>
                            <p><?php echo $t_dashboard['total_budget'] ?? 'Total Budget'; ?></p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <span class="material-symbols-rounded">trending_up</span>
                        </div>
                        <div class="stat-info">
                            <h3>$85,000</h3>
                            <p><?php echo $t_dashboard['total_spent'] ?? 'Total Spent'; ?></p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <span class="material-symbols-rounded">account_balance</span>
                        </div>
                        <div class="stat-info">
                            <h3>$40,000</h3>
                            <p><?php echo $t_dashboard['remaining'] ?? 'Remaining'; ?></p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                            <span class="material-symbols-rounded">folder</span>
                        </div>
                        <div class="stat-info">
                            <h3>12</h3>
                            <p><?php echo $t_dashboard['active_projects'] ?? 'Active Projects'; ?></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .welcome-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 40px;
            color: white;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .welcome-icon {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .welcome-icon .material-symbols-rounded {
            font-size: 32px;
        }
        
        .welcome-card h2 {
            font-size: 32px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .welcome-card p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }
        
        .stat-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .stat-icon .material-symbols-rounded {
            font-size: 28px;
            color: white;
        }
        
        .stat-info h3 {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .stat-info p {
            font-size: 14px;
            color: #6b7280;
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
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
    
    <script src="assets/js/sidebar.js"></script>
</body>
</html>
