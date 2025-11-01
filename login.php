<?php
/**
 * Login Page
 */

// Initialize secure session
require_once __DIR__ . '/config.php';
initSecureSession();

// Disable page caching for language changes
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Redirect to dashboard if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

// Load translations first to get available languages
require_once __DIR__ . '/includes/translations.php';

// Get available languages - always call getAvailableLanguages() to get latest languages
// This ensures newly added language files are immediately available
$availableLanguages = getAvailableLanguages();
$langKeys = array_keys($availableLanguages);

// Also store in $all_translations for consistency
if (!isset($all_translations['_available_languages'])) {
    $all_translations['_available_languages'] = $availableLanguages;
}

// Ensure $lang is set (should already be set by translations.php)
if (!isset($lang)) {
    $lang = 'en';
}

// CRITICAL: If GET parameter exists, ALWAYS use it and reload translations
// This ensures dropdown changes are immediately reflected regardless of session state
if (isset($_GET['lang']) && !empty($_GET['lang'])) {
    $getLang = trim($_GET['lang']);
    if (in_array($getLang, $langKeys, true)) {
        // Always update lang and reload translations when GET parameter is present
        $lang = $getLang;
        $_SESSION['language'] = $lang;
        $all_translations = loadTranslations($lang);
        // Refresh available languages to ensure newly added languages are included
        $availableLanguages = getAvailableLanguages();
        $all_translations['_available_languages'] = $availableLanguages;
        $langKeys = array_keys($availableLanguages);
    }
}

// Extract translation sections
$t_login = $all_translations['login'] ?? [];
$t_languages = $all_translations['languages'] ?? [];
$t_common = $all_translations['common'] ?? [];
$app_name = $all_translations['app']['name'] ?? 'FST Cost Management';

// Handle login form
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle language change from POST
    if (isset($_POST['language'])) {
        $postLang = trim($_POST['language']);
        if (in_array($postLang, $langKeys, true)) {
            $_SESSION['language'] = $postLang;
            $lang = $postLang;
            // Reload translations with new language
            $all_translations = loadTranslations($lang);
            // Refresh available languages to ensure newly added languages are included
            $availableLanguages = getAvailableLanguages();
            $all_translations['_available_languages'] = $availableLanguages;
            $langKeys = array_keys($availableLanguages);
            $t_login = $all_translations['login'] ?? [];
            $t_languages = $all_translations['languages'] ?? [];
            $t_common = $all_translations['common'] ?? [];
            $app_name = $all_translations['app']['name'] ?? 'FST Cost Management';
        }
    }
    
    // CSRF protection
    if (!isset($_POST[CSRF_TOKEN_NAME]) || !validateCsrfToken($_POST[CSRF_TOKEN_NAME])) {
        $error = $t_login['security_token_failed'] ?? 'Security token validation failed. Please try again.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');
        
        // Rate limiting check
        if (!checkRateLimit('login', 10, 300)) { // 10 attempts per 5 minutes
            $error = $t_login['too_many_attempts'] ?? 'Too many login attempts. Please try again later.';
        } elseif (empty($username) || empty($password)) {
            $error = $t_common['required_field'] ?? 'Please fill in all fields';
        } else {
            // Authentication with password field (currently accepts any password, ready for future password validation)
            // TODO: In production, implement LDAP/AD authentication or password hash verification
            $conn = getDbConnection();
            
            if ($conn) {
                // Use prepared statements to prevent SQL injection
                $query = "SELECT id, username, full_name, status FROM users WHERE username = $1";
                $result = pg_query_params($conn, $query, [trim($username)]);
                
                if ($result && pg_num_rows($result) > 0) {
                    $user = pg_fetch_assoc($result);
                    
                    // Check if user is active
                    if ($user['status'] !== 'active') {
                        $error = $t_login['account_disabled'] ?? 'Your account is disabled. Please contact administrator.';
                        logError("Login attempt for disabled account: $username", __FILE__, __LINE__);
                    } else {
                        // Temporary: Accept any non-empty password
                        // In the future, this will verify against:
                        // 1. LDAP/Active Directory for corporate users
                        // 2. password_hash stored in database for local users
                        // 3. Or other authentication mechanism
                        
                        // For now, any password is accepted as long as it's not empty
                        // This allows the password field to be present in the UI
                        
                        // Regenerate session ID to prevent session fixation
                        session_regenerate_id(true);
                        
                        $_SESSION['user_id'] = $user['id'];
                        $_SESSION['username'] = $username;
                        $_SESSION['full_name'] = $user['full_name'] ?? $username;
                        $_SESSION['last_activity'] = time();
                        $_SESSION['created'] = time();
                        // Ensure language is preserved after login
                        if (isset($_POST['language']) && in_array($_POST['language'], $langKeys, true)) {
                            $_SESSION['language'] = $_POST['language'];
                        }
                        
                        // Handle remember me with secure cookie
                        if (isset($_POST['remember_me']) && $_POST['remember_me'] === 'on') {
                            // Secure cookie: HttpOnly + SameSite
                            setcookie('remembered_username', $username, [
                                'expires' => time() + (30 * 24 * 60 * 60),
                                'path' => '/',
                                'httponly' => true,
                                'samesite' => 'Lax'
                            ]);
                        } else {
                            setcookie('remembered_username', '', [
                                'expires' => time() - 3600,
                                'path' => '/',
                                'httponly' => true,
                                'samesite' => 'Lax'
                            ]);
                        }
                        
                        // Close database connection
                        closeDbConnection($conn);
                        
                        // Preserve language in redirect
                        $redirectLang = isset($_POST['language']) && in_array($_POST['language'], $langKeys, true) ? $_POST['language'] : $lang;
                        header('Location: dashboard.php' . ($redirectLang !== 'en' ? '?lang=' . urlencode($redirectLang) : ''));
                        exit;
                    }
                } else {
                    $error = $t_login['user_not_found'] ?? 'User not found. Please check your username.';
                    logError("Login attempt for non-existent user: $username", __FILE__, __LINE__);
                }
                
                closeDbConnection($conn);
            } else {
                $error = $t_login['database_error'] ?? 'Database connection failed. Please contact administrator.';
                logError("Database connection failed during login for username: $username", __FILE__, __LINE__);
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title><?php echo $t_login['title'] ?? 'Login'; ?> - <?php echo $app_name; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/login.css">
    <link rel="icon" type="image/svg+xml" href="assets/images/logo.svg">
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <div class="logo-container">
                <img src="assets/images/logo.svg" alt="FST Logo" class="logo">
            </div>
            <p><?php echo $app_name; ?></p>
        </div>
        
        <?php if ($error): ?>
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i> <?php echo $error; ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="login.php<?php 
            // Preserve language from GET or POST or session
            $preserveLang = $_GET['lang'] ?? (isset($_POST['language']) ? $_POST['language'] : null) ?? $lang;
            echo ($preserveLang && in_array($preserveLang, $langKeys, true)) ? '?lang=' . htmlspecialchars($preserveLang) : ''; 
        ?>">
            <?php echo csrfField(); ?>
            <div class="form-group">
                <div class="input-with-icon">
                    <i class="fas fa-user"></i>
                    <input type="text" id="username" name="username" class="form-control" placeholder="<?php echo $t_login['username'] ?? 'Username'; ?>" value="<?php echo isset($_COOKIE['remembered_username']) ? htmlspecialchars($_COOKIE['remembered_username']) : ''; ?>" required>
                </div>
            </div>
            
            <div class="form-group">
                <div class="input-with-icon">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="password" name="password" class="form-control" placeholder="<?php echo $t_login['password'] ?? 'Password'; ?>" required>
                    <i class="fas fa-eye password-toggle" onclick="togglePassword()"></i>
                </div>
            </div>
            
            <div class="form-group">
                <div class="input-with-icon">
                    <i class="fas fa-globe"></i>
                    <select id="language" name="language" class="form-control" required>
                        <?php 
                        // Always get fresh list of available languages to include newly added ones
                        $availableLanguages = getAvailableLanguages();
                        foreach ($availableLanguages as $langCode => $langName): 
                        ?>
                            <option value="<?php echo htmlspecialchars($langCode); ?>" <?php echo ($lang === $langCode) ? 'selected' : ''; ?>><?php echo htmlspecialchars($langName); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
            
            <div class="form-check">
                <input type="checkbox" id="remember_me" name="remember_me" class="form-check-input" <?php echo (isset($_POST['remember_me']) || isset($_COOKIE['remembered_username'])) ? 'checked' : ''; ?>>
                <label for="remember_me" class="form-check-label">
                    <?php echo $t_login['remember_me'] ?? 'Remember Me'; ?>
                </label>
            </div>
            
            <button type="submit" class="btn">
                <i class="fas fa-sign-in-alt"></i> <?php echo $t_login['login_button'] ?? 'Login'; ?>
            </button>
        </form>
        
        <div class="login-footer">
            <i class="fas fa-info-circle"></i> <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?> <?php echo $all_translations['app']['version'] ?? 'v1.0.0'; ?>
        </div>
    </div>
    
    <script src="assets/js/login.js"></script>
</body>
</html>
