# 📦 Universal Database Backup System

Çok dilli ve platform bağımsız PostgreSQL veritabanı yedekleme sistemi.

## ✨ Özellikler

- 🌍 **Çok Dilli Destek**: Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca
- 🖥️ **Platform Desteği**: Windows, Linux, macOS
- 📦 **Format Desteği**: SQL (Plain), Custom (Binary), Tar
- 🗜️ **Sıkıştırma**: Otomatik gzip sıkıştırma desteği
- 🔒 **Güvenlik**: .env dosyasından otomatik yapılandırma
- 📊 **Detaylı Bilgi**: Dosya boyutu, zaman damgası, format bilgisi

## 📋 Kullanım

### PHP Script (Önerilen - En Esnek)

**Windows:**
```powershell
cd database\Backup
php backup_database.php
```

**Linux/macOS:**
```bash
cd database/Backup
php backup_database.php
```

**Seçenekler:**
```bash
php backup_database.php                    # Varsayılan: SQL format, sıkıştırılmış
php backup_database.php --format=sql       # SQL format (sıkıştırılmış)
php backup_database.php --format=sql --compress=no  # SQL format (sıkıştırılmamış)
php backup_database.php --format=custom   # Custom binary format
php backup_database.php --format=tar       # Tar format
php backup_database.php --lang=tr          # Türkçe çıktı
php backup_database.php --help             # Yardım
```

**Web Arayüzü:**
```
http://localhost/FST_Cost_V1/database/Backup/backup_database.php?run_backup=1
```

### Windows Batch Script

```cmd
cd database\Backup
backup_database.bat
backup_database.bat --lang=tr
```

### Linux/macOS Shell Script

```bash
cd database/Backup
chmod +x backup_database.sh
./backup_database.sh
./backup_database.sh --lang=tr
```

## 🔧 Yapılandırma

Yedekleme scriptleri otomatik olarak `.env` dosyasından yapılandırmayı okur:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fst_cost_db
DB_USER=postgres
DB_PASS=your_password
```

Eğer `.env` dosyası yoksa veya şifre bulunamazsa, script şifreyi manuel olarak sorar.

## 📁 Dosya Formatları

### 1. SQL (Plain Text) - Varsayılan ✅
```bash
php backup_database.php                    # Varsayılan: SQL + sıkıştırma
php backup_database.php --format=sql       # SQL format
```
- **Varsayılan format** - Herhangi bir parametre vermeden çalıştırıldığında SQL format kullanılır
- İnsan tarafından okunabilir
- Düzenlenebilir
- Varsayılan olarak gzip ile sıkıştırılır (`.sql.gz`)
- `psql` veya herhangi bir SQL editör ile restore edilebilir

### 2. Custom (Binary)
```bash
php backup_database.php --format=custom
```
- Küçük dosya boyutu
- Hızlı restore
- pg_restore ile restore edilir

### 3. Tar
```bash
php backup_database.php --format=tar
```
- Dosya bazlı yedekleme
- Orta boyut

## 🗜️ Sıkıştırma

SQL ve Tar formatları otomatik olarak gzip ile sıkıştırılabilir:

```bash
php backup_database.php --format=sql --compress
```

Sıkıştırılmış dosyalar `.gz` uzantısı ile kaydedilir.

## 📍 Dosya Konumu

Tüm yedekler `database/Backup/` klasöründe saklanır:

```
database/Backup/
├── fst_cost_db_backup_20250101_120000.sql
├── fst_cost_db_backup_20250101_120000.sql.gz
├── fst_cost_db_backup_20250101_120000.dump
└── ...
```

## 🌍 Dil Desteği

### Otomatik Dil Algılama

Scriptler sistem dilini otomatik olarak algılar:
- **Windows**: Sistem locale'den
- **Linux/macOS**: `LANG` ortam değişkeninden
- **Web**: Tarayıcı `Accept-Language` başlığından

### Manuel Dil Seçimi

**PHP:**
```bash
php backup_database.php --lang=tr
php backup_database.php --lang=en
php backup_database.php --lang=de
php backup_database.php --lang=fr
php backup_database.php --lang=es
php backup_database.php --lang=it
```

**Batch (Windows):**
```cmd
backup_database.bat --lang=tr
```

**Shell (Linux/macOS):**
```bash
./backup_database.sh --lang=tr
```

### Desteklenen Diller

- 🇹🇷 `tr` - Türkçe
- 🇬🇧 `en` - English
- 🇩🇪 `de` - Deutsch
- 🇫🇷 `fr` - Français
- 🇪🇸 `es` - Español
- 🇮🇹 `it` - Italiano

## 🔄 Restore

### SQL Format
```bash
psql -h localhost -p 5432 -U postgres -d fst_cost_db < backup_file.sql
```

### Custom Format
```bash
pg_restore -h localhost -p 5432 -U postgres -d fst_cost_db -c backup_file.dump
```

### Compressed SQL
```bash
gunzip -c backup_file.sql.gz | psql -h localhost -p 5432 -U postgres -d fst_cost_db
```

## ⚙️ Gereksinimler

- **PHP 7.4+** (PHP script için)
- **PostgreSQL Client Tools** (pg_dump)
- **.env** dosyası veya manuel yapılandırma

## 🛠️ Sorun Giderme

### pg_dump Bulunamadı

**Windows:**
1. PostgreSQL'in kurulu olduğundan emin olun
2. Laragon kullanıyorsanız: `C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe`
3. Standart kurulum: `C:\Program Files\PostgreSQL\XX\bin\pg_dump.exe`
4. PATH'e ekleyin veya script otomatik bulacaktır

**Linux/macOS:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# CentOS/RHEL
sudo yum install postgresql
```

### Bağlantı Hatası

1. PostgreSQL servisinin çalıştığından emin olun
2. `.env` dosyasındaki bilgileri kontrol edin
3. Firewall'ın 5432 portunu engellemediğinden emin olun

### İzin Hatası

**Linux/macOS:**
```bash
chmod +x backup_database.sh
chmod 755 database/Backup/
```

## 📝 Notlar

- Yedekler **tam veritabanı** yedeğidir (schema + data + blobs)
- `--create --clean --if-exists` bayrakları kullanılır
- Yedekleme sırasında veritabanı bağlantısı kesilmez (hot backup)
- Büyük veritabanları için Custom format önerilir

## 🔒 Güvenlik

- Şifreler `.env` dosyasından okunur (git'e commit edilmemeli)
- Şifreler komut satırı argümanı olarak geçirilmez
- `PGPASSWORD` ortam değişkeni kullanılır
- Yedekler hassas bilgiler içerebilir, güvenli saklayın

## 📚 İlgili Dosyalar

- `backup_database.php` - PHP script (önerilen)
- `backup_database.bat` - Windows batch script
- `backup_database.sh` - Linux/macOS shell script
- `../../.env` - Yapılandırma dosyası
- `../../config.php` - Uygulama yapılandırması

## 🆘 Yardım

Sorun yaşarsanız:
1. PHP script'i `--help` ile çalıştırın
2. `.env` dosyasını kontrol edin
3. PostgreSQL client tools'un kurulu olduğundan emin olun
4. Hata mesajlarını okuyun (çok dilli destek var)

---

**Son Güncelleme:** 2025-01-01  
**Versiyon:** 1.0.0  
**Platform:** Windows, Linux, macOS  
**Dil Desteği:** TR, EN, DE, FR, ES, IT

