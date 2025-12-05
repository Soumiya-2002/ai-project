import React, { useState, useEffect, useCallback } from 'react';
import './TeacherList.css';

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStandard, setFilterStandard] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        standard: 'Sr',
        score: '',
        subject: '',
        experience: ''
    });

    const standards = ['All', 'Sr', 'Jr', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    useEffect(() => {
        loadTeachers();
    }, []);

    const filterTeachers = useCallback(() => {
        let filtered = teachers;

        if (searchTerm) {
            filtered = filtered.filter(teacher =>
                teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStandard !== 'All') {
            filtered = filtered.filter(teacher => teacher.standard === filterStandard);
        }

        setFilteredTeachers(filtered);
    }, [teachers, searchTerm, filterStandard]);

    useEffect(() => {
        filterTeachers();
    }, [filterTeachers]);

    const loadTeachers = () => {
        const storedTeachers = JSON.parse(localStorage.getItem('teachers')) || [];
        setTeachers(storedTeachers);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingTeacher !== null) {
            // Update existing teacher
            const updatedTeachers = teachers.map((teacher, index) =>
                index === editingTeacher ? { ...formData, id: teacher.id || Date.now() } : teacher
            );
            setTeachers(updatedTeachers);
            localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
        } else {
            // Add new teacher
            const newTeacher = { ...formData, id: Date.now() };
            const updatedTeachers = [...teachers, newTeacher];
            setTeachers(updatedTeachers);
            localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
        }

        resetForm();
    };

    const handleEdit = (index) => {
        setEditingTeacher(index);
        setFormData(teachers[index]);
        setShowModal(true);
    };

    const handleDelete = (index) => {
        if (window.confirm('Are you sure you want to delete this teacher?')) {
            const updatedTeachers = teachers.filter((_, i) => i !== index);
            setTeachers(updatedTeachers);
            localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            standard: 'Sr',
            score: '',
            subject: '',
            experience: ''
        });
        setEditingTeacher(null);
        setShowModal(false);
    };

    const getScoreColor = (score) => {
        const numScore = parseFloat(score);
        if (numScore >= 90) return 'score-excellent';
        if (numScore >= 75) return 'score-good';
        if (numScore >= 60) return 'score-average';
        return 'score-poor';
    };

    const getStandardBadge = (standard) => {
        if (standard === 'Sr') return 'badge-senior';
        if (standard === 'Jr') return 'badge-junior';
        return 'badge-standard';
    };

    return (
        <div className="teacher-list-container">
            <div className="teacher-list-header">
                <div className="header-content">
                    <h1 className="page-title">Teacher Management</h1>
                    <p className="page-subtitle">Manage all teachers and their information</p>
                </div>
                <button className="btn-add-teacher" onClick={() => setShowModal(true)}>
                    <span className="btn-icon">➕</span>
                    Add Teacher
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, email, or subject..."
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

            <div className="teachers-table-wrapper">
                <table className="teachers-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Standard</th>
                            <th>Subject</th>
                            <th>Experience</th>
                            <th>Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher, index) => (
                                <tr key={teacher.id || index} className="table-row">
                                    <td className="teacher-name">
                                        <div className="name-avatar">
                                            <div className="avatar">{teacher.name.charAt(0).toUpperCase()}</div>
                                            <span>{teacher.name}</span>
                                        </div>
                                    </td>
                                    <td>{teacher.email}</td>
                                    <td>{teacher.phone}</td>
                                    <td>
                                        <span className={`badge ${getStandardBadge(teacher.standard)}`}>
                                            {teacher.standard}
                                        </span>
                                    </td>
                                    <td>{teacher.subject}</td>
                                    <td>{teacher.experience} years</td>
                                    <td>
                                        <span className={`score-badge ${getScoreColor(teacher.score)}`}>
                                            {teacher.score}%
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-action btn-edit"
                                                onClick={() => handleEdit(index)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleDelete(index)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-data">
                                    <div className="no-data-content">
                                        <span className="no-data-icon">📚</span>
                                        <p>No teachers found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTeacher !== null ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                            <button className="modal-close" onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="teacher-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter teacher name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="teacher@example.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Standard *</label>
                                    <select
                                        name="standard"
                                        value={formData.standard}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {standards.filter(s => s !== 'All').map(std => (
                                            <option key={std} value={std}>{std}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Subject *</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., Mathematics"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Experience (years) *</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Score (%) *</label>
                                    <input
                                        type="number"
                                        name="score"
                                        value={formData.score}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        max="100"
                                        placeholder="0-100"
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingTeacher !== null ? 'Update Teacher' : 'Add Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherList;
