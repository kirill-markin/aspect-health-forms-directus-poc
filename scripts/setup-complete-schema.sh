#!/bin/bash
# Complete Directus Forms POC Setup Script
# This script sets up the entire Directus environment with schema and permissions
# Usage: ./scripts/setup-complete-schema.sh

set -e

echo "🚀 Starting Aspect Health Forms POC setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed. Please install curl first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Some operations may not work properly."
    fi
    
    print_success "All dependencies are available"
}

# Stop and remove existing containers and volumes
cleanup_existing() {
    print_status "Cleaning up existing containers and volumes..."
    docker-compose down -v 2>/dev/null || true
    print_success "Cleanup completed"
}

# Start fresh containers
start_containers() {
    print_status "Starting fresh Docker containers..."
    docker-compose up -d
    
    print_status "Waiting for Directus to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:8055/server/health" | grep -q "ok"; then
            print_success "Directus is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "Directus failed to start within expected time"
    exit 1
}

# Bootstrap the database
bootstrap_database() {
    print_status "Bootstrapping Directus database..."
    docker exec -it aspect-health-forms-directus-poc-directus-1 npx directus bootstrap
    print_success "Database bootstrapped"
}

# Apply the complete schema
apply_schema() {
    print_status "Applying complete forms schema..."
    
    # Copy schema file to container
    docker cp ./infra/schema/directus-schema.yaml aspect-health-forms-directus-poc-directus-1:/tmp/directus-schema.yaml
    
    # Apply schema
    docker exec -it aspect-health-forms-directus-poc-directus-1 npx directus schema apply /tmp/directus-schema.yaml --yes
    
    print_success "Schema applied successfully"
}

# Fix permissions for admin access
fix_permissions() {
    print_status "Configuring admin permissions..."
    
    # Wait a moment for schema to settle
    sleep 2
    
    # Get authentication token
    local token
    token=$(curl -s -X POST http://localhost:8055/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"password123"}' | \
        jq -r '.data.access_token' 2>/dev/null || echo "")
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_error "Failed to get authentication token"
        exit 1
    fi
    
    # Get admin role ID
    local role_id
    role_id=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8055/roles" | \
        jq -r '.data[] | select(.name == "Administrator") | .id' 2>/dev/null || echo "")
    
    if [ -z "$role_id" ] || [ "$role_id" = "null" ]; then
        print_error "Failed to get admin role ID"
        exit 1
    fi
    
    # Get policy ID from role
    local policy_id
    policy_id=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8055/roles/$role_id" | \
        jq -r '.data.policies[0]' 2>/dev/null || echo "")
    
    if [ -z "$policy_id" ] || [ "$policy_id" = "null" ]; then
        print_error "Failed to get policy ID"
        exit 1
    fi
    
    # Update role to have admin access
    curl -s -X PATCH "http://localhost:8055/roles/$role_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"admin_access": true}' > /dev/null
    
    # Update policy to have admin and app access
    curl -s -X PATCH "http://localhost:8055/policies/$policy_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"admin_access": true, "app_access": true}' > /dev/null
    
    print_success "Admin permissions configured"
}

# Verify the setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if admin interface is accessible
    if curl -s "http://localhost:8055/admin/" | grep -q "html"; then
        print_success "Admin interface is accessible"
    else
        print_warning "Admin interface may not be ready yet"
    fi
    
    # Get authentication token for verification
    local token
    token=$(curl -s -X POST http://localhost:8055/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"password123"}' | \
        jq -r '.data.access_token' 2>/dev/null || echo "")
    
    if [ -n "$token" ] && [ "$token" != "null" ]; then
        print_success "Authentication is working"
        
        # Check if collections are accessible
        if curl -s -H "Authorization: Bearer $token" "http://localhost:8055/collections" | grep -q "forms"; then
            print_success "Collections are accessible"
        else
            print_warning "Collections may not be accessible yet"
        fi
    else
        print_warning "Could not verify authentication"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                 Aspect Health Forms POC Setup                   ║"
    echo "║                      Directus + Schema                          ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_dependencies
    cleanup_existing
    start_containers
    bootstrap_database
    apply_schema
    fix_permissions
    verify_setup
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                        🎉 Setup Complete! 🎉                    ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}🔗 Access URLs:${NC}"
    echo "   📱 Directus Admin: http://localhost:8055/admin/"
    echo "   🔑 Login: admin@example.com / password123"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "   1. Open the admin interface and explore the collections"
    echo "   2. Create demo form data in the Forms collection"
    echo "   3. Start the React Native app: cd app && npm start"
    echo "   4. Test the complete form flow"
    echo ""
    echo -e "${BLUE}🗂️  Available Collections:${NC}"
    echo "   • Forms - Main form definitions"
    echo "   • Form Versions - Immutable form versions"
    echo "   • Questions - Individual form questions"
    echo "   • Question Choices - Multiple choice options"
    echo "   • Responses - User response sessions"
    echo "   • Response Items - Individual answers"
    echo "   • Branching Rules - Conditional logic"
    echo ""
    echo -e "${YELLOW}💡 Tip: If you encounter permission issues, wait 30 seconds and refresh the admin interface.${NC}"
}

# Run main function
main "$@" 