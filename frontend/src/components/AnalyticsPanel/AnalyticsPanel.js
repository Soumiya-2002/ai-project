import React, { useState } from 'react';

const AnalyticsPanel = ({ video }) => {
    const [activeTab, setActiveTab] = useState('nlm'); // 'nlm' or 'vapi'

    // Mock Data based on video
    const nlmData = {
        summary: "The lecture covers the fundamental concepts of Algebra, focusing on linear equations. Student engagement peaked during the 'practical examples' section.",
        highlights: [
            { time: "02:15", type: "peak", text: "High attention when explaining 'Variables'" },
            { time: "05:30", type: "drop", text: "Attention drop during long calculation" },
            { time: "08:45", type: "peak", text: "Engagement spike at 'Real-world application'" }
        ],
        keywords: ["Algebra", "Linear Equations", "Variables", "Coefficients"]
    };

    const vapiData = {
        clarity: "92%",
        pace: "Ideal (130 wpm)",
        fillerWords: 5,
        transcript: [
            { time: "00:05", text: "Good morning students, today we start with Algebra." },
            { time: "00:15", text: "Let's look at what a variable actually is." },
            { time: "00:45", text: "Think of x as a container... um, holding a value." },
            { time: "01:20", text: "So if x plus 5 equals 10, what is in the container?" }
        ]
    };

    return (
        <div className="analytics-panel">
            <div className="panel-header">
                Lecture Analysis Engine
            </div>

            <div className="panel-tabs">
                <button
                    className={`tab-btn ${activeTab === 'nlm' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nlm')}
                >
                    NLM Insights
                </button>
                <button
                    className={`tab-btn ${activeTab === 'vapi' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vapi')}
                >
                    VAPI Speech
                </button>
            </div>

            <div className="panel-content">
                {activeTab === 'nlm' ? (
                    <div className="nlm-content">
                        <h4 className="section-title">Engagement Curve</h4>
                        <div className="chart-mock">
                            {[40, 50, 65, 85, 90, 80, 60, 50, 40, 55, 75, 90, 85, 70, 60].map((h, i) => (
                                <div key={i} className="chart-bar" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>

                        <h4 className="section-title">AI Summary</h4>
                        <div className="insight-card">
                            <p className="insight-text">{nlmData.summary}</p>
                        </div>

                        <h4 className="section-title">Key Moments</h4>
                        {nlmData.highlights.map((h, i) => (
                            <div key={i} className={`insight-card ${h.type === 'drop' ? 'warning' : ''}`}>
                                <span className="time">{h.time}</span>
                                <p className="insight-text">{h.text}</p>
                            </div>
                        ))}

                        <h4 className="section-title">Keywords</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {nlmData.keywords.map(k => (
                                <span key={k} style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>#{k}</span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="vapi-content">
                        <div className="video-stats-row" style={{ padding: '0 0 1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="stat-item">
                                <span className="stat-label">Clarity</span>
                                <span className="stat-val" style={{ color: '#4ade80' }}>{vapiData.clarity}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Pace</span>
                                <span className="stat-val" style={{ color: '#38bdf8' }}>{vapiData.pace}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Filler Words</span>
                                <span className="stat-val" style={{ color: '#f59e0b' }}>{vapiData.fillerWords}</span>
                            </div>
                        </div>

                        <h4 className="section-title">Live Transcript</h4>
                        <div className="transcript-list">
                            {vapiData.transcript.map((line, i) => (
                                <div key={i} className="transcript-line">
                                    <span className="t-time">{line.time}</span>
                                    <span className="t-text">{line.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPanel;
