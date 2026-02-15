/**
 * Example Usage of Gemini Pro Service
 * 
 * This file demonstrates how to use the Gemini Pro service to:
 * 1. Analyze PDF files (COB Parameters, Reading Material, Lesson Plans)
 * 2. Analyze DOCX files
 * 3. Analyze classroom lecture videos
 * 4. Generate comprehensive COB reports
 */

const geminiProService = require('../services/ai/geminiProService');
const path = require('path');

// Example 1: Analyze a COB Parameters PDF
async function exampleAnalyzeCOBParams() {
    console.log('\n=== Example 1: Analyzing COB Parameters PDF ===\n');

    try {
        const pdfPath = path.join(__dirname, 'uploads', 'cobParams-1765767387317.pdf');

        const result = await geminiProService.analyzePDF(pdfPath, 'cob_params');

        console.log('✅ COB Parameters Analysis:');
        console.log(JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Example 2: Analyze Reading Material PDF
async function exampleAnalyzeReadingMaterial() {
    console.log('\n=== Example 2: Analyzing Reading Material PDF ===\n');

    try {
        const pdfPath = path.join(__dirname, 'uploads', 'reading-material.pdf');

        const result = await geminiProService.analyzePDF(pdfPath, 'reading_material');

        console.log('✅ Reading Material Analysis:');
        console.log(JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Example 3: Analyze Lesson Plan PDF
async function exampleAnalyzeLessonPlan() {
    console.log('\n=== Example 3: Analyzing Lesson Plan PDF ===\n');

    try {
        const pdfPath = path.join(__dirname, 'uploads', 'lesson-plan.pdf');

        const result = await geminiProService.analyzePDF(pdfPath, 'lesson_plan');

        console.log('✅ Lesson Plan Analysis:');
        console.log(JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Example 4: Analyze a classroom video with full context
async function exampleAnalyzeVideoWithContext() {
    console.log('\n=== Example 4: Analyzing Classroom Video with Context ===\n');

    try {
        const videoPath = path.join(__dirname, 'uploads', 'lecture-video.mp4');

        // First, analyze all supporting documents
        const cobParams = await geminiProService.analyzePDF(
            path.join(__dirname, 'uploads', 'cobParams.pdf'),
            'cob_params'
        );

        const readingMaterial = await geminiProService.analyzePDF(
            path.join(__dirname, 'uploads', 'reading-material.pdf'),
            'reading_material'
        );

        const lessonPlan = await geminiProService.analyzePDF(
            path.join(__dirname, 'uploads', 'lesson-plan.pdf'),
            'lesson_plan'
        );

        // Now analyze the video with full context
        const context = {
            cobParams: cobParams.data,
            readingMaterial: readingMaterial.data,
            lessonPlan: lessonPlan.data
        };

        const videoAnalysis = await geminiProService.analyzeVideo(videoPath, context);

        console.log('✅ Video Analysis:');
        console.log(JSON.stringify(videoAnalysis, null, 2));

        return videoAnalysis;
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Example 5: Generate a complete COB Report
async function exampleGenerateCOBReport() {
    console.log('\n=== Example 5: Generating Complete COB Report ===\n');

    try {
        // Analyze all components
        const cobParams = await geminiProService.analyzePDF(
            path.join(__dirname, 'uploads', 'cobParams.pdf'),
            'cob_params'
        );

        const readingMaterial = await geminiProService.analyzePDF(
            path.join(__dirname, 'uploads', 'reading-material.pdf'),
            'reading_material'
        );

        const lessonPlan = await geminiProService.analyzePDF(
            path.join(__dirname, 'uploads', 'lesson-plan.pdf'),
            'lesson_plan'
        );

        const videoAnalysis = await geminiProService.analyzeVideo(
            path.join(__dirname, 'uploads', 'lecture-video.mp4'),
            {
                cobParams: cobParams.data,
                readingMaterial: readingMaterial.data,
                lessonPlan: lessonPlan.data
            }
        );

        // Generate comprehensive COB report
        const cobReport = await geminiProService.generateCOBReport(
            videoAnalysis.data,
            cobParams.data,
            {
                readingMaterial: readingMaterial.data,
                lessonPlan: lessonPlan.data
            }
        );

        console.log('✅ Complete COB Report:');
        console.log(JSON.stringify(cobReport, null, 2));

        return cobReport;
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Example 6: Analyze PDF structure only
async function exampleAnalyzePDFStructure() {
    console.log('\n=== Example 6: Analyzing PDF Structure ===\n');

    try {
        const pdfPath = path.join(__dirname, 'uploads', 'cobParams-1765767387317.pdf');

        const result = await geminiProService.analyzePDF(pdfPath, 'structure');

        console.log('✅ PDF Structure Analysis:');
        console.log(JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Main function to run examples
async function runExamples() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Gemini Pro Service - Example Usage Demonstrations       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Uncomment the examples you want to run:

    // Example 1: Analyze COB Parameters
    await exampleAnalyzeCOBParams();

    // Example 2: Analyze Reading Material
    // await exampleAnalyzeReadingMaterial();

    // Example 3: Analyze Lesson Plan
    // await exampleAnalyzeLessonPlan();

    // Example 4: Analyze Video with Context
    // await exampleAnalyzeVideoWithContext();

    // Example 5: Generate Complete COB Report
    // await exampleGenerateCOBReport();

    // Example 6: Analyze PDF Structure
    // await exampleAnalyzePDFStructure();

    console.log('\n✨ Examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}

module.exports = {
    exampleAnalyzeCOBParams,
    exampleAnalyzeReadingMaterial,
    exampleAnalyzeLessonPlan,
    exampleAnalyzeVideoWithContext,
    exampleGenerateCOBReport,
    exampleAnalyzePDFStructure
};
