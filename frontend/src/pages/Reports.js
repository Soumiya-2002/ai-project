import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './Reports.css';

const Reports = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');
    const [recentLectures, setRecentLectures] = useState([]);

    React.useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        try {
            const res = await api.get('/lectures');
            // Ensure strict numeric sort by ID desc
            const sorted = [...res.data].sort((a, b) => parseInt(b.id) - parseInt(a.id));
            setRecentLectures(sorted);
        } catch (err) {
            console.error("Failed to fetch lectures", err);
        }
    };

    const handleSelectLecture = (id) => {
        fetchReport(id);
    };

    const fetchReport = async (id) => {
        setError('');
        setReport(null);
        try {
            const res = await api.get(`/analysis/${id}`);
            setReport(res.data);
        } catch (err) {
            console.error(err);
            setError('Report not found or error fetching report.');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Try to find match in loaded lectures first
        const term = String(searchTerm).toLowerCase();
        const match = recentLectures.find(l =>
            l.id.toString() === term ||
            (l.Teacher?.name?.toLowerCase() || '').includes(term)
        );

        if (match) {
            handleSelectLecture(match.id);
        } else if (!isNaN(term) && term.trim() !== '') {
            // Fallback for direct ID fetch if not in list
            fetchReport(term);
        } else {
            setError('No teacher or lecture found with that name/ID');
        }
    };

    // Filter lectures for sidebar list
    const filteredLectures = recentLectures.filter(l => {
        if (!searchTerm) return true;
        const term = String(searchTerm).toLowerCase();
        return l.id.toString().includes(term) ||
            (l.Teacher?.name?.toLowerCase() || '').includes(term);
    });

    const handleDownload = async () => {
        if (!report || !report.lecture_id) return;
        try {
            const response = await api.get(`/analysis/${report.lecture_id}/download`, {
                responseType: 'blob', // Important
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Report-${report.lecture_id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Download failed', err);
            setError('Failed to download report.');
        }
    };

    // Helper to render score badge class
    const getScoreClass = (score, total) => {
        if (score === total) return 'score-pill score-perfect';
        if (score === 0) return 'score-pill score-poor';
        return 'score-pill score-good';
    };

    // Helper to extract data safely
    const getReportData = (report) => {
        if (!report) return null;
        let data = report.analysis_data;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return data; }
        }
        return data.cob_report || data.cob_analysis?.cob_report || data;
    };

    const cob = getReportData(report);

    return (
        <div>
            {/* <Navbar /> */}
            <div className="reports-container">
                <div className="reports-header">
                    <h1 className="reports-title">AI Analysis Reports</h1>
                    <p className="reports-subtitle">View detailed AI performance insights and classroom observations</p>
                </div>

                <div className="reports-grid">

                    {/* Left Sidebar: Lecture List */}
                    <div className="lectures-panel">
                        <div className="lectures-header">
                            <h3>Recent Lectures</h3>
                        </div>
                        <ul className="lectures-list">
                            {filteredLectures.map(l => (
                                <li
                                    key={l.id}
                                    className={`lecture-item ${report && report.lecture_id === l.id ? 'active' : ''}`}
                                    onClick={() => handleSelectLecture(l.id)}
                                >
                                    <div className="lecture-info">
                                        <h4>{l.Teacher?.name || 'Unknown Teacher'}</h4>
                                        <div className="lecture-meta">
                                            <span>#{l.id}</span>
                                            <span>•</span>
                                            <span>{l.date}</span>
                                        </div>
                                    </div>
                                    <span className="status-badge status-completed">View</span>
                                </li>
                            ))}
                            {filteredLectures.length === 0 && (
                                <li style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No lectures found</li>
                            )}
                        </ul>
                    </div>

                    {/* Right Content: Report View */}
                    <div className="report-content-panel">

                        {/* Search Bar */}
                        <div className="search-container">
                            <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', gap: '1rem' }}>
                                <input
                                    type="text"
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by Lecture ID or Teacher Name..."
                                />
                                <button type="submit" className="btn-primary">
                                    Search
                                </button>
                            </form>
                        </div>

                        {error && (
                            <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                {error}
                            </div>
                        )}

                        {!report && !error && (
                            <div className="empty-state">
                                <span className="empty-icon">📊</span>
                                <h3>Select a lecture to view analysis</h3>
                                <p>Choose from the list on the left or search by ID</p>
                            </div>
                        )}

                        {report && cob && (
                            <div className="report-card">
                                {/* Report Header */}
                                <div className="report-header">
                                    <div className="report-title-section">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h2>Classroom Observation Report</h2>
                                            <button
                                                onClick={handleDownload}
                                                className="btn-primary btn-auto-width"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '1rem' }}
                                            >
                                                <span>📥</span> Download PDF
                                            </button>
                                        </div>

                                        {/* New Meta Data Grid */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '1.5rem',
                                            marginTop: '1.5rem',
                                            width: '100%'
                                        }}>
                                            {(() => {
                                                const selectedLecture = recentLectures.find(l => l.id === report.lecture_id);
                                                return (
                                                    <>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>FACILITATOR</div>
                                                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                                                                {selectedLecture?.Teacher?.name || cob.header?.facilitator || 'Unknown'}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                                {selectedLecture?.Teacher?.email || ''}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>SCHOOL</div>
                                                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                                                                {selectedLecture?.Teacher?.School?.name || cob.header?.school || 'Unknown School'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>Full Details</div>
                                                            <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>
                                                                Class: {cob.header?.grade || 'N/A'} - {cob.header?.section || 'A'}
                                                            </div>
                                                            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                                                                {cob.header?.subject || 'General'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>Lecture Info</div>
                                                            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                                                                ID: #{report.lecture_id}
                                                            </div>
                                                            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                                                                Date: {selectedLecture?.date || report.date || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="score-badge-large">
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>AI Score</span>
                                        <span className="score-value">{cob.scores?.overall_percentage || report.score || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Key Stats */}
                                <div className="stats-grid">
                                    {cob.scores?.segments && Object.entries(cob.scores.segments).map(([seg, score]) => (
                                        <div key={seg} className="stat-card">
                                            <span className="stat-label">{seg}</span>
                                            <div className="stat-number">{score}</div>
                                        </div>
                                    ))}
                                    {!cob.scores?.segments && (
                                        <div className="stat-card">
                                            <span className="stat-label">Facilitator</span>
                                            <div className="stat-number">{cob.header?.facilitator || 'Unknown'}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Analysis Body */}
                                <div className="analysis-body">

                                    {cob.highlights && cob.highlights.length > 0 && (
                                        <div className="highlights-section">
                                            <h4 className="highlights-title">✨ Highlights & Strengths</h4>
                                            <ul className="highlights-list">
                                                {cob.highlights.map((h, i) => <li key={i}>{h}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    <h3 style={{ marginTop: '2.5rem', marginBottom: '1rem', color: '#111827' }}>Detailed Parameter Analysis</h3>

                                    {cob.parameters ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '30%' }}>Parameter</th>
                                                        <th style={{ width: '15%', textAlign: 'center' }}>Score</th>
                                                        <th style={{ width: '10%', textAlign: 'center' }}>Weight</th>
                                                        <th>Comments / Evidence</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cob.parameters.map((param, idx) => (
                                                        <tr key={idx} className="table-row">
                                                            <td>
                                                                <div style={{ fontWeight: '600', color: '#1f2937' }}>{param.name}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>{param.description}</div>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <span className={getScoreClass(param.score, param.out_of)}>
                                                                    {param.score} / {param.out_of}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'center', fontWeight: '500' }}>{param.weight}</td>
                                                            <td style={{ color: '#4b5563' }}>{param.comment}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                                                {JSON.stringify(cob, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
