#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Directus } = require('@directus/sdk');

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL || 'admin@example.com';
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD || 'password123';

// Create Directus client
const directus = new Directus(DIRECTUS_URL);

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main seed data function
async function seedData() {
    console.log('🌱 Starting seed data insertion...');
    
    try {
        // Authenticate
        console.log('🔐 Authenticating with Directus...');
        await directus.auth.login({
            email: DIRECTUS_EMAIL,
            password: DIRECTUS_PASSWORD
        });
        console.log('✅ Authentication successful');
        
        // Wait a moment for permissions to be fully applied
        console.log('⏳ Waiting for permissions to be fully applied...');
        await sleep(5000);
        
        // Test permissions by trying to read collections and specific items
        console.log('🔍 Testing permissions...');
        try {
            const collections = await directus.collections.readAll();
            console.log('✅ Collections accessible, permissions working');
            
            // Test access to our custom collections
            const forms = await directus.items('forms').readByQuery({ limit: 1 });
            console.log('✅ Forms collection accessible');
            
            const questions = await directus.items('questions').readByQuery({ limit: 1 });
            console.log('✅ Questions collection accessible');
            
        } catch (permError) {
            console.error('❌ Permission test failed:', permError.message);
            console.error('❌ Full error:', permError);
        }
        
        // Load seed data
        const seedFilePath = path.join(__dirname, '../infra/seeds/demo-forms.seed.json');
        
        if (!fs.existsSync(seedFilePath)) {
            throw new Error(`Seed file not found: ${seedFilePath}`);
        }
        
        const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));
        console.log('📄 Seed data loaded successfully');
        
        // Insert data in dependency order (no circular dependencies now)
        console.log('📝 Inserting data in dependency order...');
        
        // Insert collections in proper order
        const collections = [
            { name: 'forms', data: seedData.forms },
            { name: 'form_versions', data: seedData.form_versions },
            { name: 'questions', data: seedData.questions },
            { name: 'question_choices', data: seedData.question_choices },
            { name: 'branching_rules', data: seedData.branching_rules }
        ];
        
        for (const collection of collections) {
            if (collection.data && collection.data.length > 0) {
                console.log(`📝 Inserting ${collection.data.length} items into ${collection.name}...`);
                
                try {
                    // Use createMany for bulk insertion
                    const result = await directus.items(collection.name).createMany(collection.data);
                    console.log(`✅ Successfully inserted ${collection.data.length} items into ${collection.name}`);
                } catch (error) {
                    console.error(`❌ Failed to insert into ${collection.name}:`, error.message);
                    
                    // Try inserting items one by one for better error reporting
                    console.log(`🔄 Trying individual insertion for ${collection.name}...`);
                    let successCount = 0;
                    
                    for (const item of collection.data) {
                        try {
                            await directus.items(collection.name).createOne(item);
                            successCount++;
                        } catch (itemError) {
                            console.error(`❌ Failed to insert item:`, JSON.stringify(item, null, 2));
                            console.error(`❌ Error:`, itemError.message);
                        }
                    }
                    
                    console.log(`✅ Successfully inserted ${successCount}/${collection.data.length} items into ${collection.name}`);
                }
                
                // Small delay between collections
                await sleep(1000);
            } else {
                console.log(`⚠️ No data found for collection: ${collection.name}`);
            }
        }
        
        console.log('🎉 Seed data insertion completed!');
        
    } catch (error) {
        console.error('❌ Seed data insertion failed:', error.message);
        if (error.errors) {
            console.error('❌ Additional errors:', error.errors);
        }
        process.exit(1);
    } finally {
        // Logout
        try {
            await directus.auth.logout();
        } catch (logoutError) {
            // Ignore logout errors
        }
    }
}

// Run if called directly
if (require.main === module) {
    seedData().catch(console.error);
}

module.exports = { seedData }; 