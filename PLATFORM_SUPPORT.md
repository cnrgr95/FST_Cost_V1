# Platform Desteği ve Uyumluluk

## PHP Sürüm Desteği

Bu proje aşağıdaki PHP sürümlerini destekler:

### ✅ Desteklenen Sürümler

- **PHP 7.4** (minimum gereksinim)
- **PHP 8.0** (tam destek)
- **PHP 8.1** (tam destek)
- **PHP 8.2** (tam destek)
- **PHP 8.3** (tam destek)
- **PHP 8.4+** (tam destek - gelecek sürümler)

### Test Edilen Ortamlar

- ✅ Windows 10/11 + Laragon (PHP 8.4.13)
- ✅ Windows 10/11 + Laragon (PHP 8.2, 8.3)
- ✅ Windows + XAMPP (PHP 8.x)
- ✅ Linux (Ubuntu 20.04+) + PHP 8.x
- ✅ macOS (12+) + PHP 8.x

## Kurulum Scriptleri

### Windows (PowerShell)
```powershell
.\scripts\install_dependencies.ps1
```

**Özellikler:**
- Otomatik PHP bulma (Laragon, XAMPP, PATH)
- Tüm PHP 8.x sürümlerini tarar
- PHP versiyon kontrolü yapar
- Otomatik composer.phar indirme

### Windows (Batch)
```cmd
.\scripts\install_dependencies.bat
```

**Özellikler:**
- Otomatik PHP bulma
- Tüm PHP 8.x sürümlerini destekler
- Basit ve hızlı

### Linux/macOS
```bash
composer install
# veya
php composer.phar install
```

## Bağımlılıklar

Tüm platformlarda aynı bağımlılıklar kullanılır:

- `ezyang/htmlpurifier: ^4.19`
- `phpoffice/phpspreadsheet: ^1.29`
- `psr/simple-cache: ^3.0`
- `composer/pcre: ^3.3`

## Platform Kontrolü

Scriptler otomatik olarak:
1. PHP versiyonunu kontrol eder
2. Minimum gereksinimleri doğrular (PHP 7.4+)
3. Composer.phar'ı indirir (yoksa)
4. Bağımlılıkları yükler

## Sorun Giderme

### PHP Bulunamıyor

**Windows:**
- Laragon kullanıyorsanız: Script otomatik bulur
- XAMPP kullanıyorsanız: `C:\xampp\php\php.exe` kontrol edilir
- Standalone PHP: PATH'e ekleyin veya script'i manuel düzenleyin

**Linux/macOS:**
- PHP'nin PATH'te olduğundan emin olun
- `which php` komutu ile kontrol edin

### Composer Hataları

Eğer composer install hata verirse:
1. PHP versiyonunu kontrol edin: `php -v`
2. Composer.phar'ı yeniden indirin
3. Vendor klasörünü silin ve yeniden yükleyin

### Platform Check Hatası

composer.json'da `"platform-check": false` ayarı var, bu yüzden platform kontrolü devre dışı.
Tüm PHP 7.4+ ve 8.x sürümleri çalışır.

## Geliştirme Notları

- Vendor klasörü git'e commit edilmelidir (platform uyumluluğu için)
- Composer.lock dosyası tüm platformlarda aynı paket versiyonlarını garanti eder
- Platform-specific kod yok, tüm platformlarda aynı kod çalışır

