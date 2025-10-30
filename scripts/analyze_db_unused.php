<?php
// Read-only database analyzer to find structurally unlinked columns and potentially unused rows
// Usage: php scripts/analyze_db_unused.php

define('API_REQUEST', true);
require_once __DIR__ . '/../config.php';

function fetchAll($conn, $sql, $params = []) {
    $res = empty($params) ? pg_query($conn, $sql) : pg_query_params($conn, $sql, $params);
    if (!$res) {
        throw new Exception(pg_last_error($conn));
    }
    $rows = [];
    while ($row = pg_fetch_assoc($res)) {
        $rows[] = $row;
    }
    return $rows;
}

function getTables($conn) {
    $sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type='BASE TABLE' ORDER BY table_name";
    return array_map(fn($r) => $r['table_name'], fetchAll($conn, $sql));
}

function getColumns($conn) {
    $sql = "SELECT table_name, column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position";
    $columns = [];
    foreach (fetchAll($conn, $sql) as $r) {
        $t = $r['table_name'];
        if (!isset($columns[$t])) $columns[$t] = [];
        $columns[$t][$r['column_name']] = $r;
    }
    return $columns;
}

function getPrimaryKeys($conn) {
    $sql = "
        SELECT
            tc.table_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY tc.table_name, kcu.ordinal_position
    ";
    $pks = [];
    foreach (fetchAll($conn, $sql) as $r) {
        $t = $r['table_name'];
        if (!isset($pks[$t])) $pks[$t] = [];
        $pks[$t][] = $r['column_name'];
    }
    return $pks;
}

function getForeignKeys($conn) {
    $sql = "
        SELECT
            tc.constraint_name,
            kcu.table_name AS child_table,
            kcu.column_name AS child_column,
            ccu.table_name AS parent_table,
            ccu.column_name AS parent_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY kcu.table_name, kcu.ordinal_position
    ";
    $fks = [];
    foreach (fetchAll($conn, $sql) as $r) {
        $fks[] = $r;
    }
    return $fks;
}

function groupFks($fks) {
    $byChild = [];
    $byParent = [];
    foreach ($fks as $fk) {
        $byChild[$fk['child_table']][] = $fk;
        $byParent[$fk['parent_table']][] = $fk;
    }
    return [$byChild, $byParent];
}

function printHeader($title) {
    echo str_repeat('=', 80) . PHP_EOL;
    echo $title . PHP_EOL;
    echo str_repeat('=', 80) . PHP_EOL;
}

function main() {
    $conn = getDbConnection();
    if (!$conn) {
        fwrite(STDERR, "Cannot connect to DB. Check config.php.\n");
        exit(2);
    }

    $tables = getTables($conn);
    $columns = getColumns($conn);
    $pks = getPrimaryKeys($conn);
    $fks = getForeignKeys($conn);
    [$fksByChild, $fksByParent] = groupFks($fks);

    // 1) Columns not part of any PK or FK (structurally unlinked columns)
    printHeader('Structurally unlinked columns (not PK and not part of any FK)');
    foreach ($tables as $t) {
        $pkCols = $pks[$t] ?? [];
        $fkCols = [];
        foreach ($fks as $fk) {
            if ($fk['child_table'] === $t) {
                $fkCols[$fk['child_column']] = true;
            }
            if ($fk['parent_table'] === $t) {
                // parent columns are referenced; still part of a relationship
                $fkCols[$fk['parent_column']] = true;
            }
        }
        $unlinked = [];
        foreach (($columns[$t] ?? []) as $c => $meta) {
            if (!in_array($c, $pkCols, true) && !isset($fkCols[$c])) {
                $unlinked[] = $c;
            }
        }
        if (!empty($unlinked)) {
            echo $t . ': ' . implode(', ', $unlinked) . PHP_EOL;
        }
    }

    // 2) Child rows with NULL foreign keys (potentially unlinked records)
    printHeader('Child rows with NULL foreign key columns (potentially unlinked)');
    $seenChildFkCombos = [];
    foreach ($fks as $fk) {
        $child = $fk['child_table'];
        $col = $fk['child_column'];
        $key = $child . '|' . $col;
        if (isset($seenChildFkCombos[$key])) continue; // handle multi-col by per-col basis; simple heuristic
        $seenChildFkCombos[$key] = true;

        // Check if column exists and is nullable
        $isNullable = ($columns[$child][$col]['is_nullable'] ?? 'YES') === 'YES';
        if (!$isNullable) continue;

        $sql = "SELECT COUNT(*) AS cnt FROM \"$child\" WHERE \"$col\" IS NULL";
        $res = fetchAll($conn, $sql);
        $cnt = (int)($res[0]['cnt'] ?? 0);
        if ($cnt > 0) {
            echo $child . '.' . $col . ' -> NULL rows: ' . $cnt . PHP_EOL;
        }
    }

    // 3) Parent rows with zero incoming references across all child FKs
    printHeader('Parent rows with zero references from any child (candidate for cleanup)');
    foreach ($tables as $parent) {
        $parentPk = $pks[$parent] ?? [];
        if (count($parentPk) !== 1) {
            // Skip composite or missing PKs for safety
            continue;
        }
        $pkCol = $parentPk[0];
        $incoming = $fksByParent[$parent] ?? [];
        if (empty($incoming)) {
            // No children referencing this table; skip
            continue;
        }

        // Build a SUM of counts from each child
        $sumParts = [];
        foreach ($incoming as $fk) {
            $child = $fk['child_table'];
            $childCol = $fk['child_column'];
            $sumParts[] = "(SELECT COUNT(1) FROM \"$child\" c WHERE c.\"$childCol\" = p.\"$pkCol\")";
        }
        $sumExpr = implode(' + ', $sumParts);
        $sql = "SELECT p.\"$pkCol\" AS id FROM \"$parent\" p WHERE ($sumExpr) = 0 LIMIT 200"; // limit output volume
        try {
            $rows = fetchAll($conn, $sql);
            if (!empty($rows)) {
                echo $parent . ' -> unreferenced ids (first 200): ' . implode(', ', array_map(fn($r) => $r['id'], $rows)) . PHP_EOL;
            }
        } catch (Exception $e) {
            // Ignore if any permission/other issue
        }
    }

    echo PHP_EOL . 'Analysis completed.' . PHP_EOL;
}

try {
    main();
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}

?>


