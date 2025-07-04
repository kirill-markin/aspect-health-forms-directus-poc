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
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
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
    sleep 5
    
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
    
    # CRITICAL: Set admin_access = true on the Administrator role
    # In Directus v11, this should provide unrestricted access to everything
    print_status "Setting admin_access=true on Administrator role..."
    curl -s -X PATCH "http://localhost:8055/roles/$role_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"admin_access": true}' > /dev/null
    
    # Also ensure the policy has admin access
    print_status "Setting admin_access=true on Administrator policy..."
    curl -s -X PATCH "http://localhost:8055/policies/$policy_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d '{"admin_access": true, "app_access": true}' > /dev/null
    
    # Run database migrations to ensure everything is up to date
    # This is critical for Directus v11 policy-based access control
    print_status "Running database migrations to ensure everything is up to date..."
    docker exec aspect-health-forms-directus-poc-directus-1 npx directus database migrate:latest
    
    print_success "Administrator role configured with full admin access (Directus v11 policy-based)"
    
    # Try to refresh/apply the changes by restarting Directus service
    print_status "Refreshing Directus to apply permission changes..."
    docker restart aspect-health-forms-directus-poc-directus-1
    
    # Wait for Directus to be ready again
    print_status "Waiting for Directus to restart and apply changes..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:8055/server/health" | grep -q "ok"; then
            print_success "Directus restarted and ready with new permissions!"
            break
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Directus failed to restart within expected time"
        exit 1
    fi
    
    # Additional wait for permissions to fully propagate
    print_status "Waiting for permissions to fully propagate..."
    sleep 5
}

# Load seed data
load_seed_data() {
    print_status "Loading seed data using Directus SDK..."
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        return 1
    fi
    
    # Check if the seed data script exists
    if [ ! -f "./scripts/seed-data.js" ]; then
        print_error "Seed data script not found: ./scripts/seed-data.js"
        return 1
    fi
    
    # Run the Node.js seed data script
    if node ./scripts/seed-data.js; then
        print_success "Seed data loaded successfully"
    else
        print_error "Failed to load seed data"
        return 1
    fi
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
            
            # Check if seed data was loaded
            local forms_count
            forms_count=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8055/items/forms" | jq -r '.data | length' 2>/dev/null || echo "0")
            
            if [ "$forms_count" -gt 0 ]; then
                print_success "Seed data verification: $forms_count forms loaded"
            else
                print_warning "No forms found in database - this might be normal if running for the first time"
            fi
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
    load_seed_data
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
    echo "   2. Check the demo health survey form that was pre-loaded"
    echo "   3. Start the React Native app: cd app && npm start"
    echo "   4. Test the complete form flow with demo data"
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
    echo -e "${BLUE}📊 Demo Data Loaded:${NC}"
    echo "   • Health Survey Demo form with 4 questions"
    echo "   • Multiple choice question with 4 options (Excellent, Good, Fair, Poor)"
    echo "   • Long text question for health concerns"
    echo "   • NPS rating question for satisfaction"
    echo "   • Short text question for contact info"
    echo "   • 3 branching rules for conditional logic"
    echo ""
    echo -e "${YELLOW}💡 Tip: If you encounter permission issues, wait 30 seconds and refresh the admin interface.${NC}"
}

# Run main function
main "$@" 