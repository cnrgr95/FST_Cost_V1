# FST_Cost_V1 Statik Kod İncelemesi

Aşağıdaki rapor, hızlı statik kuralsal tarama sonuçlarını içerir. Lütfen bulguları bağlam içinde değerlendiriniz.

## Genel Özet

- HIGH: 156
- MEDIUM: 180
- LOW: 176
- INFO: 30


## Bulgular

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/InstalledVersions.php:252

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/positions.php:146

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT c.*, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/positions.php:165

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT d.*, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/positions.php:173

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT d.*, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/positions.php:240

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This department cannot be deleted because it has ' . $row['count'] . ' position(s) associated with it. Please delete all positions first.'
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/positions.php:240

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This department cannot be deleted because it has ' . $row['count'] . ' position(s) associated with it. Please delete all positions first.'
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/positions.php:260

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT p.*, d.name as department_name, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/positions.php:269

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT p.*, d.name as department_name, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:319

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vt.id, vt.name, vt.vehicle_company_id,
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/tours.php:36

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'Configuration error';
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/vehicles.php:297

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This vehicle company cannot be deleted because it has ' . $row2['count'] . ' contract(s) associated with it. Please delete all contracts first.',
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:297

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This vehicle company cannot be deleted because it has ' . $row2['count'] . ' contract(s) associated with it. Please delete all contracts first.',
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/vehicles.php:280

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This vehicle company cannot be deleted because it has ' . $row['count'] . ' vehicle type(s) associated with it. Please delete all vehicle types first.',
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:280

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This vehicle company cannot be deleted because it has ' . $row['count'] . ' vehicle type(s) associated with it. Please delete all vehicle types first.',
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:198

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vc.id, vc.name, vc.city_id, vc.contact_person, vc.contact_email, vc.contact_phone,
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:189

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vc.id, vc.name, vc.city_id, vc.contact_person, vc.contact_email, vc.contact_phone,
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:329

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vt.id, vt.name, vt.vehicle_company_id,
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:402

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This vehicle type cannot be deleted because its vehicle company has ' . $row['count'] . ' contract(s) associated with it. Please delete all contracts first.',
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/locations.php:14

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/vehicles.php:402

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This vehicle type cannot be deleted because its vehicle company has ' . $row['count'] . ' contract(s) associated with it. Please delete all contracts first.',
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/costs.php:14

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/positions.php:15

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] file_inclusion — FST_Cost_V1/app/guide.php:14

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/vehicles.php:703

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => "Imported $successCount contracts successfully" . ($errorCount > 0 ? ". $errorCount errors occurred." : ''),
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/vehicles.php:603

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This contract cannot be deleted because it has ' . $row['count'] . ' route(s) associated with it. Please delete all routes first.',
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:603

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This contract cannot be deleted because it has ' . $row['count'] . ' route(s) associated with it. Please delete all routes first.',
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/merchants.php:43

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$msg = defined('APP_DEBUG') && APP_DEBUG ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'Configuration error';
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:170

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT c.id, c.name, c.region_id, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:468

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vc.id, vc.vehicle_company_id, vc.contract_code, vc.start_date, vc.end_date,
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:426

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vc.id, vc.vehicle_company_id, vc.contract_code, vc.start_date, vc.end_date,
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/merchants.php:180

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/merchants.php:201

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT m.*, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/merchants.php:210

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT m.*, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/merchants.php:319

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This merchant cannot be deleted because it has ' . $row['count'] . ' tour(s) associated with it. Please delete all tours first.'
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/merchants.php:319

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This merchant cannot be deleted because it has ' . $row['count'] . ' tour(s) associated with it. Please delete all tours first.'
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/positions.php:38

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/vehicles.php:449

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vc.id, vc.vehicle_company_id, vc.contract_code, vc.start_date, vc.end_date,
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:321

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT p.*, d.name as department_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:208

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT r.*, c.name as country_name FROM regions r LEFT JOIN countries c ON r.country_id = c.id ORDER BY r.name ASC";
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:232

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/users.php:14

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:151

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT u.*,
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/users.php:174

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Error loading users: ' . $e->getMessage()]);
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/vehicles.php:42

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/app/definitions/tours.php:123

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
<option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:212

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT d.*, c.name as city_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:219

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT d.*, c.name as city_name
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/users.php:233

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Error loading departments: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:243

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:251

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/users.php:266

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Error loading cities: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:277

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT r.*, c.name as country_name FROM regions r LEFT JOIN countries c ON r.country_id = c.id ORDER BY r.name ASC";
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/users.php:288

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Error loading regions: ' . $e->getMessage()]);
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/users.php:306

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Error loading countries: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/users.php:315

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT p.*, d.name as department_name
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/InstalledVersions.php:235

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
```

### [HIGH] sql_injection — FST_Cost_V1/app/definitions/tours.php:116

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
<option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/vehicles.php:15

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] sql_injection — FST_Cost_V1/app/definitions/tours.php:109

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
<option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:253

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:261

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:287

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT m.*, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:308

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT t.*, t.vehicle_contract_id, m.name as merchant_name, sr.name as sub_region_name, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:325

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$subRegionsQuery = "SELECT tsr.sub_region_id, sr.name as sub_region_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:340

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
SELECT FROM information_schema.tables
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:348

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$routesQuery = "SELECT tcr.sub_region_id, tcr.vehicle_contract_route_id,
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:225

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT c.*, r.name as region_name, r.country_id, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:366

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$contractRoutesQuery = "SELECT vcr.*, vc.contract_code
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:552

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vcr.*, vc.contract_code
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:579

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
SELECT FROM information_schema.tables
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:596

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT tcr.*, sr.name as sub_region_name, vcr.from_location, vcr.to_location
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:623

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
SELECT FROM information_schema.tables
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:645

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
echo json_encode(['success' => false, 'message' => 'Failed to delete existing routes: ' . getDbErrorMessage($conn)]);
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/tours.php:15

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/users.php:38

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/tours.php:499

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT vc.id, vc.contract_code, vc.start_date, vc.end_date,
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:21

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo "===========================================\n\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/currencies.php:14

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:34

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "✓ Connected to PostgreSQL server\n\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/includes/security.php:214

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$rateLimitKey = 'rate_limit_' . $key;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/costs.php:38

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:173

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $RED . "\n✗ Error: " . $e->getMessage() . "\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:168

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo "===========================================\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/costs.php:173

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Database error: ' . $error]);
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/costs.php:176

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:166

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo "\n" . $GREEN . "===========================================\n";
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/currency-country.php:5

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/currencies.php:42

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/database/create_database.php:152

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$verifyQuery = "SELECT table_name FROM information_schema.tables
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:151

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Step 6: Verifying tables...\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:148

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "✓ Functions created: " . $functionsCreated . "\n\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:147

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "✓ Tables created: " . $tablesCreated . "\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:135

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $RED . "⚠ Warning: " . substr($error, 0, 100) . "\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:109

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Step 5: Creating tables and indexes...\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:106

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "✓ SQL file loaded\n\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:161

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "  ✓ " . $table['table_name'] . "\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/merchants.php:15

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] xss — FST_Cost_V1/login.php:169

**Açıklama:** Kullanıcı girdisi doğrudan echo ile basılıyor olabilir.

```
<input type="checkbox" id="remember_me" name="remember_me" class="form-check-input" <?php echo (isset($_POST['remember_me']) || isset($_COOKIE['remembered_username'])) ? 'checked' : ''; ?>>
```

### [HIGH] file_inclusion — FST_Cost_V1/includes/translations.php:13

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$translation_file = __DIR__ . '/../translations/' . $lang . '.json';
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/InstalledVersions.php:214

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/InstalledVersions.php:193

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/InstalledVersions.php:172

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
```

### [HIGH] file_inclusion — FST_Cost_V1/config.php:142

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
error_log("Database connection error: " . $e->getMessage());
```

### [HIGH] file_inclusion — FST_Cost_V1/config.php:146

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
die("Database connection failed: " . $e->getMessage());
```

### [HIGH] sql_injection — FST_Cost_V1/config.php:260

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT 1 FROM information_schema.columns
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:545

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
if (file_exists($file = $dir . DIRECTORY_SEPARATOR . $logicalPathPsr0)) {
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:535

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
if (file_exists($file = $dir . DIRECTORY_SEPARATOR . $logicalPathPsr0)) {
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:528

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$logicalPathPsr0 = strtr($class, '_', DIRECTORY_SEPARATOR) . $ext;
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:516

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
if (file_exists($file = $dir . DIRECTORY_SEPARATOR . $logicalPathPsr4)) {
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:506

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
if (file_exists($file = $dir . $pathEnd)) {
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:495

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$logicalPathPsr4 = strtr($class, '\\', DIRECTORY_SEPARATOR) . $ext;
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:466

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
apcu_add($this->apcuPrefix.$class, $file);
```

### [HIGH] file_inclusion — FST_Cost_V1/vendor/composer/ClassLoader.php:452

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$file = apcu_fetch($this->apcuPrefix.$class, $hit);
```

### [HIGH] sql_injection — FST_Cost_V1/vendor/autoload.php:9

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$err = 'Composer 2.3.0 dropped support for autoloading on PHP <5.6 and you are running '.PHP_VERSION.', please upgrade PHP or use Composer 2.2 LTS via "composer self-update --2.2". Aborting.'.PHP_EOL;
```

### [HIGH] xss — FST_Cost_V1/login.php:146

**Açıklama:** Kullanıcı girdisi doğrudan echo ile basılıyor olabilir.

```
<input type="text" id="username" name="username" class="form-control" placeholder="<?php echo $t_login['username'] ?? 'Username'; ?>" value="<?php echo isset($_COOKIE['remembered_username']) ? htmlspecialchars($_COOKIE['remembered_username']) : ''; ?>" required>
```

### [HIGH] file_inclusion — FST_Cost_V1/app/definitions/languages.php:14

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
header('Location: ' . $basePath . 'login.php');
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/currencies.php:207

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
// Update country's base settings (local currency code). Requires id
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:25

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Step 1: Connecting to PostgreSQL server...\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/users.php:336

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Error loading positions: ' . $e->getMessage()]);
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/currencies.php:228

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "UPDATE countries SET " . implode(', ', $setParts) . " WHERE id = $id";
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/currencies.php:220

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$setParts[] = "local_currency_code = '" . $local_currency_code . "'";
```

### [HIGH] sql_injection — FST_Cost_V1/database/create_database.php:38

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$checkDb = pg_query($postgresConn, "SELECT 1 FROM pg_database WHERE datname = '" . DB_NAME . "'");
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/locations.php:232

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$setParts[] = "local_currency_code = '" . $local_currency_code . "'";
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:237

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "UPDATE countries SET " . implode(', ', $setParts) . " WHERE id = $id";
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:258

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This country cannot be deleted because it has ' . $row['count'] . ' region(s) associated with it. Please delete all regions first.'
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/locations.php:258

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This country cannot be deleted because it has ' . $row['count'] . ' region(s) associated with it. Please delete all regions first.'
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:280

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT r.*, c.name as country_name FROM regions r LEFT JOIN countries c ON r.country_id = c.id ORDER BY r.name ASC";
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:342

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This region cannot be deleted because it has ' . $row['count'] . ' city/cities associated with it. Please delete all cities first.'
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/locations.php:342

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This region cannot be deleted because it has ' . $row['count'] . ' city/cities associated with it. Please delete all cities first.'
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:364

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT c.*, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:430

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This city cannot be deleted because it has ' . $row['count'] . ' sub region(s) associated with it. Please delete all sub regions first.'
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:37

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Step 2: Checking if database exists...\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/locations.php:430

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This city cannot be deleted because it has ' . $row['count'] . ' sub region(s) associated with it. Please delete all sub regions first.'
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:450

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:458

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT sr.*, c.name as city_name, r.name as region_name, co.name as country_name
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:41

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "⚠ Database '" . DB_NAME . "' already exists.\n" . $NC;
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/locations.php:525

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
'message' => 'This sub region cannot be deleted because it has ' . $row['count'] . ' merchant(s) associated with it. Please delete all merchants first.'
```

### [HIGH] sql_injection — FST_Cost_V1/database/create_database.php:49

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
pg_query($postgresConn, "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '" . DB_NAME . "' AND pid <> pg_backend_pid()");
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:58

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Skipping database creation...\n" . $NC;
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/currencies.php:235

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "SELECT cc.id, cc.country_id, cc.currency_code, cc.unit_name, cc.is_active, c.name as currency_name, c.symbol
```

### [HIGH] sql_injection — FST_Cost_V1/api/definitions/currencies.php:479

**Açıklama:** SQL sorgusu içinde string birleştirme veya ham kullanıcı girdisi kullanımı.

```
$query = "UPDATE country_currencies SET " . implode(', ', $setParts) . " WHERE id = $id";
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:91

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
throw new Exception("SQL file not found: " . $sqlFile);
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:87

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Step 4: Reading SQL schema file...\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:84

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "✓ Connected to database\n\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:77

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Step 3: Connecting to '" . DB_NAME . "' database...\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:71

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "✓ Database '" . DB_NAME . "' created successfully\n\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/languages.php:126

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$filePath = $langDir . $file;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/languages.php:152

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$filePath = $langDir . $code . '.json';
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/languages.php:194

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$filePath = $langDir . $code . '.json';
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/languages.php:226

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$filePath = $langDir . $code . '.json';
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/languages.php:251

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$filePath = $langDir . $code . '.json';
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/languages.php:272

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
$filePath = $langDir . $code . '.json';
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:64

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $YELLOW . "Creating database '" . DB_NAME . "'...\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/locations.php:37

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
```

### [HIGH] file_inclusion — FST_Cost_V1/database/create_database.php:56

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
echo $GREEN . "✓ Database dropped\n" . $NC;
```

### [HIGH] file_inclusion — FST_Cost_V1/api/definitions/locations.php:525

**Açıklama:** Değişkene bağlı include/require tespit edildi. RFI/LFI riski.

```
'message' => 'This sub region cannot be deleted because it has ' . $row['count'] . ' merchant(s) associated with it. Please delete all merchants first.'
```

### [INFO] i18n — FST_Cost_V1/app/definitions/positions.php:103

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<option value=""><?php echo $t_positions['loading_data'] ?? 'Yükleniyor...'; ?></option>
```

### [INFO] i18n — FST_Cost_V1/app/definitions/tours.php:129

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<label><?php echo $t_tours['tour_regions'] ?? 'Bu Turun Gerçekleştiği Bölgeler'; ?></label>
```

### [INFO] i18n — FST_Cost_V1/app/definitions/merchants.php:115

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<label><?php echo $t_merchants['operasyon_name'] ?? 'Operasyon Adı'; ?></label>
```

### [INFO] i18n — FST_Cost_V1/app/definitions/positions.php:135

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<option value=""><?php echo $t_positions['loading_data'] ?? 'Yükleniyor...'; ?></option>
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/guide.js:197

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
html += `<td>${item.location_url ? '<a href="' + encodeURI(item.location_url) + '" target="_blank" rel="noopener noreferrer" class="location-link" title="' + (tGuide.view_on_map || 'Haritada Gör') + '"><span class="material-symbols-rounded">location_on</span></a>' : '-'}</td>`;
```

### [INFO] i18n — FST_Cost_V1/app/definitions/tours.php:137

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<?php echo $t_tours['deselect_all'] ?? 'Tümünü Temizle'; ?>
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/positions.js:562

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
select.innerHTML = `<option value="">Şehir bulunamadı</option>`;
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/positions.js:569

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
select.innerHTML = `<option value="">Hata - Şehirler yüklenemedi</option>`;
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:145

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
html += `<th>${tTours.tour_regions || 'Bu Turun Gerçekleştiği Bölgeler'}</th>`;
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:527

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
if (subRegionSelect) subRegionSelect.innerHTML = '<option value="">Önce ülke, bölge ve şehir seçin</option>';
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:547

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
if (checkboxContainer) checkboxContainer.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:562

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
if (subRegionSelect) subRegionSelect.innerHTML = '<option value="">Önce ülke, bölge ve şehir seçin</option>';
```

### [INFO] i18n — FST_Cost_V1/app/definitions/tours.php:133

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<?php echo $t_tours['select_all'] ?? 'Tümünü Seç'; ?>
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:581

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
if (checkboxContainer) checkboxContainer.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:638

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
container.innerHTML = '<div class="checkbox-message">Bu şehir için alt bölge bulunamadı</div>';
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:646

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
container.innerHTML = '<div class="checkbox-message">Bölgeler yüklenirken hata oluştu</div>';
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:662

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
selectedCount.textContent = `${count} / ${total} seçili`;
```

### [INFO] i18n — FST_Cost_V1/includes/topbar.php:49

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<?php echo ($lang === 'en') ? ($all_translations['languages']['en'] ?? 'English') : ($all_translations['languages']['tr'] ?? 'Türkçe'); ?>
```

### [INFO] i18n — FST_Cost_V1/includes/topbar.php:62

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<span><?php echo $all_translations['languages']['tr'] ?? 'Türkçe'; ?></span>
```

### [INFO] i18n — FST_Cost_V1/login.php:163

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<option value="tr" <?php echo ($lang === 'tr') ? 'selected' : ''; ?>><?php echo $t_languages['tr'] ?? 'Türkçe'; ?></option>
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/definitions/tours.js:598

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
container.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/guide.js:199

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
html += `<td><span class="type-badge company">${tGuide.vehicle_company || 'Taşımacı'}</span></td>`;
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/guide.js:206

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
html += `<td><span class="type-badge user">${tGuide.user || 'Kullanıcı'}</span></td>`;
```

### [INFO] i18n — FST_Cost_V1/assets/js/toast.js:79

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<button class="btn-cancel">${tCommon.no || 'Hayır'}</button>
```

### [INFO] i18n — FST_Cost_V1/app/definitions/tours.php:143

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<input type="text" id="region_search" placeholder="<?php echo $t_tours['search_regions'] ?? 'Bölge ara...'; ?>" onkeyup="filterRegions(this.value)">
```

### [INFO] i18n — FST_Cost_V1/app/definitions/tours.php:147

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<div class="checkbox-message"><?php echo $t_tours['select_regions_first'] ?? 'Önce ülke, bölge ve şehir seçin'; ?></div>
```

### [INFO] i18n — FST_Cost_V1/assets/js/app/guide.js:163

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<th><span class="type-badge user">${tGuide.user || 'Kullanıcı'}</span></th>
```

### [INFO] i18n — FST_Cost_V1/app/definitions/languages.php:108

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
<input type="text" name="name" placeholder="<?php echo $t_lang_mgmt['language_name_placeholder'] ?? 'e.g., Deutsch, Français, Español'; ?>" required>
```

### [INFO] i18n — FST_Cost_V1/assets/js/login.js:13

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
loading: 'Yükleniyor...',
```

### [INFO] i18n — FST_Cost_V1/assets/js/login.js:14

**Açıklama:** Çeviri dosyası dışında yerelleştirilmiş sabit metin olabilir.

```
please_wait: 'Lütfen bekleyin...'
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:488

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 10px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:487

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: 10px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:455

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:338

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:337

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:4

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:335

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:456

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:334

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:454

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:457

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 9999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:453

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:489

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 10px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/users.css:336

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:422

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:10

**Açıklama:** !important aşırı kullanımı olasılığı.

```
outline: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:24

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border-color: #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:419

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:420

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:421

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:5

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background-color: #fff5f5 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:423

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:424

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 9999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:4

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:5

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background-color: #fff5f5 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:10

**Açıklama:** !important aşırı kullanımı olasılığı.

```
outline: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:444

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:445

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:446

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:447

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:448

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:449

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 9999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:564

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/merchants.css:565

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 99999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:4

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:5

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background-color: #fff5f5 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:10

**Açıklama:** !important aşırı kullanımı olasılığı.

```
outline: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:404

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:405

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:406

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:407

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:408

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/positions.css:409

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 9999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:4

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:5

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background-color: #fff5f5 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/tours.css:452

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:10

**Açıklama:** !important aşırı kullanımı olasılığı.

```
outline: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:734

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:454

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:721

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:722

**Açıklama:** !important aşırı kullanımı olasılığı.

```
box-shadow: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:723

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border-radius: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:724

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background: transparent !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:725

**Açıklama:** !important aşırı kullanımı olasılığı.

```
min-width: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:726

**Açıklama:** !important aşırı kullanımı olasılığı.

```
overflow-y: hidden !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:727

**Açıklama:** !important aşırı kullanımı olasılığı.

```
transition: height 0.4s ease !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:728

**Açıklama:** !important aşırı kullanımı olasılığı.

```
margin: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:733

**Açıklama:** !important aşırı kullanımı olasılığı.

```
height: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:10

**Açıklama:** !important aşırı kullanımı olasılığı.

```
outline: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:739

**Açıklama:** !important aşırı kullanımı olasılığı.

```
height: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:740

**Açıklama:** !important aşırı kullanımı olasılığı.

```
padding: 6px 0 6px 15px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:741

**Açıklama:** !important aşırı kullanımı olasılığı.

```
pointer-events: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:742

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: block !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:758

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:763

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:768

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: block !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/topbar.css:285

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/topbar.css:290

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/topbar.css:294

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/topbar.css:298

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:720

**Açıklama:** !important aşırı kullanımı olasılığı.

```
pointer-events: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:719

**Açıklama:** !important aşırı kullanımı olasılığı.

```
opacity: 1 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:718

**Açıklama:** !important aşırı kullanımı olasılığı.

```
padding: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:717

**Açıklama:** !important aşırı kullanımı olasılığı.

```
height: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:455

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:456

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:457

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:458

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 9999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:414

**Açıklama:** !important aşırı kullanımı olasılığı.

```
opacity: 1 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:415

**Açıklama:** !important aşırı kullanımı olasılığı.

```
pointer-events: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:460

**Açıklama:** !important aşırı kullanımı olasılığı.

```
height: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:461

**Açıklama:** !important aşırı kullanımı olasılığı.

```
padding: 6px 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:481

**Açıklama:** !important aşırı kullanımı olasılığı.

```
opacity: 1 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:482

**Açıklama:** !important aşırı kullanımı olasılığı.

```
visibility: visible !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/vehicles.css:453

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:483

**Açıklama:** !important aşırı kullanımı olasılığı.

```
pointer-events: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:492

**Açıklama:** !important aşırı kullanımı olasılığı.

```
opacity: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:493

**Açıklama:** !important aşırı kullanımı olasılığı.

```
visibility: hidden !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:494

**Açıklama:** !important aşırı kullanımı olasılığı.

```
pointer-events: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:495

**Açıklama:** !important aşırı kullanımı olasılığı.

```
transition: opacity 0s ease, visibility 0s ease !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:502

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:609

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: none !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:694

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: initial !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:695

**Açıklama:** !important aşırı kullanımı olasılığı.

```
opacity: 1 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:696

**Açıklama:** !important aşırı kullanımı olasılığı.

```
pointer-events: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:716

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: static !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/includes/sidebar.css:484

**Açıklama:** !important aşırı kullanımı olasılığı.

```
transition: opacity 0.15s ease, visibility 0.15s ease !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:5

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background-color: #fff5f5 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:429

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 9999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:402

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border-color: #2563eb !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:118

**Açıklama:** !important aşırı kullanımı olasılığı.

```
min-width: 600px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:380

**Açıklama:** !important aşırı kullanımı olasılığı.

```
margin-left: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:381

**Açıklama:** !important aşırı kullanımı olasılığı.

```
width: 100% !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:386

**Açıklama:** !important aşırı kullanımı olasılığı.

```
margin-left: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:387

**Açıklama:** !important aşırı kullanımı olasılığı.

```
width: 100% !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:413

**Açıklama:** !important aşırı kullanımı olasılığı.

```
overflow-x: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:422

**Açıklama:** !important aşırı kullanımı olasılığı.

```
min-width: 800px !important; /* Wider minimum for mobile scrolling */
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:423

**Açıklama:** !important aşırı kullanımı olasılığı.

```
width: max-content !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:431

**Açıklama:** !important aşırı kullanımı olasılığı.

```
white-space: nowrap !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:624

**Açıklama:** !important aşırı kullanımı olasılığı.

```
min-width: 700px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:3

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:4

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:5

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:6

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:7

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: 0 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:117

**Açıklama:** !important aşırı kullanımı olasılığı.

```
width: max-content !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:89

**Açıklama:** !important aşırı kullanımı olasılığı.

```
overflow-x: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/common.css:55

**Açıklama:** !important aşırı kullanımı olasılığı.

```
overflow-x: auto !important;
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/vehicles.php:15

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/locations.css:4

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border: 2px solid #dc3545 !important;
```

### [LOW] redirect_flow — FST_Cost_V1/logout.php:27

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/login.php:12

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: dashboard.php');
```

### [LOW] redirect_flow — FST_Cost_V1/index.php:12

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/index.php:10

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: dashboard.php');
```

### [LOW] redirect_flow — FST_Cost_V1/dashboard.php:10

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/guide.php:14

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:8

**Açıklama:** !important aşırı kullanımı olasılığı.

```
width: 100vw !important;
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/costs.php:14

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/currency-country.php:5

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/languages.php:14

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/locations.php:14

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/merchants.php:15

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/positions.php:15

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/tours.php:15

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/users.php:14

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] redirect_flow — FST_Cost_V1/app/definitions/currencies.php:14

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: ' . $basePath . 'login.php');
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:9

**Açıklama:** !important aşırı kullanımı olasılığı.

```
height: 100vh !important;
```

### [LOW] redirect_flow — FST_Cost_V1/login.php:99

**Açıklama:** Yönlendirme sonrası exit eksik olabilir.

```
header('Location: dashboard.php');
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:14

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 99999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:424

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:400

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background: #3b82f6 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:426

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:427

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:428

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:281

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:282

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:10

**Açıklama:** !important aşırı kullanımı olasılığı.

```
outline: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:283

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:285

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/confirm-dialog.css:11

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: flex !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:352

**Açıklama:** !important aşırı kullanımı olasılığı.

```
.toast-container { left: 10px !important; right: 10px !important; top: 10px !important; }
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:392

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background: #f3f4f6 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:395

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background: #eef2ff !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:396

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border-color: #c7d2fe !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:401

**Açıklama:** !important aşırı kullanımı olasılığı.

```
color: #fff !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/currencies.css:284

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:5

**Açıklama:** !important aşırı kullanımı olasılığı.

```
background-color: #fff5f5 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:425

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:399

**Açıklama:** !important aşırı kullanımı olasılığı.

```
white-space: nowrap !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:113

**Açıklama:** !important aşırı kullanımı olasılığı.

```
width: max-content !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:114

**Açıklama:** !important aşırı kullanımı olasılığı.

```
min-width: 1200px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:275

**Açıklama:** !important aşırı kullanımı olasılığı.

```
position: fixed !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:276

**Açıklama:** !important aşırı kullanımı olasılığı.

```
top: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:277

**Açıklama:** !important aşırı kullanımı olasılığı.

```
right: 20px !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/definitions/costs.css:4

**Açıklama:** !important aşırı kullanımı olasılığı.

```
border: 2px solid #dc3545 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:278

**Açıklama:** !important aşırı kullanımı olasılığı.

```
bottom: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:279

**Açıklama:** !important aşırı kullanımı olasılığı.

```
left: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:280

**Açıklama:** !important aşırı kullanımı olasılığı.

```
z-index: 9999 !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:296

**Açıklama:** !important aşırı kullanımı olasılığı.

```
overflow-x: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:73

**Açıklama:** !important aşırı kullanımı olasılığı.

```
overflow-x: auto !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:306

**Açıklama:** !important aşırı kullanımı olasılığı.

```
overflow: visible !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:310

**Açıklama:** !important aşırı kullanımı olasılığı.

```
min-width: 1200px !important; /* Force horizontal scroll */
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:311

**Açıklama:** !important aşırı kullanımı olasılığı.

```
width: max-content !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:312

**Açıklama:** !important aşırı kullanımı olasılığı.

```
display: table !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:320

**Açıklama:** !important aşırı kullanımı olasılığı.

```
white-space: nowrap !important;
```

### [LOW] css_smell — FST_Cost_V1/assets/css/app/guide.css:391

**Açıklama:** !important aşırı kullanımı olasılığı.

```
min-width: 1100px !important;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:234

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tUsers.select_position}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:198

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tUsers.select_department}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:853

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = '<option value="">None</option>';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:871

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = '<option value="">None</option>' + routesOptions;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:777

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
contractSelect.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:140

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
selectElement.innerHTML = `<option value="">${defaultText}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:267

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tUsers.select_country}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:189

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:309

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tUsers.select_region}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:328

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tUsers.select_city}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:352

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tUsers.select_city}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:372

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:426

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:459

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:643

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
regionSelect.innerHTML = `<option value="">${tUsers.select_region}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:726

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tTours.select_merchant || 'Select Merchant'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/users.js:285

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tUsers.select_region}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:715

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tTours.select_merchant || 'Select Merchant'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:545

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (citySelect) citySelect.innerHTML = '<option value="">Select...</option>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:590

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$name = $_GET['name'] ?? '';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:526

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (citySelect) citySelect.innerHTML = '<option value="">Select...</option>';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:527

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (subRegionSelect) subRegionSelect.innerHTML = '<option value="">Önce ülke, bölge ve şehir seçin</option>';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/merchants.php:16

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:535

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = '<option value="">Select...</option>';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:248

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:547

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (checkboxContainer) checkboxContainer.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:620

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:561

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = '<option value="">Select...</option>';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:562

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (subRegionSelect) subRegionSelect.innerHTML = '<option value="">Önce ülke, bölge ve şehir seçin</option>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:619

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$city_id = $_GET['city_id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:570

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = '<option value="">Select...</option>';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:581

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (checkboxContainer) checkboxContainer.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:617

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$name = $_GET['name'] ?? '';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:598

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = '<div class="checkbox-message">Önce ülke, bölge ve şehir seçin</div>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:593

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:610

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = '';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:638

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = '<div class="checkbox-message">Bu şehir için alt bölge bulunamadı</div>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:592

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$region_id = $_GET['region_id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:646

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = '<div class="checkbox-message">Bölgeler yüklenirken hata oluştu</div>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:566

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:322

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/languages.php:35

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:802

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tVehicles.no_cities_found || 'No cities found'}</option>`;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:85

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : 0;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:48

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/currencies.php:15

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL);
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/costs.php:111

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/costs.php:44

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/costs.php:16

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/includes/sidebar.php:43

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$currentId = $_GET['id'] ?? $_GET['contract_id'] ?? $_GET['user_id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/logout.php:17

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
if (isset($_COOKIE['remembered_username'])) {
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:93

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : 0;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/login.php:169

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
<input type="checkbox" id="remember_me" name="remember_me" class="form-check-input" <?php echo (isset($_POST['remember_me']) || isset($_COOKIE['remembered_username'])) ? 'checked' : ''; ?>>
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:525

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = '<option value="">Select...</option>';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/login.php:79

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
if (isset($_POST['remember_me']) && $_POST['remember_me'] === 'on') {
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/login.php:35

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$password = trim($_POST['password'] ?? '');
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/login.php:34

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$username = trim($_POST['username'] ?? '');
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/login.php:17

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$lang = $_GET['lang'] ?? $_SESSION['language'] ?? 'en';
```

### [MEDIUM] debug_mode — FST_Cost_V1/config.php:77

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
```

### [MEDIUM] debug_mode — FST_Cost_V1/config.php:72

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
ini_set('display_errors', 1);
```

### [MEDIUM] debug_mode — FST_Cost_V1/config.php:69

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL);
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/includes/translations.php:31

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$current_lang = $_GET['lang'] ?? $_SESSION['language'] ?? 'en';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:98

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$start = $_GET['start'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:99

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$end = $_GET['end'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:156

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:809

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tVehicles.error_cities_load || 'Error loading cities'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:821

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tVehicles.select_dept || 'Select Vehicle Company'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:835

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tVehicles.select_dept || 'Select Vehicle Company'}</option>`;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:565

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$country_id = $_GET['country_id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:563

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$name = $_GET['name'] ?? '';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:545

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:543

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$name = $_GET['name'] ?? '';
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:152

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:98

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:94

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$region_id = isset($_GET['region_id']) ? (int)$_GET['region_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:90

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/locations.php:43

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/locations.php:15

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/languages.php:108

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$code = $_GET['code'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/languages.php:95

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$code = $_GET['code'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/languages.php:66

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$code = $_GET['code'] ?? null;
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/languages.php:15

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:173

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$date = $_GET['date'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/currencies.php:172

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : 0;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/vehicles.js:793

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tVehicles.select_city || 'Select City'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:503

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = '<option value="">Select...</option>';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:467

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:222

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:113

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:109

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$region_id = isset($_GET['region_id']) ? (int)$_GET['region_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:105

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/common.js:225

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
btn.innerHTML = `<span class="material-symbols-rounded">${action.icon}</span>`;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:70

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/tours.php:16

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/login.js:72

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('loading');
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/toast.js:31

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
toast.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/toast.js:69

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
overlay.innerHTML = `
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/positions.php:125

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/guide.js:107

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/positions.php:83

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$dept_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/guide.js:179

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/positions.php:79

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/positions.php:44

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/positions.php:16

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/guide.js:231

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/guide.js:263

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
toast.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/costs.js:90

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:117

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$sub_region_id = isset($_GET['sub_region_id']) ? (int)$_GET['sub_region_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:127

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$contract_id = isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:131

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$tour_id = isset($_GET['tour_id']) ? (int)$_GET['tour_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/tours.php:173

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/app/definitions/currency-country.php:12

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$countryId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/vehicles.php:628

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$vehicle_company_id = (int)$_POST['vehicle_company_id'];
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/vehicles.php:422

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$contract_id = isset($_GET['id']) ? (int)$_GET['id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/vehicles.php:146

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/vehicles.php:94

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$company_id = isset($_GET['company_id']) ? (int)$_GET['company_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/vehicles.php:90

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$company_id = isset($_GET['company_id']) ? (int)$_GET['company_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/vehicles.php:86

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/vehicles.php:48

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/vehicles.php:16

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/costs.js:146

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:462

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:239

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$region_id = isset($_GET['region_id']) ? (int)$_GET['region_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:181

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:180

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$username = trim($_GET['username'] ?? '');
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:132

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:96

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$department_id = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:89

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$country_id = isset($_GET['country_id']) ? (int)$_GET['country_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:82

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$city_id = isset($_GET['city_id']) ? (int)$_GET['city_id'] : null;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:44

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] debug_mode — FST_Cost_V1/api/definitions/users.php:16

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(E_ALL); // Still log errors but don't display
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/users.php:461

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$username = pg_escape_string($conn, $_GET['username'] ?? '');
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:487

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tTours.select_sub_region || 'Select Sub Region'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/costs.js:174

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currencies.js:137

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
tbody.innerHTML = data.map(country => `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:1078

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
toast.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/merchants.js:92

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/merchants.js:160

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/merchants.js:198

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/merchants.js:418

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tMerchants.select_sub_region || 'Select Sub Region'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/merchants.js:443

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
toast.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:138

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:183

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:245

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:553

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tPos.select_city || 'Select City'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:562

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">Şehir bulunamadı</option>`;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/merchants.php:162

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$id = $_GET['id'] ?? null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:569

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">Hata - Şehirler yüklenemedi</option>`;
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/merchants.php:126

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$sub_region_id = isset($_GET['sub_region_id']) ? (int)$_GET['sub_region_id'] : null;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:581

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tPos.select_dept || 'Select Department'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/positions.js:612

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
toast.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:112

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] unsanitized_input — FST_Cost_V1/api/definitions/merchants.php:77

**Açıklama:** Kullanıcı girdisi işlenmeden kullanılıyor olabilir.

```
$action = $_GET['action'] ?? '';
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/tours.js:186

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:850

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tLoc.select_currency || 'Select currency'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:833

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tLoc.select_city || 'Select City'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:816

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tLoc.select_region || 'Select Region'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:802

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
select.innerHTML = `<option value="">${tLoc.select_country || 'Select Country'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currencies.js:158

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
body.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currencies.js:215

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
sel.innerHTML = `<option value="">${tCurrencies.select_currency || 'Select currency'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currencies.js:229

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
sel.innerHTML = `<option value="">${tCurrencies.select_currency || 'Select currency'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currencies.js:266

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">inventory_2</span><h3>${tCurrencies.no_country_currencies || 'No currencies assigned'}</h3></div>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currencies.js:289

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:42

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
ratesContainer.innerHTML = `<div class="loading"><span class="material-symbols-rounded">sync</span><p>${tCommon.loading||'Loading...'}</p></div>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:214

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
picker.innerHTML = header + grids;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:293

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
sel.innerHTML = `<option value="">${tCurrencies.select_currency||'Select currency'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:308

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
sel.innerHTML = `<option value="">${tCurrencies.select_currency||'Select currency'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currencies.js:126

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
tbody.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:325

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
sel.innerHTML = `<option value="">${tCurrencies.select_currency||'Select currency'}</option>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:548

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
list.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:613

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (!countryCurrencies.length) { container.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">inventory_2</span><h3>${tCurrencies.no_country_currencies||'No currencies assigned'}</h3></div>`; return; }
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:635

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/languages.js:115

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html || `<p style="color: #9ca3af;">${tLangMgmt.no_languages || 'No languages found'}</p>`;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/languages.js:186

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/languages.js:356

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
document.getElementById('editor-content').innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:142

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:199

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = html;
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/locations.js:293

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
container.innerHTML = `
```

### [MEDIUM] dom_xss — FST_Cost_V1/assets/js/app/definitions/currency-country.js:442

**Açıklama:** innerHTML ataması var. Kaynak güvenli mi?

```
if (dates.length === 0) { container.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">inventory_2</span><h3>${tCurrencies.no_rates||'No rates'}</h3></div>`; return; }
```

### [MEDIUM] debug_mode — FST_Cost_V1/config.php:65

**Açıklama:** Hata gösterimi/raporlama üretimde açık olabilir.

```
error_reporting(0);
```
