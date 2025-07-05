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
            slug: "privacy-policy-demo",
            title: "Privacy Policy Demo",
            description: "Privacy policy demo form",
            status: "published",
            exit_map: {
                "success": "https://example.com/success",
                "incomplete": "https://example.com/incomplete"
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
                uid: "privacy_policy",
                label: "Do you accept our privacy policy?",
                type: "multiple_choice",
                required: true,
                order: 1
            },
            {
                form_version_id: createdFormVersion.id,
                uid: "privacy_rejection",
                label: "Unfortunately, we cannot proceed without accepting our privacy policy. Please accept it to continue.",
                type: "multiple_choice",
                required: true,
                order: 2
            },
            {
                form_version_id: createdFormVersion.id,
                uid: "platform_purpose",
                label: "What brought you to our platform?",
                type: "multiple_choice",
                required: true,
                order: 3
            },
            {
                form_version_id: createdFormVersion.id,
                uid: "about_yourself",
                label: "Tell us a bit about yourself:",
                type: "short_text",
                required: true,
                order: 4
            },
            {
                form_version_id: createdFormVersion.id,
                uid: "detailed_goals",
                label: "Tell us more about your goals and interests:",
                type: "long_text",
                required: false,
                order: 5
            }
        ];
        
        const createdQuestions = [];
        for (const questionData of questionsData) {
            const createdQuestion = await directus.items('questions').createOne(questionData);
            createdQuestions.push(createdQuestion);
            console.log(`✅ Created question "${questionData.uid}" with ID: ${createdQuestion.id}`);
            await sleep(500);
        }
        
        // Step 4: Create question choices for the multiple choice questions
        console.log('📝 Creating question choices...');
        
        // Privacy policy question choices
        const privacyPolicyQuestion = createdQuestions.find(q => q.uid === 'privacy_policy');
        if (privacyPolicyQuestion) {
            const privacyChoicesData = [
                { question_id: privacyPolicyQuestion.id, label: "Yes, I accept", value: "yes", order: 1 },
                { question_id: privacyPolicyQuestion.id, label: "No, I don't accept", value: "no", order: 2 }
            ];
            
            for (const choiceData of privacyChoicesData) {
                const createdChoice = await directus.items('question_choices').createOne(choiceData);
                console.log(`✅ Created choice "${choiceData.label}" with ID: ${createdChoice.id}`);
                await sleep(300);
            }
        }
        
        // Privacy rejection question choice
        const privacyRejectionQuestion = createdQuestions.find(q => q.uid === 'privacy_rejection');
        if (privacyRejectionQuestion) {
            const rejectionChoicesData = [
                { question_id: privacyRejectionQuestion.id, label: "OK", value: "ok", order: 1 }
            ];
            
            for (const choiceData of rejectionChoicesData) {
                const createdChoice = await directus.items('question_choices').createOne(choiceData);
                console.log(`✅ Created choice "${choiceData.label}" with ID: ${createdChoice.id}`);
                await sleep(300);
            }
        }
        
        // Platform purpose question choices
        const platformPurposeQuestion = createdQuestions.find(q => q.uid === 'platform_purpose');
        if (platformPurposeQuestion) {
            const purposeChoicesData = [
                { question_id: platformPurposeQuestion.id, label: "Learning", value: "learning", order: 1 },
                { question_id: platformPurposeQuestion.id, label: "Business", value: "business", order: 2 },
                { question_id: platformPurposeQuestion.id, label: "Personal use", value: "personal", order: 3 },
                { question_id: platformPurposeQuestion.id, label: "Other", value: "other", order: 4 }
            ];
            
            for (const choiceData of purposeChoicesData) {
                const createdChoice = await directus.items('question_choices').createOne(choiceData);
                console.log(`✅ Created choice "${choiceData.label}" with ID: ${createdChoice.id}`);
                await sleep(300);
            }
        }
        
        // Step 5: Create branching rules
        console.log('📝 Creating branching rules...');
        const aboutYourselfQuestion = createdQuestions.find(q => q.uid === 'about_yourself');
        const detailedGoalsQuestion = createdQuestions.find(q => q.uid === 'detailed_goals');
        
        if (privacyPolicyQuestion && privacyRejectionQuestion && platformPurposeQuestion && aboutYourselfQuestion && detailedGoalsQuestion) {
            // Privacy policy branching rules
            const branchingRulesData = [
                {
                    form_version_id: createdFormVersion.id,
                    question_id: privacyPolicyQuestion.id,
                    operator: "eq",
                    value: JSON.stringify("no"),
                    target_question_id: privacyRejectionQuestion.id,
                    order: 1
                },
                {
                    form_version_id: createdFormVersion.id,
                    question_id: privacyRejectionQuestion.id,
                    operator: "eq",
                    value: JSON.stringify("ok"),
                    target_question_id: privacyPolicyQuestion.id,
                    order: 2
                },
                {
                    form_version_id: createdFormVersion.id,
                    question_id: privacyPolicyQuestion.id,
                    operator: "eq",
                    value: JSON.stringify("yes"),
                    target_question_id: platformPurposeQuestion.id,
                    order: 3
                },
                {
                    form_version_id: createdFormVersion.id,
                    question_id: platformPurposeQuestion.id,
                    operator: "is_not_empty",
                    value: JSON.stringify(null),
                    target_question_id: aboutYourselfQuestion.id,
                    order: 4
                },
                {
                    form_version_id: createdFormVersion.id,
                    question_id: aboutYourselfQuestion.id,
                    operator: "is_not_empty",
                    value: JSON.stringify(null),
                    target_question_id: detailedGoalsQuestion.id,
                    order: 5
                }
            ];
            
            for (const ruleData of branchingRulesData) {
                const createdRule = await directus.items('branching_rules').createOne(ruleData);
                console.log(`✅ Created branching rule with ID: ${createdRule.id}`);
                await sleep(300);
            }
            
            // Exit rule is not needed - frontend can detect completion when no more questions
            console.log('✅ Branching rules completed - frontend will handle form completion logic');
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