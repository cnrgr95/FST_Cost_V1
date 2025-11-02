# FST Cost Management - Kod Standartları ve Best Practices

## 📋 Genel Prensipler

### 1. Güvenlik (Security First)
- ✅ **SQL Injection:** Tüm SQL sorguları prepared statements (`pg_query_params`) kullanmalı
- ✅ **XSS:** Tüm user input'ları `h()` fonksiyonu ile escape edilmeli
- ✅ **CSRF:** Tüm state-changing request'lerde CSRF token kontrolü zorunlu
- ✅ **Authentication:** Session kontrolü tüm protected endpoint'lerde yapılmalı

### 2. Çeviri Sistemi (i18n)
- ✅ **Hardcoded Strings:** Kullanıcıya gösterilen tüm metinler çeviri sisteminde olmalı
- ✅ **API Messages:** API hata/success mesajları `api_validation` section'ından çekilmeli
- ✅ **Translation Keys:** Translation key'ler snake_case formatında olmalı

### 3. Error Handling
- ✅ **Consistent Errors:** API error'ları `ApiHelper::sendApiError()` kullanmalı
- ✅ **Logging:** Tüm hatalar `error_log()` ile loglanmalı
- ✅ **User Messages:** Production'da teknik detaylar gösterilmemeli

### 4. Code Quality
- ✅ **DRY Principle:** Kod tekrarlarından kaçınılmalı, helper functions kullanılmalı
- ✅ **Documentation:** Tüm fonksiyonlarda PHPDoc/JSDoc yorumları olmalı
- ✅ **Naming:** Değişken ve fonksiyon isimleri açıklayıcı olmalı

### 5. Performance
- ✅ **Debug Code:** Production'da console.log'lar `DEBUG_MODE` kontrolü ile sarılmalı
- ✅ **Lazy Loading:** Büyük resource'lar lazy load edilmeli
- ✅ **Caching:** Static content için cache headers kullanılmalı

## 🎯 Kod Örnekleri

### PHP - API Endpoint
```php
<?php
// Load API helper
require_once __DIR__ . '/../../includes/ApiHelper.php';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    sendApiError('unauthorized', 401);
}

// Validate CSRF
if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
    requireCsrfToken();
}

// Use translations
sendApiError('invalid_action', 400);
```

### JavaScript - Translation Usage
```javascript
// ✅ DO: Use translation system
const message = getTranslation('common', 'save', 'Save');
showToast('success', message);

// ❌ DON'T: Hardcoded strings
showToast('success', 'Saved');
```

### PHP - Output Escaping
```php
// ✅ DO: Escape output
echo h($userInput);

// ❌ DON'T: Direct output
echo $userInput;
```

### SQL - Prepared Statements
```php
// ✅ DO: Use prepared statements
$query = "SELECT * FROM users WHERE id = $1";
$result = pg_query_params($conn, $query, [$userId]);

// ❌ DON'T: String concatenation
$query = "SELECT * FROM users WHERE id = " . $userId;
$result = pg_query($conn, $query);
```

## 📁 Dosya Organizasyonu

### API Dosyaları
- `api/definitions/*.php` - CRUD operations
- `includes/ApiHelper.php` - Common API utilities
- `includes/BaseApiController.php` - Base controller class

### Frontend
- `assets/js/app/definitions/*.js` - Page-specific scripts
- `assets/js/common.js` - Shared utilities
- `assets/css/app/definitions/*.css` - Page-specific styles
- `assets/css/common.css` - Shared styles

### Translations
- `translations/en.json` - English translations
- `translations/tr.json` - Turkish translations
- `includes/translations.php` - Translation loader

## 🔍 Code Review Checklist

- [ ] SQL queries use prepared statements
- [ ] User input is escaped before output
- [ ] CSRF tokens validated for state-changing requests
- [ ] All user-facing strings use translation system
- [ ] Error messages use translation system
- [ ] Debug code is wrapped in DEBUG_MODE checks
- [ ] Functions have proper documentation
- [ ] Code follows DRY principle
- [ ] No hardcoded credentials or sensitive data
- [ ] Proper error handling and logging

## 🚀 Performance Guidelines

1. **Minimize HTTP Requests:** Combine CSS/JS where possible
2. **Lazy Load:** Load non-critical resources asynchronously
3. **Cache Headers:** Set appropriate cache headers for static assets
4. **Database:** Use indexes, optimize queries
5. **JavaScript:** Avoid blocking operations, use async/await

## 📚 Documentation Standards

### PHP Functions
```php
/**
 * Short description
 * 
 * @param type $param Description
 * @return type Description
 * @throws Exception Description
 */
```

### JavaScript Functions
```javascript
/**
 * Short description
 * @param {type} param Description
 * @returns {type} Description
 */
```

## ✅ Testing Guidelines

1. Test all CRUD operations
2. Test authentication/authorization
3. Test CSRF protection
4. Test input validation
5. Test error handling
6. Test translations (both languages)

---

**Son Güncelleme:** 2024-01-XX  
**Versiyon:** 1.0.0

