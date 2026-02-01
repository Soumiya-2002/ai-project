/**
 * Simple test script to verify Gemini Pro integration
 */

require('dotenv').config();
const geminiProService = require('./services/ai/geminiProService');
const path = require('path');

async function testGeminiIntegration() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   Testing Gemini Pro Integration                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Configuration Check:');
    console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not Set');
    console.log('');

    // Test 1: Analyze the uploaded COB Parameters PDF
    console.log('🧪 Test 1: Analyzing COB Parameters PDF...\n');

    try {
        const pdfPath = path.join(__dirname, 'uploads', 'cobParams-1765767387317.pdf');
        console.log('   File path:', pdfPath);

        const fs = require('fs');
        if (!fs.existsSync(pdfPath)) {
            console.log('   ⚠️  File not found. Please ensure the PDF exists at:', pdfPath);
            return;
        }

        console.log('   ✅ File exists');
        console.log('   📊 Starting analysis with Gemini Pro...\n');

        const result = await geminiProService.analyzePDF(pdfPath, 'cob_params');

        console.log('   ✅ Analysis Complete!\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('RESULTS:');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(JSON.stringify(result, null, 2));
        console.log('\n═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('   ❌ Error during analysis:');
        console.error('   ', error.message);
        console.error('\n   Full error:', error);
    }

    console.log('\n✨ Test completed!\n');
}

// Run the test
testGeminiIntegration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
