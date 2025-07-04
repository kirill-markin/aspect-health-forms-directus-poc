#!/bin/bash
# Export Directus schema to YAML format
# Usage: ./snapshot.sh

set -e

DIRECTUS_URL=${DIRECTUS_URL:-"http://localhost:8055"}
SCHEMA_FILE="./infra/schema/directus-schema.yaml"

echo "Exporting Directus schema from $DIRECTUS_URL..."

# Check if Directus is running
if ! curl -s "$DIRECTUS_URL/server/health" > /dev/null; then
    echo "Error: Directus is not running at $DIRECTUS_URL"
    exit 1
fi

# Export schema
npx directus schema snapshot --output "$SCHEMA_FILE"

echo "Schema exported to $SCHEMA_FILE"
echo "Don't forget to commit the changes!"