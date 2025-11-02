#!/bin/bash
# ============================================================
# Universal Database Backup Script - Linux/macOS Shell
# Multi-language Support (Turkish, English, German, French, Spanish, Italian)
# PostgreSQL Full Backup (Schema + Data + Blobs + Globals)
# ============================================================

set -e  # Exit on error

# Detect language from system
LANG_CODE="${LANG%%.*}"
if [[ "$LANG_CODE" == *"tr"* ]]; then
    LANG_SELECTED="tr"
elif [[ "$LANG_CODE" == *"de"* ]]; then
    LANG_SELECTED="de"
elif [[ "$LANG_CODE" == *"fr"* ]]; then
    LANG_SELECTED="fr"
elif [[ "$LANG_CODE" == *"es"* ]]; then
    LANG_SELECTED="es"
elif [[ "$LANG_CODE" == *"it"* ]]; then
    LANG_SELECTED="it"
else
    LANG_SELECTED="en"
fi

# Override from command line argument
if [[ "$1" == "--lang="* ]]; then
    LANG_SELECTED="${1#--lang=}"
fi

# Translations
declare -A TITLE
TITLE[tr]="Veritabanı Yedekleme"
TITLE[en]="Database Backup"
TITLE[de]="Datenbanksicherung"
TITLE[fr]="Sauvegarde de la base de données"
TITLE[es]="Respaldo de base de datos"
TITLE[it]="Backup del database"

declare -A STARTING
STARTING[tr]="Veritabanı yedekleme başlatılıyor..."
STARTING[en]="Starting database backup..."
STARTING[de]="Datenbanksicherung wird gestartet..."
STARTING[fr]="Démarrage de la sauvegarde..."
STARTING[es]="Iniciando respaldo de base de datos..."
STARTING[it]="Avvio backup del database..."

declare -A SUCCESS
SUCCESS[tr]="✓ Yedekleme başarılı!"
SUCCESS[en]="✓ Backup successful!"
SUCCESS[de]="✓ Sicherung erfolgreich!"
SUCCESS[fr]="✓ Sauvegarde réussie!"
SUCCESS[es]="✓ ¡Respaldo exitoso!"
SUCCESS[it]="✓ Backup completato!"

declare -A FAILED
FAILED[tr]="✗ Yedekleme başarısız!"
FAILED[en]="✗ Backup failed!"
FAILED[de]="✗ Sicherung fehlgeschlagen!"
FAILED[fr]="✗ Sauvegarde échouée!"
FAILED[es]="✗ ¡Respaldo fallido!"
FAILED[it]="✗ Backup fallito!"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Database Configuration - Read from .env file
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="fst_cost_db"
DB_USER="postgres"
PGPASSWORD=""

# Try to read from .env file in project root
ENV_FILE="$SCRIPT_DIR/../../.env"
if [ -f "$ENV_FILE" ]; then
    DB_HOST=$(grep "^DB_HOST=" "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ' || echo "localhost")
    DB_PORT=$(grep "^DB_PORT=" "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ' || echo "5432")
    DB_NAME=$(grep "^DB_NAME=" "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ' || echo "fst_cost_db")
    DB_USER=$(grep "^DB_USER=" "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ' || echo "postgres")
    PGPASSWORD=$(grep "^DB_PASS=" "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ' || echo "")
fi

# If password not found, prompt user
if [ -z "$PGPASSWORD" ]; then
    read -sp "Enter PostgreSQL password for user '$DB_USER': " PGPASSWORD
    echo
fi

# Export password
export PGPASSWORD

# Find pg_dump
PGBIN=""
POSSIBLE_PATHS=(
    "/usr/bin/pg_dump"
    "/usr/local/bin/pg_dump"
    "/opt/homebrew/bin/pg_dump"
    "/usr/local/pgsql/bin/pg_dump"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -x "$path" ]; then
        PGBIN="$path"
        break
    fi
done

# Try which command if not found
if [ -z "$PGBIN" ]; then
    PGBIN=$(which pg_dump 2>/dev/null || echo "")
fi

# Check if pg_dump exists
if [ -z "$PGBIN" ] || [ ! -x "$PGBIN" ]; then
    echo
    echo "ERROR: pg_dump not found. PostgreSQL client tools must be installed."
    exit 1
fi

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_SQL="${DB_NAME}_backup_${TIMESTAMP}.sql"

echo
echo "${TITLE[$LANG_SELECTED]}"
echo "============================================================"
echo "${STARTING[$LANG_SELECTED]}"
echo "Database: $DB_NAME"
echo "Backup file: $DUMP_SQL"
echo

# Create plain SQL dump with UTF-8 encoding for Turkish characters
"$PGBIN" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F p --create --clean --if-exists --encoding=UTF8 -v -d "$DB_NAME" > "$DUMP_SQL" 2>&1

if [ $? -eq 0 ]; then
    # Get file size
    FILESIZE=$(stat -f%z "$DUMP_SQL" 2>/dev/null || stat -c%s "$DUMP_SQL" 2>/dev/null || echo "unknown")
    
    echo
    echo "${SUCCESS[$LANG_SELECTED]}"
    echo "File: $DUMP_SQL"
    echo "Location: $SCRIPT_DIR/$DUMP_SQL"
    echo "Size: $FILESIZE bytes"
    echo "Timestamp: $TIMESTAMP"
    echo "============================================================"
    exit 0
else
    echo
    echo "${FAILED[$LANG_SELECTED]}"
    echo "Please check PostgreSQL credentials and connection."
    exit 1
fi

