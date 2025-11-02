<?php
/**
 * Universal Database Backup Script - Multi-language Support
 * PostgreSQL Full Backup (Schema + Data + Blobs + Globals)
 * 
 * Supports: Windows, Linux, macOS
 * Languages: Turkish, English, German, French, Spanish, Italian
 * 
 * Usage:
 *   php backup_database.php
 *   php backup_database.php --format=sql
 *   php backup_database.php --format=custom --compress
 */

// Allow web access for interface (security handled in web section)
// Web interface is safe as it only runs backup when explicitly requested

// Set UTF-8 encoding
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');
if (php_sapi_name() === 'cli') {
    // Try to set console encoding (Windows)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        @exec('chcp 65001 >nul 2>&1');
    }
}

// Load configuration
require_once __DIR__ . '/../../config.php';

// Detect language
function detectLanguage() {
    // Try to detect from system
    $lang = 'en';
    
    if (php_sapi_name() === 'cli') {
        // CLI: Try environment variable or system locale
        $lang = getenv('LANG') ?: getenv('LC_ALL') ?: 'en';
        if (strpos($lang, 'tr') !== false) $lang = 'tr';
        elseif (strpos($lang, 'de') !== false) $lang = 'de';
        elseif (strpos($lang, 'fr') !== false) $lang = 'fr';
        elseif (strpos($lang, 'es') !== false) $lang = 'es';
        elseif (strpos($lang, 'it') !== false) $lang = 'it';
        else $lang = 'en';
    } else {
        // Web: Try browser language
        $acceptLang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'en';
        if (stripos($acceptLang, 'tr') !== false) $lang = 'tr';
        elseif (stripos($acceptLang, 'de') !== false) $lang = 'de';
        elseif (stripos($acceptLang, 'fr') !== false) $lang = 'fr';
        elseif (stripos($acceptLang, 'es') !== false) $lang = 'es';
        elseif (stripos($acceptLang, 'it') !== false) $lang = 'it';
        else $lang = 'en';
    }
    
    // Override from command line argument
    if (php_sapi_name() === 'cli') {
        $options = getopt('', ['lang::']);
        if (isset($options['lang'])) {
            $lang = $options['lang'];
        }
    }
    
    return in_array($lang, ['tr', 'en', 'de', 'fr', 'es', 'it']) ? $lang : 'en';
}

$lang = detectLanguage();

// Translations
$translations = [
    'tr' => [
        'title' => 'Veritabanı Yedekleme',
        'starting' => 'Veritabanı yedekleme başlatılıyor...',
        'reading_config' => 'Yapılandırma okunuyor...',
        'database' => 'Veritabanı',
        'backup_file' => 'Yedek dosyası',
        'backup_success' => '✓ Yedekleme başarılı!',
        'backup_failed' => '✗ Yedekleme başarısız!',
        'creating_directory' => 'Yedek klasörü oluşturuluyor...',
        'executing_dump' => 'Veritabanı dökümü çıkarılıyor...',
        'compressing' => 'Sıkıştırılıyor...',
        'completed' => 'Tamamlandı',
        'error' => 'Hata',
        'file_size' => 'Dosya boyutu',
        'location' => 'Konum',
        'backup_info' => 'Yedek bilgileri',
        'timestamp' => 'Zaman damgası',
        'format' => 'Format',
        'missing_pg_dump' => 'pg_dump bulunamadı. PostgreSQL client tools kurulu olmalı.',
        'missing_config' => 'Yapılandırma dosyası bulunamadı.',
        'connection_failed' => 'Veritabanı bağlantısı başarısız',
        'directory_creation_failed' => 'Yedek klasörü oluşturulamadı',
        'dump_failed' => 'Veritabanı dökümü başarısız',
        'compression_failed' => 'Sıkıştırma başarısız',
        'bytes' => 'bayt',
        'kb' => 'KB',
        'mb' => 'MB',
        'gb' => 'GB',
        'back' => 'Geri',
        'download_backup' => 'Yedek İndir',
        'create_new_backup' => 'Yeni Yedek Oluştur',
        'existing_backups' => 'Mevcut Yedekler',
        'download' => 'İndir',
        'actions' => 'İşlemler',
        'no_backups_yet' => 'Henüz yedek bulunmuyor',
        'compressed' => 'Sıkıştırılmış',
        'backup_files' => 'Yedek dosyaları',
        'files' => 'dosya'
    ],
    'en' => [
        'title' => 'Database Backup',
        'starting' => 'Starting database backup...',
        'reading_config' => 'Reading configuration...',
        'database' => 'Database',
        'backup_file' => 'Backup file',
        'backup_success' => '✓ Backup successful!',
        'backup_failed' => '✗ Backup failed!',
        'creating_directory' => 'Creating backup directory...',
        'executing_dump' => 'Executing database dump...',
        'compressing' => 'Compressing...',
        'completed' => 'Completed',
        'error' => 'Error',
        'file_size' => 'File size',
        'location' => 'Location',
        'backup_info' => 'Backup information',
        'timestamp' => 'Timestamp',
        'format' => 'Format',
        'missing_pg_dump' => 'pg_dump not found. PostgreSQL client tools must be installed.',
        'missing_config' => 'Configuration file not found.',
        'connection_failed' => 'Database connection failed',
        'directory_creation_failed' => 'Failed to create backup directory',
        'dump_failed' => 'Database dump failed',
        'compression_failed' => 'Compression failed',
        'bytes' => 'bytes',
        'kb' => 'KB',
        'mb' => 'MB',
        'gb' => 'GB',
        'back' => 'Back',
        'download_backup' => 'Download Backup',
        'create_new_backup' => 'Create New Backup',
        'existing_backups' => 'Existing Backups',
        'download' => 'Download',
        'actions' => 'Actions',
        'no_backups_yet' => 'No backups yet',
        'compressed' => 'Compressed',
        'backup_files' => 'Backup files',
        'files' => 'files'
    ],
    'de' => [
        'title' => 'Datenbanksicherung',
        'starting' => 'Datenbanksicherung wird gestartet...',
        'reading_config' => 'Konfiguration wird gelesen...',
        'database' => 'Datenbank',
        'backup_file' => 'Sicherungsdatei',
        'backup_success' => '✓ Sicherung erfolgreich!',
        'backup_failed' => '✗ Sicherung fehlgeschlagen!',
        'creating_directory' => 'Sicherungsverzeichnis wird erstellt...',
        'executing_dump' => 'Datenbankdump wird ausgeführt...',
        'compressing' => 'Wird komprimiert...',
        'completed' => 'Abgeschlossen',
        'error' => 'Fehler',
        'file_size' => 'Dateigröße',
        'location' => 'Speicherort',
        'backup_info' => 'Sicherungsinformationen',
        'timestamp' => 'Zeitstempel',
        'format' => 'Format',
        'missing_pg_dump' => 'pg_dump nicht gefunden. PostgreSQL Client-Tools müssen installiert sein.',
        'missing_config' => 'Konfigurationsdatei nicht gefunden.',
        'connection_failed' => 'Datenbankverbindung fehlgeschlagen',
        'directory_creation_failed' => 'Sicherungsverzeichnis konnte nicht erstellt werden',
        'dump_failed' => 'Datenbankdump fehlgeschlagen',
        'compression_failed' => 'Komprimierung fehlgeschlagen',
        'bytes' => 'Bytes',
        'kb' => 'KB',
        'mb' => 'MB',
        'gb' => 'GB'
    ],
    'fr' => [
        'title' => 'Sauvegarde de la base de données',
        'starting' => 'Démarrage de la sauvegarde...',
        'reading_config' => 'Lecture de la configuration...',
        'database' => 'Base de données',
        'backup_file' => 'Fichier de sauvegarde',
        'backup_success' => '✓ Sauvegarde réussie!',
        'backup_failed' => '✗ Sauvegarde échouée!',
        'creating_directory' => 'Création du répertoire de sauvegarde...',
        'executing_dump' => 'Exécution du dump de la base de données...',
        'compressing' => 'Compression...',
        'completed' => 'Terminé',
        'error' => 'Erreur',
        'file_size' => 'Taille du fichier',
        'location' => 'Emplacement',
        'backup_info' => 'Informations de sauvegarde',
        'timestamp' => 'Horodatage',
        'format' => 'Format',
        'missing_pg_dump' => 'pg_dump introuvable. Les outils client PostgreSQL doivent être installés.',
        'missing_config' => 'Fichier de configuration introuvable.',
        'connection_failed' => 'Échec de la connexion à la base de données',
        'directory_creation_failed' => 'Impossible de créer le répertoire de sauvegarde',
        'dump_failed' => 'Échec du dump de la base de données',
        'compression_failed' => 'Échec de la compression',
        'bytes' => 'octets',
        'kb' => 'Ko',
        'mb' => 'Mo',
        'gb' => 'Go'
    ],
    'es' => [
        'title' => 'Respaldo de base de datos',
        'starting' => 'Iniciando respaldo de base de datos...',
        'reading_config' => 'Leyendo configuración...',
        'database' => 'Base de datos',
        'backup_file' => 'Archivo de respaldo',
        'backup_success' => '✓ ¡Respaldo exitoso!',
        'backup_failed' => '✗ ¡Respaldo fallido!',
        'creating_directory' => 'Creando directorio de respaldo...',
        'executing_dump' => 'Ejecutando volcado de base de datos...',
        'compressing' => 'Comprimiendo...',
        'completed' => 'Completado',
        'error' => 'Error',
        'file_size' => 'Tamaño del archivo',
        'location' => 'Ubicación',
        'backup_info' => 'Información de respaldo',
        'timestamp' => 'Marca de tiempo',
        'format' => 'Formato',
        'missing_pg_dump' => 'pg_dump no encontrado. Las herramientas cliente de PostgreSQL deben estar instaladas.',
        'missing_config' => 'Archivo de configuración no encontrado.',
        'connection_failed' => 'Falló la conexión a la base de datos',
        'directory_creation_failed' => 'No se pudo crear el directorio de respaldo',
        'dump_failed' => 'Falló el volcado de la base de datos',
        'compression_failed' => 'Falló la compresión',
        'bytes' => 'bytes',
        'kb' => 'KB',
        'mb' => 'MB',
        'gb' => 'GB'
    ],
    'it' => [
        'title' => 'Backup del database',
        'starting' => 'Avvio backup del database...',
        'reading_config' => 'Lettura configurazione...',
        'database' => 'Database',
        'backup_file' => 'File di backup',
        'backup_success' => '✓ Backup completato!',
        'backup_failed' => '✗ Backup fallito!',
        'creating_directory' => 'Creazione directory di backup...',
        'executing_dump' => 'Esecuzione dump del database...',
        'compressing' => 'Compressione...',
        'completed' => 'Completato',
        'error' => 'Errore',
        'file_size' => 'Dimensione file',
        'location' => 'Posizione',
        'backup_info' => 'Informazioni backup',
        'timestamp' => 'Timestamp',
        'format' => 'Formato',
        'missing_pg_dump' => 'pg_dump non trovato. Gli strumenti client PostgreSQL devono essere installati.',
        'missing_config' => 'File di configurazione non trovato.',
        'connection_failed' => 'Connessione al database fallita',
        'directory_creation_failed' => 'Impossibile creare la directory di backup',
        'dump_failed' => 'Dump del database fallito',
        'compression_failed' => 'Compressione fallita',
        'bytes' => 'bytes',
        'kb' => 'KB',
        'mb' => 'MB',
        'gb' => 'GB'
    ]
];

$t = $translations[$lang] ?? $translations['en'];

// Translation helper
function t($key) {
    global $t;
    return $t[$key] ?? $key;
}

// Format file size
function formatBytes($bytes, $decimals = 2) {
    global $t;
    $size = (int)$bytes;
    $unit = $t['bytes'];
    
    if ($size >= 1073741824) {
        $size = number_format($size / 1073741824, $decimals);
        $unit = $t['gb'];
    } elseif ($size >= 1048576) {
        $size = number_format($size / 1048576, $decimals);
        $unit = $t['mb'];
    } elseif ($size >= 1024) {
        $size = number_format($size / 1024, $decimals);
        $unit = $t['kb'];
    } else {
        $size = number_format($size, $decimals);
    }
    
    return $size . ' ' . $unit;
}

// Load platform helper if available
if (file_exists(__DIR__ . '/../../includes/platform_helper.php')) {
    require_once __DIR__ . '/../../includes/platform_helper.php';
}

// Find pg_dump executable
function findPgDump() {
    $pgDump = 'pg_dump'; // Default: assume in PATH
    
    // Use platform helper if available
    if (function_exists('findExecutable')) {
        $commonPaths = [];
        if (function_exists('isWindows') && isWindows()) {
            $commonPaths = [
                'C:\\laragon\\bin\\postgresql\\postgresql\\bin',
                'C:\\Program Files\\PostgreSQL\\16\\bin',
                'C:\\Program Files\\PostgreSQL\\15\\bin',
                'C:\\Program Files\\PostgreSQL\\14\\bin',
                'C:\\Program Files\\PostgreSQL\\13\\bin',
                'C:\\Program Files\\PostgreSQL\\12\\bin',
                'C:\\Program Files (x86)\\PostgreSQL\\16\\bin',
                'C:\\Program Files (x86)\\PostgreSQL\\15\\bin',
                'C:\\Program Files (x86)\\PostgreSQL\\14\\bin',
            ];
        } else {
            $commonPaths = [
                '/usr/bin',
                '/usr/local/bin',
                '/opt/local/bin',
                '/usr/local/pgsql/bin',
            ];
        }
        
        $found = findExecutable('pg_dump', $commonPaths);
        if ($found) {
            return $found;
        }
    }
    
    // Windows paths
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        $commonPaths = [
            'C:\\laragon\\bin\\postgresql\\postgresql\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
            'C:\\Program Files\\PostgreSQL\\12\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_dump.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\pg_dump.exe',
        ];
        
        foreach ($commonPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        
        // Try to find in PATH
        $output = [];
        @exec('where pg_dump 2>nul', $output);
        if (!empty($output) && file_exists(trim($output[0]))) {
            return trim($output[0]);
        }
    } else {
        // Unix/Linux/Mac paths
        $commonPaths = [
            '/usr/bin/pg_dump',
            '/usr/local/bin/pg_dump',
            '/opt/homebrew/bin/pg_dump',
            '/usr/local/pgsql/bin/pg_dump',
        ];
        
        foreach ($commonPaths as $path) {
            if (file_exists($path) && is_executable($path)) {
                return $path;
            }
        }
        
        // Try which command
        $output = [];
        @exec('which pg_dump 2>/dev/null', $output);
        if (!empty($output) && file_exists(trim($output[0]))) {
            return trim($output[0]);
        }
    }
    
    return $pgDump; // Return default (hopefully in PATH)
}

// Main backup function
function runBackup($format = 'custom', $compress = true) {
    global $t, $lang;
    
    $startTime = microtime(true);
    
    // Check if config is loaded
    if (!defined('DB_HOST') || !defined('DB_NAME')) {
        echo t('missing_config') . PHP_EOL;
        return false;
    }
    
    // Find pg_dump
    $pgDump = findPgDump();
    if (!file_exists($pgDump) && $pgDump === 'pg_dump') {
        // Try to execute to see if it's in PATH
        $test = [];
        @exec('pg_dump --version 2>&1', $test);
        if (empty($test)) {
            echo t('missing_pg_dump') . PHP_EOL;
            return false;
        }
    }
    
    // Create backup directory with platform helper
    $backupDir = __DIR__;
    if (!is_dir($backupDir)) {
        if (function_exists('createDirectory')) {
            if (!createDirectory($backupDir, getDefaultDirMode(), true)) {
                echo t('directory_creation_failed') . ': ' . $backupDir . PHP_EOL;
                return false;
            }
        } else {
            // Fallback if platform helper not available
            $mode = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? null : 0755;
            if ($mode !== null) {
                if (!@mkdir($backupDir, $mode, true)) {
                    echo t('directory_creation_failed') . ': ' . $backupDir . PHP_EOL;
                    return false;
                }
            } else {
                if (!@mkdir($backupDir, true)) {
                    echo t('directory_creation_failed') . ': ' . $backupDir . PHP_EOL;
                    return false;
                }
            }
        }
    }
    
    // Generate timestamp
    $timestamp = date('Ymd_His');
    $dbName = DB_NAME;
    
    // Determine file extension and format
    $ext = '.sql';
    $formatFlag = '-F p'; // Plain SQL format
    if ($format === 'custom') {
        $ext = '.dump';
        $formatFlag = '-F c'; // Custom format
    } elseif ($format === 'tar') {
        $ext = '.tar';
        $formatFlag = '-F t'; // Tar format
    }
    
    $backupFile = $backupDir . DIRECTORY_SEPARATOR . $dbName . '_backup_' . $timestamp . $ext;
    
    // Build pg_dump command
    $connString = sprintf(
        'host=%s port=%s dbname=%s user=%s password=%s',
        escapeshellarg(DB_HOST),
        escapeshellarg(DB_PORT),
        escapeshellarg(DB_NAME),
        escapeshellarg(DB_USER),
        escapeshellarg(DB_PASS)
    );
    
    // Set password via environment variable (more secure than command line)
    putenv('PGPASSWORD=' . DB_PASS);
    
    // Add encoding parameter to ensure UTF-8 encoding for Turkish characters
    // Use -v for verbose but filter out verbose messages from SQL output
    // For better encoding, we'll separate SQL output from verbose messages
    $cmd = sprintf(
        '%s -h %s -p %s -U %s -d %s %s --create --clean --if-exists --encoding=UTF8 -v',
        escapeshellarg($pgDump),
        escapeshellarg(DB_HOST),
        escapeshellarg(DB_PORT),
        escapeshellarg(DB_USER),
        escapeshellarg(DB_NAME),
        $formatFlag
    );
    
    // Set UTF-8 locale for all platforms
    if (function_exists('isWindows')) {
        $isWindows = isWindows();
    } else {
        $isWindows = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN');
    }
    
    if ($isWindows) {
        // Windows: verbose messages go to stderr, SQL to stdout
        // Redirect stderr separately to avoid encoding issues
        $cmd .= ' 2>nul';
        // Set UTF-8 codepage for Windows console
        @exec('chcp 65001 >nul 2>&1');
    } else {
        // Unix/Linux/macOS: redirect both, we'll filter
        $cmd .= ' 2>&1';
        // Set UTF-8 locale environment variables
        putenv('LC_ALL=en_US.UTF-8');
        putenv('LANG=en_US.UTF-8');
        putenv('LC_CTYPE=UTF-8');
    }
    
    // Always set PostgreSQL encoding environment
    putenv('PGCLIENTENCODING=UTF8');
    
    // Execute backup
    echo t('executing_dump') . '...' . PHP_EOL;
    
    // Set UTF-8 encoding for file output
    // Use binary mode for all formats to ensure proper byte handling
    $fileHandle = fopen($backupFile, 'wb');
    
    if (!$fileHandle) {
        echo t('dump_failed') . ': Cannot create backup file' . PHP_EOL;
        putenv('PGPASSWORD=');
        putenv('PGCLIENTENCODING=');
        return false;
    }
    
    // Write UTF-8 BOM only for plain SQL files (not binary formats)
    // This helps editors recognize UTF-8 encoding for all languages
    if ($format === 'sql' || $format === 'plain') {
        fwrite($fileHandle, "\xEF\xBB\xBF"); // UTF-8 BOM
    }
    
    // Use popen for better handling of large outputs
    // Note: pg_dump output may contain characters from all languages, ensure UTF-8 encoding
    $handle = popen($cmd, 'r');
    if (!$handle) {
        echo t('dump_failed') . PHP_EOL;
        if ($fileHandle) fclose($fileHandle);
        putenv('PGPASSWORD=');
        putenv('PGCLIENTENCODING=');
        return false;
    }
    
    if (!$fileHandle) {
        pclose($handle);
        echo t('dump_failed') . ': Cannot write to file' . PHP_EOL;
        putenv('PGPASSWORD=');
        putenv('PGCLIENTENCODING=');
        return false;
    }
    
    // Write UTF-8 BOM if on Windows (optional, helps some editors recognize UTF-8)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        fwrite($fileHandle, "\xEF\xBB\xBF"); // UTF-8 BOM
    }
    
    // Stream output directly to file, filtering out verbose messages
    $bufferSize = 8192;
    $errorOutput = '';
    $lineBuffer = '';
    $verboseCount = 0;
    
    while (!feof($handle)) {
        $data = fread($handle, $bufferSize);
        if ($data === false) break;
        
        // Add to line buffer and process complete lines
        $lineBuffer .= $data;
        
        // Process complete lines (ending with newline)
        while (($pos = strpos($lineBuffer, "\n")) !== false) {
            $line = substr($lineBuffer, 0, $pos + 1);
            $lineBuffer = substr($lineBuffer, $pos + 1);
            
            // Filter out pg_dump verbose messages (they corrupt the SQL file with encoding issues)
            // pg_dump verbose messages always start with "pg_dump:" prefix
            if (strpos($line, 'pg_dump:') === 0) {
                // Skip verbose messages - they have encoding issues and aren't SQL
                $verboseCount++;
                $errorOutput .= $line; // Keep for error checking but don't write to SQL
                continue;
            }
            
            // This is SQL content - ensure UTF-8 encoding before writing
            // Convert to UTF-8 if not already (safety check for all languages)
            if (!mb_check_encoding($line, 'UTF-8')) {
                $detected = mb_detect_encoding($line, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'Windows-1254', 'Windows-1251', 'EUC-JP', 'SHIFT-JIS'], true);
                if ($detected && $detected !== 'UTF-8') {
                    $line = mb_convert_encoding($line, 'UTF-8', $detected);
                }
            }
            
            fwrite($fileHandle, $line);
            $errorOutput .= $line; // Also capture for error checking
        }
    }
    
    // Write any remaining buffer (incomplete line) if it's not a verbose message
    if (!empty($lineBuffer) && strpos($lineBuffer, 'pg_dump:') !== 0) {
        // Ensure UTF-8 encoding for remaining buffer
        if (!mb_check_encoding($lineBuffer, 'UTF-8')) {
            $detected = mb_detect_encoding($lineBuffer, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'Windows-1254', 'Windows-1251', 'EUC-JP', 'SHIFT-JIS'], true);
            if ($detected && $detected !== 'UTF-8') {
                $lineBuffer = mb_convert_encoding($lineBuffer, 'UTF-8', $detected);
            }
        }
        fwrite($fileHandle, $lineBuffer);
        $errorOutput .= $lineBuffer;
    }
    
    // Log filtered verbose messages count
    if ($verboseCount > 0 && php_sapi_name() === 'cli') {
        echo "Filtered $verboseCount verbose messages from SQL output" . PHP_EOL;
    }
    
    $returnVar = pclose($handle);
    fclose($fileHandle);
    
    // Check for errors
    if ($returnVar !== 0) {
        echo t('dump_failed') . ' (exit code: ' . $returnVar . ')' . PHP_EOL;
        if (strpos($errorOutput, 'ERROR') !== false || strpos($errorOutput, 'FATAL') !== false) {
            echo substr($errorOutput, -500) . PHP_EOL; // Show last 500 chars
        }
        @unlink($backupFile);
        putenv('PGPASSWORD=');
        putenv('PGCLIENTENCODING=');
        return false;
    }
    
    // For SQL format: Create both compressed and uncompressed versions
    $finalFiles = [];
    if ($format === 'sql') {
        // Always keep the uncompressed version
        $finalFiles[] = $backupFile;
        
        // Also create compressed version if compression is enabled
        if ($compress) {
            echo t('compressing') . '...' . PHP_EOL;
            $compressFile = $backupFile . '.gz';
            
            if (function_exists('gzencode')) {
                $content = file_get_contents($backupFile);
                $compressed = gzencode($content, 9);
                if ($compressed !== false) {
                    file_put_contents($compressFile, $compressed);
                    $finalFiles[] = $compressFile;
                }
            } elseif (function_exists('gzopen')) {
                // Alternative compression method
                $src = fopen($backupFile, 'rb');
                $dst = gzopen($compressFile, 'wb9');
                if ($src && $dst) {
                    while (!feof($src)) {
                        gzwrite($dst, fread($src, 8192));
                    }
                    fclose($src);
                    gzclose($dst);
                    $finalFiles[] = $compressFile;
                }
            }
        }
        $finalFile = $backupFile; // Return main file for compatibility
    } else {
        // For other formats, use single file
        $finalFile = $backupFile;
        $finalFiles[] = $backupFile;
    }
    
    // Clean up environment variables
    putenv('PGPASSWORD=');
    putenv('PGCLIENTENCODING=');
    
    // Reset locale for Unix systems
    if (!$isWindows) {
        putenv('LC_ALL=');
        putenv('LANG=');
        putenv('LC_CTYPE=');
    }
    
    // Calculate elapsed time
    $elapsed = number_format(microtime(true) - $startTime, 2);
    
    // Get file size
    $fileSize = file_exists($finalFile) ? filesize($finalFile) : 0;
    
    // Output results
    echo PHP_EOL;
    echo str_repeat('=', 60) . PHP_EOL;
    echo t('backup_success') . PHP_EOL;
    echo str_repeat('-', 60) . PHP_EOL;
    echo t('database') . ': ' . DB_NAME . PHP_EOL;
    
    // Show all created files
    if (count($finalFiles) > 1) {
        echo t('backup_files') . ':' . PHP_EOL;
        foreach ($finalFiles as $file) {
            $fileSize = file_exists($file) ? filesize($file) : 0;
            echo '  - ' . basename($file) . ' (' . formatBytes($fileSize) . ')' . PHP_EOL;
        }
    } else {
        $fileSize = file_exists($finalFile) ? filesize($finalFile) : 0;
        echo t('backup_file') . ': ' . basename($finalFile) . PHP_EOL;
        echo t('file_size') . ': ' . formatBytes($fileSize) . PHP_EOL;
    }
    
    echo t('location') . ': ' . dirname($finalFile) . PHP_EOL;
    echo t('timestamp') . ': ' . date('Y-m-d H:i:s') . PHP_EOL;
    echo t('format') . ': ' . strtoupper($format);
    if ($format === 'sql' && $compress) {
        echo ' (' . count($finalFiles) . ' ' . t('files') . ': .sql + .sql.gz)';
    } elseif ($format === 'sql') {
        echo ' (.sql)';
    }
    echo PHP_EOL;
    echo t('completed') . ' in ' . $elapsed . ' seconds' . PHP_EOL;
    echo str_repeat('=', 60) . PHP_EOL;
    
    // Return array of files for web interface
    return $finalFiles;
}

// Parse command line arguments
$format = 'sql'; // Default: SQL format
$compress = true;

if (php_sapi_name() === 'cli') {
    $options = getopt('', ['format::', 'compress::', 'lang::', 'help']);
    
    if (isset($options['help'])) {
        echo "Usage: php backup_database.php [options]\n";
        echo "Options:\n";
        echo "  --format=FORMAT    Backup format: sql, custom, tar (default: custom)\n";
        echo "  --compress         Compress backup (default: yes)\n";
        echo "  --lang=LANG        Language: tr, en, de, fr, es, it (default: auto-detect)\n";
        echo "  --help             Show this help\n";
        exit(0);
    }
    
    if (isset($options['format'])) {
        $format = $options['format'];
    }
    
    if (isset($options['compress']) && $options['compress'] === 'no') {
        $compress = false;
    }
    
    if (isset($options['lang'])) {
        $lang = $options['lang'];
        $t = $translations[$lang] ?? $translations['en'];
    }
    
    // Run backup
    echo t('title') . PHP_EOL;
    echo str_repeat('=', 60) . PHP_EOL;
    runBackup($format, $compress);
} else {
    // Web interface
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="<?php echo $lang; ?>">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?php echo htmlspecialchars(t('title')); ?></title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #151A2D;
                border-bottom: 3px solid #151A2D;
                padding-bottom: 10px;
            }
            .btn {
                background: #151A2D;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            }
            .btn:hover {
                background: #1f2937;
            }
            pre {
                background: #f4f4f4;
                padding: 15px;
                border-radius: 4px;
                overflow-x: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1><?php echo htmlspecialchars(t('title')); ?></h1>
            
            <?php
            // Show backup interface
            if (isset($_GET['run_backup']) || isset($_POST['run_backup'])) {
                echo '<div style="margin-bottom: 20px;">';
                echo '<a href="?" class="btn" style="background: #6b7280;">← ' . htmlspecialchars(t('back')) . '</a>';
                echo '</div>';
                
                echo '<h2>' . htmlspecialchars(t('executing_dump')) . '</h2>';
                echo '<div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">';
                
                ob_start();
                $result = runBackup('sql', true); // SQL format with compression
                $output = ob_get_clean();
                
                echo '<pre style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 4px; max-height: 400px; overflow-y: auto;">' . htmlspecialchars($output) . '</pre>';
                
                echo '</div>';
                
                if ($result && !empty($result)) {
                    echo '<div class="alert alert-success">';
                    echo '<strong>✓ ' . htmlspecialchars(t('backup_success')) . '</strong><br>';
                    
                    // Handle both single file and array of files
                    $files = is_array($result) ? $result : [$result];
                    
                    if (count($files) > 1) {
                        echo htmlspecialchars(t('backup_files')) . ':<br>';
                        echo '<ul style="margin: 10px 0; padding-left: 20px;">';
                        foreach ($files as $file) {
                            $basename = basename($file);
                            $filesize = file_exists($file) ? filesize($file) : 0;
                            echo '<li><code>' . htmlspecialchars($basename) . '</code> (' . formatBytes($filesize) . ')</li>';
                        }
                        echo '</ul>';
                    } else {
                        $file = $files[0];
                        echo htmlspecialchars(t('backup_file')) . ': <code>' . basename($file) . '</code><br>';
                        $filesize = file_exists($file) ? filesize($file) : 0;
                        echo htmlspecialchars(t('file_size')) . ': ' . formatBytes($filesize) . '<br>';
                    }
                    echo '<small>' . htmlspecialchars(t('location')) . ': <code>' . htmlspecialchars(dirname($files[0])) . '</code></small>';
                    echo '</div>';
                    
                    // Show download links for all files
                    echo '<p>';
                    foreach ($files as $file) {
                        if (file_exists($file)) {
                            $fileUrl = '?download=' . urlencode(basename($file));
                            $label = basename($file);
                            echo '<a href="' . htmlspecialchars($fileUrl) . '" class="btn" style="background: #059669; margin-right: 10px; margin-bottom: 10px;">⬇ ' . htmlspecialchars($label) . '</a> ';
                        }
                    }
                    echo '</p>';
                } else {
                    echo '<div class="alert alert-warning">';
                    echo '<strong>✗ ' . htmlspecialchars(t('backup_failed')) . '</strong><br>';
                    echo '<small>' . htmlspecialchars(t('dump_failed')) . '</small>';
                    echo '</div>';
                }
                
                echo '<hr style="margin: 30px 0;">';
                echo '<a href="?" class="btn">' . htmlspecialchars(t('create_new_backup')) . '</a>';
            } elseif (isset($_GET['download'])) {
                // Handle file download
                $filename = basename($_GET['download']);
                $filepath = __DIR__ . DIRECTORY_SEPARATOR . $filename;
                
                if (file_exists($filepath) && strpos($filename, '_backup_') !== false) {
                    header('Content-Type: application/octet-stream');
                    header('Content-Disposition: attachment; filename="' . $filename . '"');
                    header('Content-Length: ' . filesize($filepath));
                    readfile($filepath);
                    exit;
                } else {
                    http_response_code(404);
                    die('File not found');
                }
            } else {
                // Show main interface
                ?>
                <div class="alert alert-info">
                    <strong>ℹ️ <?php echo htmlspecialchars(t('backup_info')); ?></strong><br>
                    <?php echo htmlspecialchars(t('database')); ?>: <strong><?php echo htmlspecialchars(DB_NAME); ?></strong><br>
                    <?php echo htmlspecialchars(t('format')); ?>: <strong>SQL</strong> (<?php echo htmlspecialchars(t('compressed')); ?>)<br>
                    <?php echo htmlspecialchars(t('location')); ?>: <code><?php echo htmlspecialchars(__DIR__); ?></code>
                </div>
                
                <form method="POST" action="">
                    <input type="hidden" name="run_backup" value="1">
                    <p>
                        <button type="submit" class="btn">🚀 <?php echo htmlspecialchars(t('title')); ?></button>
                    </p>
                </form>
                
                <hr style="margin: 30px 0;">
                
                <h3>📋 <?php echo htmlspecialchars(t('existing_backups')); ?></h3>
                <?php
                // List existing backups
                $backupFiles = glob(__DIR__ . DIRECTORY_SEPARATOR . DB_NAME . '_backup_*.sql*');
                if (!empty($backupFiles)) {
                    // Sort by modification time (newest first)
                    usort($backupFiles, function($a, $b) {
                        return filemtime($b) - filemtime($a);
                    });
                    
                    echo '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
                    echo '<thead><tr style="background: #f3f4f6; border-bottom: 2px solid #ddd;">';
                    echo '<th style="padding: 10px; text-align: left;">' . htmlspecialchars(t('backup_file')) . '</th>';
                    echo '<th style="padding: 10px; text-align: right;">' . htmlspecialchars(t('file_size')) . '</th>';
                    echo '<th style="padding: 10px; text-align: center;">' . htmlspecialchars(t('timestamp')) . '</th>';
                    echo '<th style="padding: 10px; text-align: center;">' . htmlspecialchars(t('actions')) . '</th>';
                    echo '</tr></thead><tbody>';
                    
                    foreach ($backupFiles as $file) {
                        $basename = basename($file);
                        $filesize = filesize($file);
                        $modified = date('Y-m-d H:i:s', filemtime($file));
                        $downloadUrl = '?download=' . urlencode($basename);
                        
                        echo '<tr style="border-bottom: 1px solid #eee;">';
                        echo '<td style="padding: 10px;"><code>' . htmlspecialchars($basename) . '</code></td>';
                        echo '<td style="padding: 10px; text-align: right;">' . formatBytes($filesize) . '</td>';
                        echo '<td style="padding: 10px; text-align: center;">' . htmlspecialchars($modified) . '</td>';
                        echo '<td style="padding: 10px; text-align: center;">';
                        echo '<a href="' . htmlspecialchars($downloadUrl) . '" class="btn" style="padding: 5px 10px; font-size: 12px; background: #059669;">⬇ ' . htmlspecialchars(t('download')) . '</a>';
                        echo '</td>';
                        echo '</tr>';
                    }
                    
                    echo '</tbody></table>';
                } else {
                    echo '<p style="color: #666; font-style: italic;">' . htmlspecialchars(t('no_backups_yet')) . '</p>';
                }
                ?>
                <?php
            }
            ?>
        </div>
    </body>
    </html>
    <?php
}

