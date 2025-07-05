# Aspect Health Forms - Directus POC

A proof-of-concept demonstrating dynamic form management using Directus as a headless CMS backend with React Native frontend.

## Overview

This POC showcases:
- **Dynamic Form Creation**: Create forms through Directus admin interface
- **Conditional Logic**: Advanced branching rules for question flow
- **Form Versioning**: Immutable form versions for safe updates
- **Mobile-First**: React Native app for form completion
- **Data Management**: Structured response storage and analytics

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │     Directus    │    │   PostgreSQL    │
│   Mobile App    │◄──►│   (Headless     │◄──►│   Database      │
│                 │    │    CMS/API)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- **Docker & Docker Compose** - for running Directus and PostgreSQL
- **Node.js 18+** - for React Native development
- **Expo CLI** (recommended): `npm install -g @expo/cli`

### 🚀 One-Command Setup

Set up the entire POC from scratch:

```bash
./scripts/setup.sh
```

This automated script will:
1. 🧹 Clean up any existing containers and volumes
2. 🚀 Start fresh Docker containers (Directus + PostgreSQL)
3. 🔧 Bootstrap the database
4. 📋 Apply the complete forms schema with all collections and fields
5. 🔐 Configure admin permissions
6. ✅ Verify everything is working

**After setup completes:**
- 📱 **Directus Admin**: http://localhost:8055/admin/
- 🔑 **Login**: admin@example.com / password123
- All collections will be ready with proper fields and permissions

### Start the React Native App

```bash
cd app

# Install dependencies
npm install

# Create environment configuration
echo "EXPO_PUBLIC_DIRECTUS_URL=http://localhost:8055" > .env

# Start the development server
npm start
```

**Choose your platform:**
- Press `w` for web (easiest for testing)
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### 🧪 Test the Complete Flow

1. **Admin Interface**: Explore collections at http://localhost:8055/admin/
2. **Mobile App**: Complete the health survey demo
3. **Data Verification**: Check responses saved in Directus admin

## ✅ Setup Validation Checklist

Use this checklist to verify your local setup is working correctly:

### Directus Backend ✓
- [ ] Docker containers running: `docker-compose ps`
- [ ] Directus admin accessible: http://localhost:8055
- [ ] Can login with admin@example.com / password123
- [ ] Collections visible in **Content** menu
- [ ] Demo form exists in **Content** → **Forms**
- [ ] Questions populated in **Content** → **Questions**

### React Native App ✓  
- [ ] App dependencies installed: `npm install` in app/ directory
- [ ] Environment configured: `app/.env` exists with Directus URL
- [ ] Development server starts: `npm start` in app/ directory
- [ ] App loads without errors (web/simulator/device)
- [ ] Home screen shows "Aspect Health Forms"
- [ ] Demo form available and clickable

### End-to-End Flow ✓
- [ ] Can start the health survey from home screen
- [ ] Questions display correctly with proper field types
- [ ] Conditional logic works (different questions based on answers)
- [ ] Can navigate back/forward through questions
- [ ] Form completion shows success screen
- [ ] Response saved in Directus admin (**Content** → **Responses**)

### API Integration ✓
- [ ] API health check works: `curl http://localhost:8055/server/health`
- [ ] Forms endpoint accessible: `curl http://localhost:8055/items/forms`
- [ ] Mobile app can fetch form data (check browser console/logs)
- [ ] Mobile app can submit responses (verify in Directus)

**If all checkboxes are ✅, your POC is ready for demonstration!**

## Core Features

### Dynamic Form Management
- Create forms through Directus admin interface
- Support for multiple question types (text, multiple choice, NPS, etc.)
- Real-time form updates without app deployment

### Conditional Logic
- Advanced branching rules with multiple operators
- Support for hidden field conditions (UTM parameters, user segments)
- Fallback rules for default behavior

### Form Versioning
- Immutable form versions for safe updates
- Users complete the same version they started
- Easy rollback to previous versions

### Data Collection
- Structured response storage
- Progress tracking and resume capability
- Export-ready format for analytics

## Demo Form

The POC includes a health survey demo with:
- Multiple choice health rating
- Conditional text input for concerns
- NPS satisfaction rating
- Contact information collection
- Smart branching based on responses

## API Endpoints

### Directus REST API
- `GET /items/forms` - List forms
- `GET /items/form_versions/{id}` - Get form version with questions
- `POST /items/responses` - Create response session
- `POST /items/response_items` - Save answers

### Example Usage

```typescript
// Get form by slug
const form = await directusClient.getFormBySlug('demo-health-survey');

// Load form version with questions and rules
const versionData = await directusClient.getLatestFormVersion(form.id);

// Create response session
const response = await directusClient.createResponse(versionId, userId);

// Save answer
await directusClient.saveAnswer(response.id, 'question_uid', value);
```

## Development Commands

```bash
# Full setup from scratch (recommended)
./scripts/setup.sh

# Just restart without losing data
docker-compose restart

# Stop environment
docker-compose down

# Reset everything (deletes all data)
docker-compose down -v
```

## Configuration

### Environment Variables
- `DIRECTUS_URL` - Directus API endpoint
- `DB_*` - Database connection settings
- `ADMIN_*` - Admin user credentials

### Docker Services
- **Directus**: Port 8055 (admin interface + API)
- **PostgreSQL**: Port 5432 (database)

## Form Schema

### Collections
- `forms` - Form definitions
- `form_versions` - Immutable versions
- `questions` - Individual questions
- `question_choices` - Multiple choice options
- `branching_rules` - Conditional logic
- `form_webhooks` - Webhook configurations
- `responses` - User sessions
- `response_items` - Individual answers

### Branching Rules
Supports operators: `eq`, `neq`, `in`, `not_in`, `gt`, `lt`, `gte`, `lte`, `between`, `is_empty`, `is_not_empty`

## Troubleshooting

### Common Issues and Solutions

#### 🐳 Docker & Directus Issues

**1. Directus not starting**
```bash
# Check container logs
docker-compose logs directus

# Common fixes:
docker-compose down
docker-compose up -d

# If still failing, reset everything:
./scripts/reset.sh
./scripts/dev-up.sh
```

**2. Port conflicts (8055 already in use)**
```bash
# Check what's using the port
lsof -i :8055

# Kill the process or change port in docker-compose.yml
```

**3. Database connection issues**
```bash
# Verify PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs database

# Reset database if corrupted
docker-compose down -v
docker-compose up -d
```

#### 🔧 Schema & Data Issues

**4. Schema application fails**
```bash
# Ensure Directus CLI is installed
npm install -g directus

# Verify Directus is running
curl http://localhost:8055/server/health

# Try manual application
cd infra/ci
./apply.sh

# If still failing, create collections manually in Directus admin
```

**5. Demo data not appearing**
- Verify schema was applied first (collections exist)
- Check **Content** → **Forms** in Directus admin
- Try creating demo form manually:
  1. Go to **Content** → **Forms** → **Create Item**
  2. Use the JSON data from Step 3 above

#### 📱 React Native Issues

**6. Metro bundler issues**
```bash
cd app

# Clear all caches
npx expo start --clear

# Or if using React Native CLI:
npx react-native start --reset-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**7. App can't connect to Directus**
```bash
# Check the app environment file
cat app/.env
# Should contain: EXPO_PUBLIC_DIRECTUS_URL=http://localhost:8055

# Test Directus API manually
curl http://localhost:8055/items/forms

# For iOS Simulator, use computer's IP instead of localhost:
EXPO_PUBLIC_DIRECTUS_URL=http://192.168.1.XXX:8055
```

**8. Expo CLI issues**
```bash
# Update Expo CLI
npm install -g @expo/cli@latest

# Clear Expo cache
npx expo start --clear

# If using physical device, ensure same WiFi network
```

#### 🔍 Data Flow Issues

**9. Form responses not saving**
- Check browser console for API errors
- Verify Directus collections exist: `responses`, `response_items`
- Test API manually:
```bash
curl -X POST http://localhost:8055/items/responses \
  -H "Content-Type: application/json" \
  -d '{"form_version_id":"test","user_id":"test","status":"draft"}'
```

**10. Branching logic not working**
- Check **Content** → **Branching Rules** in Directus
- Verify rules have correct `form_version_id`
- Test with simple conditions first

### 🚨 Emergency Reset

If everything is broken and you want to start fresh:

```bash
# Nuclear option - deletes all data
./scripts/reset.sh

# Full reinstall
./scripts/dev-up.sh
npm install -g directus
./infra/ci/apply.sh

# Manually recreate demo data in Directus admin
```

### 💡 Getting Help

1. **Check container logs**: `docker-compose logs <service-name>`
2. **Verify services running**: `docker-compose ps`
3. **Test Directus API**: `curl http://localhost:8055/server/health`
4. **Check app logs**: Enable debugging in React Native/Expo
5. **Inspect network requests**: Use browser dev tools to see API calls

## Next Steps

### Production Deployment
- Use Docker Compose for production
- Set up SSL certificates
- Configure environment-specific settings
- Set up backup strategies

### Feature Enhancements
- File upload support with cloud storage integration
- Advanced field types (date, location, signature, etc.)
- Multi-language support
- Analytics dashboard
- Email notifications
- Real-time collaboration features

## License

This is a proof-of-concept project. Please refer to individual dependencies for their respective licenses.