import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Reports = () => {
    const [lectureId, setLectureId] = useState('');
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');
    const [recentLectures, setRecentLectures] = useState([]);

    React.useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        try {
            const res = await api.get('/lectures'); // Gets all lectures
            // Sort by ID desc to show newest first
            const sorted = res.data.sort((a, b) => b.id - a.id);
            setRecentLectures(sorted);
        } catch (err) {
            console.error("Failed to fetch lectures", err);
        }
    };

    const handleSelectLecture = (id) => {
        setLectureId(id);
        // Trigger search effectively
        // We can't easily trigger the form submit event, so we just call the API logic
        // But state update is async, so we'll do it manually:
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
            setError('Report not found or error fetching report (Analysis might still be in progress).');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchReport(lectureId);
    };

    return (
        <div>
            <Navbar />
            <div className="dashboard-container">
                <h2>AI Analysis Reports</h2>

                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>

                    {/* Left Side: Lecture List */}
                    <div className="card" style={{ flex: 1, minWidth: '300px', textAlign: 'left' }}>
                        <h3>Recent Lectures</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Teacher</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentLectures.map(l => (
                                        <tr key={l.id}>
                                            <td>#{l.id}</td>
                                            <td>{l.Teacher ? l.Teacher.name : 'Unknown'}</td>
                                            <td>{l.date}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleSelectLecture(l.id)}
                                                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentLectures.length === 0 && (
                                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>No lectures found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Side: Report View */}
                    <div style={{ flex: 2, minWidth: '300px' }}>
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text"
                                    value={lectureId}
                                    onChange={(e) => setLectureId(e.target.value)}
                                    placeholder="Enter Lecture ID manually..."
                                    required
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" style={{ width: 'auto' }}>Search</button>
                            </form>
                            {error && <p className="error" style={{ marginTop: '10px' }}>{error}</p>}
                        </div>

                        {report && (
                            <div className="card" style={{ textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3>Analysis Report for Lecture #{report.lecture_id}</h3>
                                    <div style={{ background: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #10b981' }}>
                                        <span style={{ color: '#047857', fontWeight: 'bold' }}>AI Score: {report.score}/100</span>
                                    </div>
                                </div>

                                <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <h4>COB Analysis Details</h4>
                                    {(() => {
                                        let data = report.analysis_data;
                                        // Ensure we have an object
                                        if (typeof data === 'string') {
                                            try { data = JSON.parse(data); } catch (e) { return <p>{data}</p>; }
                                        }

                                        // Check for the new "cob_report" structure
                                        const cob = data.cob_report || data.cob_analysis?.cob_report || data;

                                        if (cob && cob.header) {
                                            return (
                                                <div>
                                                    {/* 1. Header Details */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                                        <div><strong>Facilitator:</strong> {cob.header.facilitator}</div>
                                                        <div><strong>School:</strong> {cob.header.school}</div>
                                                        <div><strong>Grade/Sec:</strong> {cob.header.grade} - {cob.header.section}</div>
                                                        <div><strong>Subject:</strong> {cob.header.subject}</div>
                                                        <div><strong>Date:</strong> {cob.header.observation_date}</div>
                                                        <div><strong>Duration:</strong> {cob.header.duration}</div>
                                                    </div>

                                                    {/* 2. Score Summary */}
                                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                                        <div style={{ background: '#0f172a', color: 'white', padding: '1rem', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                                                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Overall Score</div>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{cob.scores?.overall_percentage || 'N/A'}</div>
                                                        </div>
                                                        {cob.scores?.segments && Object.entries(cob.scores.segments).map(([seg, score]) => (
                                                            <div key={seg} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{seg}</div>
                                                                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#334155' }}>{score}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* 3. Detailed Parameter Table */}
                                                    {cob.parameters && (
                                                        <div style={{ overflowX: 'auto' }}>
                                                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                                <thead style={{ background: '#f1f5f9' }}>
                                                                    <tr>
                                                                        <th style={{ padding: '10px', textAlign: 'left' }}>Parameter</th>
                                                                        <th style={{ padding: '10px', textAlign: 'center' }}>Score</th>
                                                                        <th style={{ padding: '10px', textAlign: 'center' }}>Weight</th>
                                                                        <th style={{ padding: '10px', textAlign: 'left' }}>Comments / Evidence</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {cob.parameters.map((param, idx) => (
                                                                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                            <td style={{ padding: '12px' }}>
                                                                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{param.name}</div>
                                                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{param.description}</div>
                                                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{param.category}</div>
                                                                            </td>
                                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                                <span style={{
                                                                                    background: param.score === param.out_of ? '#dcfce7' : param.score === 0 ? '#fee2e2' : '#fef9c3',
                                                                                    color: param.score === param.out_of ? '#166534' : param.score === 0 ? '#991b1b' : '#854d0e',
                                                                                    padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold'
                                                                                }}>
                                                                                    {param.score} / {param.out_of}
                                                                                </span>
                                                                            </td>
                                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{param.weight}</td>
                                                                            <td style={{ padding: '12px', whiteSpace: 'pre-wrap' }}>{param.comment}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {/* 4. Highlights & Observations */}
                                                    <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
                                                        {cob.highlights && (
                                                            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                                                <h5 style={{ color: '#1e40af', marginTop: 0 }}>Highlights</h5>
                                                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                                                    {cob.highlights.map((h, i) => <li key={i}>{h}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {cob.other_observations && (
                                                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <h5 style={{ color: '#475569', marginTop: 0 }}>Other Observations</h5>
                                                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                                                    {cob.other_observations.map((o, i) => <li key={i}>{o}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // Fallback for older reports
                                            return (
                                                <div>
                                                    <p><em>This is an older report format.</em></p>
                                                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{JSON.stringify(data, null, 2)}</pre>
                                                </div>
                                            );
                                        }
                                    })()}
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
