# Installation Scripts

Bu klasör kurulum ve bakım scriptlerini içerir.

## Scriptler

### install_dependencies.ps1
PowerShell scripti - Composer bağımlılıklarını yükler.
- Otomatik PHP bulma (Laragon, XAMPP, PATH)
- PHP 7.4+ ve tüm 8.x sürümlerini destekler
- Otomatik composer.phar indirme

**Kullanım:**
```powershell
.\scripts\install_dependencies.ps1
```

### install_dependencies.bat
Batch scripti - Composer bağımlılıklarını yükler (PowerShell yoksa).
- Otomatik PHP bulma
- PHP 7.4+ ve tüm 8.x sürümlerini destekler
- **Not:** PowerShell versiyonu önerilir (daha gelişmiş)

**Kullanım:**
```cmd
.\scripts\install_dependencies.bat
```

### check_vendor.ps1
Vendor klasörünün durumunu kontrol eder.
- Eksik bağımlılıkları tespit eder
- Hata durumunda çözüm önerir

**Kullanım:**
```powershell
.\scripts\check_vendor.ps1
```

### check_unused_db_objects.sql
Veritabanı yapısı analiz scripti - PostgreSQL'de kullanılmayan tablo ve sütunları tespit eder.

**Kullanım:**
```sql
\i scripts/check_unused_db_objects.sql
```

## Notlar

- Scriptler proje kök dizinine otomatik olarak geçer
- Scriptler `scripts` klasöründen çağrılmalıdır: `.\scripts\script_name`
- Scriptler herhangi bir dizinden çağrılabilir (otomatik dizin değişimi)

