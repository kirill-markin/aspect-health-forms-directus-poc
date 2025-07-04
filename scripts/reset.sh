#!/bin/bash
# Clean slate - remove all containers and volumes
# Usage: ./scripts/reset.sh

set -e

echo "🔄 Resetting Aspect Health Forms POC development environment..."

# Stop all containers
echo "Stopping containers..."
docker-compose down

# Remove all volumes (this will delete all data!)
echo "Removing volumes and data..."
docker-compose down -v

# Remove any orphaned containers
echo "Cleaning up Docker resources..."
docker system prune -f

# Remove any local cache/temp files
echo "Cleaning up local files..."
rm -rf .docker/
rm -rf directus/
rm -rf uploads/
rm -rf database/
rm -rf cache/

echo ""
echo "✅ Environment has been reset!"
echo ""
echo "📋 To start fresh:"
echo "   1. Run: ./scripts/dev-up.sh"
echo "   2. Apply schema: ./infra/ci/apply.sh"
echo "   3. Import demo data via Directus admin interface"
echo ""
echo "⚠️  Note: All data has been permanently deleted!"