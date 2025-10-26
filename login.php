<?php
/**
 * Login Page
 */

session_start();

// Redirect to dashboard if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

// Simple language handling
$lang = $_GET['lang'] ?? $_SESSION['language'] ?? 'en';
$_SESSION['language'] = $lang;

// Simple translations
$translations = [
    'en' => [
        'title' => 'Login',
        'username' => 'Username',
        'password' => 'Password',
        'language' => 'Language',
        'remember_me' => 'Remember Me',
        'login_button' => 'Login',
        'welcome' => 'Welcome',
        'app_name' => 'FST Cost Management',
        'invalid_credentials' => 'Invalid username or password',
        'please_fill_all' => 'Please fill in all fields'
    ],
    'tr' => [
        'title' => 'Giriş',
        'username' => 'Kullanıcı Adı',
        'password' => 'Şifre',
        'language' => 'Dil',
        'remember_me' => 'Beni Hatırla',
        'login_button' => 'Giriş',
        'welcome' => 'Hoşgeldiniz',
        'app_name' => 'FST Maliyet Yönetimi',
        'invalid_credentials' => 'Geçersiz kullanıcı adı veya şifre',
        'please_fill_all' => 'Lütfen tüm alanları doldurun'
    ]
];

$t = $translations[$lang] ?? $translations['en'];

// Handle login form
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    
    if (empty($username) || empty($password)) {
        $error = $t['please_fill_all'];
    } else {
        // Simple authentication (for testing)
        if ($username === 'admin' && $password === 'admin') {
            $_SESSION['user_id'] = 1;
            $_SESSION['username'] = $username;
            
            // Handle remember me
            if (isset($_POST['remember_me']) && $_POST['remember_me'] === 'on') {
                setcookie('remembered_username', $username, time() + (30 * 24 * 60 * 60), '/');
            } else {
                setcookie('remembered_username', '', time() - 3600, '/');
            }
            
            header('Location: dashboard.php');
            exit;
        } else {
            $error = $t['invalid_credentials'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t['title']; ?> - FST Cost Management</title>
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
            <p><?php echo $t['app_name']; ?></p>
        </div>
        
        <?php if ($error): ?>
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i> <?php echo $error; ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="login.php">
            <div class="form-group">
                <div class="input-with-icon">
                    <i class="fas fa-user"></i>
                    <input type="text" id="username" name="username" class="form-control" placeholder="<?php echo $t['username']; ?>" value="<?php echo isset($_COOKIE['remembered_username']) ? htmlspecialchars($_COOKIE['remembered_username']) : ''; ?>" required>
                </div>
            </div>
            
            <div class="form-group">
                <div class="input-with-icon">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="password" name="password" class="form-control" placeholder="<?php echo $t['password']; ?>" required>
                    <i class="fas fa-eye password-toggle" onclick="togglePassword()"></i>
                </div>
            </div>
            
            <div class="form-group">
                <div class="input-with-icon">
                    <i class="fas fa-globe"></i>
                    <select id="language" name="language" class="form-control" required>
                        <option value="en" <?php echo ($lang === 'en') ? 'selected' : ''; ?>>English</option>
                        <option value="tr" <?php echo ($lang === 'tr') ? 'selected' : ''; ?>>Türkçe</option>
                    </select>
                </div>
            </div>
            
            <div class="form-check">
                <input type="checkbox" id="remember_me" name="remember_me" class="form-check-input" <?php echo (isset($_POST['remember_me']) || isset($_COOKIE['remembered_username'])) ? 'checked' : ''; ?>>
                <label for="remember_me" class="form-check-label">
                    <?php echo $t['remember_me']; ?>
                </label>
            </div>
            
            <button type="submit" class="btn">
                <i class="fas fa-sign-in-alt"></i> <?php echo $t['login_button']; ?>
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
