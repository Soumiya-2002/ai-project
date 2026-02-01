# Quick Start Guide - Gemini Pro Integration

## 🚀 Quick Setup

### Step 1: Get a Valid Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key

### Step 2: Update Environment Variables

Edit `/backend/.env`:
```env
GEMINI_API_KEY=your_new_api_key_here
```

### Step 3: Test the Integration

```bash
cd /Users/soumiyabhandari/projects/Node_JS/ai-project/backend
node testGemini.js
```

You should see:
```
✅ Using model: gemini-pro
✅ Analysis Complete!
```

## 📤 Upload Files via API

### Using cURL

```bash
curl -X POST http://localhost:5001/gemini/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "cobParams=@/path/to/cob-params.pdf" \
  -F "readingMaterial=@/path/to/reading.pdf" \
  -F "lessonPlan=@/path/to/lesson-plan.pdf" \
  -F "video=@/path/to/lecture.mp4" \
  -F "teacher_id=1" \
  -F "date=2026-02-01"
```

### Using JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('cobParams', cobParamsFile);
formData.append('readingMaterial', readingFile);
formData.append('lessonPlan', lessonPlanFile);
formData.append('video', videoFile);
formData.append('teacher_id', '1');
formData.append('date', '2026-02-01');

const response = await fetch('http://localhost:5001/gemini/upload', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});

const result = await response.json();
console.log(result);
```

### Using Axios

```javascript
const formData = new FormData();
formData.append('cobParams', cobParamsFile);
formData.append('readingMaterial', readingFile);
formData.append('lessonPlan', lessonPlanFile);
formData.append('video', videoFile);
formData.append('teacher_id', '1');
formData.append('date', '2026-02-01');

const response = await axios.post('/gemini/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
    }
});

console.log(response.data);
```

## 🔍 Analyze Individual Files

### Analyze PDF

```javascript
const response = await fetch('http://localhost:5001/gemini/analyze-pdf', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        filePath: 'uploads/cobParams-1765767387317.pdf',
        analysisType: 'cob_params'
    })
});

const result = await response.json();
console.log(result.analysis);
```

### Analysis Types

- `structure` - Document structure and organization
- `cob_params` - COB parameters and criteria
- `lesson_plan` - Lesson plan details
- `reading_material` - Reading material content
- `content` - General content analysis (default)

## 💻 Backend Usage

### Direct Service Usage

```javascript
const geminiProService = require('./services/ai/geminiProService');

// Analyze COB Parameters
const cobAnalysis = await geminiProService.analyzePDF(
    './uploads/cob-params.pdf',
    'cob_params'
);

// Analyze Reading Material
const readingAnalysis = await geminiProService.analyzePDF(
    './uploads/reading-material.pdf',
    'reading_material'
);

// Analyze Lesson Plan
const lessonAnalysis = await geminiProService.analyzePDF(
    './uploads/lesson-plan.pdf',
    'lesson_plan'
);

// Analyze Video with Context
const videoAnalysis = await geminiProService.analyzeVideo(
    './uploads/lecture.mp4',
    {
        cobParams: cobAnalysis.data,
        readingMaterial: readingAnalysis.data,
        lessonPlan: lessonAnalysis.data
    }
);

// Generate COB Report
const cobReport = await geminiProService.generateCOBReport(
    videoAnalysis.data,
    cobAnalysis.data,
    {
        readingMaterial: readingAnalysis.data,
        lessonPlan: lessonAnalysis.data
    }
);

console.log(cobReport.report);
```

## 📊 Expected Response Format

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
                "scoring_rubrics": {...}
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

## 🎯 Common Use Cases

### Use Case 1: Analyze Uploaded COB Parameters

```bash
node testGemini.js
```

### Use Case 2: Batch Process Multiple Lectures

```javascript
const lectures = [
    { video: 'lecture1.mp4', date: '2026-02-01' },
    { video: 'lecture2.mp4', date: '2026-02-02' },
    { video: 'lecture3.mp4', date: '2026-02-03' }
];

for (const lecture of lectures) {
    const analysis = await geminiProService.analyzeVideo(
        `./uploads/${lecture.video}`,
        { cobParams: cobParamsData }
    );
    console.log(`Analyzed ${lecture.video}:`, analysis);
}
```

### Use Case 3: Generate Reports for All Teachers

```javascript
const teachers = await Teacher.findAll();

for (const teacher of teachers) {
    const lectures = await Lecture.findAll({ 
        where: { teacher_id: teacher.id } 
    });
    
    for (const lecture of lectures) {
        // Generate COB report for each lecture
        const report = await geminiProService.generateCOBReport(...);
        await Report.create({
            lecture_id: lecture.id,
            analysis_data: JSON.stringify(report),
            generated_by_ai: true
        });
    }
}
```

## 🔧 Troubleshooting

### Issue: "No working Gemini model found"

**Solution**:
```bash
# Check your API key
echo $GEMINI_API_KEY

# Or in Node.js
node -e "require('dotenv').config(); console.log(process.env.GEMINI_API_KEY)"

# Get a new key from: https://makersuite.google.com/app/apikey
```

### Issue: "File not found"

**Solution**:
```bash
# Check if file exists
ls -la uploads/cobParams-1765767387317.pdf

# Use absolute path
node -e "console.log(require('path').join(__dirname, 'uploads', 'file.pdf'))"
```

### Issue: "PDF extraction failed"

**Solution**:
```bash
# Test PDF extraction
node -e "const pdf = require('pdf-parse'); const fs = require('fs'); pdf(fs.readFileSync('uploads/file.pdf')).then(d => console.log(d.text.substring(0, 100)))"
```

## 📚 Additional Resources

- **Full Documentation**: `/backend/GEMINI_README.md`
- **Implementation Details**: `/backend/IMPLEMENTATION_SUMMARY.md`
- **Example Scripts**: `/backend/examples/geminiExamples.js`
- **Test Script**: `/backend/testGemini.js`

## 🎓 Tips

1. **Start Small**: Test with one PDF first before uploading all files
2. **Check Logs**: Monitor console output for detailed error messages
3. **Use Examples**: Run the example scripts to understand the flow
4. **Customize Prompts**: Edit `geminiProService.js` to adjust analysis prompts
5. **Cache Results**: Store analysis results to avoid re-processing

## ⚡ Performance Tips

- **File Size**: Keep videos under 100MB for faster processing
- **Batch Processing**: Process multiple files in parallel when possible
- **Caching**: Cache COB parameters analysis (they don't change often)
- **Background Jobs**: Use job queues for long-running video analysis

## 🔐 Security Notes

- **API Key**: Never commit your API key to version control
- **File Validation**: Always validate uploaded files
- **Authentication**: Ensure all endpoints require authentication
- **File Size Limits**: Current limit is 500MB per file

---

**Ready to start?** Run `node testGemini.js` after updating your API key!
