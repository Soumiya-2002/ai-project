import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './Reports.css';

const Reports = () => {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [pdfError, setPdfError] = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const session = JSON.parse(localStorage.getItem('user')) || {};
    const isSuperAdmin = (session.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin';

    React.useEffect(() => {
        fetchLectures();
    }, []);

    // Cleanup object URL on unmount or change
    React.useEffect(() => {
        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [pdfBlobUrl]);

    const fetchLectures = async () => {
        try {
            const res = await api.get('/lectures');
            // Ensure strict numeric sort by ID desc
            const sorted = [...res.data].sort((a, b) => parseInt(b.id) - parseInt(a.id));
            setLectures(sorted);
            setLoading(false);

            // Check if we navigated here with a specific lecture ID to view
            const targetLectureId = location.state?.lectureId;
            let foundTarget = false;

            if (targetLectureId) {
                const targetIndex = sorted.findIndex(l => l.id === targetLectureId || l.id === parseInt(targetLectureId));
                if (targetIndex !== -1) {
                    foundTarget = true;
                    // Select the target lecture
                    handleSelectLecture(sorted[targetIndex]);
                    // Switch to the correct page
                    const targetPage = Math.ceil((targetIndex + 1) / itemsPerPage);
                    setCurrentPage(targetPage);
                }
            }

            // Default: Select the first lecture to show its PDF if no specific target found
            if (!foundTarget && sorted.length > 0) {
                handleSelectLecture(sorted[0]);
            }
        } catch (err) {
            console.error("Failed to fetch lectures", err);
            setLoading(false);
        }
    };

    // Filter Logic: Teacher Name, Lecture ID, Grade, Section
    const filteredLectures = lectures.filter(l => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();

        const idMatch = l.id.toString().includes(term);
        const teacherMatch = (l.Teacher?.name || '').toLowerCase().includes(term);
        const gradeMatch = (l.grade || '').toLowerCase().includes(term);
        const sectionMatch = (l.section || '').toLowerCase().includes(term);

        return idMatch || teacherMatch || gradeMatch || sectionMatch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredLectures.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLectures = filteredLectures.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Reset pagination when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSelectLecture = (lecture) => {
        setSelectedLecture(lecture);
        // Reset previous state
        setPdfError('');
        if (lecture.status === 'completed') {
            fetchPdf(lecture.id);
        } else {
            setPdfBlobUrl(null);
        }
    };

    const fetchPdf = async (lectureId) => {
        setPdfLoading(true);
        setPdfError('');
        setPdfBlobUrl(null);
        try {
            const response = await api.get(`/analysis/${lectureId}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            setPdfBlobUrl(url);
        } catch (err) {
            console.error('Failed to fetch PDF', err);
            setPdfError('Failed to load PDF. Please try again.');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleApproveReport = async (lectureId) => {
        try {
            await api.put(`/lectures/${lectureId}/approve`);
            setLectures(prev => prev.map(l => l.id === lectureId ? { ...l, is_approved: true } : l));
            if (selectedLecture && selectedLecture.id === lectureId) {
                setSelectedLecture(prev => ({ ...prev, is_approved: true }));
            }
            alert('Report approved successfully!');
        } catch (err) {
            console.error('Failed to approve report:', err);
            alert('Failed to approve report: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            {/* <Navbar /> */}
            <div className="reports-container">
                <div className="reports-header">
                    <h1 className="reports-title">AI Analysis Reports</h1>
                    <p className="reports-subtitle">View detailed AI performance insights and PDF reports</p>
                </div>

                <div className="reports-grid">

                    {/* Left Sidebar: Lecture List with Search & Pagination */}
                    <div className="lectures-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                        {/* Search Input */}
                        <div className="search-container">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search Teacher, ID, Grade, Section..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* List */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <ul className="lectures-list">
                                {loading ? (
                                    <li style={{ padding: '2rem', textAlign: 'center' }}>Loading...</li>
                                ) : currentLectures.length === 0 ? (
                                    <li style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No lectures found</li>
                                ) : (
                                    currentLectures.map(l => (
                                        <li
                                            key={l.id}
                                            className={`lecture-item ${selectedLecture && selectedLecture.id === l.id ? 'active' : ''}`}
                                            onClick={() => handleSelectLecture(l)}
                                        >
                                            <div className="lecture-info">
                                                <h4>{l.Teacher?.name || 'Unknown Teacher'}</h4>
                                                <div className="lecture-meta">
                                                    <span>#{l.id}</span>
                                                    <span>•</span>
                                                    <span>{l.grade ? `Class ${l.grade}-${l.section}` : 'General'}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                                                    {l.date}
                                                </div>
                                            </div>
                                            <span className={`status-badge status-${l.status || 'pending'}`}>
                                                {l.status === 'completed' ? 'View PDF' : l.status}
                                            </span>
                                            {isSuperAdmin && l.status === 'completed' && (
                                                <span style={{ fontSize: '0.7rem', color: l.is_approved ? '#10b981' : '#f59e0b', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                                                    {l.is_approved ? '✓ Approved' : '⏳ Pending'}
                                                </span>
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                >
                                    &lt; Prev
                                </button>
                                <span className="pagination-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                >
                                    Next &gt;
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Content: PDF Viewer */}
                    <div className="report-content-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                        {!selectedLecture ? (
                            <div className="empty-state">
                                <span className="empty-icon">📄</span>
                                <h3>Select a lecture to view report</h3>
                                <p>Select from the list to view the AI-generated PDF.</p>
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {/* Header */}
                                <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                                            {selectedLecture.Teacher?.name || 'Teacher'} - {selectedLecture.date}
                                        </h2>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                                            Lecture #{selectedLecture.id} • Class {selectedLecture.grade}-{selectedLecture.section}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {/* Approve Button for Super Admin */}
                                        {isSuperAdmin && !selectedLecture.is_approved && selectedLecture.status === 'completed' && (
                                            <button
                                                onClick={() => handleApproveReport(selectedLecture.id)}
                                                style={{
                                                    background: '#10b981', color: 'white', border: 'none', borderRadius: '4px',
                                                    padding: '0.5rem 1rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold'
                                                }}
                                            >
                                                Approve
                                            </button>
                                        )}

                                        {/* Download Link (if Blob URL exists) */}
                                        {pdfBlobUrl && (
                                            <a
                                                href={pdfBlobUrl}
                                                download={`Report-${selectedLecture.id}.pdf`}
                                                className="btn-primary"
                                                style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                            >
                                                Download PDF
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* PDF Viewer Area */}
                                <div style={{ flex: 1, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>

                                    {pdfLoading && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#6b7280' }}>
                                            <span style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
                                            <p>Loading PDF Report...</p>
                                        </div>
                                    )}

                                    {!pdfLoading && pdfError && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#ef4444' }}>
                                            <span style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</span>
                                            <p>{pdfError}</p>
                                        </div>
                                    )}

                                    {!pdfLoading && !pdfError && pdfBlobUrl && (
                                        <iframe
                                            src={pdfBlobUrl}
                                            title="PDF Report Viewer"
                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                        />
                                    )}

                                    {!pdfLoading && !pdfError && !pdfBlobUrl && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#6b7280' }}>
                                            <span style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</span>
                                            <p>No PDF available for this lecture.</p>
                                            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Status: {selectedLecture.status}</p>
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
