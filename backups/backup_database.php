<?php
/**
 * Database Backup Script
 * Creates a SQL dump of the database
 */

require_once __DIR__ . '/config.php';

$timestamp = date('Ymd_His');
$backupDir = __DIR__ . '/backups';
$backupFile = $backupDir . '/fst_cost_db_backup_' . $timestamp . '.sql';

// Create backups directory if it doesn't exist
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

// Build pg_dump command
$command = sprintf(
    'pg_dump -h %s -p %s -U %s -d %s -F c -f %s',
    escapeshellarg(DB_HOST),
    escapeshellarg(DB_PORT),
    escapeshellarg(DB_USER),
    escapeshellarg(DB_NAME),
    escapeshellarg($backupFile)
);

// Set password environment variable
putenv('PGPASSWORD=' . DB_PASS);

$isWeb = php_sapi_name() !== 'cli';

// Try to execute the command
exec($command . ' 2>&1', $output, $returnCode);

// If pg_dump command failed, try using pg_dump as plain SQL
if ($returnCode !== 0) {
    if ($isWeb) {
        echo "<div style='padding: 20px; background: #fff3cd; border-radius: 5px; margin: 20px 0;'>Trying alternative backup method...</div>";
    } else {
        echo "Trying alternative backup method...\n";
    }
    
    try {
        $conn = getDbConnection();
        
        if ($conn) {
            // Get all table data
            $backupContent = "-- FST Cost Database Backup\n";
            $backupContent .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
            $backupContent .= "-- Database: " . DB_NAME . "\n\n";
            $backupContent .= "BEGIN;\n\n";
            
            // First, backup all sequences
            $backupContent .= "-- ==================================================\n";
            $backupContent .= "-- Sequences\n";
            $backupContent .= "-- ==================================================\n\n";
            
            $seqQuery = "SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' ORDER BY sequence_name";
            $seqResult = pg_query($conn, $seqQuery);
            
            if ($seqResult && pg_num_rows($seqResult) > 0) {
                while ($seqRow = pg_fetch_assoc($seqResult)) {
                    $seqName = $seqRow['sequence_name'];
                    $seqEscaped = pg_escape_identifier($conn, $seqName);
                    
                    // Get sequence properties
                    $seqValQuery = "SELECT last_value, is_called FROM $seqEscaped";
                    $seqValResult = pg_query($conn, $seqValQuery);
                    $lastValue = 1;
                    if ($seqValResult) {
                        $seqValRow = pg_fetch_assoc($seqValResult);
                        $lastValue = $seqValRow['last_value'] ?? 1;
                        if ($seqValRow['is_called'] === 't') {
                            $lastValue++;
                        }
                    }
                    
                    $backupContent .= "DROP SEQUENCE IF EXISTS $seqEscaped CASCADE;\n";
                    $backupContent .= "CREATE SEQUENCE $seqEscaped START $lastValue;\n\n";
                }
            }
            
            // Get all tables
            $tablesQuery = "SELECT table_name 
                           FROM information_schema.tables 
                           WHERE table_schema = 'public' 
                           AND table_type = 'BASE TABLE'
                           ORDER BY table_name";
            $tablesResult = pg_query($conn, $tablesQuery);
            
            if ($tablesResult) {
                while ($tableRow = pg_fetch_assoc($tablesResult)) {
                    $table = $tableRow['table_name'];
                    $tableEscaped = pg_escape_identifier($conn, $table);
                    
                    $backupContent .= "\n-- ==================================================\n";
                    $backupContent .= "-- Table: $table\n";
                    $backupContent .= "-- ==================================================\n\n";
                    
                    // Get table structure (CREATE TABLE)
                    $structureQuery = "SELECT 
                        column_name, 
                        data_type, 
                        character_maximum_length,
                        is_nullable, 
                        column_default,
                        numeric_precision,
                        numeric_scale
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = '$table'
                    ORDER BY ordinal_position";
                    
                    $structureResult = pg_query($conn, $structureQuery);
                    
                    if ($structureResult && pg_num_rows($structureResult) > 0) {
                        $backupContent .= "DROP TABLE IF EXISTS $tableEscaped CASCADE;\n";
                        $backupContent .= "CREATE TABLE $tableEscaped (\n";
                        
                        $columns = [];
                        $primaryKeys = [];
                        
                        while ($colRow = pg_fetch_assoc($structureResult)) {
                            $colName = $colRow['column_name'];
                            $colType = $colRow['data_type'];
                            $colLength = $colRow['character_maximum_length'];
                            $isNullable = $colRow['is_nullable'] === 'YES';
                            $colDefault = $colRow['column_default'];
                            $numPrecision = $colRow['numeric_precision'];
                            $numScale = $colRow['numeric_scale'];
                            
                            // Format column type
                            $typeStr = $colType;
                            if ($colLength) {
                                $typeStr .= "($colLength)";
                            } elseif ($numPrecision) {
                                $typeStr .= "($numPrecision" . ($numScale ? ",$numScale" : "") . ")";
                            }
                            
                            $colDef = "    " . pg_escape_identifier($conn, $colName) . " $typeStr";
                            
                            if (!$isNullable) {
                                $colDef .= " NOT NULL";
                            }
                            
                            if ($colDefault && stripos($colDefault, 'nextval') === false) {
                                $colDef .= " DEFAULT $colDefault";
                            } elseif ($colDefault && stripos($colDefault, 'nextval') !== false) {
                                // Sequence definition will be handled separately
                                $colDef .= " DEFAULT $colDefault";
                            }
                            
                            $columns[] = $colDef;
                        }
                        
                        // Get primary keys
                        $pkQuery = "SELECT column_name 
                                   FROM information_schema.table_constraints tc
                                   JOIN information_schema.key_column_usage kcu 
                                     ON tc.constraint_name = kcu.constraint_name
                                   WHERE tc.table_name = '$table' 
                                   AND tc.constraint_type = 'PRIMARY KEY'
                                   ORDER BY kcu.ordinal_position";
                        $pkResult = pg_query($conn, $pkQuery);
                        
                        if ($pkResult && pg_num_rows($pkResult) > 0) {
                            $pkCols = [];
                            while ($pkRow = pg_fetch_assoc($pkResult)) {
                                $pkCols[] = pg_escape_identifier($conn, $pkRow['column_name']);
                            }
                            if (!empty($pkCols)) {
                                $columns[] = "    PRIMARY KEY (" . implode(', ', $pkCols) . ")";
                            }
                        }
                        
                        $backupContent .= implode(",\n", $columns) . "\n";
                        $backupContent .= ");\n\n";
                        
                        // Link sequences to columns (for auto-increment)
                        $autoIncQuery = "SELECT column_name, column_default 
                                        FROM information_schema.columns 
                                        WHERE table_name = '$table' 
                                        AND column_default LIKE 'nextval%'";
                        $autoIncResult = pg_query($conn, $autoIncQuery);
                        if ($autoIncResult && pg_num_rows($autoIncResult) > 0) {
                            while ($autoIncRow = pg_fetch_assoc($autoIncResult)) {
                                // Extract sequence name from default value
                                if (preg_match("/nextval\('([^']+)'/", $autoIncRow['column_default'], $matches)) {
                                    $seqName = $matches[1];
                                    $seqEscaped = pg_escape_identifier($conn, $seqName);
                                    $colEscaped = pg_escape_identifier($conn, $autoIncRow['column_name']);
                                    $backupContent .= "ALTER TABLE $tableEscaped ALTER COLUMN $colEscaped SET DEFAULT nextval('$seqEscaped');\n";
                                }
                            }
                            $backupContent .= "\n";
                        }
                        
                        // Get foreign keys
                        $fkQuery = "SELECT
                            tc.constraint_name,
                            kcu.column_name,
                            ccu.table_name AS foreign_table_name,
                            ccu.column_name AS foreign_column_name
                        FROM information_schema.table_constraints AS tc
                        JOIN information_schema.key_column_usage AS kcu
                          ON tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage AS ccu
                          ON ccu.constraint_name = tc.constraint_name
                        WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_name = '$table'";
                        
                        $fkResult = pg_query($conn, $fkQuery);
                        if ($fkResult && pg_num_rows($fkResult) > 0) {
                            while ($fkRow = pg_fetch_assoc($fkResult)) {
                                $fkCol = pg_escape_identifier($conn, $fkRow['column_name']);
                                $fkTable = pg_escape_identifier($conn, $fkRow['foreign_table_name']);
                                $fkTableCol = pg_escape_identifier($conn, $fkRow['foreign_column_name']);
                                $backupContent .= "ALTER TABLE $tableEscaped ADD CONSTRAINT {$fkRow['constraint_name']} FOREIGN KEY ($fkCol) REFERENCES $fkTable($fkTableCol);\n";
                            }
                            $backupContent .= "\n";
                        }
                    }
                    
                    // Get table data
                    // Check if table has 'id' column for ordering
                    $hasIdCol = false;
                    $idCheckQuery = "SELECT column_name FROM information_schema.columns 
                                    WHERE table_name = '$table' AND column_name = 'id'";
                    $idCheckResult = pg_query($conn, $idCheckQuery);
                    if ($idCheckResult && pg_num_rows($idCheckResult) > 0) {
                        $hasIdCol = true;
                    }
                    
                    $orderBy = $hasIdCol ? "ORDER BY id" : "";
                    $dataQuery = "SELECT * FROM $tableEscaped $orderBy";
                    $dataResult = pg_query($conn, $dataQuery);
                    
                    if ($dataResult && pg_num_rows($dataResult) > 0) {
                        $backupContent .= "-- Data for table: $table (" . pg_num_rows($dataResult) . " rows)\n";
                        
                        while ($row = pg_fetch_assoc($dataResult)) {
                            $columns = array_keys($row);
                            $values = array_values($row);
                            
                            $colsStr = implode(', ', array_map(function($col) use ($conn) {
                                return pg_escape_identifier($conn, $col);
                            }, $columns));
                            
                            $valsStr = implode(', ', array_map(function($val) use ($conn) {
                                if ($val === null) {
                                    return 'NULL';
                                }
                                // Handle different data types
                                if (is_numeric($val) && !is_string($val)) {
                                    return $val;
                                }
                                if (is_bool($val)) {
                                    return $val ? 'true' : 'false';
                                }
                                return "'" . pg_escape_string($conn, $val) . "'";
                            }, $values));
                            
                            $backupContent .= "INSERT INTO $tableEscaped ($colsStr) VALUES ($valsStr);\n";
                        }
                    } else {
                        $backupContent .= "-- No data in table: $table\n";
                    }
                    
                    $backupContent .= "\n";
                }
            }
            
            $backupContent .= "\nCOMMIT;\n";
            
            closeDbConnection($conn);
            
            // Save to file
            file_put_contents($backupFile, $backupContent);
            
            if (file_exists($backupFile)) {
                $returnCode = 0;
                $output = ['Backup created using alternative method'];
            }
        }
    } catch (Exception $e) {
        $output[] = "Alternative backup method failed: " . $e->getMessage();
    }
}

if ($returnCode === 0) {
    $fileSize = filesize($backupFile);
    $fileSizeFormatted = number_format($fileSize / 1024, 2) . ' KB';
    
    if ($isWeb) {
        header('Content-Type: text/html; charset=utf-8');
        echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Database Backup</title>";
        echo "<style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px; }
            .success { background: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin: 20px 0; }
            .file-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .btn:hover { background: #0056b3; }
        </style></head><body>";
        echo "<div class='container'>";
        echo "<h1>✓ Database Backup Successful</h1>";
        echo "<div class='success'>Database backup completed successfully!</div>";
        echo "<div class='file-info'>";
        echo "<strong>Backup File:</strong> " . basename($backupFile) . "<br>";
        echo "<strong>File Size:</strong> $fileSizeFormatted<br>";
        echo "<strong>Location:</strong> backups/" . basename($backupFile) . "<br>";
        echo "<strong>Date:</strong> " . date('Y-m-d H:i:s') . "<br>";
        echo "</div>";
        echo "<p>To restore this backup:</p>";
        echo "<code style='background: #f8f9fa; padding: 10px; display: block; border-radius: 5px;'>pg_restore -h localhost -p 5432 -U postgres -d " . DB_NAME . " backups/" . basename($backupFile) . "</code>";
        echo "<a href='dashboard.php' class='btn'>Return to Dashboard</a>";
        echo "</div></body></html>";
    } else {
        echo "Database backup completed successfully!\n";
        echo "Backup file: $backupFile\n";
        echo "File size: $fileSizeFormatted\n";
    }
} else {
    if ($isWeb) {
        header('Content-Type: text/html; charset=utf-8');
        echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Backup Error</title></head><body>";
        echo "<div style='font-family: Arial; padding: 20px; background: #f8d7da; color: #721c24; border-radius: 5px;'>";
        echo "<h1>✗ Backup Failed</h1>";
        echo "<p>Error details:</p>";
        echo "<pre>" . implode("\n", $output) . "</pre>";
        echo "</div></body></html>";
    } else {
        echo "Backup failed!\n";
        echo "Error: " . implode("\n", $output) . "\n";
    }
    exit(1);
}

