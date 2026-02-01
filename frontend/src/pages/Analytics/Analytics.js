import React from 'react';
import './Analytics.css';

const Analytics = () => {
    return (
        <div className="analytics-page">
            <h1 className="page-title">Platform Analytics</h1>
            <p className="page-subtitle">Insights across all schools and lectures</p>

            <div className="analytics-grid">
                {/* Usage Chart */}
                <div className="card chart-card wide">
                    <h3>Analysis Volume (Last 30 Days)</h3>
                    <div className="chart-placeholder">
                        <div className="bars">
                            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                                <div key={i} className="bar" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                        <div className="x-axis">
                            <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
                        </div>
                    </div>
                </div>

                {/* Performance by Subject */}
                <div className="card chart-card">
                    <h3>Engagement by Subject</h3>
                    <div className="pie-chart-mock">
                        <div className="legend">
                            <div className="l-item"><span className="dot dot-1"></span>Math (85%)</div>
                            <div className="l-item"><span className="dot dot-2"></span>Science (72%)</div>
                            <div className="l-item"><span className="dot dot-3"></span>History (64%)</div>
                            <div className="l-item"><span className="dot dot-4"></span>English (78%)</div>
                        </div>
                    </div>
                </div>

                {/* Top Teachers */}
                <div className="card list-card">
                    <h3>Top Performing Teachers</h3>
                    <div className="top-list">
                        {[
                            { name: "Sarah Connors", score: 98, subject: "Physics" },
                            { name: "John Smith", score: 95, subject: "Math" },
                            { name: "Emily Blunt", score: 92, subject: "Chemistry" },
                        ].map((t, i) => (
                            <div key={i} className="list-item">
                                <div className="rank">#{i + 1}</div>
                                <div className="info">
                                    <div className="name">{t.name}</div>
                                    <div className="sub">{t.subject}</div>
                                </div>
                                <div className="score">{t.score}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="card list-card">
                    <h3>Recent Quality Alerts</h3>
                    <div className="alert-list">
                        <div className="alert-item warning">
                            <span className="icon">⚠️</span>
                            <div>
                                <div className="msg">Low Clarity Detected</div>
                                <div className="meta">Mr. Anderson • History 101</div>
                            </div>
                        </div>
                        <div className="alert-item info">
                            <span className="icon">ℹ️</span>
                            <div>
                                <div className="msg">Processing Delay</div>
                                <div className="meta">System • 2 mins ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
