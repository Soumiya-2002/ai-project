import React, { useState, useEffect } from 'react';
import './VideoUpload.css';

const VideoUpload = () => {
    const [videos, setVideos] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [filterStandard, setFilterStandard] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        teacherId: '',
        teacherName: '',
        standard: 'Sr',
        subject: '',
        title: '',
        description: '',
        duration: '',
        videoFile: null,
        thumbnail: null,
        uploadDate: ''
    });

    const standards = ['All', 'Sr', 'Jr', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    useEffect(() => {
        loadVideos();
        loadTeachers();
    }, []);

    const loadVideos = () => {
        const storedVideos = JSON.parse(localStorage.getItem('videos')) || [];
        setVideos(storedVideos);
    };

    const loadTeachers = () => {
        const storedTeachers = JSON.parse(localStorage.getItem('teachers')) || [];
        setTeachers(storedTeachers);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'teacherId') {
            const selectedTeacher = teachers.find(t => t.id.toString() === value);
            if (selectedTeacher) {
                setFormData(prev => ({
                    ...prev,
                    teacherId: value,
                    teacherName: selectedTeacher.name,
                    standard: selectedTeacher.standard,
                    subject: selectedTeacher.subject
                }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [name]: reader.result }));
            };

            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newVideo = {
            ...formData,
            id: Date.now(),
            uploadDate: new Date().toISOString().split('T')[0]
        };

        const updatedVideos = [...videos, newVideo];
        setVideos(updatedVideos);
        localStorage.setItem('videos', JSON.stringify(updatedVideos));

        resetForm();
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this video?')) {
            const updatedVideos = videos.filter(v => v.id !== id);
            setVideos(updatedVideos);
            localStorage.setItem('videos', JSON.stringify(updatedVideos));
        }
    };

    const resetForm = () => {
        setFormData({
            teacherId: '',
            teacherName: '',
            standard: 'Sr',
            subject: '',
            title: '',
            description: '',
            duration: '',
            videoFile: null,
            thumbnail: null,
            uploadDate: ''
        });
        setShowModal(false);
    };

    const getFilteredVideos = () => {
        let filtered = videos;

        if (searchTerm) {
            filtered = filtered.filter(video =>
                video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                video.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                video.subject.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStandard !== 'All') {
            filtered = filtered.filter(video => video.standard === filterStandard);
        }

        return filtered;
    };

    const getStandardBadge = (standard) => {
        if (standard === 'Sr') return 'badge-senior';
        if (standard === 'Jr') return 'badge-junior';
        return 'badge-standard';
    };

    return (
        <div className="video-upload-container">
            <div className="video-upload-header">
                <div className="header-content">
                    <h1 className="page-title">Video Management</h1>
                    <p className="page-subtitle">Upload and manage teacher videos</p>
                </div>
                <button className="btn-upload-video" onClick={() => setShowModal(true)}>
                    <span className="btn-icon">📹</span>
                    Upload Video
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by title, teacher, or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-tabs">
                    {standards.map(standard => (
                        <button
                            key={standard}
                            className={`filter-tab ${filterStandard === standard ? 'active' : ''}`}
                            onClick={() => setFilterStandard(standard)}
                        >
                            {standard === 'All' ? 'All Standards' : `Standard ${standard}`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="videos-grid">
                {getFilteredVideos().length > 0 ? (
                    getFilteredVideos().map((video) => (
                        <div key={video.id} className="video-card">
                            <div className="video-thumbnail">
                                {video.thumbnail ? (
                                    <img src={video.thumbnail} alt={video.title} />
                                ) : (
                                    <div className="thumbnail-placeholder">
                                        <span className="placeholder-icon">🎬</span>
                                    </div>
                                )}
                                <div className="video-duration">{video.duration}</div>
                            </div>

                            <div className="video-content">
                                <h3 className="video-title">{video.title}</h3>
                                <p className="video-description">{video.description}</p>

                                <div className="video-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">👨‍🏫</span>
                                        <span className="meta-text">{video.teacherName}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">📚</span>
                                        <span className="meta-text">{video.subject}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className={`badge ${getStandardBadge(video.standard)}`}>
                                            {video.standard}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-icon">📅</span>
                                        <span className="meta-text">{video.uploadDate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="video-actions">
                                <button className="btn-action btn-play" title="Play">
                                    ▶️
                                </button>
                                <button
                                    className="btn-action btn-delete"
                                    onClick={() => handleDelete(video.id)}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-videos">
                        <span className="no-videos-icon">🎥</span>
                        <p>No videos found</p>
                        <button className="btn-upload-first" onClick={() => setShowModal(true)}>
                            Upload Your First Video
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload New Video</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="video-form">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Select Teacher *</label>
                                    <select
                                        name="teacherId"
                                        value={formData.teacherId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Choose a teacher...</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name} - {teacher.subject} (Standard {teacher.standard})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Standard</label>
                                    <input
                                        type="text"
                                        name="standard"
                                        value={formData.standard}
                                        readOnly
                                        className="readonly-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        readOnly
                                        className="readonly-input"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Video Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., Introduction to Algebra"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Description *</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Brief description of the video content..."
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Duration *</label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., 15:30"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Video File *</label>
                                    <input
                                        type="file"
                                        name="videoFile"
                                        onChange={handleFileChange}
                                        accept="video/*"
                                        required
                                        className="file-input"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Thumbnail (Optional)</label>
                                    <input
                                        type="file"
                                        name="thumbnail"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="file-input"
                                    />
                                    {formData.thumbnail && (
                                        <div className="thumbnail-preview">
                                            <img src={formData.thumbnail} alt="Thumbnail preview" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Upload Video
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoUpload;
