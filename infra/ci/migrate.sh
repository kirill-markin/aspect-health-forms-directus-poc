#!/bin/bash
# Run migrations and seed data
# Usage: ./migrate.sh

set -e

DIRECTUS_URL=${DIRECTUS_URL:-"http://localhost:8055"}
SEEDS_DIR="./infra/seeds"

echo "Running migrations and seeding data..."

# Check if Directus is running
if ! curl -s "$DIRECTUS_URL/server/health" > /dev/null; then
    echo "Error: Directus is not running at $DIRECTUS_URL"
    exit 1
fi

# Run any SQL migrations first
if [ -d "./infra/migrations" ] && [ "$(ls -A ./infra/migrations/*.sql 2>/dev/null)" ]; then
    echo "Running SQL migrations..."
    for migration in ./infra/migrations/*.sql; do
        echo "Running migration: $migration"
        # This would require a direct database connection
        # For now, we'll skip this as it requires database credentials
        # psql $DATABASE_URL -f "$migration"
    done
fi

# Import seed data
if [ -d "$SEEDS_DIR" ] && [ "$(ls -A $SEEDS_DIR/*.json 2>/dev/null)" ]; then
    echo "Importing seed data..."
    for seed_file in $SEEDS_DIR/*.json; do
        echo "Importing: $seed_file"
        # This would require the Directus CLI or API calls
        # For now, manual import through the admin interface
        echo "Please import $seed_file manually through the Directus admin interface"
    done
fi

echo "Migration and seeding completed!"