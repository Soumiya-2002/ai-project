const PDFDocument = require('pdfkit');

const generatePDF = (report, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Report-${report.lecture_id}.pdf`);

    doc.pipe(res);

    // -- Header --
    doc.fontSize(10).fillColor('#64748b').text('AI SCHOOL MANAGER', 50, 50);
    doc.fontSize(24).fillColor('#1e293b').font('Helvetica-Bold').text('Classroom Observation Report', 50, 75);

    // Draw a line
    doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e2e8f0').stroke();

    // Set Y for Metadata
    doc.y = 130;
    const startY = doc.y;

    const cob = parseCOB(report);
    const header = cob.header || {};
    const scores = cob.scores || {};

    // Column 1: Facilitator
    doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold').text('FACILITATOR', 50, startY);
    doc.fontSize(12).fillColor('#1e293b').font('Helvetica').text(header.facilitator || 'Unknown', 50, startY + 15);

    // Column 2: School
    doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold').text('SCHOOL', 250, startY);
    doc.fontSize(12).fillColor('#1e293b').font('Helvetica').text(header.school || 'Unknown', 250, startY + 15);

    // Score Badge (Right Aligned)
    doc.roundedRect(450, startY, 100, 50, 10).fill('#f1f5f9');
    doc.fillColor('#64748b').fontSize(8).text('AI SCORE', 470, startY + 10);
    doc.fillColor('#2563eb').fontSize(20).font('Helvetica-Bold').text(scores.overall_percentage || report.score || 'N/A', 470, startY + 25);

    // Reset X and move down (Critical Fix for layout)
    doc.x = 50;
    doc.y = startY + 70;

    // -- Details --
    doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('Analysis Details');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Lecture ID: #${report.lecture_id}  |  Date: ${header.observation_date || report.createdAt}`);
    doc.text(`Class: ${header.grade} - ${header.section}  |  Subject: ${header.subject}`);
    doc.moveDown(2);

    // -- Stat Segments --
    if (scores.segments) {
        doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('Performance Breakdown');
        doc.moveDown();
        const segY = doc.y;
        let segX = 50;

        Object.entries(scores.segments).forEach(([key, val]) => {
            doc.rect(segX, segY, 100, 40).strokeColor('#cbd5e1').stroke();
            doc.fontSize(8).fillColor('#64748b').text(key.toUpperCase(), segX + 5, segY + 5);
            doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text(val, segX + 5, segY + 20);
            segX += 110;
        });
        doc.moveDown(4);
    }

    // -- Parameters Table --
    if (cob.parameters && cob.parameters.length > 0) {
        if (doc.y > 600) doc.addPage(); // Only add page if near bottom
        doc.x = 50; // Ensure Left Alignment
        doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Detailed Parameters');
        doc.moveDown();

        cob.parameters.forEach((param, i) => {
            // Background for row
            const currentY = doc.y;
            doc.rect(50, currentY, 500, 70).fillColor(i % 2 === 0 ? '#f8fafc' : '#ffffff').fill();

            // Content
            // Title
            doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(param.name, 60, currentY + 10);
            // Description
            doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(param.description, 60, currentY + 25);

            // Score
            doc.fillColor('#2563eb').fontSize(12).font('Helvetica-Bold').text(`${param.score}/${param.out_of}`, 450, currentY + 15, { align: 'right', width: 40 });

            // Comment
            doc.fillColor('#334155').fontSize(9).font('Helvetica-Oblique').text(param.comment || 'No comment', 60, currentY + 45, { width: 480 });

            // Space between rows
            doc.y = currentY + 75;

            // Page break check (simple)
            if (doc.y > 700) {
                doc.addPage();
            }
        });
    }

    doc.end();
};

// Helper: Parse the analysis_data which might be string or object
const parseCOB = (report) => {
    let data = report.analysis_data;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return {}; }
    }
    return data.cob_report || data.cob_analysis?.cob_report || {};
};

module.exports = { generatePDF };
