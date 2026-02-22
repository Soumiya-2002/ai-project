/**
 * VideoUpload.js (Frontend)
 * 
 * This component handles the UI for the main Video Upload form.
 * It strictly gathers necessary metadata Context (School, Teacher, Grade, Section, Docs) 
 * and handles dispatching the Multipart Form Data to the backend. It also initiates polling
 * to wait for the background AI Analysis process to complete and render the final success modal.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './VideoUpload.css';

const VideoUpload = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    // Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [completedLectureId, setCompletedLectureId] = useState(null);

    // Form Selection State
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [lectureNumber, setLectureNumber] = useState(1);
    const [grade, setGrade] = useState('');
    const [section, setSection] = useState('');


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

    /**
     * Resolves the list of active teachers for a specific school.
     * Required so the admin can assign the uploaded lecture to a specific educator.
     */
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

    /**
     * Resets dependent dropdowns (like Teachers) when the parent School dropdown changes.
     */
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

    /**
     * Captures the primary learning material (video/audio recording) from the file picker.
     */
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // State for Polling
    const [pollingLectureId, setPollingLectureId] = useState(null);

    // Polling Effect
    // Removed old continuous polling hook.
    // The new flow just uploads the video and immediately shows a success message, 
    // letting the user continue their work while AI processes in the background.

    /**
     * Compiles the form context into a multipart FormData payload and fires it off to the backend.
     * Activates the UI loader and sets up the ID required for background polling.
     */
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
        if (readingMaterialFile) formData.append('readingMaterial', readingMaterialFile);
        if (lessonPlanFile) formData.append('lessonPlan', lessonPlanFile);

        try {
            setIsLoading(true);
            setMessage('Uploading Video... Analysis will start automatically.');
            setPdfUrl(null);

            const res = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.status === 'processing' && res.data.lecture_id) {
                // The backend received it and started background analysis
                setIsLoading(false);
                setFile(null);
                setCompletedLectureId(res.data.lecture_id);
                setShowSuccessModal(true);
            } else {
                // Fallback for immediate path
                if (res.data.pdfReport) {
                    setPdfUrl(res.data.pdfReport);
                }
                setFile(null);
                setIsLoading(false);
                setShowSuccessModal(true);
            }

        } catch (err) {
            console.error(err);
            setMessage('Upload Failed: ' + (err.response?.data?.message || err.message));
            setIsLoading(false);
        }
    };

    const handleViewReport = () => {
        navigate('/reports', { state: { lectureId: completedLectureId } });
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        setMessage('Analysis Complete! You can start another upload.');
        // Reset form or other states if needed
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            {/* Full Screen Loader Overlay */}
            {isLoading && (
                <div className="full-screen-loader">
                    <div className="loader-content">
                        <span className="loader-spinner"></span>
                        <h3 className="loader-title">Uploading Video...</h3>
                        <p className="loader-text">
                            Please wait while your files are securely transferred to the server.<br />
                            This may take a minute depending on your internet speed.
                        </p>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', maxWidth: '500px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111', marginBottom: '1rem' }}>Upload Successful!</h2>
                        <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            Your video has been securely uploaded to the server.
                        </p>
                        <p style={{ color: '#0056b3', fontSize: '1rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                            The AI has started its analysis in the background. Please check the 'Reports' tab in 5 to 6 minutes.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => navigate('/reports')}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    background: '#000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Go to Reports
                            </button>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="dashboard-container" style={{ padding: '2rem', filter: isLoading || showSuccessModal ? 'blur(5px)' : 'none', pointerEvents: isLoading || showSuccessModal ? 'none' : 'auto' }}>
                <h2 className="page-title">Upload Lecture Video</h2>
                <div className="card" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', borderRadius: '16px', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

                    <form onSubmit={handleUpload}>
                        {/* ... (Existing Form Content) ... */}
                        {/* Note: I'm preserving the form content structure in the replacement below by mapping it similarly to the original file to avoid accidental deletion of form fields. But since replace_file_content replaces the whole block I select, I must be careful. */}
                        {/* For safety in this specific tool call, I will include the whole component body since I edited the top (hooks) and bottom (modal) */}

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
                                <select
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    disabled={!selectedTeacher}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}
                                    required
                                >
                                    <option value="" disabled>-- Select Grade --</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                        <option key={num} value={`Grade ${num}`}>Grade {num}</option>
                                    ))}
                                </select>
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

                    {message && !showSuccessModal && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: message.includes('Success') || message.includes('Complete') ? '#ecfdf5' : '#fef2f2', color: message.includes('Success') || message.includes('Complete') ? '#065f46' : '#991b1b', borderRadius: '8px', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoUpload;
