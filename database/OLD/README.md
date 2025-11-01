# Database Setup & Management Guide

PostgreSQL veritabanı kurulum, yönetim ve taşıma rehberi.

---

## 📋 İÇİNDEKİLER

1. [Kurulum](#kurulum)
2. [Backup & Restore](#backup--restore)
3. [UTF-8 Encoding](#utf-8-encoding)
4. [Migration & Taşıma](#migration--taşıma)
5. [Sample Data](#sample-data)
6. [Troubleshooting](#troubleshooting)

---

## KURULUM

### Yöntem 1: PHP Script ile (Önerilen)

1. **Database credentials ayarlayın** (`config.php` veya `.env` dosyasında):
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fst_cost_db
   DB_USER=postgres
   DB_PASS=your_password
   ```

2. **Script'i çalıştırın**:
   ```bash
   php database/create_database.php
   ```

   Script otomatik olarak:
   - Veritabanının var olup olmadığını kontrol eder
   - Yoksa oluşturur (UTF-8 encoding ile)
   - Tüm tabloları, index'leri, trigger'ları oluşturur
   - Encoding'i doğrular

### Yöntem 2: SQL Dosyası ile

1. **PostgreSQL'e bağlanın**:
   ```bash
   psql -U postgres
   ```

2. **Veritabanını oluşturun**:
   ```sql
   CREATE DATABASE fst_cost_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
   \c fst_cost_db
   ```

3. **SQL dosyasını çalıştırın**:
   ```bash
   psql -U postgres -d fst_cost_db -f database/create_database.sql
   ```

### Yöntem 3: Batch Script ile (Windows)

```bash
database\create_database.bat
```

Script PostgreSQL şifresini soracaktır.

---

## BACKUP & RESTORE

### Backup Alma

#### PowerShell (Windows)
```powershell
cd database
.\backup_database.ps1
```

**Özellikler:**
- Otomatik PostgreSQL path bulma
- `.env` dosyasından şifre okuma (yoksa prompt)
- Timestamp'li backup dosyası: `fst_cost_db_backup_YYYYMMDD_HHMMSS.sql`

#### Batch (Windows)
```batch
database\backup_database.bat
```

#### Manuel (Linux/Mac)
```bash
pg_dump -U postgres -d fst_cost_db --create --clean --if-exists -f backup.sql
```

### Restore Etme

#### PowerShell (Windows)
```powershell
cd database
.\restore_database.ps1
# Veya spesifik dosya ile:
.\restore_database.ps1 -DUMP_FILE "fst_cost_db_backup_20251101_010400.sql"
```

**Özellikler:**
- Parametre verilmezse en son backup'ı bulur
- `.env` dosyasından şifre okur (yoksa prompt)

#### Batch (Windows)
```batch
database\restore_database.bat
# Veya spesifik dosya ile:
database\restore_database.bat "fst_cost_db_backup_20251101_010400.sql"
```

#### Manuel (Linux/Mac)
```bash
psql -U postgres -d fst_cost_db < database/fst_cost_db_backup_YYYYMMDD_HHMMSS.sql
```

---

## UTF-8 ENCODING

### Sorun
Sunucu değiştiğinde Türkçe karakterler (ğ, ü, ş, ı, ö, ç) bozuluyor.

### Çözüm
Sistem UTF-8 encoding ile yapılandırılmıştır:

1. **Veritabanı oluşturma** - UTF-8 ile:
   ```sql
   CREATE DATABASE fst_cost_db 
   WITH ENCODING 'UTF8' 
   LC_COLLATE='en_US.UTF-8' 
   LC_CTYPE='en_US.UTF-8';
   ```

2. **Encoding kontrolü**:
   ```bash
   psql -U postgres -d fst_cost_db -f database/fix_encoding.sql
   ```

3. **Detaylı bilgi**: `UTF8_ENCODING_FIX.md` dosyasına bakın.

---

## MIGRATION & TAŞIMA

### Sunucu Değişikliği

Sistem taşınmaya hazırdır (dinamik path'ler kullanıyor).

**Yapılması gerekenler:**

1. **Database ayarları** (`.env` dosyası):
   ```env
   DB_HOST=new_host
   DB_PORT=5432
   DB_NAME=fst_cost_db
   DB_USER=postgres
   DB_PASS=new_password
   ```

2. **Backup alın** (eski sunucudan):
   ```powershell
   .\backup_database.ps1
   ```

3. **Restore edin** (yeni sunucuda):
   ```powershell
   .\restore_database.ps1
   ```

4. **Encoding kontrolü**:
   ```sql
   SHOW client_encoding;
   -- UTF8 olmalı
   ```

**Detaylı rehber**: `MIGRATION_GUIDE.md` dosyasına bakın.

---

## SAMPLE DATA

Test için örnek veri ekleme:

```bash
psql -U postgres -d fst_cost_db -f database/insert_sample_data.sql
```

**Eklenen veriler:**
- 3 ülke (Türkiye, Almanya, Fransa)
- Bölge ve şehirler
- Alt bölgeler
- Departman ve pozisyonlar
- Merchant'lar (restoran, otel, mağaza vb.)
- 13 araç firması
- 28 araç tipi
- 14 araç kontratı (FST-001 to FST-014)
- 4 kullanıcı (john.doe, jane.smith, ahmet.yilmaz, anna.mueller)

---

## TROUBLESHOOTING

### Bağlantı Hatası
- PostgreSQL servisinin çalıştığını kontrol edin
- `config.php` veya `.env` dosyasındaki credentials'ı kontrol edin
- Port 5432'in açık olduğunu kontrol edin

### Permission Hatası
- PostgreSQL kullanıcısının `CREATE DATABASE` yetkisi olmalı
- Production için dedicated user oluşturun

### Encoding Sorunu
- Veritabanının UTF-8 ile oluşturulduğunu kontrol edin
- `fix_encoding.sql` script'ini çalıştırın
- Client encoding'i kontrol edin: `SHOW client_encoding;`

### Backup/Restore Hatası
- PostgreSQL path'inin doğru olduğunu kontrol edin
- Script'ler otomatik path bulma yapıyor, ama manuel path de ayarlanabilir
- Şifre `.env` dosyasında veya prompt ile verilmeli (hardcoded değil)

---

## 📁 DOSYA YAPISI

```
database/
├── create_database.sql      # Ana şema (tüm tablolar, index'ler, trigger'lar)
├── create_database.php      # PHP kurulum script'i
├── create_database.bat      # Windows batch kurulum script'i
├── insert_sample_data.sql  # Örnek veri
├── fix_encoding.sql        # UTF-8 encoding kontrol ve düzeltme
├── backup_database.ps1     # PowerShell backup script (.env desteği)
├── backup_database.bat     # Batch backup script (.env desteği)
├── restore_database.ps1    # PowerShell restore script (.env desteği, otomatik dosya bulma)
├── restore_database.bat    # Batch restore script (.env desteği, otomatik dosya bulma)
├── README.md               # Bu dosya (tüm dokümantasyon)
├── MIGRATION_GUIDE.md      # Taşıma rehberi
├── UTF8_ENCODING_FIX.md    # UTF-8 encoding detayları
└── .gitignore              # Backup dosyalarını ignore eder
```

---

## ⚠️ GÜVENLİK NOTLARI

### Production İçin

1. **Şifreler:**
   - ✅ Script'ler artık `.env` dosyasından şifre okuyor
   - ✅ Hardcoded password'ler kaldırıldı
   - ✅ `.env` dosyasını `.gitignore`'a ekleyin

2. **Backup:**
   - Backup dosyalarını güvenli bir yerde saklayın
   - Offsite backup yapın
   - Backup retention policy oluşturun

3. **Permissions:**
   - Script dosyalarını yalnızca yetkili kullanıcılar çalıştırabilmeli
   - Database credentials güvenli tutulmalı

---

## 🔧 GELİŞMİŞ KULLANIM

### Custom Backup Format

```bash
# Custom format (compressed, restore edilebilir)
pg_dump -U postgres -d fst_cost_db -F c -f backup.dump

# Restore
pg_restore -U postgres -d fst_cost_db backup.dump
```

### Scheduled Backups

**Windows Task Scheduler:**
```powershell
# Günde bir kez backup al
schtasks /create /tn "FST DB Backup" /tr "powershell.exe -File C:\path\to\backup_database.ps1" /sc daily /st 02:00
```

**Linux Cron:**
```bash
# Her gün saat 02:00'de backup al
0 2 * * * /usr/bin/pg_dump -U postgres fst_cost_db > /backups/db_backup_$(date +\%Y\%m\%d).sql
```

---

## 📞 DESTEK

Sorunlar için:
1. Troubleshooting bölümünü kontrol edin
2. Log dosyalarını inceleyin (`logs/` klasörü)
3. Database encoding'i kontrol edin

---

**Son Güncelleme:** 2025-11-01
