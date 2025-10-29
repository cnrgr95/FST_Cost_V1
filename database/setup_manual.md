# Manuel Veritabanı Kurulumu

Laragon'da PostgreSQL üzerinden veritabanını manuel olarak oluşturmak için:

## Yöntem 1: PostgreSQL Komut Satırı ile

1. **PostgreSQL'e bağlanın:**
   ```bash
   psql -U postgres
   ```

2. **Veritabanını oluşturun:**
   ```sql
   CREATE DATABASE fst_cost_db;
   ```

3. **Veritabanına bağlanın:**
   ```sql
   \c fst_cost_db
   ```

4. **SQL dosyasını çalıştırın:**
   ```bash
   \i C:/laragon/www/FST_Cost_V1/database/create_database.sql
   ```
   
   VEYA terminal'den:
   ```bash
   psql -U postgres -d fst_cost_db -f C:/laragon/www/FST_Cost_V1/database/create_database.sql
   ```

## Yöntem 2: pgAdmin ile

1. **pgAdmin'i açın**

2. **Yeni veritabanı oluşturun:**
   - Server > Databases > Sağ tık > Create > Database
   - Name: `fst_cost_db`
   - Owner: `postgres`
   - Save

3. **SQL Editor'ü açın:**
   - `fst_cost_db` > Right Click > Query Tool

4. **SQL dosyasını açın:**
   - File > Open > `create_database.sql` dosyasını seçin

5. **Execute edin:**
   - Execute (F5) tuşuna basın

## Yöntem 3: Batch Script ile (Windows)

1. **create_database.bat** dosyasını çift tıklayın
   - Script Laragon'un PHP path'ini otomatik bulacaktır

## Yöntem 4: Laragon Terminal ile

1. **Laragon'u açın**

2. **Terminal butonuna tıklayın** (veya Ctrl+Alt+T)

3. **Proje dizinine gidin:**
   ```bash
   cd C:\laragon\www\FST_Cost_V1
   ```

4. **PHP script'ini çalıştırın:**
   ```bash
   php database/create_database.php
   ```

## Kontrol

Veritabanının doğru oluşturulduğunu kontrol etmek için:

```sql
-- PostgreSQL'de
\c fst_cost_db

-- Tabloları listeleyin
\dt

-- Users tablosunun yapısını kontrol edin
\d users

-- Tüm tabloları görüntüleyin
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Beklenen tablolar:
- countries
- regions  
- cities
- departments
- users

## Sorun Giderme

### "database does not exist" hatası
- Veritabanını önce oluşturun: `CREATE DATABASE fst_cost_db;`

### "permission denied" hatası
- PostgreSQL kullanıcısının yetkilerini kontrol edin
- Postgres kullanıcısı ile giriş yapın

### "connection refused" hatası
- PostgreSQL servisinin çalıştığından emin olun
- Laragon'da PostgreSQL'in aktif olduğunu kontrol edin

