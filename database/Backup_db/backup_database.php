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
        'files' => 'dosya',
        'tables_count' => 'Toplam Tablo',
        'rows_count' => 'Toplam Satır',
        'table_stats' => 'Tablo İstatistikleri',
        'table_name' => 'Tablo Adı',
        'row_count' => 'Satır Sayısı',
        'size_estimate' => 'Tahmini Boyut',
        'backup_details' => 'Yedek Detayları',
        'total_data' => 'Toplam Veri',
        'empty_tables' => 'Boş Tablolar',
        'backing_up_globals' => 'Global nesneler yedekleniyor',
        'globals_backup' => 'Global yedek',
        'encoding' => 'Kodlama'
    ],
    'de' => [
        'title' => 'Datenbanksicherung',
        'starting' => 'Datenbanksicherung wird gestartet...',
        'reading_config' => 'Konfiguration wird gelesen...',
        'database' => 'Datenbank',
        'tables_count' => 'Tabellen gesamt',
        'rows_count' => 'Zeilen gesamt',
        'table_stats' => 'Tabellenstatistiken',
        'table_name' => 'Tabellenname',
        'row_count' => 'Anzahl Zeilen',
        'size_estimate' => 'Geschätzte Größe',
        'backup_details' => 'Sicherungsdetails',
        'total_data' => 'Gesamtdaten',
        'empty_tables' => 'Leere Tabellen',
        'backup_file' => 'Sicherungsdatei',
        'backing_up_globals' => 'Globale Objekte werden gesichert',
        'globals_backup' => 'Globale Sicherung',
        'encoding' => 'Kodierung',
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
        'gb' => 'GB',
        'back' => 'Zurück',
        'download_backup' => 'Backup herunterladen',
        'create_new_backup' => 'Neues Backup erstellen',
        'existing_backups' => 'Vorhandene Backups',
        'download' => 'Herunterladen',
        'actions' => 'Aktionen',
        'no_backups_yet' => 'Noch keine Backups',
        'compressed' => 'Komprimiert',
        'backup_files' => 'Backup-Dateien',
        'files' => 'Dateien'
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
        'tables_count' => 'Tables totales',
        'rows_count' => 'Lignes totales',
        'table_stats' => 'Statistiques des tables',
        'table_name' => 'Nom de la table',
        'row_count' => 'Nombre de lignes',
        'size_estimate' => 'Taille estimée',
        'backup_details' => 'Détails de la sauvegarde',
        'total_data' => 'Données totales',
        'empty_tables' => 'Tables vides',
        'backing_up_globals' => 'Sauvegarde des objets globaux',
        'globals_backup' => 'Sauvegarde globale',
        'encoding' => 'Encodage',
        'connection_failed' => 'Échec de la connexion à la base de données',
        'directory_creation_failed' => 'Impossible de créer le répertoire de sauvegarde',
        'dump_failed' => 'Échec du dump de la base de données',
        'compression_failed' => 'Échec de la compression',
        'bytes' => 'octets',
        'kb' => 'Ko',
        'mb' => 'Mo',
        'gb' => 'Go',
        'back' => 'Retour',
        'download_backup' => 'Télécharger la sauvegarde',
        'create_new_backup' => 'Créer une nouvelle sauvegarde',
        'existing_backups' => 'Sauvegardes existantes',
        'download' => 'Télécharger',
        'actions' => 'Actions',
        'no_backups_yet' => 'Aucune sauvegarde pour le moment',
        'compressed' => 'Compressé',
        'backup_files' => 'Fichiers de sauvegarde',
        'files' => 'fichiers'
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
        'tables_count' => 'Total de tablas',
        'rows_count' => 'Total de filas',
        'table_stats' => 'Estadísticas de tablas',
        'table_name' => 'Nombre de tabla',
        'row_count' => 'Cantidad de filas',
        'size_estimate' => 'Tamaño estimado',
        'backup_details' => 'Detalles de la copia',
        'total_data' => 'Datos totales',
        'empty_tables' => 'Tablas vacías',
        'backing_up_globals' => 'Respaldando objetos globales',
        'globals_backup' => 'Respaldo global',
        'encoding' => 'Codificación',
        'connection_failed' => 'Falló la conexión a la base de datos',
        'directory_creation_failed' => 'No se pudo crear el directorio de respaldo',
        'dump_failed' => 'Falló el volcado de la base de datos',
        'compression_failed' => 'Falló la compresión',
        'bytes' => 'bytes',
        'kb' => 'KB',
        'mb' => 'MB',
        'gb' => 'GB',
        'back' => 'Atrás',
        'download_backup' => 'Descargar respaldo',
        'create_new_backup' => 'Crear nuevo respaldo',
        'existing_backups' => 'Respaldos existentes',
        'download' => 'Descargar',
        'actions' => 'Acciones',
        'no_backups_yet' => 'Aún no hay respaldos',
        'compressed' => 'Comprimido',
        'backup_files' => 'Archivos de respaldo',
        'files' => 'archivos'
    ],
    'it' => [
        'title' => 'Backup del database',
        'starting' => 'Avvio backup del database...',
        'reading_config' => 'Lettura configurazione...',
        'database' => 'Database',
        'tables_count' => 'Tabelle totali',
        'rows_count' => 'Righe totali',
        'table_stats' => 'Statistiche tabelle',
        'table_name' => 'Nome tabella',
        'row_count' => 'Numero di righe',
        'size_estimate' => 'Dimensione stimata',
        'backup_details' => 'Dettagli backup',
        'total_data' => 'Dati totali',
        'empty_tables' => 'Tabelle vuote',
        'backup_file' => 'File di backup',
        'backing_up_globals' => 'Backup oggetti globali',
        'globals_backup' => 'Backup globale',
        'encoding' => 'Codifica',
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
        'gb' => 'GB',
        'back' => 'Indietro',
        'download_backup' => 'Scarica backup',
        'create_new_backup' => 'Crea nuovo backup',
        'existing_backups' => 'Backup esistenti',
        'download' => 'Scarica',
        'actions' => 'Azioni',
        'no_backups_yet' => 'Nessun backup ancora',
        'compressed' => 'Compresso',
        'backup_files' => 'File di backup',
        'files' => 'file'
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
        'files' => 'files',
        'tables_count' => 'Total Tables',
        'rows_count' => 'Total Rows',
        'table_stats' => 'Table Statistics',
        'table_name' => 'Table Name',
        'row_count' => 'Row Count',
        'size_estimate' => 'Estimated Size',
        'backup_details' => 'Backup Details',
        'total_data' => 'Total Data',
        'empty_tables' => 'Empty Tables',
        'backing_up_globals' => 'Backing up global objects',
        'globals_backup' => 'Globals backup',
        'encoding' => 'Encoding'
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
    
    // Safe fallback for translation keys
    $unitBytes = $t['bytes'] ?? 'bytes';
    $unitKB = $t['kb'] ?? 'KB';
    $unitMB = $t['mb'] ?? 'MB';
    $unitGB = $t['gb'] ?? 'GB';
    
    $unit = $unitBytes;
    
    if ($size >= 1073741824) {
        $size = number_format($size / 1073741824, $decimals);
        $unit = $unitGB;
    } elseif ($size >= 1048576) {
        $size = number_format($size / 1048576, $decimals);
        $unit = $unitMB;
    } elseif ($size >= 1024) {
        $size = number_format($size / 1024, $decimals);
        $unit = $unitKB;
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

/**
 * Get database statistics (tables and row counts)
 * @return array|false Statistics array or false on error
 */
function getDatabaseStats() {
    if (!defined('DB_HOST') || !defined('DB_NAME')) {
        return false;
    }
    
    try {
        $conn = getDbConnection();
        if (!$conn) {
            return false;
        }
        
        // Get all tables
        $query = "SELECT table_name 
                  FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_type = 'BASE TABLE'
                  ORDER BY table_name";
        $result = pg_query($conn, $query);
        
        if (!$result) {
            closeDbConnection($conn);
            return false;
        }
        
        $tables = [];
        $totalRows = 0;
        
        while ($row = pg_fetch_assoc($result)) {
            $tableName = $row['table_name'];
            
            // Get row count for this table
            $countQuery = "SELECT COUNT(*) as count FROM " . pg_escape_identifier($conn, $tableName);
            $countResult = pg_query($conn, $countQuery);
            
            $rowCount = 0;
            if ($countResult) {
                $countRow = pg_fetch_assoc($countResult);
                $rowCount = (int)($countRow['count'] ?? 0);
            }
            
            // Get estimated size
            $sizeQuery = "SELECT pg_total_relation_size(" . pg_escape_literal($conn, 'public.' . $tableName) . ") as size";
            $sizeResult = pg_query($conn, $sizeQuery);
            $size = 0;
            if ($sizeResult) {
                $sizeRow = pg_fetch_assoc($sizeResult);
                $size = (int)($sizeRow['size'] ?? 0);
            }
            
            $tables[] = [
                'name' => $tableName,
                'rows' => $rowCount,
                'size' => $size
            ];
            
            $totalRows += $rowCount;
        }
        
        closeDbConnection($conn);
        
        return [
            'tables' => $tables,
            'total_tables' => count($tables),
            'total_rows' => $totalRows,
            'empty_tables' => array_filter($tables, function($t) { return $t['rows'] === 0; })
        ];
    } catch (Exception $e) {
        error_log("Database stats error: " . $e->getMessage());
        return false;
    }
}

/**
 * Find pg_dumpall executable (for globals backup)
 */
function findPgDumpAll() {
    $pgDumpAll = 'pg_dumpall'; // Default: assume in PATH
    
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
        
        $found = findExecutable('pg_dumpall', $commonPaths);
        if ($found) {
            return $found;
        }
    }
    
    // Windows paths
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        $commonPaths = [
            'C:\\laragon\\bin\\postgresql\\postgresql\\bin\\pg_dumpall.exe',
            'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dumpall.exe',
            'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dumpall.exe',
            'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dumpall.exe',
            'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dumpall.exe',
            'C:\\Program Files\\PostgreSQL\\12\\bin\\pg_dumpall.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_dumpall.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_dumpall.exe',
            'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\pg_dumpall.exe',
        ];
        
        foreach ($commonPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        
        // Try to find in PATH
        $output = [];
        @exec('where pg_dumpall 2>nul', $output);
        if (!empty($output) && file_exists(trim($output[0]))) {
            return trim($output[0]);
        }
    } else {
        // Unix/Linux/Mac paths
        $commonPaths = [
            '/usr/bin/pg_dumpall',
            '/usr/local/bin/pg_dumpall',
            '/opt/homebrew/bin/pg_dumpall',
            '/usr/local/pgsql/bin/pg_dumpall',
        ];
        
        foreach ($commonPaths as $path) {
            if (file_exists($path) && is_executable($path)) {
                return $path;
            }
        }
        
        // Try which command
        $output = [];
        @exec('which pg_dumpall 2>/dev/null', $output);
        if (!empty($output) && file_exists(trim($output[0]))) {
            return trim($output[0]);
        }
    }
    
    return $pgDumpAll; // Return default (hopefully in PATH)
}

/**
 * Backup globals (roles, users, tablespaces) - Full internationalization support
 */
function backupGlobals($backupDir, $timestamp) {
    global $t;
    
    $pgDumpAll = findPgDumpAll();
    
    // Check if pg_dumpall is available
    if (!file_exists($pgDumpAll) && $pgDumpAll === 'pg_dumpall') {
        $test = [];
        @exec('pg_dumpall --version 2>&1', $test);
        if (empty($test)) {
            echo "Warning: pg_dumpall not found. Skipping globals backup." . PHP_EOL;
            return false;
        }
    }
    
    $globalsFile = $backupDir . DIRECTORY_SEPARATOR . 'globals_' . $timestamp . '.sql';
    
    // Set password via environment variable
    putenv('PGPASSWORD=' . DB_PASS);
    
    // Set UTF-8 locale for all platforms
    if (function_exists('isWindows')) {
        $isWindows = isWindows();
    } else {
        $isWindows = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN');
    }
    
    if ($isWindows) {
        @exec('chcp 65001 >nul 2>&1');
    } else {
        putenv('LC_ALL=en_US.UTF-8');
        putenv('LANG=en_US.UTF-8');
        putenv('LC_CTYPE=UTF-8');
    }
    
    // Always set PostgreSQL encoding environment
    putenv('PGCLIENTENCODING=UTF8');
    
    // Build pg_dumpall command for globals only (roles, users, tablespaces)
    // --globals-only: Only dump global objects (roles and tablespaces)
    $cmd = sprintf(
        '%s -h %s -p %s -U %s --globals-only --encoding=UTF8',
        escapeshellarg($pgDumpAll),
        escapeshellarg(DB_HOST),
        escapeshellarg(DB_PORT),
        escapeshellarg(DB_USER)
    );
    
    if ($isWindows) {
        $cmd .= ' 2>nul';
    } else {
        $cmd .= ' 2>&1';
    }
    
    // Execute globals backup
    echo t('backing_up_globals') . '...' . PHP_EOL;
    
    $fileHandle = fopen($globalsFile, 'wb');
    if (!$fileHandle) {
        echo "Warning: Cannot create globals backup file" . PHP_EOL;
        putenv('PGPASSWORD=');
        putenv('PGCLIENTENCODING=');
        return false;
    }
    
    // Write UTF-8 BOM for SQL files
    fwrite($fileHandle, "\xEF\xBB\xBF");
    
    $handle = popen($cmd, 'r');
    if (!$handle) {
        echo "Warning: Failed to execute pg_dumpall" . PHP_EOL;
        fclose($fileHandle);
        putenv('PGPASSWORD=');
        putenv('PGCLIENTENCODING=');
        return false;
    }
    
    // Stream output directly to file
    $bufferSize = 8192;
    $errorOutput = '';
    $lineBuffer = '';
    
    while (!feof($handle)) {
        $data = fread($handle, $bufferSize);
        if ($data === false) break;
        
        $lineBuffer .= $data;
        
        // Process complete lines
        while (($pos = strpos($lineBuffer, "\n")) !== false) {
            $line = substr($lineBuffer, 0, $pos + 1);
            $lineBuffer = substr($lineBuffer, $pos + 1);
            
            // Filter out pg_dumpall verbose messages
            if (strpos($line, 'pg_dumpall:') === 0) {
                $errorOutput .= $line;
                continue;
            }
            
            // Ensure UTF-8 encoding
            if (!mb_check_encoding($line, 'UTF-8')) {
                $detected = mb_detect_encoding($line, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'Windows-1254', 'Windows-1251', 'EUC-JP', 'SHIFT-JIS', 'GB18030', 'BIG5'], true);
                if ($detected && $detected !== 'UTF-8') {
                    $line = mb_convert_encoding($line, 'UTF-8', $detected);
                }
            }
            
            fwrite($fileHandle, $line);
            $errorOutput .= $line;
        }
    }
    
    // Write any remaining buffer
    if (!empty($lineBuffer) && strpos($lineBuffer, 'pg_dumpall:') !== 0) {
        if (!mb_check_encoding($lineBuffer, 'UTF-8')) {
            $detected = mb_detect_encoding($lineBuffer, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'Windows-1254', 'Windows-1251', 'EUC-JP', 'SHIFT-JIS', 'GB18030', 'BIG5'], true);
            if ($detected && $detected !== 'UTF-8') {
                $lineBuffer = mb_convert_encoding($lineBuffer, 'UTF-8', $detected);
            }
        }
        fwrite($fileHandle, $lineBuffer);
        $errorOutput .= $lineBuffer;
    }
    
    $returnVar = pclose($handle);
    fclose($fileHandle);
    
    // Clean up environment variables
    putenv('PGPASSWORD=');
    putenv('PGCLIENTENCODING=');
    if (!$isWindows) {
        putenv('LC_ALL=');
        putenv('LANG=');
        putenv('LC_CTYPE=');
    }
    
    if ($returnVar !== 0) {
        echo "Warning: Globals backup failed (exit code: " . $returnVar . ")" . PHP_EOL;
        @unlink($globalsFile);
        return false;
    }
    
    // Check if file has content
    if (file_exists($globalsFile) && filesize($globalsFile) > 100) {
        return $globalsFile;
    } else {
        @unlink($globalsFile);
        return false;
    }
}

// Main backup function
function runBackup($format = 'sql', $compress = true, $includeGlobals = true) {
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
    
    // Set password via environment variable (more secure than command line)
    putenv('PGPASSWORD=' . DB_PASS);
    
    // Enhanced pg_dump command with full internationalization support
    // --create: Include CREATE DATABASE statement
    // --clean: Include DROP statements before CREATE
    // --if-exists: Use IF EXISTS for DROP statements
    // --encoding=UTF8: Ensure UTF-8 encoding for all languages
    // --no-owner: Don't output commands to set ownership (for portability)
    // --no-privileges: Don't output commands to set privileges (for portability)
    // --verbose: Verbose output (filtered in processing)
    $cmd = sprintf(
        '%s -h %s -p %s -U %s -d %s %s --create --clean --if-exists --encoding=UTF8 --no-owner --no-privileges --verbose',
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
            // Support for: Turkish, Arabic, Chinese, Japanese, Korean, Russian, European languages
            if (!mb_check_encoding($line, 'UTF-8')) {
                $detected = mb_detect_encoding($line, [
                    'UTF-8', 'ISO-8859-1', 'ISO-8859-2', 'ISO-8859-3', 'ISO-8859-4',
                    'ISO-8859-5', 'ISO-8859-6', 'ISO-8859-7', 'ISO-8859-8', 'ISO-8859-9',
                    'ISO-8859-10', 'ISO-8859-13', 'ISO-8859-14', 'ISO-8859-15', 'ISO-8859-16',
                    'Windows-1250', 'Windows-1251', 'Windows-1252', 'Windows-1253',
                    'Windows-1254', 'Windows-1255', 'Windows-1256', 'Windows-1257', 'Windows-1258',
                    'EUC-JP', 'SHIFT-JIS', 'ISO-2022-JP', 'GB18030', 'GB2312', 'BIG5',
                    'EUC-KR', 'ISO-2022-KR', 'KOI8-R', 'KOI8-U', 'ARMSCII-8'
                ], true);
                if ($detected && $detected !== 'UTF-8') {
                    $line = mb_convert_encoding($line, 'UTF-8', $detected);
                } else {
                    // If detection fails, try to convert using UTF-8 ignore errors
                    $line = mb_convert_encoding($line, 'UTF-8', 'UTF-8');
                }
            }
            
            fwrite($fileHandle, $line);
            $errorOutput .= $line; // Also capture for error checking
        }
    }
    
    // Write any remaining buffer (incomplete line) if it's not a verbose message
    if (!empty($lineBuffer) && strpos($lineBuffer, 'pg_dump:') !== 0) {
        // Ensure UTF-8 encoding for remaining buffer - full internationalization support
        if (!mb_check_encoding($lineBuffer, 'UTF-8')) {
            $detected = mb_detect_encoding($lineBuffer, [
                'UTF-8', 'ISO-8859-1', 'ISO-8859-2', 'ISO-8859-3', 'ISO-8859-4',
                'ISO-8859-5', 'ISO-8859-6', 'ISO-8859-7', 'ISO-8859-8', 'ISO-8859-9',
                'ISO-8859-10', 'ISO-8859-13', 'ISO-8859-14', 'ISO-8859-15', 'ISO-8859-16',
                'Windows-1250', 'Windows-1251', 'Windows-1252', 'Windows-1253',
                'Windows-1254', 'Windows-1255', 'Windows-1256', 'Windows-1257', 'Windows-1258',
                'EUC-JP', 'SHIFT-JIS', 'ISO-2022-JP', 'GB18030', 'GB2312', 'BIG5',
                'EUC-KR', 'ISO-2022-KR', 'KOI8-R', 'KOI8-U', 'ARMSCII-8'
            ], true);
            if ($detected && $detected !== 'UTF-8') {
                $lineBuffer = mb_convert_encoding($lineBuffer, 'UTF-8', $detected);
            } else {
                $lineBuffer = mb_convert_encoding($lineBuffer, 'UTF-8', 'UTF-8');
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
    
    // Backup globals (roles, users, tablespaces) for full backup
    $globalsFile = false;
    if ($includeGlobals) {
        $globalsFile = backupGlobals($backupDir, $timestamp);
    }
    
    // Get database statistics
    $stats = getDatabaseStats();
    
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
    $allFiles = $finalFiles;
    if ($globalsFile && file_exists($globalsFile)) {
        $allFiles[] = $globalsFile;
    }
    
    if (count($allFiles) > 1) {
        echo t('backup_files') . ':' . PHP_EOL;
        foreach ($allFiles as $file) {
            $fileSize = file_exists($file) ? filesize($file) : 0;
            $label = basename($file);
            if (strpos($label, 'globals_') === 0) {
                $label .= ' (Roles, Users, Tablespaces)';
            }
            echo '  - ' . $label . ' (' . formatBytes($fileSize) . ')' . PHP_EOL;
        }
    } else {
        $fileSize = file_exists($finalFile) ? filesize($finalFile) : 0;
        echo t('backup_file') . ': ' . basename($finalFile) . PHP_EOL;
        echo t('file_size') . ': ' . formatBytes($fileSize) . PHP_EOL;
    }
    
    if ($globalsFile && file_exists($globalsFile)) {
        echo t('globals_backup') . ': ' . basename($globalsFile) . ' (' . formatBytes(filesize($globalsFile)) . ')' . PHP_EOL;
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
    echo t('encoding') . ': UTF-8 (Full Internationalization Support)' . PHP_EOL;
    echo t('completed') . ' in ' . $elapsed . ' seconds' . PHP_EOL;
    
    // Display detailed statistics if available
    if ($stats !== false) {
        echo str_repeat('-', 60) . PHP_EOL;
        echo t('backup_details') . ':' . PHP_EOL;
        echo '  ' . t('tables_count') . ': ' . $stats['total_tables'] . PHP_EOL;
        echo '  ' . t('rows_count') . ': ' . number_format($stats['total_rows'], 0, '.', ',') . PHP_EOL;
        
        if (count($stats['empty_tables']) > 0) {
            echo '  ' . t('empty_tables') . ': ' . count($stats['empty_tables']) . PHP_EOL;
        }
        
        // Show table details in CLI
        if (php_sapi_name() === 'cli' && $stats['total_tables'] > 0) {
            echo PHP_EOL;
            echo t('table_stats') . ':' . PHP_EOL;
            echo sprintf("%-30s %12s %15s", t('table_name'), t('row_count'), t('size_estimate')) . PHP_EOL;
            echo str_repeat('-', 60) . PHP_EOL;
            
            foreach ($stats['tables'] as $table) {
                $sizeStr = formatBytes($table['size']);
                echo sprintf("%-30s %12s %15s", 
                    substr($table['name'], 0, 30),
                    number_format($table['rows'], 0, '.', ','),
                    $sizeStr
                ) . PHP_EOL;
            }
        }
    }
    
    echo str_repeat('=', 60) . PHP_EOL;
    
    // Return array with files and statistics for web interface
    return [
        'files' => $allFiles,
        'stats' => $stats,
        'elapsed' => $elapsed,
        'file_size' => $fileSize,
        'globals_file' => $globalsFile
    ];
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
                    // Handle new format with stats
                    if (is_array($result) && isset($result['files'])) {
                        $files = $result['files'];
                        $stats = $result['stats'] ?? false;
                        $elapsed = $result['elapsed'] ?? '0';
                        $fileSize = $result['file_size'] ?? 0;
                    } else {
                        // Legacy format: just files array
                        $files = is_array($result) ? $result : [$result];
                        $stats = false;
                        $elapsed = '0';
                        $fileSize = file_exists($files[0]) ? filesize($files[0]) : 0;
                    }
                    
                    echo '<div class="alert alert-success">';
                    echo '<strong>✓ ' . htmlspecialchars(t('backup_success')) . '</strong><br>';
                    
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
                        echo htmlspecialchars(t('file_size')) . ': ' . formatBytes($fileSize) . '<br>';
                    }
                    echo '<small>' . htmlspecialchars(t('location')) . ': <code>' . htmlspecialchars(dirname($files[0])) . '</code></small><br>';
                    echo '<small>' . htmlspecialchars(t('completed')) . ' in ' . htmlspecialchars($elapsed) . ' seconds</small>';
                    echo '</div>';
                    
                    // Display detailed statistics
                    if ($stats !== false && is_array($stats) && isset($stats['tables'])) {
                        echo '<div class="alert alert-info" style="margin-top: 20px;">';
                        echo '<strong>📊 ' . htmlspecialchars(t('backup_details')) . '</strong><br><br>';
                        
                        echo '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">';
                        echo '<div><strong>' . htmlspecialchars(t('tables_count')) . ':</strong> <span style="font-size: 1.2em; color: #059669;">' . $stats['total_tables'] . '</span></div>';
                        echo '<div><strong>' . htmlspecialchars(t('rows_count')) . ':</strong> <span style="font-size: 1.2em; color: #059669;">' . number_format($stats['total_rows'], 0, '.', ',') . '</span></div>';
                        echo '</div>';
                        
                        if (count($stats['empty_tables']) > 0) {
                            echo '<div style="color: #f59e0b; margin-bottom: 15px;">';
                            echo '<strong>⚠ ' . htmlspecialchars(t('empty_tables')) . ':</strong> ' . count($stats['empty_tables']);
                            echo '</div>';
                        }
                        
                        // Table statistics table
                        echo '<details style="margin-top: 15px;">';
                        echo '<summary style="cursor: pointer; font-weight: bold; padding: 10px; background: #f3f4f6; border-radius: 5px;">📋 ' . htmlspecialchars(t('table_stats')) . ' (' . $stats['total_tables'] . ' ' . htmlspecialchars(t('tables_count')) . ')</summary>';
                        echo '<div style="margin-top: 10px; max-height: 400px; overflow-y: auto;">';
                        echo '<table style="width: 100%; border-collapse: collapse; margin-top: 10px; background: white;">';
                        echo '<thead><tr style="background: #151A2D; color: white;">';
                        echo '<th style="padding: 10px; text-align: left;">' . htmlspecialchars(t('table_name')) . '</th>';
                        echo '<th style="padding: 10px; text-align: right;">' . htmlspecialchars(t('row_count')) . '</th>';
                        echo '<th style="padding: 10px; text-align: right;">' . htmlspecialchars(t('size_estimate')) . '</th>';
                        echo '</tr></thead><tbody>';
                        
                        foreach ($stats['tables'] as $table) {
                            $rowCount = number_format($table['rows'], 0, '.', ',');
                            $size = formatBytes($table['size']);
                            $rowStyle = $table['rows'] === 0 ? 'background: #fef2f2; color: #991b1b;' : '';
                            
                            echo '<tr style="border-bottom: 1px solid #e5e7eb; ' . $rowStyle . '">';
                            echo '<td style="padding: 8px;"><code>' . htmlspecialchars($table['name']) . '</code></td>';
                            echo '<td style="padding: 8px; text-align: right; font-weight: ' . ($table['rows'] > 0 ? 'bold' : 'normal') . ';">' . htmlspecialchars($rowCount) . '</td>';
                            echo '<td style="padding: 8px; text-align: right;">' . htmlspecialchars($size) . '</td>';
                            echo '</tr>';
                        }
                        
                        echo '</tbody></table>';
                        echo '</div>';
                        echo '</details>';
                        echo '</div>';
                    }
                    
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
                // Handle file download (both database backups and globals)
                $filename = basename($_GET['download']);
                $filepath = __DIR__ . DIRECTORY_SEPARATOR . $filename;
                
                if (file_exists($filepath) && (strpos($filename, '_backup_') !== false || strpos($filename, 'globals_') === 0)) {
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
                // List existing backups (include both database backups and globals)
                $backupFiles = glob(__DIR__ . DIRECTORY_SEPARATOR . DB_NAME . '_backup_*.sql*');
                $globalsFiles = glob(__DIR__ . DIRECTORY_SEPARATOR . 'globals_*.sql*');
                $allBackupFiles = array_merge($backupFiles, $globalsFiles);
                if (!empty($allBackupFiles)) {
                    // Sort by modification time (newest first)
                    usort($allBackupFiles, function($a, $b) {
                        return filemtime($b) - filemtime($a);
                    });
                    
                    echo '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
                    echo '<thead><tr style="background: #f3f4f6; border-bottom: 2px solid #ddd;">';
                    echo '<th style="padding: 10px; text-align: left;">' . htmlspecialchars(t('backup_file')) . '</th>';
                    echo '<th style="padding: 10px; text-align: right;">' . htmlspecialchars(t('file_size')) . '</th>';
                    echo '<th style="padding: 10px; text-align: center;">' . htmlspecialchars(t('timestamp')) . '</th>';
                    echo '<th style="padding: 10px; text-align: center;">' . htmlspecialchars(t('actions')) . '</th>';
                    echo '</tr></thead><tbody>';
                    
                    foreach ($allBackupFiles as $file) {
                        $isGlobals = (strpos(basename($file), 'globals_') === 0);
                        $basename = basename($file);
                        $filesize = filesize($file);
                        $modified = date('Y-m-d H:i:s', filemtime($file));
                        $downloadUrl = '?download=' . urlencode($basename);
                        
                        $fileTypeLabel = $isGlobals ? ' <span style="font-size: 0.85em; color: #059669; font-weight: bold;">(Globals)</span>' : '';
                        echo '<tr style="border-bottom: 1px solid #eee;' . ($isGlobals ? ' background: #f0fdf4;' : '') . '">';
                        echo '<td style="padding: 10px;"><code>' . htmlspecialchars($basename) . '</code>' . $fileTypeLabel . '</td>';
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

