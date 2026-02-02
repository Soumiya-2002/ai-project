import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

const VideoUpload = () => {
    const [schools, setSchools] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    // Form Selection State
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [lectureNumber, setLectureNumber] = useState(1);

    // New File States
    const [cobParamsFile, setCobParamsFile] = useState(null);
    const [readingMaterialFile, setReadingMaterialFile] = useState(null);
    const [lessonPlanFile, setLessonPlanFile] = useState(null);

    // User Role context
    const session = JSON.parse(localStorage.getItem('user')) || {};
    const isSuperAdmin = (session.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin';
    const userSchoolId = session.school_id;

    React.useEffect(() => {
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
            const { data } = await api.get(`/teachers?school_id=${schoolId}&limit=100`);
            setTeachers(data.data || []);
        } catch (err) {
            console.error("Failed to load teachers", err);
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

        if (!selectedSchool || !selectedTeacher || !selectedDate || !file) {
            alert("Please complete all steps.");
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('school_id', selectedSchool);
        formData.append('teacher_id', selectedTeacher);
        formData.append('date', selectedDate);
        formData.append('lecture_number', lectureNumber);

        // Append additional files if they exist
        if (cobParamsFile) formData.append('cobParams', cobParamsFile);
        if (readingMaterialFile) formData.append('readingMaterial', readingMaterialFile);
        if (lessonPlanFile) formData.append('lessonPlan', lessonPlanFile);

        try {
            setMessage('Uploading Video...');
            const res = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('Upload Successful! AI Analysis Queued.');
            setFile(null);
            // Reset other fields if needed, or keep for next upload
        } catch (err) {
            console.error(err);
            setMessage('Upload Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            {/* Note: Navbar import path adjusted to ../../components/Navbar */}
            <div className="dashboard-container" style={{ padding: '2rem' }}>
                <h2 className="page-title">Upload Lecture Video</h2>
                <div className="card" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', borderRadius: '16px', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

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
                                        {t.name} ({Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects || 'N/A'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Step 3: Date & Lecture Number */}
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
                    {message && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: message.includes('Success') ? '#ecfdf5' : '#fef2f2', color: message.includes('Success') ? '#065f46' : '#991b1b', borderRadius: '8px', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoUpload;
