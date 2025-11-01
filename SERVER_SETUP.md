# 🌐 Sunucu Yapılandırma Rehberi

Bu doküman, FST Cost Management sisteminin doğru çalışması için gerekli tüm sunucu ayarlarını içerir.

## 📋 Gereksinimler Kontrol Listesi

### ✅ PHP Gereksinimleri

**Minimum PHP Versiyonu:** PHP 7.4+  
**Önerilen:** PHP 8.0, 8.1, 8.2, 8.3, 8.4+

**Gerekli PHP Extension'ları:**

```ini
; php.ini dosyasında aktif olmalı
extension=pgsql          ; PostgreSQL veritabanı bağlantısı için
extension=pdo_pgsql      ; PDO PostgreSQL desteği
extension=mbstring       ; UTF-8 karakter desteği (Türkçe karakterler için kritik)
extension=curl           ; Dış API çağrıları için (çeviri servisleri)
extension=json           ; JSON işlemleri için
extension=openssl        ; Güvenli bağlantılar için
extension=fileinfo       ; Dosya upload kontrolü için
extension=zip            ; Excel dosya işlemleri için (PhpSpreadsheet)
```

**Kontrol Komutu:**
```bash
php -m | grep -E "pgsql|mbstring|curl|json|openssl|fileinfo|zip"
```

**Windows PowerShell:**
```powershell
php -m | Select-String -Pattern "pgsql|mbstring|curl|json|openssl|fileinfo|zip"
```

### ✅ PostgreSQL Gereksinimleri

**Minimum Versiyon:** PostgreSQL 12+  
**Önerilen:** PostgreSQL 14+

**PostgreSQL Extension'ları:**
```sql
-- Veritabanında gerekli extension'lar (otomatik yüklenir)
-- PostgreSQL'in kendi extension'ları yeterlidir
```

### ✅ Composer Gereksinimleri

**Composer Versiyon:** 2.0+ önerilir

**Kurulum Kontrolü:**
```bash
composer --version
```

**Bağımlılık Kurulumu:**
```bash
# Proje dizininde
composer install --optimize-autoloader --no-dev
```

**Windows için:**
```powershell
# PowerShell'de
.\scripts\install_dependencies.ps1

# Veya Command Prompt'ta
.\scripts\install_dependencies.bat
```

## 🔧 Yapılandırma Dosyaları

### 1. `.env` Dosyası Oluşturun (Önerilen)

Proje kök dizininde `.env` dosyası oluşturun:

```env
# Environment
APP_ENV=development
# APP_ENV=production  # Production için

# Debug Mode
APP_DEBUG=true
# APP_DEBUG=false  # Production için

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fst_cost_db
DB_USER=postgres
DB_PASS=your_password_here

# Session Configuration
SESSION_LIFETIME=7200
```

**⚠️ ÖNEMLİ:**
- Production ortamında `.env` dosyasını `.gitignore`'a ekleyin
- `.env` dosyası asla git'e commit edilmemeli
- Her ortam için farklı `.env` dosyası kullanın

### 2. `php.ini` Ayarları

Sunucunuzun `php.ini` dosyasında şu ayarları kontrol edin:

```ini
; Memory Limit (Excel dosyaları için yeterli olmalı)
memory_limit = 256M
; memory_limit = 512M  # Büyük Excel dosyaları için önerilir

; Upload Limits
upload_max_filesize = 10M
post_max_size = 10M

; Session Settings
session.save_handler = files
session.save_path = "/tmp"  # Linux için, Windows için varsayılan kullanılır
session.gc_maxlifetime = 7200
session.cookie_lifetime = 0

; Timezone
date.timezone = Europe/Istanbul

; Error Reporting (Development)
display_errors = On
display_startup_errors = On
error_reporting = E_ALL

; Error Reporting (Production)
; display_errors = Off
; display_startup_errors = Off
; error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
; log_errors = On
```

### 3. `.htaccess` Yapılandırması (Apache)

Proje kök dizininde `.htaccess` dosyası mevcut ve şu ayarları içermeli:

```apache
# UTF-8 Encoding
AddDefaultCharset UTF-8

# Error Handling
php_flag display_errors Off
php_flag log_errors On

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# File Upload Size (eğer php.ini yeterli değilse)
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value memory_limit 256M
```

**Apache Modül Kontrolü:**
```bash
# Linux'ta
apache2ctl -M | grep rewrite
# mod_rewrite aktif olmalı

# Windows'ta (Laragon)
# Laragon otomatik olarak mod_rewrite'ı aktif eder
```

### 4. Nginx Yapılandırması

Nginx kullanıyorsanız:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/FST_Cost_V1;
    index index.php;

    # UTF-8 Encoding
    charset utf-8;

    # Logs
    access_log /var/log/nginx/fst_cost_access.log;
    error_log /var/log/nginx/fst_cost_error.log;

    # File Upload Size
    client_max_body_size 10M;

    # Main Location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP Handler
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;  # PHP versiyonunuza göre
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        # PHP Settings
        fastcgi_read_timeout 300;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
    }

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Deny access to sensitive files
    location ~ ^/(vendor|\.env|composer\.(json|lock)|\.git) {
        deny all;
    }
}
```

## 📁 Klasör İzinleri (Linux/Mac)

```bash
# Klasörleri oluşturun (yoksa)
mkdir -p uploads logs

# İzinleri ayarlayın
chmod 755 uploads/
chmod 755 logs/
chmod 755 translations/
chmod 644 translations/*.json

# PHP'nin yazabilmesi için (Apache/Nginx kullanıcısı)
# Apache genelde 'www-data' veya 'apache' kullanır
# Nginx genelde 'www-data' veya 'nginx' kullanır
chown -R www-data:www-data uploads/ logs/
chmod -R 775 uploads/ logs/
```

**Windows için:**
- Laragon/XAMPP otomatik olarak izinleri yönetir
- Manuel müdahale genelde gerekmez

## 🔐 Güvenlik Ayarları

### Production Ortamı İçin:

1. **`.env` dosyasını koruyun:**
```apache
# .htaccess'e ekleyin
<Files ".env">
    Order allow,deny
    Deny from all
</Files>
```

2. **Sensitive dosyaları koruyun:**
```apache
# .htaccess'e ekleyin
<FilesMatch "^(composer\.(json|lock)|\.git|\.env)">
    Order allow,deny
    Deny from all
</FilesMatch>
```

3. **PHP error display'i kapatın:**
```ini
# php.ini veya .htaccess
display_errors = Off
log_errors = On
```

## 🔍 Kontrol Scriptleri

### PHP Extension Kontrolü

`check_requirements.php` dosyası oluşturun:

```php
<?php
/**
 * System Requirements Checker
 * Bu dosyayı browser'da çalıştırarak gereksinimleri kontrol edin
 */

echo "<h1>FST Cost Management - System Requirements Check</h1>";

$requirements = [
    'PHP Version >= 7.4' => version_compare(PHP_VERSION, '7.4.0', '>='),
    'PostgreSQL Extension (pgsql)' => extension_loaded('pgsql'),
    'PDO PostgreSQL Extension' => extension_loaded('pdo_pgsql'),
    'mbstring Extension' => extension_loaded('mbstring'),
    'curl Extension' => extension_loaded('curl'),
    'json Extension' => extension_loaded('json'),
    'openssl Extension' => extension_loaded('openssl'),
    'fileinfo Extension' => extension_loaded('fileinfo'),
    'zip Extension' => extension_loaded('zip'),
    'Composer Autoload' => file_exists(__DIR__ . '/vendor/autoload.php'),
    'Translations Directory' => is_dir(__DIR__ . '/translations'),
    'Uploads Directory (writable)' => is_writable(__DIR__ . '/uploads'),
    'Logs Directory (writable)' => is_writable(__DIR__ . '/logs'),
];

echo "<table border='1' cellpadding='10'>";
echo "<tr><th>Requirement</th><th>Status</th></tr>";

$allPassed = true;
foreach ($requirements as $requirement => $status) {
    $statusText = $status ? '✅ PASS' : '❌ FAIL';
    $color = $status ? 'green' : 'red';
    echo "<tr><td>{$requirement}</td><td style='color:{$color}'><strong>{$statusText}</strong></td></tr>";
    if (!$status) $allPassed = false;
}

echo "</table>";

if ($allPassed) {
    echo "<h2 style='color:green'>✅ All requirements met!</h2>";
} else {
    echo "<h2 style='color:red'>❌ Some requirements are missing. Please install them.</h2>";
}

echo "<hr>";
echo "<h3>PHP Info:</h3>";
echo "PHP Version: " . PHP_VERSION . "<br>";
echo "PHP SAPI: " . php_sapi_name() . "<br>";
echo "Memory Limit: " . ini_get('memory_limit') . "<br>";
echo "Upload Max Size: " . ini_get('upload_max_filesize') . "<br>";
echo "Post Max Size: " . ini_get('post_max_size') . "<br>";
?>
```

## 🚀 Hızlı Kurulum Kontrol Listesi

- [ ] PHP 7.4+ yüklü ve çalışıyor
- [ ] PostgreSQL extension'ları aktif (`pgsql`, `pdo_pgsql`)
- [ ] Gerekli PHP extension'ları aktif (mbstring, curl, json, openssl, fileinfo, zip)
- [ ] Composer yüklü (`composer --version`)
- [ ] Composer dependencies yüklendi (`vendor/` klasörü mevcut)
- [ ] `.env` dosyası oluşturuldu ve yapılandırıldı
- [ ] PostgreSQL veritabanı oluşturuldu ve bağlantı test edildi
- [ ] `uploads/` klasörü yazılabilir
- [ ] `logs/` klasörü yazılabilir
- [ ] `translations/` klasörü mevcut ve dosyalar okunabilir
- [ ] Apache `mod_rewrite` aktif (veya Nginx yapılandırıldı)
- [ ] `.htaccess` dosyası mevcut ve çalışıyor
- [ ] PHP error logging aktif ve çalışıyor

## 🐛 Sorun Giderme

### "Class not found" Hatası
```bash
# Composer autoload'u yeniden oluşturun
composer dump-autoload --optimize
```

### PostgreSQL Bağlantı Hatası
- PostgreSQL servisinin çalıştığından emin olun
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` değerlerini kontrol edin
- PostgreSQL'de kullanıcının bağlantı izninin olduğundan emin olun

### Session Hatası
- `logs/` klasörünün yazılabilir olduğundan emin olun
- `session.save_path` ayarını kontrol edin
- PHP'nin session dosyalarını oluşturabileceği bir dizin olmalı

### Upload Hatası
- `php.ini`'de `upload_max_filesize` ve `post_max_size` yeterli olmalı
- `uploads/` klasörü yazılabilir olmalı
- Web sunucusu kullanıcısının (www-data, apache, nginx) yazma izni olmalı

## 📞 Ek Yardım

Tüm yapılandırma dosyaları projeye dahildir. Sorun yaşarsanız:
1. `check_requirements.php` dosyasını çalıştırın
2. PHP error log'larını kontrol edin
3. Database connection log'larını kontrol edin
4. Browser console'daki JavaScript hatalarını kontrol edin

