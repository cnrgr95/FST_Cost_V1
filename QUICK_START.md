# 🚀 Hızlı Başlangıç Rehberi

FST Cost Management sistemini hızlıca kurmak için bu adımları izleyin.

## ⚡ Hızlı Kurulum (5 Dakika)

### 1. Composer Bağımlılıklarını Yükleyin

**Windows (Laragon):**
```powershell
.\scripts\install_dependencies.ps1
```

**Linux/Mac:**
```bash
composer install
```

### 2. .env Dosyası Oluşturun

**Yöntem A: Web Arayüzü (Önerilen)**
1. Tarayıcıda açın: `http://localhost/FST_Cost_V1/setup_env.php`
2. Formu doldurun
3. ".env Dosyası Oluştur" butonuna tıklayın

**Yöntem B: Manuel Kopyalama**
```powershell
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Sonra `.env` dosyasını açıp veritabanı bilgilerinizi güncelleyin.

**Yöntem C: Doğrudan Oluşturma**
Proje kök dizininde `.env` dosyası oluşturup şu içeriği ekleyin:

```env
APP_ENV=development
APP_DEBUG=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fst_cost_db
DB_USER=postgres
DB_PASS=your_password_here
SESSION_LIFETIME=7200
```

### 3. Veritabanını Hazırlayın

PostgreSQL'de veritabanını oluşturun:
```sql
CREATE DATABASE fst_cost_db;
```

### 4. Sistem Kontrolü

Tarayıcıda açın: `http://localhost/FST_Cost_V1/check_requirements.php`

Bu sayfa tüm gereksinimleri kontrol eder ve eksikleri gösterir.

### 5. Uygulamayı Başlatın

Tarayıcıda açın: `http://localhost/FST_Cost_V1/login.php`

**Varsayılan Giriş:**
- Username: `admin`
- Password: `admin`

## 📋 Minimum Gereksinimler

- ✅ PHP 7.4+ (8.0+ önerilir)
- ✅ PostgreSQL 12+
- ✅ Composer
- ✅ PHP Extension'ları: pgsql, mbstring, curl, json, openssl, fileinfo, zip

## 🔧 Sorun Giderme

### .env Dosyası Bulunamadı
- `setup_env.php` ile oluşturun
- Veya `.env.example` dosyasını kopyalayıp `.env` olarak kaydedin

### Composer Hatası
- `composer install` komutunu proje kök dizininde çalıştırın
- `vendor/` klasörünün oluştuğundan emin olun

### Veritabanı Bağlantı Hatası
- PostgreSQL servisinin çalıştığından emin olun
- `.env` dosyasındaki bilgileri kontrol edin
- Firewall'ın 5432 portunu engellemediğinden emin olun

### Extension Hatası
- `check_requirements.php` ile kontrol edin
- `php.ini` dosyasında extension'ları aktif edin

## 📖 Detaylı Dokümantasyon

- `SERVER_SETUP.md` - Detaylı sunucu yapılandırması
- `README.md` - Genel proje bilgileri
- `database/README.md` - Veritabanı yönetimi

## ⚠️ Önemli Notlar

1. **Production Ortamı:**
   - `.env` dosyasında `APP_ENV=production` ve `APP_DEBUG=false` ayarlayın
   - `setup_env.php` ve `check_requirements.php` dosyalarını silin veya koruyun
   - Güçlü veritabanı şifresi kullanın

2. **Güvenlik:**
   - `.env` dosyası `.gitignore`'da olmalı (zaten var)
   - `.htaccess` ile `.env` dosyası korunuyor
   - Production'da HTTPS kullanın

3. **İzinler:**
   - `uploads/` klasörü yazılabilir olmalı
   - `logs/` klasörü yazılabilir olmalı

## 🎯 Sonraki Adımlar

Kurulum tamamlandıktan sonra:
1. Veritabanı backup'ını yükleyin (varsa)
2. İlk admin kullanıcısı ile giriş yapın
3. Sistem ayarlarını yapılandırın
4. Çeviri dosyalarını kontrol edin

---

**Sorularınız için:** `check_requirements.php` dosyasını çalıştırarak sistem durumunu kontrol edebilirsiniz.

