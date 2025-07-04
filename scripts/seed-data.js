#!/usr/bin/env node

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
        
        // Insert data step by step, getting auto-generated IDs
        console.log('📝 Inserting data with auto-generated IDs...');
        
        // Step 1: Create forms (without ID)
        console.log('📝 Creating forms...');
        const formData = {
            slug: "demo-health-survey",
            title: "Health Survey Demo",
            description: "A demonstration health survey form with conditional logic",
            status: "published",
            exit_map: {
                "success": "https://example.com/success",
                "incomplete": "https://example.com/incomplete",
                "high_risk": "https://example.com/high-risk"
            }
        };
        const createdForm = await directus.items('forms').createOne(formData);
        console.log(`✅ Created form with ID: ${createdForm.id}`);
        await sleep(2000);
        
        // Step 2: Create form_versions using the form ID
        console.log('📝 Creating form version...');
        const formVersionData = {
            form_id: createdForm.id,
            version: 1,
            label: "Initial Version"
        };
        const createdFormVersion = await directus.items('form_versions').createOne(formVersionData);
        console.log(`✅ Created form version with ID: ${createdFormVersion.id}`);
        await sleep(2000);
        
        // Step 3: Create questions using the form_version ID
        console.log('📝 Creating questions...');
        const questionsData = [
            {
                form_version_id: createdFormVersion.id,
                uid: "general_health",
                label: "How would you rate your general health?",
                type: "multiple_choice",
                required: true,
                order: 1
            },
            {
                form_version_id: createdFormVersion.id,
                uid: "health_concerns",
                label: "Please describe any specific health concerns you have:",
                type: "long_text",
                required: false,
                order: 2
            },
            {
                form_version_id: createdFormVersion.id,
                uid: "satisfaction_rating",
                label: "How satisfied are you with your current healthcare provider?",
                type: "nps",
                required: true,
                order: 3
            },
            {
                form_version_id: createdFormVersion.id,
                uid: "contact_info",
                label: "Please provide your contact information:",
                type: "short_text",
                required: true,
                order: 4
            }
        ];
        
        const createdQuestions = [];
        for (const questionData of questionsData) {
            const createdQuestion = await directus.items('questions').createOne(questionData);
            createdQuestions.push(createdQuestion);
            console.log(`✅ Created question "${questionData.uid}" with ID: ${createdQuestion.id}`);
            await sleep(500);
        }
        
        // Step 4: Create question choices for the multiple choice question
        console.log('📝 Creating question choices...');
        const generalHealthQuestion = createdQuestions.find(q => q.uid === 'general_health');
        if (generalHealthQuestion) {
            const choicesData = [
                { question_id: generalHealthQuestion.id, label: "Excellent", value: "excellent", order: 1 },
                { question_id: generalHealthQuestion.id, label: "Good", value: "good", order: 2 },
                { question_id: generalHealthQuestion.id, label: "Fair", value: "fair", order: 3 },
                { question_id: generalHealthQuestion.id, label: "Poor", value: "poor", order: 4 }
            ];
            
            for (const choiceData of choicesData) {
                const createdChoice = await directus.items('question_choices').createOne(choiceData);
                console.log(`✅ Created choice "${choiceData.label}" with ID: ${createdChoice.id}`);
                await sleep(300);
            }
        }
        
        // Step 5: Create branching rules
        console.log('📝 Creating branching rules...');
        const healthConcernsQuestion = createdQuestions.find(q => q.uid === 'health_concerns');
        const satisfactionQuestion = createdQuestions.find(q => q.uid === 'satisfaction_rating');
        
        if (generalHealthQuestion && healthConcernsQuestion && satisfactionQuestion) {
            // First, create rules with target_question_id
            const simpleRulesData = [
                {
                    form_version_id: createdFormVersion.id,
                    question_id: generalHealthQuestion.id,
                    operator: "eq",
                    value: JSON.stringify("poor"),
                    target_question_id: healthConcernsQuestion.id,
                    order: 1
                },
                {
                    form_version_id: createdFormVersion.id,
                    question_id: generalHealthQuestion.id,
                    operator: "in",
                    value: JSON.stringify(["excellent", "good"]),
                    target_question_id: satisfactionQuestion.id,
                    order: 2
                }
            ];
            
            for (const ruleData of simpleRulesData) {
                const createdRule = await directus.items('branching_rules').createOne(ruleData);
                console.log(`✅ Created branching rule with ID: ${createdRule.id}`);
                await sleep(300);
            }
            
            // Create exit rules (using last question as target)
            console.log('📝 Creating exit rules...');
            const contactInfoQuestion = createdQuestions.find(q => q.uid === 'contact_info');
            const exitRulesData = [
                {
                    form_version_id: createdFormVersion.id,
                    question_id: satisfactionQuestion.id,
                    operator: "lt",
                    value: JSON.stringify(5),
                    target_question_id: contactInfoQuestion.id,
                    exit_key: "high_risk",
                    order: 3
                },
                {
                    form_version_id: createdFormVersion.id,
                    question_id: satisfactionQuestion.id,
                    operator: "gt",
                    value: JSON.stringify(8),
                    target_question_id: contactInfoQuestion.id,
                    exit_key: "success",
                    order: 4
                }
            ];
            
            for (const ruleData of exitRulesData) {
                const createdRule = await directus.items('branching_rules').createOne(ruleData);
                console.log(`✅ Created exit rule with ID: ${createdRule.id} (exit: ${ruleData.exit_key})`);
                await sleep(300);
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