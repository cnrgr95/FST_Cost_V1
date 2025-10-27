<?php
/**
 * Login Page
 */

// Initialize secure session
require_once __DIR__ . '/config.php';
initSecureSession();

// Redirect to dashboard if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

// Simple language handling
$lang = $_GET['lang'] ?? $_SESSION['language'] ?? 'en';
$_SESSION['language'] = $lang;

// Load translations
require_once __DIR__ . '/includes/translations.php';
$t_login = $all_translations['login'] ?? [];
$t_languages = $all_translations['languages'] ?? [];
$t_common = $all_translations['common'] ?? [];
$app_name = $all_translations['app']['name'] ?? 'FST Cost Management';

// Handle login form
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF protection
    if (!isset($_POST[CSRF_TOKEN_NAME]) || !validateCsrfToken($_POST[CSRF_TOKEN_NAME])) {
        $error = $t_login['security_token_failed'] ?? 'Security token validation failed. Please try again.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');
        
        // Rate limiting check
        if (!checkRateLimit('login', 5, 300)) { // 5 attempts per 5 minutes
            $error = $t_login['too_many_attempts'] ?? 'Too many login attempts. Please try again later.';
        } elseif (empty($username) || empty($password)) {
            $error = $t_common['required_field'] ?? 'Please fill in all fields';
        } else {
            // Simple authentication (for testing)
            // TODO: Replace with database-based authentication
            if ($username === 'admin' && $password === 'admin') {
                // Regenerate session ID to prevent session fixation
                session_regenerate_id(true);
                
                $_SESSION['user_id'] = 1;
                $_SESSION['username'] = $username;
                $_SESSION['last_activity'] = time();
                $_SESSION['created'] = time();
                
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
                
                header('Location: dashboard.php');
                exit;
            } else {
                $error = $t_login['invalid_credentials'] ?? 'Invalid username or password';
                // Log failed login attempt
                logError("Failed login attempt for username: $username", __FILE__, __LINE__);
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
        
        <form method="POST" action="login.php">
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
                        <option value="en" <?php echo ($lang === 'en') ? 'selected' : ''; ?>><?php echo $t_languages['en'] ?? 'English'; ?></option>
                        <option value="tr" <?php echo ($lang === 'tr') ? 'selected' : ''; ?>><?php echo $t_languages['tr'] ?? 'Türkçe'; ?></option>
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
        
        <div style="text-align: center; margin-top: 1rem; font-size: 12px; color: #666;">
            <i class="fas fa-info-circle"></i> FST Cost Management v1.0.0
        </div>
    </div>
    
    <script>
        // Pass current language to JavaScript
        const currentLang = '<?php echo $lang; ?>';
    </script>
    <script src="assets/js/login.js"></script>
</body>
</html>
