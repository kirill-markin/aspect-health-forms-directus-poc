# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a proof-of-concept demonstrating dynamic form management using Directus as a headless CMS backend with React Native frontend. The system enables creating forms through the Directus admin interface and completing them via a mobile app with advanced conditional logic.

## Architecture

Three-tier architecture:
- **React Native Mobile App** (Expo) - Form completion interface
- **Directus CMS/API** - Form management and data storage
- **PostgreSQL Database** - Data persistence

Key architectural patterns:
- **Data-First Design**: Directus mirrors database schema, no vendor lock-in
- **Immutable Form Versioning**: Users complete the same version they started
- **Client-Side Branching**: Complex conditional logic evaluated in React Native
- **API-First Integration**: REST APIs auto-generated from Directus schema

## Development Commands

### Environment Setup
```bash
# Complete automated setup from scratch (recommended)
./scripts/setup-complete-schema.sh

# Just restart containers without losing data
docker-compose restart

# Stop environment
docker-compose down

# Reset everything (deletes all data)
docker-compose down -v
```

### Schema Management
```bash
# Export current schema from running Directus instance
docker exec -it aspect-health-forms-directus-poc-directus-1 npx directus schema snapshot /tmp/current-schema.yaml

# Copy exported schema out for inspection
docker cp aspect-health-forms-directus-poc-directus-1:/tmp/current-schema.yaml ./tmp/

# Update the main schema file with changes (if needed)
cp ./tmp/current-schema.yaml ./infra/schema/directus-schema.yaml
```

### React Native Development
```bash
cd app

# Install dependencies
npm install

# Start development server
npm start

# Platform-specific builds
npm run ios      # iOS simulator
npm run android  # Android emulator  
npm run web      # Web browser
```

### Environment Configuration
- Root `.env` file: Database and Directus configuration
- `app/.env` file: React Native environment (create with `EXPO_PUBLIC_DIRECTUS_URL=http://localhost:8055`)

## Core Data Architecture

### Form System Design
The form system uses a **versioned, relational architecture**:

1. **Forms** → **Form Versions** (1:many) - Immutable versioning
2. **Form Versions** → **Questions** (1:many) - Question definitions  
3. **Questions** → **Question Choices** (1:many) - Multiple choice options
4. **Form Versions** → **Branching Rules** (1:many) - Conditional logic
5. **Form Versions** → **Responses** (1:many) - User sessions
6. **Responses** → **Response Items** (1:many) - Individual answers

### Collections and Fields Created
The automated setup creates these collections with complete field definitions:

- **Forms** - Main form definitions (id, slug, title, description, status, active_version_id, created_at, updated_at)
- **Form Versions** - Immutable form versions (id, form_id, version, label, created_at)
- **Questions** - Individual questions (id, form_version_id, uid, label, type, required, order)
- **Question Choices** - Multiple choice options (id, question_id, label, value, order)
- **Responses** - User response sessions (id, form_version_id, user_id, status, created_at, completed_at)
- **Response Items** - Individual answers (id, response_id, question_uid, value)
- **Branching Rules** - Conditional logic (id, form_version_id, question_uid, operator, value, target_question_uid, order)

### Question Types Supported
- `short_text` - Single line text input
- `long_text` - Multi-line textarea
- `multiple_choice` - Radio buttons with choices
- `nps` - 0-10 numeric rating scale

### Branching Logic System
Complex conditional logic using 11 operators:
- Comparison: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `between`
- Set operations: `in`, `not_in`
- Null checks: `is_empty`, `is_not_empty`

Branching rules support:
- **Question-based conditions**: `when_question_id`
- **Hidden field conditions**: `when_hidden_field` (UTM params, user segments)
- **Fallback rules**: `is_fallback=true` for default behavior
- **Priority ordering**: `order` field for rule evaluation sequence

## Key Components

### Backend (Directus)
- **Collections**: 8 core collections defining the form system
- **Schema as Code**: `infra/schema/directus-schema.yaml` contains complete structure
- **Demo Data**: `scripts/seed-data.js` for health survey example

### Frontend (React Native)
- **FormRenderer**: Dynamic component that renders any form structure using BranchingEngine
- **BranchingEngine**: Client-side logic evaluator (`app/src/utils/branching.ts`)
- **Field Components**: Modular question renderers in `app/src/components/fields/`
- **API Client**: TypeScript client with complete type definitions (`app/src/api/directus.ts`)
- **Screen Flow**: HomeScreen → DemoFormScreen → SuccessScreen

### Critical Integration Points
- **Environment Variables**: React Native connects to Directus via `EXPO_PUBLIC_DIRECTUS_URL`
- **API Authentication**: Currently public access, no auth required for POC
- **Data Flow**: Form definition (Directus) → Form rendering (React Native) → Response storage (Directus)

## Development Workflow

### Making Schema Changes
1. Modify collections in Directus admin interface
2. Export schema: 
   ```bash
   docker exec -it aspect-health-forms-directus-poc-directus-1 npx directus schema snapshot /tmp/current-schema.yaml
   docker cp aspect-health-forms-directus-poc-directus-1:/tmp/current-schema.yaml ./tmp/
   cp ./tmp/current-schema.yaml ./infra/schema/directus-schema.yaml
   ```
3. Commit updated `directus-schema.yaml`
4. Other developers apply with: `./scripts/setup-complete-schema.sh`

### Adding New Question Types
1. Add type to TypeScript union in `app/src/api/directus.ts`
2. Create field component in `app/src/components/fields/`
3. Add case to switch statement in `FormRenderer.tsx`
4. Update demo data if needed

### Modifying Branching Logic
The `BranchingEngine` class handles all conditional logic. Key methods:
- `getNextAction()` - Determines next question or exit
- `evaluateRule()` - Processes individual branching rules
- `updateAnswer()` - Updates internal state when user answers

### Testing the Complete Flow
1. Verify Directus admin access: http://localhost:8055
2. Check API health: `curl http://localhost:8055/server/health`
3. Test form data: `curl http://localhost:8055/items/forms`
4. Run React Native app and complete demo form
5. Verify responses in Directus admin under Content → Responses

## Troubleshooting Common Issues

### Schema Application Fails
- Run the complete setup script: `./scripts/setup-complete-schema.sh`
- Verify Directus running: `curl http://localhost:8055/server/health`
- Check logs: `docker-compose logs directus`
- If persistent issues, try manual collection creation in Directus admin

### React Native Connection Issues
- Check `app/.env` contains correct Directus URL
- For iOS simulator, use computer IP instead of localhost
- Verify CORS enabled in Directus (should be enabled by default)

### Docker Environment Issues
- Check container status: `docker-compose ps`
- View logs: `docker-compose logs directus`
- Reset if corrupted: `./scripts/setup-complete-schema.sh`

## Demo Data Structure

The POC includes a health survey with:
- Multiple choice health rating (triggers branching)
- Conditional text input for health concerns
- NPS satisfaction rating
- Contact information collection
- Exit routing based on user responses (success/high_risk paths)

This demonstrates the complete capabilities of the dynamic form system with real-world conditional logic.