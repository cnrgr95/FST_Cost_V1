<?php
/**
 * Languages Management Page
 * Manages language files and translations
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
$t_lang_mgmt = $all_translations['language_mgmt'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_lang_mgmt['title'] ?? 'Languages'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/languages.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
    
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="languages-container-page">
                <!-- Page Header -->
                <div class="languages-header">
                    <h1><?php echo $t_lang_mgmt['title'] ?? 'Languages & Translations'; ?></h1>
                </div>
                
                <!-- Languages Container -->
                <div class="languages-container">
                    <!-- Sidebar -->
                    <div class="languages-sidebar">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h2><?php echo $t_lang_mgmt['languages'] ?? 'Languages'; ?></h2>
                            <button class="btn-add" onclick="openAddModal()" style="padding: 6px 12px; font-size: 14px;">
                                <span class="material-symbols-rounded" style="font-size: 18px;">add</span>
                                <?php echo $t_lang_mgmt['add'] ?? 'Add'; ?>
                            </button>
                        </div>
                        <div id="languages-list"></div>
                    </div>
                    
                    <!-- Editor -->
                    <div class="languages-editor">
                        <div id="editor-content">
                            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                <span class="material-symbols-rounded" style="font-size: 48px;">language</span>
                                <p><?php echo $t_lang_mgmt['select_language_prompt'] ?? 'Select a language to edit translations'; ?></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Add Language Modal -->
    <div class="modal" id="addLanguageModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><?php echo $t_lang_mgmt['add_language'] ?? 'Add Language'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="addLanguageForm">
                <div class="form-group">
                    <label><?php echo $t_lang_mgmt['language_code'] ?? 'Language Code'; ?> *</label>
                    <input type="text" name="code" placeholder="<?php echo $t_lang_mgmt['language_code_placeholder'] ?? 'e.g., de, fr, es'; ?>" required maxlength="2" style="text-transform: lowercase;">
                </div>
                
                <div class="form-group">
                    <label><?php echo $t_lang_mgmt['language_name'] ?? 'Language Name'; ?> *</label>
                    <input type="text" name="name" placeholder="<?php echo $t_lang_mgmt['language_name_placeholder'] ?? 'e.g., Deutsch, Français, Español'; ?>" required>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeAddModal()">
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary">
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Edit Language Modal -->
    <div class="modal" id="editLanguageModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><?php echo $t_lang_mgmt['edit_language'] ?? 'Edit Language'; ?></h2>
                <button class="btn-close">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="editLanguageForm">
                <div class="form-group">
                    <label><?php echo $t_lang_mgmt['language_name'] ?? 'Language Name'; ?> *</label>
                    <input type="text" name="name" required>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeEditModal()">
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
        'apiBase' => $basePath . 'api/definitions/languages.php',
        'translations' => [
            'common' => $t_common,
            'language_mgmt' => $t_lang_mgmt
        ]
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_PRETTY_PRINT);
    ?>
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/languages.js"></script>
</body>
</html>
