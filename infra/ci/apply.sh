#!/bin/bash
# Apply Directus schema from YAML format
# Usage: ./apply.sh

set -e

DIRECTUS_URL=${DIRECTUS_URL:-"http://localhost:8055"}
SCHEMA_FILE="./infra/schema/directus-schema.yaml"

echo "Applying Directus schema from $SCHEMA_FILE..."

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Error: Schema file not found at $SCHEMA_FILE"
    exit 1
fi

# Check if Directus is running
if ! curl -s "$DIRECTUS_URL/server/health" > /dev/null; then
    echo "Error: Directus is not running at $DIRECTUS_URL"
    exit 1
fi

# Apply schema
npx directus schema apply "$SCHEMA_FILE" --yes

echo "Schema applied successfully!"