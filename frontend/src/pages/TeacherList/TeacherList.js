import React, { useState, useEffect, useCallback } from 'react';
import './TeacherList.css';
import { toast } from 'react-toastify';

import api from '../../api/axios';

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // New field for creation
        school_id: '', // Empty default
        status: 'Active',
        experience: 5
    });

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadTeachers(page);
        loadSchools(); // Load schools for dropdown
    }, [page]);

    const filterTeachers = useCallback(() => {
        let filtered = teachers;
        if (searchTerm) {
            filtered = filtered.filter(teacher =>
                teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredTeachers(filtered);
    }, [teachers, searchTerm]);

    useEffect(() => {
        filterTeachers();
    }, [filterTeachers]);

    const loadSchools = async () => {
        try {
            const { data } = await api.get('/schools');
            let list = [];
            // Robustly handle response structure (array vs object with data property)
            if (Array.isArray(data)) list = data;
            else if (data && Array.isArray(data.data)) list = data.data;

            setSchools(list);

            // Set default school if available
            if (list.length > 0) {
                setFormData(prev => ({ ...prev, school_id: list[0]?.id || '' }));
            }
        } catch (error) {
            console.error("Failed to load schools", error);
            setSchools([]);
        }
    };

    const loadTeachers = async (startPage) => {
        try {
            const { data } = await api.get(`/teachers?page=${startPage}&limit=${limit}`);
            if (data && Array.isArray(data.data)) {
                setTeachers(data.data);
                setTotalPages(data.totalPages || 0);
            } else if (Array.isArray(data)) {
                setTeachers(data);
                setTotalPages(1);
            } else {
                setTeachers([]);
            }
        } catch (error) {
            console.error(error);
            setTeachers([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const { name, email, school_id, experience } = formData;

        if (!name) return toast.error("Name is required");
        if (!email) return toast.error("Email is required");
        if (!school_id) return toast.error("Please select a school");

        // Validate numeric fields if experience is kept (User didn't ask to remove it, but it's not in DB?)
        // The user only asked to remove Standard, Score, Subject. 
        // I will keep experience validation if the field remains, but actually experience is also not in DB.
        // However, sticking to strict user request: remove Standard, Score, Subject.
        // Wait, if I remove them from UI, I must remove them here.

        // Check if experience is in the form? User didn't say remove experience.
        // But checking previous file content, experience validation was:
        // if (experience === '' || experience < 0) return toast.error("Experience must be a positive number");

        // I will assume I should keep Experience if not asked to remove, but wait, it's not in DB.
        // I'll keep it in the form state for now but remove the others.
        // Actually, looking at the code, experience IS validated.

        // I'll remove Standard, Subject, Score.

        if (experience === '' || experience < 0) return toast.error("Experience must be a positive number");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            // Prepare payload
            const payload = {
                ...formData,
                subjects: [], // Default to empty array as subject input is removed
                status: formData.status // Ensure status is sent
            };

            if (editingTeacher !== null) {
                const id = teachers[editingTeacher].id;
                await api.put(`/teachers/${id}`, payload);
                toast.success("Teacher updated");
                loadTeachers(page);
            } else {
                await api.post('/teachers', payload);
                toast.success("Teacher created & linked to User account");
                setPage(1);
                loadTeachers(1);
            }
            resetForm();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Failed to save teacher";
            toast.error(msg);
        }
    };

    const handleEdit = (index) => {
        setEditingTeacher(index);
        const t = teachers[index];
        setFormData({
            ...t,
            password: '',
            school_id: t.school_id || (schools[0] ? schools[0].id : ''), // Ensure school matched
            standard: 'Sr',
            status: t.status || 'Active',
            experience: t.experience || 0
        });
        setShowModal(true);
    };

    const handleDelete = async (index) => {
        if (window.confirm('Delete this teacher?')) {
            try {
                const id = teachers[index].id;
                await api.delete(`/teachers/${id}`);
                toast.info("Teacher deleted");
                loadTeachers(page);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const toggleStatus = async (index) => {
        const teacher = teachers[index];
        const newStatus = teacher.status === 'Active' ? 'Blocked' : 'Active';

        try {
            await api.put(`/teachers/${teacher.id}`, {
                status: newStatus
            });
            toast.success(`Teacher ${newStatus === 'Active' ? 'Activated' : 'Blocked'}`);
            loadTeachers(page);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const handleImpersonate = (teacher) => {
        const sessionData = {
            token: "demo-token-impersonate-" + Date.now(),
            role: "teacher",
            user: {
                name: teacher.name,
                email: teacher.email
            },
            isImpersonating: true
        };
        localStorage.setItem("session", JSON.stringify(sessionData));
        toast.success(`Impersonating ${teacher.name}...`);
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 1000);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            school_id: schools.length > 0 ? schools[0].id : '',
            status: 'Active',
            experience: 0
        });
        setEditingTeacher(null);
        setShowModal(false);
    };

    return (
        <div className="teacher-list-container">
            <div className="teacher-list-header">
                <div className="header-content">
                    <h1 className="page-title">Teacher Management</h1>
                    <p className="page-subtitle">Manage faculty access and performance</p>
                </div>
                <button className="btn-add-teacher" onClick={() => setShowModal(true)}>
                    <i className="fa-solid fa-plus btn-icon"></i>
                    Add Teacher
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="teachers-table-wrapper">
                <table className="teachers-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map((teacher, index) => (
                                <tr key={teacher.id || index} className={`table-row ${teacher.status === 'Blocked' ? 'blocked-row' : ''}`}>
                                    <td className="teacher-name">
                                        <div className="name-avatar">
                                            <div className="avatar">{teacher.name.charAt(0).toUpperCase()}</div>
                                            <span>{teacher.name}</span>
                                        </div>
                                    </td>
                                    <td>{teacher.email}</td>
                                    <td>
                                        <span className={`status-badge ${teacher.status === 'Active' ? 'status-active' : 'status-blocked'}`}>
                                            {teacher.status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">

                                            <button
                                                className="btn-action btn-edit"
                                                onClick={() => handleEdit(index)}
                                                title="Edit"
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button
                                                className={`btn-action ${teacher.status === 'Active' ? 'btn-block' : 'btn-activate'}`}
                                                onClick={() => toggleStatus(index)}
                                                title={teacher.status === 'Active' ? 'Suspend' : 'Activate'}
                                            >
                                                <i className={`fa-solid ${teacher.status === 'Active' ? 'fa-ban' : 'fa-check'}`}></i>
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleDelete(index)}
                                                title="Delete"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="no-data">
                                    <div className="no-data-content">
                                        <i className="fa-regular fa-folder-open no-data-icon"></i>
                                        <p>No teachers found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination-controls">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="btn-page"
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="btn-page"
                >
                    Next
                </button>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTeacher !== null ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                            <button className="modal-close" onClick={resetForm}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="teacher-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter teacher name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="teacher@example.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>School <span className="required">*</span></label>
                                    <select name="school_id" value={formData.school_id} onChange={handleInputChange}>
                                        <option value="">Select School</option>
                                        {schools.map(school => (
                                            <option key={school.id} value={school.id}>{school.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        <option value="Active">Active</option>
                                        <option value="Blocked">Blocked</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Experience (years) <span className="required">*</span></label>
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
