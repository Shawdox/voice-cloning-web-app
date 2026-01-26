#!/bin/bash
# Run database migration to add format field

DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="voice_clone"

# Load from .env if it exists
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Run the migration
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-voice_clone} -f migrations/add_tts_format_field.sql

echo "Migration completed!"
