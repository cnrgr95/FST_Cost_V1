# Türkçe Karakter Sorunu Çözümü (UTF-8 Encoding)

## Sorun
Sunucu değiştiğinde Türkçe karakterler (ğ, ü, ş, ı, ö, ç) bozuluyor.

## Çözüm
Aşağıdaki değişiklikler yapıldı:

### 1. PostgreSQL Bağlantı Ayarları (`config.php`)
- Connection string'e `options='--client_encoding=UTF8'` eklendi
- `getDbConnection()` fonksiyonunda `pg_set_client_encoding($conn, 'UTF8')` çağrısı eklendi

### 2. PHP Encoding Ayarları (`config.php`)
- `mb_internal_encoding('UTF-8')` eklendi
- `mb_http_output('UTF-8')` eklendi
- `mb_regex_encoding('UTF-8')` eklendi

### 3. API Header'ları
Tüm API dosyalarındaki Content-Type header'ları güncellendi:
```php
header('Content-Type: application/json; charset=utf-8');
```

### 4. Veritabanı Oluşturma
- `create_database.sql` dosyasına UTF-8 encoding ayarları eklendi
- `create_database.php` script'i UTF-8 ile veritabanı oluşturuyor

### 5. Apache/HTTP Headers (`.htaccess`)
- `AddDefaultCharset UTF-8` zaten mevcut

## Sunucu Değişikliğinde Yapılması Gerekenler

### 1. Veritabanı Oluşturma
Veritabanını yeni sunucuda UTF-8 encoding ile oluşturun:

```sql
CREATE DATABASE fst_cost_db 
WITH ENCODING 'UTF8' 
LC_COLLATE='en_US.UTF-8' 
LC_CTYPE='en_US.UTF-8';
```

### 2. Mevcut Veritabanını Kontrol Etme
Eğer veritabanı zaten varsa, encoding'i kontrol edin:

```sql
-- Veritabanı encoding'ini kontrol et
SELECT datname, pg_encoding_to_char(encoding) 
FROM pg_database 
WHERE datname = 'fst_cost_db';

-- Eğer UTF8 değilse, yeni bir veritabanı oluşturup verileri taşıyın
```

### 3. Backup/Restore
Backup alırken ve restore ederken encoding'i kontrol edin:

```bash
# Backup alırken
pg_dump -U postgres -d fst_cost_db --encoding=UTF8 > backup.sql

# Restore ederken
psql -U postgres -d fst_cost_db --set client_encoding=UTF8 < backup.sql
```

### 4. PostgreSQL Server Ayarları
PostgreSQL'in locale ayarlarını kontrol edin:

```bash
# Locale ayarlarını görmek için
locale

# PostgreSQL'in kullandığı locale'i görmek için
show lc_collate;
show lc_ctype;
```

### 5. PHP Ayarları
`php.ini` dosyasında şu ayarları kontrol edin:

```ini
default_charset = "UTF-8"
mbstring.internal_encoding = UTF-8
mbstring.http_output = UTF-8
```

## Test Etme

Türkçe karakterleri test etmek için:

```sql
-- Test verisi ekle
INSERT INTO countries (name) VALUES ('Türkiye');
INSERT INTO cities (name, region_id) VALUES ('İstanbul', 1);
INSERT INTO regions (name, country_id) VALUES ('Marmara', 1);

-- Kontrol et
SELECT * FROM countries WHERE name LIKE '%ü%';
```

## Sorun Giderme

### Eğer karakterler hala bozuksa:

1. **Veritabanı encoding kontrolü:**
   ```sql
   SHOW client_encoding;
   ```

2. **PHP encoding kontrolü:**
   ```php
   echo mb_internal_encoding();
   echo mb_http_output();
   ```

3. **Browser encoding:**
   - F12 > Network > Response Headers > Content-Type kontrolü
   - `charset=utf-8` olmalı

4. **Veri kontrolü:**
   ```sql
   -- Mevcut verilerin encoding'ini kontrol et
   SELECT name, convert_from(name::bytea, 'UTF8') FROM countries LIMIT 1;
   ```

## Notlar

- PostgreSQL'de `UTF8` ve `UTF-8` aynı anlama gelir
- Veritabanı oluşturulduktan sonra encoding değiştirilemez
- Eğer encoding yanlışsa, veritabanını yeniden oluşturmanız gerekir
- Backup dosyaları her zaman UTF-8 encoding ile alınmalı

