# Sistem Taşıma Rehberi

Bu doküman, FST Cost Management sistemini başka bir konuma taşırken yapılması gerekenleri açıklar.

## ✅ Otomatik Çalışan Kısımlar

Sistem dinamik path kullanımı sayesinde taşınmaya hazırdır:

- ✅ Tüm PHP path'leri `__DIR__` ile dinamik oluşturuluyor
- ✅ Tüm include/require'lar relativ path kullanıyor
- ✅ BASE_PATH otomatik hesaplanıyor
- ✅ Klasör yapısı korunuyor

## ⚠️ Taşıma Sonrası Yapılması Gerekenler

### 1. Database Bağlantı Ayarları

**Seçenek A: `.env` Dosyası Oluşturun (Önerilen)**

Proje kök dizininde `.env` dosyası oluşturun:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fst_cost_db
DB_USER=postgres
DB_PASS=your_password_here
```

**Seçenek B: `config.php` Dosyasını Güncelleyin**

`config.php` dosyasındaki database ayarlarını güncelleyin:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'fst_cost_db');
define('DB_USER', 'postgres');
define('DB_PASS', 'your_password_here');
```

### 2. Web Sunucusu Ayarları

**Apache (.htaccess otomatik çalışır):**
- Document Root'u yeni konuma ayarlayın
- `mod_rewrite` aktif olmalı

**Nginx:**
```nginx
server {
    root /yeni/path/FST_Cost_V1;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 3. Veritabanı Restore

Yeni sunucuda veritabanını restore edin:

```bash
# PostgreSQL'e bağlanın
psql -U postgres

# Veritabanı oluşturun
CREATE DATABASE fst_cost_db;

# Çıkış yapın
\q

# Backup dosyasını restore edin
psql -U postgres -d fst_cost_db < database/fst_cost_db_backup_YYYYMMDD_HHMMSS.sql
```

**Windows PowerShell:**
```powershell
# Backup dosyasını restore edin (PostgreSQL path'ini güncelleyin)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d fst_cost_db -f database\fst_cost_db_backup_YYYYMMDD_HHMMSS.sql
```

### 4. Klasör İzinleri (Linux/Mac)

```bash
chmod -R 755 uploads/
chmod -R 755 logs/
chmod -R 644 config.php
```

### 5. Backup Script Yolu (Opsiyonel)

`database/backup_database.ps1` dosyasındaki PostgreSQL path'ini güncelleyin:

```powershell
# Satır 6'yı güncelleyin
$pgDump = "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
# Veya PATH'te ise:
$pgDump = "pg_dump.exe"
```

### 6. Composer Bağımlılıkları

Eğer `vendor/` klasörünü taşımadıysanız:

```bash
composer install
```

## 📋 Taşıma Checklist

- [ ] Tüm dosyalar yeni konuma kopyalandı
- [ ] Database bağlantı ayarları güncellendi (.env veya config.php)
- [ ] Web sunucusu ayarları yapılandırıldı
- [ ] Veritabanı restore edildi
- [ ] Klasör izinleri ayarlandı (Linux/Mac)
- [ ] Composer bağımlılıkları yüklendi (opsiyonel)
- [ ] Backup script path'i güncellendi (opsiyonel)
- [ ] Tarayıcıda test edildi

## 🔍 Sorun Giderme

### Veritabanı bağlantı hatası
- `.env` dosyasının proje kök dizininde olduğunu kontrol edin
- Database ayarlarının doğru olduğunu kontrol edin
- PostgreSQL servisinin çalıştığını kontrol edin

### 404 hatası veya sayfa bulunamıyor
- Document Root'un doğru ayarlandığını kontrol edin
- `.htaccess` dosyasının mevcut olduğunu kontrol edin
- `mod_rewrite` aktif olduğunu kontrol edin

### CSS/JS dosyaları yüklenmiyor
- Asset path'lerin doğru olduğunu kontrol edin
- Tarayıcı konsolunda hata var mı bakın

## 💡 Notlar

- Sistem `__DIR__` kullanarak dinamik path'ler oluşturur
- Tüm relativ path'ler otomatik çalışır
- Sadece database ve web sunucusu ayarları güncellenmelidir

