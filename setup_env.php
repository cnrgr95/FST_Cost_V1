<?php
/**
 * .env Dosyası Oluşturma Yardımcı Scripti
 * Bu dosyayı tarayıcıda çalıştırarak .env dosyasını otomatik oluşturabilirsiniz
 * URL: http://localhost/FST_Cost_V1/setup_env.php
 */

// Prevent direct access security
if (!defined('APP_INIT')) {
    define('APP_INIT', true);
}

header('Content-Type: text/html; charset=utf-8');

// Güvenlik Kontrolleri
$isLocalhost = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', '[::1]']) || 
               (isset($_SERVER['REMOTE_ADDR']) && in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']));

// Production ortamında sadece localhost'tan erişilebilir
if (!$isLocalhost && file_exists(__DIR__ . '/config.php')) {
    @include_once __DIR__ . '/config.php';
    if (defined('APP_ENV') && APP_ENV === 'production') {
        http_response_code(403);
        die('Access Denied: Bu dosya production ortamında sadece localhost üzerinden erişilebilir.');
    }
}

// Session başlat (güvenlik için)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CSRF Token oluştur (form güvenliği için)
if (!isset($_SESSION['setup_csrf_token'])) {
    $_SESSION['setup_csrf_token'] = bin2hex(random_bytes(32));
}

$envFile = __DIR__ . '/.env';
$envExampleFile = __DIR__ . '/.env.example';
$envExists = file_exists($envFile);

// Database connection test fonksiyonu (dosyanın başında tanımla)
function testDatabaseConnection($host, $port, $dbname, $user, $pass) {
    if (empty($host) || empty($dbname) || empty($user)) {
        return ['success' => false, 'message' => 'Eksik bağlantı bilgileri'];
    }
    
    // pgsql extension kontrolü
    if (!function_exists('pg_connect')) {
        return ['success' => false, 'message' => 'PostgreSQL extension (pgsql) yüklü değil'];
    }
    
    try {
        $connString = "host={$host} port={$port} dbname={$dbname} user={$user} password={$pass}";
        $conn = @pg_connect($connString);
        
        if (!$conn) {
            $error = pg_last_error();
            return ['success' => false, 'message' => $error ?: 'Bağlantı kurulamadı'];
        }
        
        // Version bilgisini al
        $result = pg_query($conn, "SELECT version()");
        $version = '';
        if ($result) {
            $row = pg_fetch_row($result);
            $version = $row[0] ?? '';
            // Sadece versiyon numarasını al
            if (preg_match('/PostgreSQL (\d+\.\d+)/', $version, $matches)) {
                $version = $matches[1];
            }
        }
        
        pg_close($conn);
        
        return [
            'success' => true,
            'message' => 'Bağlantı başarılı',
            'version' => $version
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FST Cost Management - .env Setup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #151A2D;
            border-bottom: 3px solid #151A2D;
            padding-bottom: 10px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        input[type="text"],
        input[type="password"],
        select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        .btn {
            background: #151A2D;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
        }
        .btn:hover {
            background: #1f2937;
        }
        .btn-secondary {
            background: #6b7280;
        }
        .btn-secondary:hover {
            background: #4b5563;
        }
        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .alert-success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .alert-warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
        .alert-info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }
        .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .code-block {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            margin: 10px 0;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ .env Dosyası Oluşturma</h1>
        
        <?php
        if ($envExists) {
            echo '<div class="alert alert-warning">';
            echo '<strong>⚠️ Uyarı:</strong> .env dosyası zaten mevcut!';
            echo '<br>Dosyayı güncellemek istiyorsanız, önce mevcut dosyayı silin veya manuel olarak düzenleyin.';
            echo '</div>';
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // CSRF Token kontrolü
            if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['setup_csrf_token']) {
                echo '<div class="alert alert-warning">';
                echo '<strong>⚠️ Güvenlik Uyarısı:</strong> Geçersiz CSRF token. Lütfen sayfayı yenileyip tekrar deneyin.';
                echo '</div>';
            } else {
                // Validation fonksiyonları
                $errors = [];
                $data = [];
                
                // Environment validation
                $data['APP_ENV'] = trim($_POST['APP_ENV'] ?? 'development');
                if (!in_array($data['APP_ENV'], ['development', 'production', 'testing'])) {
                    $errors[] = 'Geçersiz ortam seçimi.';
                    $data['APP_ENV'] = 'development';
                }
                
                // Debug validation
                $data['APP_DEBUG'] = trim($_POST['APP_DEBUG'] ?? 'true');
                if (!in_array($data['APP_DEBUG'], ['true', 'false', '1', '0'])) {
                    $errors[] = 'Geçersiz debug modu.';
                    $data['APP_DEBUG'] = 'true';
                }
                
                // Database Host validation
                $data['DB_HOST'] = trim($_POST['DB_HOST'] ?? 'localhost');
                if (empty($data['DB_HOST'])) {
                    $errors[] = 'Veritabanı sunucusu boş olamaz.';
                } elseif (!preg_match('/^[a-zA-Z0-9._-]+$/', $data['DB_HOST']) && 
                          !filter_var($data['DB_HOST'], FILTER_VALIDATE_IP)) {
                    $errors[] = 'Geçersiz veritabanı sunucu adresi.';
                }
                
                // Database Port validation
                $data['DB_PORT'] = trim($_POST['DB_PORT'] ?? '5432');
                if (empty($data['DB_PORT']) || !is_numeric($data['DB_PORT']) || 
                    (int)$data['DB_PORT'] < 1 || (int)$data['DB_PORT'] > 65535) {
                    $errors[] = 'Geçersiz port numarası (1-65535 arası olmalı).';
                    $data['DB_PORT'] = '5432';
                }
                
                // Database Name validation
                $data['DB_NAME'] = trim($_POST['DB_NAME'] ?? 'fst_cost_db');
                if (empty($data['DB_NAME'])) {
                    $errors[] = 'Veritabanı adı boş olamaz.';
                } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $data['DB_NAME'])) {
                    $errors[] = 'Veritabanı adı sadece harf, rakam ve alt çizgi içerebilir.';
                }
                
                // Database User validation
                $data['DB_USER'] = trim($_POST['DB_USER'] ?? 'postgres');
                if (empty($data['DB_USER'])) {
                    $errors[] = 'Veritabanı kullanıcı adı boş olamaz.';
                }
                
                // Database Password (optional but recommended)
                $data['DB_PASS'] = trim($_POST['DB_PASS'] ?? '');
                if ($data['APP_ENV'] === 'production' && empty($data['DB_PASS'])) {
                    $errors[] = 'Production ortamında veritabanı şifresi zorunludur.';
                }
                
                // Session Lifetime validation
                $data['SESSION_LIFETIME'] = trim($_POST['SESSION_LIFETIME'] ?? '7200');
                if (empty($data['SESSION_LIFETIME']) || !is_numeric($data['SESSION_LIFETIME']) || 
                    (int)$data['SESSION_LIFETIME'] < 60 || (int)$data['SESSION_LIFETIME'] > 86400) {
                    $errors[] = 'Oturum süresi 60-86400 saniye arası olmalı.';
                    $data['SESSION_LIFETIME'] = '7200';
                }
                
                // Eğer hata varsa göster
                if (!empty($errors)) {
                    echo '<div class="alert alert-warning">';
                    echo '<strong>⚠️ Doğrulama Hataları:</strong><ul style="margin:10px 0; padding-left:20px;">';
                    foreach ($errors as $error) {
                        echo '<li>' . htmlspecialchars($error) . '</li>';
                    }
                    echo '</ul></div>';
                } else {
                    // .env dosyası içeriğini oluştur
                    $envContent = "# FST Cost Management System - Environment Configuration\n";
                    $envContent .= "# Generated on: " . date('Y-m-d H:i:s') . "\n";
                    $envContent .= "# Generated by: setup_env.php\n\n";
                    
                    $envContent .= "# ============================================\n";
                    $envContent .= "# Environment Settings\n";
                    $envContent .= "# ============================================\n";
                    $envContent .= "APP_ENV=" . $data['APP_ENV'] . "\n";
                    $envContent .= "APP_DEBUG=" . $data['APP_DEBUG'] . "\n\n";
                    
                    $envContent .= "# ============================================\n";
                    $envContent .= "# Database Configuration\n";
                    $envContent .= "# ============================================\n";
                    $envContent .= "DB_HOST=" . $data['DB_HOST'] . "\n";
                    $envContent .= "DB_PORT=" . $data['DB_PORT'] . "\n";
                    $envContent .= "DB_NAME=" . $data['DB_NAME'] . "\n";
                    $envContent .= "DB_USER=" . $data['DB_USER'] . "\n";
                    $envContent .= "DB_PASS=" . $data['DB_PASS'] . "\n\n";
                    
                    $envContent .= "# ============================================\n";
                    $envContent .= "# Session Configuration\n";
                    $envContent .= "# ============================================\n";
                    $envContent .= "SESSION_LIFETIME=" . $data['SESSION_LIFETIME'] . "\n";
                    
                    // Dosyayı oluştur
                    $result = @file_put_contents($envFile, $envContent);
                    
                    if ($result !== false) {
                        // İzinleri ayarla (Linux/Mac için)
                        @chmod($envFile, 0644);
                        
                        // Veritabanı bağlantısını test et
                        $dbTestResult = testDatabaseConnection(
                            $data['DB_HOST'],
                            $data['DB_PORT'],
                            $data['DB_NAME'],
                            $data['DB_USER'],
                            $data['DB_PASS']
                        );
                        
                        echo '<div class="alert alert-success">';
                        echo '<strong>✅ Başarılı!</strong> .env dosyası oluşturuldu.';
                        echo '<br>Dosya konumu: <code>' . htmlspecialchars($envFile) . '</code>';
                        echo '<br>Dosya boyutu: ' . number_format($result) . ' bytes';
                        echo '</div>';
                        
                        // Database connection test sonucu
                        if ($dbTestResult['success']) {
                            echo '<div class="alert alert-success">';
                            echo '<strong>✅ Veritabanı Bağlantısı Başarılı!</strong>';
                            echo '<br>PostgreSQL versiyonu: ' . htmlspecialchars($dbTestResult['version'] ?? 'Unknown');
                            echo '</div>';
                        } else {
                            echo '<div class="alert alert-warning">';
                            echo '<strong>⚠️ Veritabanı Bağlantı Uyarısı:</strong>';
                            echo '<br>' . htmlspecialchars($dbTestResult['message'] ?? 'Bağlantı test edilemedi.');
                            echo '<br><small>Lütfen veritabanı bilgilerinizi kontrol edin.</small>';
                            echo '</div>';
                        }
                        
                        echo '<div class="alert alert-info">';
                        echo '<strong>📝 Sonraki Adımlar:</strong><ul style="margin:10px 0; padding-left:20px;">';
                        echo '<li><a href="check_requirements.php" target="_blank">Sistem gereksinimlerini kontrol edin</a></li>';
                        echo '<li>Veritabanını oluşturun veya restore edin</li>';
                        echo '<li><a href="login.php" target="_blank">Giriş sayfasına gidin</a></li>';
                        if ($data['APP_ENV'] === 'production') {
                            echo '<li><strong>Production:</strong> Bu setup scriptini silin veya koruma altına alın</li>';
                        }
                        echo '</ul></div>';
                        
                        echo '<p>';
                        echo '<a href="check_requirements.php" class="btn">Sistem Gereksinimlerini Kontrol Et</a> ';
                        echo '<a href="login.php" class="btn btn-secondary">Giriş Sayfasına Git</a>';
                        echo '</p>';
                        
                        // CSRF token'ı yenile
                        $_SESSION['setup_csrf_token'] = bin2hex(random_bytes(32));
                    } else {
                        $error = error_get_last();
                        echo '<div class="alert alert-warning">';
                        echo '<strong>❌ Hata:</strong> .env dosyası oluşturulamadı.';
                        echo '<br>Lütfen klasör yazma izinlerini kontrol edin.';
                        if ($error) {
                            echo '<br><small>PHP Hatası: ' . htmlspecialchars($error['message']) . '</small>';
                        }
                        echo '</div>';
                        
                        // İzin kontrolü
                        $dirWritable = is_writable(__DIR__);
                        echo '<div class="alert ' . ($dirWritable ? 'alert-success' : 'alert-warning') . '">';
                        echo '<strong>Klasör İzinleri:</strong> ';
                        echo $dirWritable ? '✅ Klasör yazılabilir' : '❌ Klasör yazılamaz';
                        echo '<br>Klasör: <code>' . htmlspecialchars(__DIR__) . '</code>';
                        if (!$dirWritable) {
                            echo '<br><small>Linux/Mac: <code>chmod 755 ' . htmlspecialchars(__DIR__) . '</code></small>';
                        }
                        echo '</div>';
                        
                        echo '<div class="code-block">';
                        echo "<strong>Manuel Oluşturma:</strong><br>";
                        echo "1. Proje kök dizininde '.env' dosyası oluşturun<br>";
                        echo "2. Aşağıdaki içeriği dosyaya kopyalayın:<br><br>";
                        echo '<textarea readonly style="width:100%; height:200px; font-family:monospace; font-size:12px;">';
                        echo htmlspecialchars($envContent);
                        echo '</textarea>';
                        echo '</div>';
                    }
                }
            }
        } elseif (isset($_POST['test_db']) && $_POST['test_db'] === '1') {
            // Database connection test (AJAX request)
            $testResult = testDatabaseConnection(
                $_POST['host'] ?? '',
                $_POST['port'] ?? '5432',
                $_POST['dbname'] ?? '',
                $_POST['user'] ?? '',
                $_POST['pass'] ?? ''
            );
            
            echo '<div id="db-test-result">';
            if ($testResult['success']) {
                echo '<div class="alert alert-success">';
                echo '<strong>✅ Bağlantı Başarılı!</strong><br>';
                echo 'PostgreSQL: ' . htmlspecialchars($testResult['version'] ?? 'Connected');
                echo '</div>';
            } else {
                echo '<div class="alert alert-warning">';
                echo '<strong>❌ Bağlantı Hatası:</strong><br>';
                echo htmlspecialchars($testResult['message'] ?? 'Bilinmeyen hata');
                echo '</div>';
            }
            echo '</div>';
            exit;
        } else {
            // Form göster
            $currentEnv = [];
            if (file_exists($envFile)) {
                $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    if (strpos(trim($line), '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        list($key, $value) = explode('=', $line, 2);
                        $currentEnv[trim($key)] = trim($value);
                    }
                }
            }
            
            // config.php'den varsayılan değerleri oku (eğer varsa)
            $defaults = [
                'APP_ENV' => 'development',
                'APP_DEBUG' => 'true',
                'DB_HOST' => 'localhost',
                'DB_PORT' => '5432',
                'DB_NAME' => 'fst_cost_db',
                'DB_USER' => 'postgres',
                'DB_PASS' => '',
                'SESSION_LIFETIME' => '7200'
            ];
            
            // config.php'den mevcut değerleri oku (eğer tanımlıysa)
            if (file_exists(__DIR__ . '/config.php')) {
                // Define guard'ları
                if (!defined('BASE_PATH')) {
                    define('BASE_PATH', __DIR__ . DIRECTORY_SEPARATOR);
                }
                if (!defined('APP_INIT')) {
                    define('APP_INIT', true);
                }
                if (!defined('API_REQUEST')) {
                    define('API_REQUEST', true); // Prevent session issues
                }
                
                // Try to read from config.php (without full execution)
                $configContent = @file_get_contents(__DIR__ . '/config.php');
                if ($configContent) {
                    // Extract DB values using regex (safe method)
                    if (preg_match("/define\s*\(\s*['\"]DB_HOST['\"]\s*,\s*['\"]([^'\"]+)['\"]/", $configContent, $matches)) {
                        $defaults['DB_HOST'] = $matches[1];
                    }
                    if (preg_match("/define\s*\(\s*['\"]DB_PORT['\"]\s*,\s*['\"]([^'\"]+)['\"]/", $configContent, $matches)) {
                        $defaults['DB_PORT'] = $matches[1];
                    }
                    if (preg_match("/define\s*\(\s*['\"]DB_NAME['\"]\s*,\s*['\"]([^'\"]+)['\"]/", $configContent, $matches)) {
                        $defaults['DB_NAME'] = $matches[1];
                    }
                    if (preg_match("/define\s*\(\s*['\"]DB_USER['\"]\s*,\s*['\"]([^'\"]+)['\"]/", $configContent, $matches)) {
                        $defaults['DB_USER'] = $matches[1];
                    }
                }
            }
            
            // Mevcut değerleri veya varsayılanları kullan
            foreach ($defaults as $key => $default) {
                if (!isset($currentEnv[$key])) {
                    $currentEnv[$key] = $default;
                }
            }
            
            if (empty($currentEnv['DB_PASS'])) {
                $currentEnv['DB_PASS'] = ''; // Boş bırak, kullanıcı girecek
            }
        ?>
        
        <div class="alert alert-info">
            <strong>ℹ️ Bilgi:</strong> Bu form ile .env dosyasını otomatik oluşturabilirsiniz.
            <br>Alternatif olarak <code>.env.example</code> dosyasını kopyalayıp <code>.env</code> olarak kaydedebilirsiniz.
        </div>
        
        <form method="POST" action="" id="envForm" onsubmit="return validateForm()">
            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['setup_csrf_token']); ?>">
            <div class="form-group">
                <label for="APP_ENV">Ortam (Environment):</label>
                <select name="APP_ENV" id="APP_ENV" required>
                    <option value="development" <?php echo ($currentEnv['APP_ENV'] ?? '') === 'development' ? 'selected' : ''; ?>>Development</option>
                    <option value="production" <?php echo ($currentEnv['APP_ENV'] ?? '') === 'production' ? 'selected' : ''; ?>>Production</option>
                    <option value="testing" <?php echo ($currentEnv['APP_ENV'] ?? '') === 'testing' ? 'selected' : ''; ?>>Testing</option>
                </select>
                <div class="help-text">Production için: production seçin</div>
            </div>
            
            <div class="form-group">
                <label for="APP_DEBUG">Debug Modu:</label>
                <select name="APP_DEBUG" id="APP_DEBUG" required onchange="updateDebugWarning()">
                    <option value="true" <?php echo ($currentEnv['APP_DEBUG'] ?? '') === 'true' ? 'selected' : ''; ?>>Aktif (Development)</option>
                    <option value="false" <?php echo ($currentEnv['APP_DEBUG'] ?? '') === 'false' ? 'selected' : ''; ?>>Pasif (Production)</option>
                </select>
                <div class="help-text" id="debugHelp">Production için mutlaka false seçin</div>
            </div>
            
            <script>
            function updateDebugWarning() {
                const appEnv = document.getElementById('APP_ENV').value;
                const appDebug = document.getElementById('APP_DEBUG').value;
                const debugHelp = document.getElementById('debugHelp');
                
                if (appEnv === 'production' && appDebug === 'true') {
                    debugHelp.innerHTML = '<strong style="color: red;">⚠️ UYARI: Production ortamında debug modu KAPALI olmalı!</strong>';
                } else if (appEnv === 'production') {
                    debugHelp.innerHTML = '✅ Production için doğru ayar';
                } else {
                    debugHelp.innerHTML = 'Development için debug modu aktif olabilir';
                }
            }
            
            // Ortam değiştiğinde debug modunu otomatik güncelle
            document.getElementById('APP_ENV').addEventListener('change', function() {
                const appEnv = this.value;
                const appDebug = document.getElementById('APP_DEBUG');
                
                if (appEnv === 'production') {
                    appDebug.value = 'false';
                    updateDebugWarning();
                } else if (appEnv === 'development') {
                    appDebug.value = 'true';
                    updateDebugWarning();
                }
            });
            
            // Sayfa yüklendiğinde kontrol et
            document.addEventListener('DOMContentLoaded', function() {
                updateDebugWarning();
            });
            </script>
            
            <h3>Veritabanı Ayarları</h3>
            
            <div class="form-group">
                <label for="DB_HOST">Veritabanı Sunucusu (DB_HOST):</label>
                <input type="text" name="DB_HOST" id="DB_HOST" value="<?php echo htmlspecialchars($currentEnv['DB_HOST'] ?? 'localhost'); ?>" required>
                <div class="help-text">Genellikle: localhost</div>
            </div>
            
            <div class="form-group">
                <label for="DB_PORT">Port (DB_PORT):</label>
                <input type="text" name="DB_PORT" id="DB_PORT" value="<?php echo htmlspecialchars($currentEnv['DB_PORT'] ?? '5432'); ?>" required>
                <div class="help-text">PostgreSQL varsayılan port: 5432</div>
            </div>
            
            <div class="form-group">
                <label for="DB_NAME">Veritabanı Adı (DB_NAME):</label>
                <input type="text" name="DB_NAME" id="DB_NAME" value="<?php echo htmlspecialchars($currentEnv['DB_NAME'] ?? 'fst_cost_db'); ?>" required>
                <div class="help-text">Veritabanınızın adı</div>
            </div>
            
            <div class="form-group">
                <label for="DB_USER">Kullanıcı Adı (DB_USER):</label>
                <input type="text" name="DB_USER" id="DB_USER" value="<?php echo htmlspecialchars($currentEnv['DB_USER'] ?? 'postgres'); ?>" required>
                <div class="help-text">PostgreSQL kullanıcı adı</div>
            </div>
            
            <div class="form-group">
                <label for="DB_PASS">Şifre (DB_PASS):</label>
                <div style="position: relative;">
                    <input type="password" name="DB_PASS" id="DB_PASS" value="<?php echo htmlspecialchars($currentEnv['DB_PASS'] ?? ''); ?>" 
                           <?php echo ($data['APP_ENV'] ?? $currentEnv['APP_ENV'] ?? 'development') === 'production' ? 'required' : ''; ?>
                           style="padding-right: 40px;">
                    <button type="button" onclick="togglePassword()" 
                            style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 5px;">
                        <span id="toggleIcon">👁️</span>
                    </button>
                </div>
                <div class="help-text">
                    PostgreSQL şifresi 
                    <?php if (($data['APP_ENV'] ?? $currentEnv['APP_ENV'] ?? 'development') === 'production'): ?>
                        <strong style="color: red;">(Production'da zorunlu)</strong>
                    <?php else: ?>
                        (Development için opsiyonel)
                    <?php endif; ?>
                </div>
            </div>
            
            <h3>Oturum Ayarları</h3>
            
            <div class="form-group">
                <label for="SESSION_LIFETIME">Oturum Süresi (saniye):</label>
                <input type="text" name="SESSION_LIFETIME" id="SESSION_LIFETIME" value="<?php echo htmlspecialchars($currentEnv['SESSION_LIFETIME'] ?? '7200'); ?>" required>
                <div class="help-text">Varsayılan: 7200 (2 saat). Minimum: 60, Maksimum: 86400 (24 saat)</div>
            </div>
            
            <div style="margin-top: 30px;">
                <button type="submit" class="btn" id="submitBtn">.env Dosyası Oluştur</button>
                <button type="button" class="btn btn-secondary" onclick="testConnection()" id="testBtn">Veritabanı Bağlantısını Test Et</button>
                <a href="check_requirements.php" class="btn btn-secondary">İptal</a>
            </div>
            
            <div id="testResult" style="margin-top: 15px;"></div>
        </form>
        
        <script>
        // Form validation
        function validateForm() {
            const dbName = document.getElementById('DB_NAME').value.trim();
            const dbUser = document.getElementById('DB_USER').value.trim();
            const dbPass = document.getElementById('DB_PASS').value.trim();
            const appEnv = document.getElementById('APP_ENV').value;
            
            // Database name validation
            if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
                alert('Veritabanı adı sadece harf, rakam ve alt çizgi içerebilir.');
                document.getElementById('DB_NAME').focus();
                return false;
            }
            
            // Production'da şifre zorunlu
            if (appEnv === 'production' && !dbPass) {
                if (!confirm('Production ortamında veritabanı şifresi zorunludur. Devam etmek istiyor musunuz?')) {
                    document.getElementById('DB_PASS').focus();
                    return false;
                }
            }
            
            return true;
        }
        
        // Toggle password visibility
        function togglePassword() {
            const passInput = document.getElementById('DB_PASS');
            const toggleIcon = document.getElementById('toggleIcon');
            if (passInput.type === 'password') {
                passInput.type = 'text';
                toggleIcon.textContent = '🙈';
            } else {
                passInput.type = 'password';
                toggleIcon.textContent = '👁️';
            }
        }
        
        // Database connection test
        function testConnection() {
            const btn = document.getElementById('testBtn');
            const resultDiv = document.getElementById('testResult');
            
            btn.disabled = true;
            btn.textContent = 'Test ediliyor...';
            resultDiv.innerHTML = '<div class="alert alert-info">Bağlantı test ediliyor...</div>';
            
            const formData = new FormData();
            formData.append('test_db', '1');
            formData.append('host', document.getElementById('DB_HOST').value);
            formData.append('port', document.getElementById('DB_PORT').value);
            formData.append('dbname', document.getElementById('DB_NAME').value);
            formData.append('user', document.getElementById('DB_USER').value);
            formData.append('pass', document.getElementById('DB_PASS').value);
            
            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(text => {
                // JSON response'u parse et
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const testDiv = doc.querySelector('#db-test-result');
                    if (testDiv) {
                        resultDiv.innerHTML = testDiv.innerHTML;
                    } else {
                        resultDiv.innerHTML = '<div class="alert alert-warning">Test sonucu alınamadı. Lütfen formu gönderip kontrol edin.</div>';
                    }
                } catch (e) {
                    resultDiv.innerHTML = '<div class="alert alert-warning">Test sonucu parse edilemedi.</div>';
                }
                btn.disabled = false;
                btn.textContent = 'Veritabanı Bağlantısını Test Et';
            })
            .catch(error => {
                resultDiv.innerHTML = '<div class="alert alert-warning">Test hatası: ' + error + '</div>';
                btn.disabled = false;
                btn.textContent = 'Veritabanı Bağlantısını Test Et';
            });
        }
        </script>
        
        <hr style="margin: 30px 0;">
        
        <h3>📝 Manuel Oluşturma</h3>
        <p>Alternatif olarak, <code>.env.example</code> dosyasını kopyalayıp <code>.env</code> olarak kaydedebilirsiniz:</p>
        
        <div class="code-block">
            <strong>Windows PowerShell:</strong><br>
            Copy-Item .env.example .env<br><br>
            
            <strong>Linux/Mac:</strong><br>
            cp .env.example .env<br><br>
            
            <strong>Veya manuel olarak:</strong><br>
            1. .env.example dosyasını açın<br>
            2. İçeriği kopyalayın<br>
            3. .env adıyla yeni dosya oluşturun<br>
            4. Değerleri düzenleyin
        </div>
        
        <?php
        }
        ?>
        
        <div class="alert alert-warning" style="margin-top: 30px;">
            <strong>🔒 Güvenlik Uyarısı:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>.env dosyası hassas bilgiler içerir</li>
                <li>Production ortamında mutlaka .htaccess ile korunmalı</li>
                <li>.env dosyasını asla git'e commit etmeyin</li>
                <li>Bu setup scriptini production'da kullanmayın</li>
            </ul>
        </div>
    </div>
</body>
</html>

