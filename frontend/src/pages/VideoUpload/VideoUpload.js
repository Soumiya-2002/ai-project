import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

const VideoUpload = () => {
    const [schools, setSchools] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    // Form Selection State
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [lectureNumber, setLectureNumber] = useState(1);
    const [grade, setGrade] = useState('');
    const [section, setSection] = useState('');

    // New File States
    const [cobParamsFile, setCobParamsFile] = useState(null);
    const [readingMaterialFile, setReadingMaterialFile] = useState(null);
    const [lessonPlanFile, setLessonPlanFile] = useState(null);

    // User Role context
    const session = JSON.parse(localStorage.getItem('user')) || {};
    const isSuperAdmin = (session.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin';
    const userSchoolId = session.school_id;

    useEffect(() => {
        if (isSuperAdmin) {
            loadSchools();
        } else if (userSchoolId) {
            setSelectedSchool(userSchoolId);
            loadTeachers(userSchoolId);
        }
    }, [isSuperAdmin, userSchoolId]);

    const loadSchools = async () => {
        try {
            const { data } = await api.get('/schools');
            setSchools(data.data || []);
        } catch (err) {
            console.error("Failed to load schools", err);
        }
    };

    const loadTeachers = async (schoolId) => {
        try {
            // Changed from /teachers to /users/teachers to fetch from Users table
            const { data } = await api.get(`/users/teachers?school_id=${schoolId}&limit=100`);
            setTeachers(data.data || []);
        } catch (err) {
            console.error("Failed to load teachers", err);
            console.error("Error response:", err.response?.data);
        }
    };

    const handleSchoolChange = (e) => {
        const schoolId = e.target.value;
        setSelectedSchool(schoolId);
        setSelectedTeacher('');
        if (schoolId) {
            loadTeachers(schoolId);
        } else {
            setTeachers([]);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!selectedSchool || !selectedTeacher || !selectedDate || !file || !grade || !section) {
            alert("Please complete all steps, including Grade and Section.");
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('school_id', selectedSchool);
        formData.append('teacher_id', selectedTeacher);
        formData.append('date', selectedDate);
        formData.append('lecture_number', lectureNumber);
        formData.append('grade', grade);
        formData.append('section', section);

        // Append additional files if they exist
        if (cobParamsFile) formData.append('cobParams', cobParamsFile);
        if (readingMaterialFile) formData.append('readingMaterial', readingMaterialFile);
        if (lessonPlanFile) formData.append('lessonPlan', lessonPlanFile);

        try {
            setIsLoading(true);
            setMessage('Uploading Video & Starting AI Analysis... This may take a few minutes.');
            setPdfUrl(null);

            const res = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Analysis Complete! Report Generated.');
            console.log("Response:", res.data);
            if (res.data.pdfReport) {
                setPdfUrl(res.data.pdfReport);
            }
            setFile(null);
            // We usually don't clear all form fields so user can upload another for same class easily?
            // But clearing file is good practice.
        } catch (err) {
            console.error(err);
            setMessage('Upload Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            {/* Note: Navbar import path adjusted to ../../components/Navbar */}
            <div className="dashboard-container" style={{ padding: '2rem' }}>
                <h2 className="page-title">Upload Lecture Video</h2>
                <div className="card" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', borderRadius: '16px', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="spinner" style={{
                                display: 'inline-block',
                                width: '60px',
                                height: '60px',
                                border: '4px solid rgba(0,0,0,0.1)',
                                borderRadius: '50%',
                                borderTopColor: '#000',
                                animation: 'spin 1s ease-in-out infinite',
                                marginBottom: '1.5rem'
                            }}></div>
                            <h3 style={{ color: '#111827', marginBottom: '0.5rem' }}>Analysis in Progress</h3>
                            <p style={{ color: '#4b5563', fontSize: '1.1rem' }}>
                                Please wait, the AI is analyzing your lecture video.<br />
                                This usually takes 2-3 minutes. Do not close this tab.
                            </p>
                            <style>{`
                                @keyframes spin {
                                    to { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    ) : (
                        <form onSubmit={handleUpload}>

                            {/* Step 1: School Selection */}
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select School</label>
                                {isSuperAdmin ? (
                                    <select
                                        className="form-control"
                                        value={selectedSchool}
                                        onChange={handleSchoolChange}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                        required
                                    >
                                        <option value="">-- Select School --</option>
                                        {schools.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={userSchoolId ? "My School (Locked)" : "No School Linked"}
                                        disabled
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f3f4f6' }}
                                    />
                                )}
                            </div>

                            {/* Step 2: Teacher Selection */}
                            <div className="form-group" style={{ marginBottom: '1.5rem', opacity: selectedSchool ? 1 : 0.5 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Teacher</label>
                                <select
                                    className="form-control"
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    disabled={!selectedSchool}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                    required
                                >
                                    <option value="">-- Select Teacher --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Step 3: Date, Lecture Number, Grade & Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', opacity: selectedTeacher ? 1 : 0.5 }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lecture Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        disabled={!selectedTeacher}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lecture Number</label>
                                    <select
                                        value={lectureNumber}
                                        onChange={(e) => setLectureNumber(e.target.value)}
                                        disabled={!selectedTeacher}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                        required
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                            <option key={num} value={num}>Lecture {num}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* New Grade & Section Fields */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Grade / Class</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10 or Kindergarten"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        disabled={!selectedTeacher}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Section</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A, B, Rose"
                                        value={section}
                                        onChange={(e) => setSection(e.target.value)}
                                        disabled={!selectedTeacher}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* COB Parameters (DOCX) */}
                            <div className="form-group" style={{ marginBottom: '1.5rem', opacity: selectedDate ? 1 : 0.5 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>COB Parameters (.docx / .pdf)</label>
                                <input
                                    type="file"
                                    accept=".docx, .pdf"
                                    onChange={(e) => setCobParamsFile(e.target.files[0])}
                                    disabled={!selectedDate}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px dashed #d1d5db', borderRadius: '8px' }}
                                    required
                                // Removed 'value' to avoid controlled input error for file
                                />
                            </div>

                            {/* Reading Material (PDF) */}
                            <div className="form-group" style={{ marginBottom: '1.5rem', opacity: selectedDate ? 1 : 0.5 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reading Material / Eye to Mind (.pdf)</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setReadingMaterialFile(e.target.files[0])}
                                    disabled={!selectedDate}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px dashed #d1d5db', borderRadius: '8px' }}
                                    required
                                />
                            </div>

                            {/* Open Sesame (PDF) */}
                            <div className="form-group" style={{ marginBottom: '2rem', opacity: selectedDate ? 1 : 0.5 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Open Sesame / Lesson Plan (.pdf)</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setLessonPlanFile(e.target.files[0])}
                                    disabled={!selectedDate}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px dashed #d1d5db', borderRadius: '8px' }}
                                    required
                                />
                            </div>

                            {/* Step 4: Upload Video */}
                            <div className="form-group" style={{ marginBottom: '2rem', opacity: selectedDate ? 1 : 0.5 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Upload Video File</label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="video/*"
                                    disabled={!selectedDate}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px dashed #d1d5db', borderRadius: '8px' }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!file}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: file ? '#000000' : '#9ca3af',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: file ? 'pointer' : 'not-allowed',
                                    fontSize: '1rem'
                                }}
                            >
                                <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: '8px' }}></i>
                                Upload & Analyze
                            </button>
                        </form>
                    )}

                    {message && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: message.includes('Success') || message.includes('Complete') ? '#ecfdf5' : '#fef2f2', color: message.includes('Success') || message.includes('Complete') ? '#065f46' : '#991b1b', borderRadius: '8px', textAlign: 'center' }}>
                            {message}
                            {pdfUrl && (
                                <div style={{ marginTop: '1rem' }}>
                                    <a
                                        href={`${api.defaults.baseURL}${pdfUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#065f46', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}
                                    >
                                        <i className="fa-solid fa-file-pdf" style={{ marginRight: '6px' }}></i>
                                        Download Report
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoUpload;
