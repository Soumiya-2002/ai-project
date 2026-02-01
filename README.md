# 🎓 AI-Powered Educational Analysis System

## Complete Implementation with Google Gemini Pro

This project provides a comprehensive solution for analyzing classroom lectures using AI. It processes COB (Classroom Observation) parameters, reading materials, lesson plans, and video lectures to generate detailed observation reports.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [API Endpoints](#api-endpoints)
8. [File Structure](#file-structure)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This system uses **Google Gemini Pro** to:

1. **Read and analyze** COB Parameters (PDF/DOCX)
2. **Extract insights** from Reading Materials (PDF/DOCX)
3. **Parse** Lesson Plans (PDF/DOCX)
4. **Analyze** classroom lecture videos
5. **Generate** comprehensive COB reports with scoring

---

## ✨ Features

### Document Analysis
- ✅ PDF file reading and analysis
- ✅ DOCX file reading and analysis
- ✅ Automatic text extraction
- ✅ Structured data extraction
- ✅ Context-aware analysis

### Video Analysis
- ✅ Classroom lecture video processing
- ✅ Teaching methodology evaluation
- ✅ Student engagement assessment
- ✅ Content accuracy verification
- ✅ Time-stamped observations

### COB Report Generation
- ✅ Automated parameter-by-parameter scoring
- ✅ Evidence-based comments
- ✅ Category-wise breakdowns
- ✅ Strengths and improvement areas
- ✅ Actionable recommendations

### Technical Features
- ✅ Multi-file upload support
- ✅ RESTful API endpoints
- ✅ Database integration
- ✅ JWT authentication
- ✅ Error handling
- ✅ Auto-model detection

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Upload Form (COB Params, Reading, Lesson, Video)   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Node.js/Express)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes: /gemini/upload, /gemini/analyze-pdf, etc.  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers: geminiUploadController.js              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services: geminiProService.js                       │   │
│  │  - analyzePDF()                                      │   │
│  │  - analyzeDOCX()                                     │   │
│  │  - analyzeVideo()                                    │   │
│  │  - generateCOBReport()                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Google Gemini Pro API                      │
│  - Text Analysis                                             │
│  - Document Understanding                                    │
│  - Structured Output Generation                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (MySQL/Sequelize)                 │
│  - Lectures Table                                            │
│  - Reports Table                                             │
│  - Teachers Table                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites
- Node.js v14+
- MySQL database
- Google Gemini API key

### Steps

1. **Clone the repository** (if applicable)
   ```bash
   cd /Users/soumiyabhandari/projects/Node_JS/ai-project
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up database**
   - Create MySQL database
   - Update `.env` with database credentials

5. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Generate API key
   - Add to `.env` file

---

## ⚙️ Configuration

### Backend `.env` File

```env
# Server
PORT=5001

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_ai_db

# Authentication
JWT_SECRET=supersecretkey

# AI Services
GEMINI_API_KEY=your_gemini_api_key_here
VAPI_API_KEY=your_vapi_key
NLM_API_KEY=your_nlm_key
```

### Important Notes
- ⚠️ **Never commit `.env` to version control**
- ✅ Use `.env.example` for template
- 🔑 Keep API keys secure

---

## 🚀 Usage

### Start the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

### Upload Files via UI

1. Navigate to `http://localhost:3000/upload`
2. Fill in lecture details (date, teacher, lecture number)
3. Upload files:
   - **COB Parameters**: PDF or DOCX
   - **Reading Material**: PDF or DOCX
   - **Lesson Plan**: PDF or DOCX
   - **Video File**: MP4, MOV, AVI, or MKV
4. Click "Upload & Analyze"
5. View analysis results

### Test the Integration

```bash
cd backend
node testGemini.js
```

Expected output:
```
╔════════════════════════════════════════════════════════════╗
║   Testing Gemini Pro Integration                          ║
╚════════════════════════════════════════════════════════════╝

📋 Configuration Check:
   GEMINI_API_KEY: ✅ Set

🧪 Test 1: Analyzing COB Parameters PDF...
   ✅ File exists
   📊 Starting analysis with Gemini Pro...
   ✅ Using model: gemini-pro
   ✅ Analysis Complete!
```

---

## 🔌 API Endpoints

### 1. Upload and Analyze All Files

**Endpoint**: `POST /gemini/upload`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body** (FormData):
```
cobParams: File (PDF/DOCX)
readingMaterial: File (PDF/DOCX)
lessonPlan: File (PDF/DOCX)
video: File (MP4/MOV/AVI/MKV)
teacher_id: String
date: String (YYYY-MM-DD)
lecture_number: Number
```

**Response**:
```json
{
    "success": true,
    "message": "Files uploaded and analyzed successfully!",
    "analysis": {
        "cobParams": {...},
        "readingMaterial": {...},
        "lessonPlan": {...},
        "video": {...}
    },
    "files": {
        "cobParams": "cobParams-1738419692000.pdf",
        "readingMaterial": "readingMaterial-1738419692001.pdf",
        "lessonPlan": "lessonPlan-1738419692002.pdf",
        "video": "video-1738419692003.mp4"
    }
}
```

### 2. Analyze Specific PDF

**Endpoint**: `POST /gemini/analyze-pdf`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
    "filePath": "uploads/cobParams-1765767387317.pdf",
    "analysisType": "cob_params"
}
```

**Analysis Types**:
- `structure` - Document structure
- `cob_params` - COB parameters
- `lesson_plan` - Lesson plan details
- `reading_material` - Reading material content
- `content` - General content (default)

**Response**:
```json
{
    "success": true,
    "analysis": {
        "success": true,
        "analysisType": "cob_params",
        "data": {...},
        "rawResponse": "..."
    }
}
```

### 3. Analyze Specific Video

**Endpoint**: `POST /gemini/analyze-video`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
    "filePath": "uploads/video-1738419692003.mp4",
    "context": {
        "cobParams": {...},
        "lessonPlan": {...},
        "readingMaterial": {...}
    }
}
```

**Response**:
```json
{
    "success": true,
    "analysis": {
        "success": true,
        "analysisType": "video",
        "data": {...},
        "rawResponse": "..."
    }
}
```

---

## 📁 File Structure

```
ai-project/
├── backend/
│   ├── services/
│   │   └── ai/
│   │       ├── geminiProService.js      # Main Gemini service
│   │       ├── geminiService.js         # Legacy service
│   │       ├── vapiService.js           # Audio processing
│   │       └── nlmService.js            # Rubric scoring
│   ├── controllers/
│   │   ├── geminiUploadController.js   # New Gemini controller
│   │   └── uploadController.js         # Legacy controller
│   ├── routes/
│   │   ├── geminiRoutes.js             # Gemini API routes
│   │   └── uploadRoutes.js             # Legacy routes
│   ├── models/
│   │   ├── Lecture.js
│   │   ├── Report.js
│   │   └── Teacher.js
│   ├── uploads/                        # Uploaded files
│   ├── examples/
│   │   └── geminiExamples.js           # Usage examples
│   ├── testGemini.js                   # Test script
│   ├── GEMINI_README.md                # Full documentation
│   ├── IMPLEMENTATION_SUMMARY.md       # Implementation details
│   ├── QUICK_START.md                  # Quick start guide
│   ├── .env                            # Environment variables
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Upload/
│   │   ├── components/
│   │   └── api/
│   └── package.json
└── README.md                           # This file
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "No working Gemini model found"

**Cause**: Invalid or missing API key

**Solution**:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Generate a new API key
3. Update `.env`:
   ```env
   GEMINI_API_KEY=your_new_api_key_here
   ```
4. Restart the server

#### 2. "File not found"

**Cause**: Incorrect file path

**Solution**:
```bash
# Check if file exists
ls -la backend/uploads/

# Verify path in code matches actual location
```

#### 3. "PDF extraction failed"

**Cause**: Corrupted or encrypted PDF

**Solution**:
- Try with a different PDF
- Ensure PDF is not password-protected
- Check PDF file size (should be < 500MB)

#### 4. "Database connection failed"

**Cause**: Incorrect database credentials

**Solution**:
1. Verify MySQL is running
2. Check `.env` database settings
3. Test connection:
   ```bash
   mysql -u root -p
   ```

#### 5. "Upload fails with 413 error"

**Cause**: File size exceeds limit

**Solution**:
- Current limit: 500MB
- Compress video files if needed
- Adjust limit in `geminiUploadController.js`:
  ```javascript
  limits: { fileSize: 500 * 1024 * 1024 }
  ```

---

## 📚 Documentation

- **Full API Documentation**: [`GEMINI_README.md`](./backend/GEMINI_README.md)
- **Implementation Details**: [`IMPLEMENTATION_SUMMARY.md`](./backend/IMPLEMENTATION_SUMMARY.md)
- **Quick Start Guide**: [`QUICK_START.md`](./backend/QUICK_START.md)
- **Example Scripts**: [`examples/geminiExamples.js`](./backend/examples/geminiExamples.js)

---

## 🎯 Next Steps

1. ✅ **Get Valid API Key** from Google AI Studio
2. ✅ **Test Integration** with `node testGemini.js`
3. ✅ **Upload Sample Files** via the UI
4. ✅ **Review Analysis Results**
5. ✅ **Customize Prompts** in `geminiProService.js`
6. ✅ **Integrate with Frontend** using provided API endpoints

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for detailed error messages
3. Consult the documentation files
4. Verify API key validity

---

## 📝 License

This project is part of the AI-powered educational analysis system.

---

## ✨ Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| PDF Analysis | ✅ | Extract and analyze PDF documents |
| DOCX Analysis | ✅ | Extract and analyze Word documents |
| Video Analysis | ✅ | Analyze classroom lecture videos |
| COB Report Generation | ✅ | Generate comprehensive observation reports |
| Multi-file Upload | ✅ | Upload multiple files simultaneously |
| Database Integration | ✅ | Store analysis results in MySQL |
| Authentication | ✅ | JWT-based authentication |
| Error Handling | ✅ | Comprehensive error handling |
| Auto-model Detection | ✅ | Automatically detect working Gemini model |

---

**Status**: ✅ Implementation Complete | ⚠️ Awaiting Valid Gemini API Key

**Last Updated**: February 1, 2026
