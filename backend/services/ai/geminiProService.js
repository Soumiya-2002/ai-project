const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class GeminiProService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
            this.genAI = null;
        } else {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }

        // Try different model names - the API key might support different versions
        this.modelNames = [
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-2.0-flash',
            'gemini-flash-latest',
            'gemini-pro-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];
    }

    /**
     * Get a working model
     */
    async getWorkingModel() {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized');
        }

        // Try each model until one works
        for (const modelName of this.modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({ model: modelName });
                // Test with a simple prompt
                const result = await model.generateContent('Hello');
                await result.response;
                //console.log(`✅ Using model: ${modelName}`);
                return model;
            } catch (error) {
                //console.log(`❌ Model ${modelName} not available`);
                continue;
            }
        }

        throw new Error('No working Gemini model found. Please check your API key.');
    }

    /**
     * Extract text from PDF using pdf-parse
     */
    async extractPDFText(filePath) {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    }

    /**
     * Extract text from DOCX using mammoth
     */
    async extractDOCXText(filePath) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }

    /**
     * Read and analyze PDF files using Gemini Pro
     * @param {string} filePath - Path to the PDF file
     * @param {string} analysisType - Type of analysis (structure, content, cob_params)
     * @returns {Promise<Object>} Analysis result
     */
    async analyzePDF(filePath, analysisType = 'content') {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized. Please set GEMINI_API_KEY');
        }

        try {
            // Extract text from PDF first
            const extractedText = await this.extractPDFText(filePath);

            // Use text-based analysis
            return await this.analyzeText(extractedText, analysisType, 'PDF');

        } catch (error) {
            console.error('Error analyzing PDF with Gemini:', error);
            throw error;
        }
    }

    /**
     * Read and analyze DOCX files using Gemini Pro
     * @param {string} filePath - Path to the DOCX file
     * @param {string} analysisType - Type of analysis
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeDOCX(filePath, analysisType = 'content') {
        try {
            const extractedText = await this.extractDOCXText(filePath);
            return await this.analyzeText(extractedText, analysisType, 'DOCX');

        } catch (error) {
            console.error('Error analyzing DOCX with Gemini:', error);
            throw error;
        }
    }

    /**
     * Analyze extracted text using Gemini Pro
     * @param {string} text - Text to analyze
     * @param {string} analysisType - Type of analysis
     * @param {string} sourceType - Source file type
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeText(text, analysisType = 'content', sourceType = 'text') {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized. Please set GEMINI_API_KEY');
        }

        try {
            // Get a working model
            const model = await this.getWorkingModel();

            let prompt = `Analyze the following ${sourceType} document content:\n\n${text}\n\n---\n\n`;

            switch (analysisType) {
                case 'structure':
                    prompt += `Provide a structural analysis of this document including:
                    1. Document type and purpose
                    2. Main sections and organization
                    3. Key topics covered
                    4. Overall structure
                    
                    Return as JSON with keys: documentType, sections, topics, structure`;
                    break;

                case 'cob_params':
                    prompt += `This is a COB (Classroom Observation) Parameters document. Extract and structure:
                    1. All observation parameters and criteria
                    2. Scoring rubrics and weightages
                    3. Categories and sub-categories
                    4. Expected behaviors and standards
                    5. Any specific instructions for observers
                    
                    Return as a structured JSON object with keys: parameters, categories, scoring_rubrics, instructions`;
                    break;

                case 'lesson_plan':
                    prompt += `Analyze this lesson plan document and extract:
                    1. Learning objectives
                    2. Topic and subject
                    3. Grade/class level
                    4. Teaching methodology
                    5. Activities planned
                    6. Resources required
                    7. Assessment methods
                    8. Time allocation
                    
                    Return as JSON with keys: objectives, topic, grade, methodology, activities, resources, assessment, timeline`;
                    break;

                case 'reading_material':
                    prompt += `Analyze this reading material and provide:
                    1. Main topic and theme
                    2. Key concepts covered
                    3. Difficulty level
                    4. Important vocabulary
                    5. Summary of content
                    6. Suggested discussion points
                    
                    Return as JSON with keys: topic, key_concepts, difficulty, vocabulary, summary, discussion_points`;
                    break;

                default:
                    prompt += `Provide a comprehensive analysis and summary of this content including:
                    - Main topics and themes
                    - Key points and takeaways
                    - Important details
                    - Overall purpose
                    
                    Return as JSON with keys: topics, key_points, details, purpose`;
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();

            // Try to extract JSON from the response
            let parsedData;
            try {
                // Remove markdown code blocks if present
                const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                    responseText.match(/```\n([\s\S]*?)\n```/) ||
                    [null, responseText];
                const jsonText = jsonMatch[1] || responseText;
                parsedData = JSON.parse(jsonText.trim());
            } catch (e) {
                // If not valid JSON, return as text
                parsedData = {
                    analysis: responseText,
                    raw_text: text.substring(0, 500) + '...' // Include snippet of original
                };
            }

            return {
                success: true,
                analysisType,
                sourceType,
                data: parsedData,
                rawResponse: responseText
            };

        } catch (error) {
            console.error('Error analyzing text with Gemini:', error);
            throw error;
        }
    }

    /**
     * Analyze video files using Gemini Pro
     * Note: For video analysis, we'll use a text-based approach with transcription
     * @param {string} filePath - Path to the video file
     * @param {Object} context - Additional context (COB params, lesson plan, etc.)
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeVideo(filePath, context = {}) {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized. Please set GEMINI_API_KEY');
        }

        try {
            const model = await this.getWorkingModel();

            // Build comprehensive prompt with context
            let prompt = `You are analyzing a classroom lecture video. Based on the provided context, generate a comprehensive analysis.\n\n`;

            if (context.cobParams) {
                prompt += `**COB Parameters:**\n${JSON.stringify(context.cobParams, null, 2)}\n\n`;
            }

            if (context.lessonPlan) {
                prompt += `**Lesson Plan:**\n${JSON.stringify(context.lessonPlan, null, 2)}\n\n`;
            }

            if (context.readingMaterial) {
                prompt += `**Reading Material:**\n${JSON.stringify(context.readingMaterial, null, 2)}\n\n`;
            }

            prompt += `
**Generate a detailed classroom observation report with:**

1. **Content Analysis:**
   - Topics covered
   - Conceptual accuracy
   - Clarity of explanations

2. **Teaching Methodology:**
   - Teaching techniques
   - Use of resources
   - Student engagement strategies

3. **Classroom Management:**
   - Teacher presence
   - Student behavior
   - Time management

4. **Alignment Assessment:**
   - Adherence to lesson plan
   - Use of reading materials
   - COB parameter compliance

5. **Scoring (if COB parameters provided):**
   - Parameter-by-parameter scores
   - Overall score
   - Evidence and justification

Return as a comprehensive JSON report.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            try {
                const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                    text.match(/```\n([\s\S]*?)\n```/) ||
                    [null, text];
                const jsonText = jsonMatch[1] || text;
                const parsedData = JSON.parse(jsonText.trim());

                return {
                    success: true,
                    analysisType: 'video',
                    data: parsedData,
                    rawResponse: text
                };
            } catch (e) {
                return {
                    success: true,
                    analysisType: 'video',
                    data: { analysis: text },
                    rawResponse: text
                };
            }

        } catch (error) {
            console.error('Error analyzing video with Gemini:', error);
            throw error;
        }
    }

    /**
     * Generate comprehensive COB report
     * @param {Object} videoAnalysis - Analysis from video
     * @param {Object} cobParams - COB parameters
     * @param {Object} additionalContext - Other context
     * @returns {Promise<Object>} COB Report
     */
    async generateCOBReport(videoAnalysis, cobParams, additionalContext = {}) {
        if (!this.genAI) {
            throw new Error('Gemini API not initialized. Please set GEMINI_API_KEY');
        }

        try {
            const model = await this.getWorkingModel();

            const prompt = `
You are an expert educational auditor. Generate a formal COB (Classroom Observation) Report.

**Video Analysis:**
${JSON.stringify(videoAnalysis, null, 2)}

**COB Parameters:**
${JSON.stringify(cobParams, null, 2)}

**Additional Context:**
${JSON.stringify(additionalContext, null, 2)}

Generate a comprehensive COB report with:
1. Header (teacher, school, subject, date, etc.)
2. Overall score and category-wise scores
3. Detailed parameter-by-parameter evaluation with:
   - Score
   - Evidence from observation
   - Comments
4. Highlights and strengths
5. Areas for improvement
6. Other observations
7. Recommendations

Return as a well-structured JSON object with keys: header, scores, parameters, highlights, areas_for_improvement, observations, recommendations`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            try {
                const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                    text.match(/```\n([\s\S]*?)\n```/) ||
                    [null, text];
                const jsonText = jsonMatch[1] || text;
                const parsedData = JSON.parse(jsonText.trim());

                return {
                    success: true,
                    report: parsedData,
                    rawResponse: text
                };
            } catch (e) {
                return {
                    success: true,
                    report: { analysis: text },
                    rawResponse: text
                };
            }

        } catch (error) {
            console.error('Error generating COB report with Gemini:', error);
            throw error;
        }
    }
}

module.exports = new GeminiProService();
