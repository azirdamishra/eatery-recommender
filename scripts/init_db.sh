#!/bin/bash

# Enable error handling
set -euo pipefail

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to the backend directory
cd "$PROJECT_ROOT/backend"

# Check if .env file exists
if [ ! -f .env ]; then
    log "Error: .env file not found in backend directory"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check required environment variables
required_vars=("DATABASE_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
        log "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Extract database name from DATABASE_URL (macOS compatible)
DB_NAME=$(echo $DATABASE_URL | sed -E 's/.*\/([^\/]+)$/\1/')

# Check if database exists and create backup if it does
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log "Database $DB_NAME exists. Creating backup..."
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump "$DB_NAME" > "$BACKUP_FILE"
    log "Backup created at $BACKUP_FILE"
fi

# Verify database connection
log "Verifying database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    log "Error: Could not connect to database. Please check your DATABASE_URL and ensure the database server is running."
    exit 1
fi

# Run the database initialization
log "Initializing database..."
if python -m app.core.init_db; then
    log "Database initialized successfully!"
else
    log "Failed to initialize database."
    exit 1
fi

# Verify tables were created
log "Verifying database tables..."
if ! psql "$DATABASE_URL" -c "\dt" > /dev/null 2>&1; then
    log "Error: No tables found after initialization."
    exit 1
fi

log "Database initialization completed successfully!" 