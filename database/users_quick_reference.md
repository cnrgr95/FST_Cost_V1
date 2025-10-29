# Örnek Kullanıcılar - Hızlı Referans

Bu dosya, sisteme giriş yapabileceğiniz örnek kullanıcıları listeler.

## ⚠️ ŞİFRESİZ GİRİŞ
Sistem şifresiz giriş kullanmaktadır. Sadece kullanıcı adını girerek giriş yapabilirsiniz.

## 👥 Örnek Kullanıcılar

### 1. John Doe (IT Manager - Istanbul)
- **Kullanıcı Adı:** `john.doe`
- **Tam Ad:** John Doe
- **Şehir:** Istanbul
- **Departman:** IT Department
- **Email:** john.doe@fstcost.com
- **Telefon:** +90 212 555 0101
- **Durum:** Active

### 2. Jane Smith (HR Manager - Istanbul)
- **Kullanıcı Adı:** `jane.smith`
- **Tam Ad:** Jane Smith
- **Şehir:** Istanbul
- **Departman:** Human Resources
- **Email:** jane.smith@fstcost.com
- **Telefon:** +90 212 555 0102
- **Durum:** Active

### 3. Ahmet Yılmaz (Finance Manager - Ankara)
- **Kullanıcı Adı:** `ahmet.yilmaz`
- **Tam Ad:** Ahmet Yılmaz
- **Şehir:** Ankara
- **Departman:** Finance Department
- **Email:** ahmet.yilmaz@fstcost.com
- **Telefon:** +90 312 555 0201
- **Durum:** Active

### 4. Anna Müller (Operations Manager - Munich)
- **Kullanıcı Adı:** `anna.mueller`
- **Tam Ad:** Anna Müller
- **Şehir:** Munich
- **Departman:** Operations
- **Email:** anna.mueller@fstcost.com
- **Telefon:** +49 89 555 0301
- **Durum:** Active

## 🚀 Kullanım

Giriş yapmak için:
1. Login sayfasına gidin
2. **Sadece kullanıcı adını** girin (şifre gerekmez)
3. "Remember Me" kutusunu işaretleyebilirsiniz
4. Giriş butonuna tıklayın

## 📋 Örnek Giriş Komutları

```
Kullanıcı Adı: john.doe
Kullanıcı Adı: jane.smith
Kullanıcı Adı: ahmet.yilmaz
Kullanıcı Adı: anna.mueller
```

## 💡 Notlar

- Tüm kullanıcılar aktif durumda (`status = 'active'`)
- Şifre kontrolü yapılmamaktadır (LDAP entegrasyonu için hazır)
- Üretim ortamında LDAP/Active Directory ile entegre edilecektir
- Demo amaçlı şifresiz giriş kullanılmaktadır

## 🔍 Veritabanından Kontrol

Kullanıcıları veritabanından kontrol etmek için:

```sql
SELECT 
    username,
    full_name,
    email,
    phone,
    status,
    d.name as department,
    c.name as city
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN cities c ON u.city_id = c.id
ORDER BY username;
```

