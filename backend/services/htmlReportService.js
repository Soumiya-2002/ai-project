const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * Generates a PDF report that mimics the official COB Audit Report format.
 * - Extracts the absolute-positioned HEADER from the template.
 * - Reconstructs the BODY as a semantic HTML table for dynamic content.
 */
const generateReportFromHtml = async (data, templatePath, outputPath) => {
    try {
        console.log(`Generating Reconstructed Report from: ${templatePath}`);

        let headerHtml = '';
        const styles = [];

        // 1. Process Template for Header extraction
        if (fs.existsSync(templatePath)) {
            const htmlContent = fs.readFileSync(templatePath, 'utf8');
            const $ = cheerio.load(htmlContent);

            // Extract existing styles
            $('style').each((i, el) => styles.push($(el).html()));

            // Extract Header elements (approx top < 320px)
            const firstPage = $('.page').first();
            const headerElements = [];
            firstPage.find('.text-block').each((i, el) => {
                const style = $(el).attr('style') || '';
                const topMatch = style.match(/top:\s*([\d.]+)px/);
                // The header usually ends before the first table (approx 310-320px)
                if (topMatch && parseFloat(topMatch[1]) < 310) {
                    headerElements.push($.html(el));
                }
            });
            headerHtml = headerElements.join('\n');
        } else {
            console.warn("Template file not found. Using generic header.");
            headerHtml = `<h1 style="text-align:center; font-family:Arial;">CLASSROOM OBSERVATION – AUDIT REPORT</h1>`;
        }

        // 2. Add Custom CSS to match Screenshot Style
        styles.push(`
            body { background-color: #fff; width: 1000px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header-container { position: relative; height: 320px; width: 1000px; overflow: hidden; border-bottom: 2px solid #ddd; margin-bottom: 20px; }
            .content-container { width: 95%; margin: 0 auto; }
            
            /* Table Style matching Screenshot */
            .cob-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
            .cob-table th, .cob-table td { border: 1px solid #000; padding: 5px 8px; vertical-align: top; }
            
            /* Header Row */
            .cob-table thead th { 
                background-color: #f2f2f2; 
                font-weight: bold; 
                text-align: center;
                border-bottom: 2px solid #000;
            }
            .header-param { width: 25%; text-align: left !important; text-decoration: underline; }
            
            /* Section Headers (e.g. Concepts (55%)) */
            .section-header { 
                background-color: #e6e6e6; 
                font-weight: bold; 
                text-align: right; 
                padding-right: 20px !important;
                color: #4444ff; /* Blueish text from screenshot */
            }

            /* Cells */
            .score-cell { text-align: center; vertical-align: middle; font-weight: bold; font-size: 12px; }
            .comment-cell { text-align: left; }
            .weighted-cell { text-align: center; vertical-align: middle; }

            /* Overall Score Box */
            .overall-box { 
                border: 2px solid #000; 
                width: 60%; 
                margin: 20px auto;
                border-collapse: collapse;
            }
            .overall-box td { border: 1px solid #000; padding: 5px; }
            .overall-header { background-color: #f2f2f2; font-weight: bold; text-align: center; color: blue; }
        `);

        // 3. Replace Header Placeholders
        const cob = data.cob_report || {};
        const headerData = cob.header || {};

        const safeReplace = (key, val) => {
            if (val) headerHtml = headerHtml.replace(new RegExp(key, 'g'), val);
        };
        safeReplace('First Last', headerData.facilitator);
        safeReplace('SchoolName', headerData.school);
        // Sometimes SchoolName appears as Xxx
        safeReplace('Xxx', headerData.school);
        safeReplace('Gr 0X', `Gr ${headerData.grade || '0'}`);
        safeReplace('Mmm DD, YYYY', headerData.date);
        safeReplace('HH:MM', headerData.duration);
        safeReplace('Informed / Uninformed \\(Recommended\\)', 'Informed');

        // 4. Build Body Content (Tables)

        // A. Segment Scores Table (Concept, Delivery, Language, etc)
        const scores = cob.scores || {};
        const segmentAuditHTML = `
            <div style="font-family: Arial; font-size: 12px; position: absolute; top: 280px; left: 140px; font-weight: bold;">
                Overall Score: <span style="font-size: 14px;">${scores.overall_percentage || 'N/A'}</span>
            </div>
            
            <table class="overall-box" style="margin-left: 240px; font-size: 10px; width: 500px;">
                <tr class="overall-header">
                    <td colspan="2">Segment Scores</td>
                </tr>
                <tr style="background-color: #ddd; font-weight: bold;">
                    <td width="30%">Score</td>
                    <td>Segments</td>
                </tr>
                <tr>
                    <td class="score-cell">${getSegmentScore(cob.parameters, 'Concepts')}%</td>
                    <td>Concepts</td>
                </tr>
                <tr>
                    <td class="score-cell">${getSegmentScore(cob.parameters, 'Delivery')}%</td>
                    <td>Delivery</td>
                </tr>
                <tr>
                    <td class="score-cell">${getSegmentScore(cob.parameters, 'Language')}%</td>
                    <td>Language</td>
                </tr>
                 <tr>
                    <td class="score-cell">${getSegmentScore(cob.parameters, 'Teacher-Student')}%</td>
                    <td>Teacher-Student Interaction</td>
                </tr>
            </table>
            <div style="clear:both; height: 20px;"></div>
        `;

        // B. Detailed Parameters Table
        let tableBody = '';

        // Group by Category to insert Section Headers
        const grouped = groupBy(cob.parameters || [], 'category');
        const categories = ['Concepts', 'Delivery', 'Language', 'Resources', 'Time Utilisation', 'Plan Adherence'];

        categories.forEach(cat => {
            // Find keys that include the category name (e.g. "Concepts" matches "Concepts & Explanation")
            const actualKey = Object.keys(grouped).find(k => k && k.includes(cat));
            const params = grouped[cat] || (actualKey ? grouped[actualKey] : null);

            if (params) {
                // Section Header Row
                tableBody += `
                    <tr>
                        <td colspan="5" class="section-header">${cat} (${getCategoryWeight(cat)}%)</td>
                    </tr>
                `;

                params.forEach(p => {
                    const weighted = p.score && p.out_of ? ((p.score / p.out_of) * getParamWeight(p.name)).toFixed(1) + '%' : '-';
                    tableBody += `
                        <tr>
                            <td><strong>${p.name.replace(cat, '').trim() || p.name}</strong><br><span style="font-size:9px; color:#555;">${getRubricDesc(p.score)}</span></td>
                            <td class="score-cell">${p.score}</td>
                            <td class="score-cell">${p.out_of}</td>
                            <td class="weighted-cell">${weighted}</td>
                            <td class="comment-cell">${p.comment || ''}</td>
                        </tr>
                    `;
                });
            }
        });

        const mainTable = `
            <table class="cob-table">
                <thead>
                    <tr>
                        <th class="header-param">Parameter</th>
                        <th width="8%">Score</th>
                        <th width="8%">Out of</th>
                        <th width="10%">Weighted</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBody}
                </tbody>
            </table>
        `;

        // 5. Final HTML Assembly
        const finalHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>${styles.join('\n')}</style>
                </head>
                <body>
                    <div class="header-container">
                        ${headerHtml}
                        ${segmentAuditHTML} <!-- Injecting the Segment Table into the absolute header space/bottom -->
                    </div>
                    <div class="content-container">
                        ${mainTable}
                    </div>
                </body>
            </html>
        `;

        // 6. PDF Generation
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '30px', bottom: '30px', left: '20px', right: '20px' }
        });
        await browser.close();

        return outputPath;

    } catch (error) {
        console.error("HTML Report Gen Error:", error);
        throw error;
    }
};

// Utilities
function groupBy(arr, key) {
    if (!arr) return {};
    return arr.reduce((acc, x) => {
        const k = x[key] || 'Other';
        (acc[k] = acc[k] || []).push(x);
        return acc;
    }, {});
}

function getSegmentScore(params, category) {
    if (!params) return 0;
    const catParams = params.filter(p => p.category && p.category.includes(category));
    if (!catParams.length) return 0;
    const total = catParams.reduce((sum, p) => sum + (p.score || 0), 0);
    const max = catParams.reduce((sum, p) => sum + (p.out_of || 0), 0);
    return max ? ((total / max) * 100).toFixed(2) : 0;
}

function getCategoryWeight(cat) {
    if (cat.includes('Concept')) return 55;
    if (cat.includes('Delivery')) return 20;
    if (cat.includes('Language')) return 10;
    if (cat.includes('Resources')) return 10;
    if (cat.includes('Time')) return 10; // Approx
    return 0;
}

function getParamWeight(name) {
    // Rough logic based on screenshots
    if (name.includes('Rectification')) return 30;
    if (name.includes('Resource')) return 10;
    return 100; // Default
}

function getRubricDesc(score) {
    if (score === 2) return "(Meets expectation)";
    if (score === 1) return "(Partial/One error)";
    if (score === 0) return "(Multiple errors)";
    return "";
}

module.exports = { generateReportFromHtml };
