# Sistem Taşıma Rehberi (Özet)

FST Cost Management sistemini başka bir konuma taşımak için:

## ✅ Sistem Taşınmaya Hazır

Sistem **dinamik path kullanımı** sayesinde taşınmaya hazırdır. Tüm path'ler otomatik olarak hesaplanır.

## 📝 Taşıma Sonrası Yapılması Gerekenler

### 1. Database Ayarları
`.env` dosyası oluşturun veya `config.php` içindeki database bilgilerini güncelleyin.

### 2. Web Sunucusu Ayarları
Document Root'u yeni konuma ayarlayın.

### 3. Veritabanı Restore
Backup dosyasını restore edin (detaylar için `database/MIGRATION_GUIDE.md` bakın).

### 4. Klasör İzinleri (Linux/Mac)
```bash
chmod -R 755 uploads/ logs/
```

Detaylı rehber için: `database/MIGRATION_GUIDE.md`

