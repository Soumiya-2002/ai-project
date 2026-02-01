# 🔑 Gemini API Key Setup Guide (हिंदी में)

## समस्या क्या है?

आपकी current API key (`AIzaSyCBcwDEcgsmExc08cu3gBWZDRujoZAZ8V8`) काम नहीं कर रही है। यह हो सकता है:
- ❌ Expired हो गई हो
- ❌ Wrong service के लिए हो (Google Cloud vs AI Studio)
- ❌ Permissions सही न हों

## ✅ Solution: नई API Key बनाएं

### Step 1: Google AI Studio पर जाएं

1. Browser में खोलें: **https://aistudio.google.com/app/apikey**
2. अपने Google account से sign in करें

### Step 2: API Key Generate करें

1. **"Create API Key"** button पर click करें
2. अगर पूछे तो **"Create API key in new project"** select करें
3. Key automatically generate हो जाएगी
4. **Copy** button पर click करके key copy करें

### Step 3: `.env` File Update करें

1. File खोलें: `/backend/.env`
2. Line 8 को update करें:
   ```env
   GEMINI_API_KEY=यहां_आपकी_नई_key_paste_करें
   ```
3. File save करें

### Step 4: Server Restart करें

Backend terminal में:
```bash
# Ctrl+C दबाएं (server stop करने के लिए)
# फिर फिर से start करें:
npm run dev
```

### Step 5: Test करें

```bash
node testDirect.js
```

आपको यह दिखना चाहिए:
```
✅ SUCCESS! Model: gemini-pro
Response: नमस्ते!
```

## 🎯 अगर फिर भी काम न करे

### Option A: Google Cloud Console से API Key

1. जाएं: https://console.cloud.google.com/apis/credentials
2. "Create Credentials" > "API Key"
3. Key copy करें
4. "Restrict Key" में जाकर "Generative Language API" enable करें

### Option B: Free Trial Check करें

1. जाएं: https://aistudio.google.com/
2. Check करें कि आपका free quota available है
3. अगर नहीं है तो नया Google account से try करें

## 📞 Quick Test Commands

### Test 1: API Key Valid है या नहीं
```bash
node testDirect.js
```

### Test 2: PDF Analysis
```bash
node testGemini.js
```

### Test 3: Complete Upload Flow
```bash
# Frontend से file upload करें
# या Postman से test करें
```

## 🚀 API Key मिलने के बाद

आपका पूरा system तैयार है! बस API key डालें और:

1. ✅ COB Parameters analyze होंगे
2. ✅ Reading Materials analyze होंगे  
3. ✅ Lesson Plans analyze होंगे
4. ✅ Videos analyze होंगे
5. ✅ Complete COB Reports generate होंगे

## 💡 Important Notes

- 🆓 Gemini API **free** है (limited quota के साथ)
- 📊 Free quota: 60 requests/minute
- 💾 File size limit: 20MB per file (हमारा: 500MB)
- 🔐 API key को **कभी भी public** न करें

## 🎓 Video Tutorial (English)

अगर video देखना चाहें:
https://www.youtube.com/results?search_query=google+gemini+api+key+setup

## ✅ Checklist

- [ ] Google AI Studio पर गए
- [ ] API Key generate किया
- [ ] `.env` file update की
- [ ] Server restart किया
- [ ] `node testDirect.js` run किया
- [ ] ✅ Success message मिला

---

**मदद चाहिए?** 
- Documentation: `/backend/GEMINI_README.md`
- Quick Start: `/backend/QUICK_START.md`
