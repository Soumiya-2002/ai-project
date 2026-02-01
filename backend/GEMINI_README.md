# Gemini Pro Integration for AI-Powered Educational Analysis

This implementation provides comprehensive AI-powered analysis of educational materials using **Google Gemini Pro 1.5**.

## 🎯 Features

### 1. **PDF Analysis**
- Read and analyze COB Parameters documents
- Extract lesson plan details
- Analyze reading materials
- Understand document structure

### 2. **DOCX Analysis**
- Process Microsoft Word documents
- Extract text and analyze content
- Support for all educational document types

### 3. **Video Analysis**
- Analyze classroom lecture videos
- Evaluate teaching methodology
- Assess student engagement
- Identify areas for improvement

### 4. **COB Report Generation**
- Automated classroom observation reports
- Parameter-by-parameter evaluation
- Evidence-based scoring
- Actionable recommendations

---

## 📦 Installation

The required packages have already been installed:

```bash
npm install @google/generative-ai file-type
```

### Dependencies:
- `@google/generative-ai` - Official Google Generative AI SDK
- `file-type` - File type detection
- `mammoth` - DOCX text extraction (already installed)
- `pdf-parse` - PDF text extraction (already installed)
- `multer` - File upload handling (already installed)

---

## 🔑 Configuration

Your `.env` file already contains the Gemini API key:

```env
GEMINI_API_KEY=AIzaSyCBcwDEcgsmExc08cu3gBWZDRujoZAZ8V8
```

---

## 🚀 API Endpoints

### 1. Upload and Analyze All Files

**Endpoint:** `POST /gemini/upload`

**Description:** Upload and analyze COB parameters, reading material, lesson plan, and video in one request.

**Request:**
```javascript
// Using FormData
const formData = new FormData();
formData.append('cobParams', cobParamsFile);        // PDF or DOCX
formData.append('readingMaterial', readingFile);    // PDF or DOCX
formData.append('lessonPlan', lessonPlanFile);      // PDF or DOCX
formData.append('video', videoFile);                // MP4, MOV, AVI, MKV
formData.append('teacher_id', '1');
formData.append('date', '2026-02-01');
formData.append('lecture_number', '1');

// Send request
fetch('http://localhost:5001/gemini/upload', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: formData
});
```

**Response:**
```json
{
    "success": true,
    "message": "Files uploaded and analyzed successfully!",
    "analysis": {
        "cobParams": {
            "success": true,
            "analysisType": "cob_params",
            "data": {
                "parameters": [...],
                "categories": [...],
                "scoring_rubrics": [...]
            }
        },
        "readingMaterial": {
            "success": true,
            "analysisType": "reading_material",
            "data": {
                "topic": "...",
                "key_concepts": [...],
                "summary": "..."
            }
        },
        "lessonPlan": {
            "success": true,
            "analysisType": "lesson_plan",
            "data": {
                "objectives": [...],
                "activities": [...],
                "timeline": "..."
            }
        },
        "video": {
            "success": true,
            "analysisType": "video",
            "data": {
                "content_analysis": {...},
                "teaching_methodology": {...},
                "cob_scoring": {...}
            }
        }
    },
    "files": {
        "cobParams": "cobParams-1738419692000.pdf",
        "readingMaterial": "readingMaterial-1738419692001.pdf",
        "lessonPlan": "lessonPlan-1738419692002.pdf",
        "video": "video-1738419692003.mp4"
    }
}
```

---

### 2. Analyze Specific PDF

**Endpoint:** `POST /gemini/analyze-pdf`

**Request:**
```json
{
    "filePath": "uploads/cobParams-1765767387317.pdf",
    "analysisType": "cob_params"
}
```

**Analysis Types:**
- `structure` - Document structure and organization
- `cob_params` - COB parameters and criteria
- `lesson_plan` - Lesson plan details
- `reading_material` - Reading material content
- `content` - General content analysis (default)

**Response:**
```json
{
    "success": true,
    "analysis": {
        "success": true,
        "analysisType": "cob_params",
        "data": {
            "parameters": [
                {
                    "category": "Concepts",
                    "name": "Makes no conceptual errors",
                    "weight": "40%",
                    "max_score": 2
                }
            ],
            "categories": ["Concepts", "Delivery", "Language", "Facilitator-Student"],
            "total_parameters": 17
        },
        "rawText": "..."
    }
}
```

---

### 3. Analyze Specific Video

**Endpoint:** `POST /gemini/analyze-video`

**Request:**
```json
{
    "filePath": "uploads/video-1738419692003.mp4",
    "context": {
        "cobParams": { ... },
        "lessonPlan": { ... },
        "readingMaterial": { ... }
    }
}
```

**Response:**
```json
{
    "success": true,
    "analysis": {
        "success": true,
        "analysisType": "video",
        "data": {
            "content_analysis": {
                "topics_taught": ["..."],
                "conceptual_errors": [],
                "clarity": "high"
            },
            "teaching_methodology": {
                "techniques": ["..."],
                "visual_aids": true,
                "engagement_strategies": ["..."]
            },
            "classroom_management": {
                "teacher_presence": "confident",
                "student_behavior": "attentive"
            },
            "cob_scoring": {
                "overall_score": 85,
                "parameter_scores": [...]
            }
        }
    }
}
```

---

## 💻 Usage Examples

### Example 1: Analyze COB Parameters PDF

```javascript
const geminiProService = require('./services/ai/geminiProService');

async function analyzeCOBParams() {
    const result = await geminiProService.analyzePDF(
        './uploads/cobParams-1765767387317.pdf',
        'cob_params'
    );
    
    console.log('COB Parameters:', result.data);
}
```

### Example 2: Analyze Classroom Video

```javascript
async function analyzeClassroomVideo() {
    // First, analyze supporting documents
    const cobParams = await geminiProService.analyzePDF(
        './uploads/cob-params.pdf',
        'cob_params'
    );
    
    const lessonPlan = await geminiProService.analyzePDF(
        './uploads/lesson-plan.pdf',
        'lesson_plan'
    );
    
    // Analyze video with context
    const videoAnalysis = await geminiProService.analyzeVideo(
        './uploads/lecture.mp4',
        {
            cobParams: cobParams.data,
            lessonPlan: lessonPlan.data
        }
    );
    
    console.log('Video Analysis:', videoAnalysis.data);
}
```

### Example 3: Generate Complete COB Report

```javascript
async function generateCOBReport() {
    // Analyze all components
    const cobParams = await geminiProService.analyzePDF(
        './uploads/cob-params.pdf',
        'cob_params'
    );
    
    const videoAnalysis = await geminiProService.analyzeVideo(
        './uploads/lecture.mp4',
        { cobParams: cobParams.data }
    );
    
    // Generate report
    const report = await geminiProService.generateCOBReport(
        videoAnalysis.data,
        cobParams.data
    );
    
    console.log('COB Report:', report.report);
}
```

---

## 🧪 Testing

Run the example script to test the implementation:

```bash
node examples/geminiExamples.js
```

This will analyze the uploaded COB parameters PDF and demonstrate the capabilities.

---

## 📁 File Structure

```
backend/
├── services/
│   └── ai/
│       ├── geminiProService.js      # Main Gemini Pro service
│       ├── geminiService.js         # Legacy service
│       ├── vapiService.js           # Audio processing
│       └── nlmService.js            # Rubric scoring
├── controllers/
│   ├── geminiUploadController.js   # New Gemini-powered upload
│   └── uploadController.js         # Legacy upload
├── routes/
│   ├── geminiRoutes.js             # Gemini API routes
│   └── uploadRoutes.js             # Legacy routes
├── examples/
│   └── geminiExamples.js           # Usage examples
└── uploads/                        # Uploaded files
```

---

## 🎓 How It Works

### 1. **File Upload Flow**

```
User uploads files → Multer saves to disk → Gemini analyzes each file → Results returned
```

### 2. **Analysis Pipeline**

```
1. COB Parameters PDF → Extract parameters, criteria, rubrics
2. Reading Material PDF → Extract key concepts, summary
3. Lesson Plan PDF → Extract objectives, activities, timeline
4. Video File → Analyze teaching with context from above files
5. Generate COB Report → Combine all analyses into formal report
```

### 3. **Gemini Pro Capabilities**

- **Multimodal Input:** Can process text, PDFs, images, and videos
- **Large Context Window:** Can handle extensive documents
- **Structured Output:** Returns JSON for easy integration
- **Vision Capabilities:** Analyzes visual elements in videos

---

## 🔧 Customization

### Modify Analysis Prompts

Edit `geminiProService.js` to customize prompts for different analysis types:

```javascript
case 'custom_analysis':
    prompt = `Your custom prompt here...`;
    break;
```

### Add New File Types

Extend the `fileFilter` in `geminiUploadController.js`:

```javascript
const allowedExtensions = /pdf|docx|doc|mp4|mov|pptx/;
```

---

## 🐛 Troubleshooting

### Issue: "Gemini API not initialized"
**Solution:** Ensure `GEMINI_API_KEY` is set in `.env` file

### Issue: File upload fails
**Solution:** Check file size limits (currently 500MB) and allowed extensions

### Issue: Video analysis takes too long
**Solution:** This is normal for large videos. Consider implementing background processing.

---

## 📊 Expected Output Format

### COB Report Structure

```json
{
    "header": {
        "facilitator": "Teacher Name",
        "school": "School Name",
        "grade": "2",
        "subject": "Mathematics",
        "date": "2026-02-01"
    },
    "scores": {
        "overall_percentage": "85%",
        "segments": {
            "Concepts": "90%",
            "Delivery": "85%",
            "Language": "80%"
        }
    },
    "parameters": [
        {
            "category": "Concepts",
            "name": "Makes no conceptual errors",
            "score": 2,
            "out_of": 2,
            "comment": "Teacher explained concepts clearly..."
        }
    ],
    "highlights": ["Excellent use of visual aids"],
    "recommendations": ["Improve student engagement"]
}
```

---

## 🚀 Next Steps

1. **Test with your files:** Upload your actual COB parameters, lesson plans, and videos
2. **Customize prompts:** Adjust analysis prompts to match your specific requirements
3. **Integrate with frontend:** Update your React frontend to use the new `/gemini/upload` endpoint
4. **Add background processing:** For large videos, implement job queues (Bull, Agenda)
5. **Enhance reporting:** Add PDF generation for COB reports

---

## 📞 Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify your Gemini API key is valid
3. Ensure files are in the correct format
4. Review the example scripts in `examples/geminiExamples.js`

---

## 📝 License

This implementation is part of the AI Project and follows the project's license terms.
