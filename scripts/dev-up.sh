#!/bin/bash
# Start everything locally for development
# Usage: ./scripts/dev-up.sh

set -e

echo "Starting Aspect Health Forms POC development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Please create it first."
    exit 1
fi

# Load environment variables
source .env

echo "Starting database and Directus containers..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 10

# Check if Directus is running
echo "Checking Directus health..."
for i in {1..30}; do
    if curl -s "http://localhost:8055/server/health" > /dev/null; then
        echo "Directus is ready!"
        break
    fi
    echo "Waiting for Directus... ($i/30)"
    sleep 2
done

# Check if we can connect to Directus
if ! curl -s "http://localhost:8055/server/health" > /dev/null; then
    echo "Error: Directus is not responding. Check logs with: docker-compose logs directus"
    exit 1
fi

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🔗 Access URLs:"
echo "   Directus Admin: http://localhost:8055"
echo "   Database: postgresql://localhost:5432/$DB_DATABASE"
echo ""
echo "🔑 Admin Credentials:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "📋 Next steps:"
echo "   1. Apply schema: ./infra/ci/apply.sh"
echo "   2. Import demo data via Directus admin interface"
echo "   3. Start React Native app: cd app && npm start"
echo ""
echo "🛑 To stop: docker-compose down"