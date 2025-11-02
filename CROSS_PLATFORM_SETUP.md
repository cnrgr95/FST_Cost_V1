# Cross-Platform Compatibility Guide

## 🌍 Platform Support

FST Cost Management System is now fully cross-platform compatible and works on:

- ✅ **Windows** (Laragon, XAMPP, standalone PHP)
- ✅ **Linux** (Ubuntu, Debian, CentOS, RHEL, etc.)
- ✅ **macOS** (Homebrew, MAMP, XAMPP)
- ✅ **BSD** (FreeBSD, OpenBSD)
- ✅ **Cloud Platforms** (AWS, Azure, Google Cloud, DigitalOcean)

## 🚀 Platform-Specific Features

### Windows
- Automatic PHP detection in Laragon, XAMPP
- PowerShell and Batch installation scripts
- Automatic path normalization (handles backslashes)

### Linux/Unix
- Standard POSIX permissions (755/644)
- Supports all common package managers
- Automatic executable detection via `which`

### macOS
- Homebrew integration
- MAMP support
- Automatic path resolution

## 📋 Configuration

### Environment Variables (.env)

All platform-specific settings can be configured via `.env` file:

```env
# Application Environment
APP_ENV=production          # development, production, testing
APP_DEBUG=false             # true/false
APP_TIMEZONE=Europe/Istanbul  # Any valid PHP timezone

# Database Configuration
DB_HOST=localhost           # Database host
DB_PORT=5432                # Database port
DB_NAME=fst_cost_db         # Database name
DB_USER=postgres            # Database user
DB_PASS=your_password       # Database password

# Session Configuration
SESSION_LIFETIME=7200       # Session lifetime in seconds (60-86400)
```

### Automatic Features

The system automatically:

1. **Detects Platform** - Identifies Windows, Linux, macOS
2. **Normalizes Paths** - Converts all path separators appropriately
3. **Sets Permissions** - Uses platform-appropriate file permissions
4. **Finds Executables** - Locates PHP, Composer, pg_dump automatically
5. **Configures Timezone** - Falls back to system timezone if not specified
6. **Handles Encoding** - Ensures UTF-8 throughout the system

## 🔧 Platform Helper Functions

New `includes/platform_helper.php` provides:

- `createDirectory()` - Platform-aware directory creation
- `normalizePath()` - Path separator normalization
- `findExecutable()` - Cross-platform executable discovery
- `findComposer()` - Automatic Composer location
- `isWindows()` / `isUnix()` - Platform detection
- `isDirectoryWritable()` - Reliable writable check
- `getSystemTimezone()` - Automatic timezone detection

## 📝 Installation

### Windows
```powershell
.\scripts\install_dependencies.ps1
```

### Linux/macOS
```bash
composer install
# or
php composer.phar install
```

## 🔍 Database Connection

The system now includes:

- **Automatic Retry Logic** - Retries failed connections up to 3 times
- **Connection Timeout** - 5-second timeout prevents hanging
- **UTF-8 Encoding** - Ensures proper character handling
- **Error Handling** - Platform-appropriate error messages

## ⚙️ File Permissions

### Automatic Permission Handling

The system automatically sets appropriate permissions:

- **Windows**: Uses default Windows permissions (null)
- **Linux/Unix**: Uses 755 for directories, 644 for files

### Manual Permission Setup (Linux/Unix)

```bash
chmod 755 logs uploads
chmod 644 .env
```

## 🔐 Security

### Production Checklist

1. ✅ Set `APP_ENV=production` in `.env`
2. ✅ Set `APP_DEBUG=false` in `.env`
3. ✅ Set secure `DB_PASS` in `.env`
4. ✅ Protect `.env` file (chmod 600 on Linux)
5. ✅ Remove or protect `check_requirements.php`
6. ✅ Remove or protect `setup_env.php`

### Platform-Specific Security

- **Windows**: File permissions are managed by Windows ACL
- **Linux/Unix**: Use chmod for file permissions
- **All Platforms**: `.env` should never be in version control

## 🌐 Server Configuration

### Apache (.htaccess)

The `.htaccess` file is included and works on all platforms.

### Nginx

For Nginx, add to your server block:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}
```

### PHP-FPM

Ensure `php-fpm` is configured for your platform.

## 🐛 Troubleshooting

### Common Issues

1. **Path Separator Issues**
   - ✅ Fixed: System now uses `DIRECTORY_SEPARATOR` everywhere

2. **Permission Denied**
   - ✅ Fixed: Platform helper handles permissions automatically
   - Manual: Check `logs/` and `uploads/` are writable

3. **Composer Not Found**
   - ✅ Fixed: `findComposer()` auto-detects Composer
   - Manual: Place `composer.phar` in project root

4. **Database Connection Timeout**
   - ✅ Fixed: 5-second timeout with retry logic
   - Manual: Check `DB_HOST`, `DB_PORT` in `.env`

5. **Timezone Warnings**
   - ✅ Fixed: Auto-detects system timezone
   - Manual: Set `APP_TIMEZONE` in `.env`

## 📚 Additional Resources

- See `README.md` for general installation instructions
- See `QUICK_START.md` for quick setup guide
- See `SERVER_SETUP.md` for server-specific configuration
- See `check_requirements.php` to verify your environment

## ✅ Testing

Run the requirements checker:

```
http://localhost/FST_Cost_V1/check_requirements.php
```

This will verify:
- PHP version and extensions
- Directory permissions
- Database connectivity
- Platform-specific settings

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0

