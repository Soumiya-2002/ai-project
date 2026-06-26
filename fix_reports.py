import os

FILE_JS = '/Users/soumiyabhandari/projects/Node_JS/ai-project/frontend/src/pages/LessonPlanReports/LessonPlanReports.js'

with open(FILE_JS, 'r') as f:
    content = f.read()

content = content.replace("const Reports", "const LessonPlanReports")
content = content.replace("export default Reports", "export default LessonPlanReports")
content = content.replace("import './Reports.css'", "import './LessonPlanReports.css'")
content = content.replace("import \"./Reports.css\"", "import './LessonPlanReports.css'")
content = content.replace("api.get('/reports'", "api.get('/lesson-plan-reports'")
content = content.replace("api.post('/reports'", "api.post('/lesson-plan-reports'")

with open(FILE_JS, 'w') as f:
    f.write(content)
