import React, { useState, useEffect, useCallback } from 'react';
import './SchoolList.css';
import { toast } from 'react-toastify';

import api from '../../api/axios';

const SchoolList = () => {
    const [schools, setSchools] = useState([]);
    const [filteredSchools, setFilteredSchools] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSchool, setEditingSchool] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        principal: '',
        email: '',
        phone: '',
        status: 'Active'
    });

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadSchools(page);
    }, [page]);

    const filterSchools = useCallback(() => {
        let filtered = schools;
        if (searchTerm) {
            filtered = filtered.filter(school =>
                school.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredSchools(filtered);
    }, [schools, searchTerm]);

    useEffect(() => {
        filterSchools();
    }, [filterSchools]);

    const loadSchools = async (startPage) => {
        try {
            const { data } = await api.get(`/schools?page=${startPage}&limit=${limit}`);
            if (data.data) {
                setSchools(data.data);
                setTotalPages(data.totalPages);
            } else {
                setSchools(data || []);
            }
        } catch (error) {
            console.error("Failed to load schools", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const { name, address, principal, email, phone, teacherCount, studentCount } = formData;

        if (!name) return toast.error("School Name is required");
        if (!address) return toast.error("Address is required");
        if (!principal) return toast.error("Principal Name is required");
        if (!email) return toast.error("Email is required");
        if (!phone) return toast.error("Phone Number is required");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return false;
        }

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            toast.error("Phone number must be exactly 10 digits");
            return false;
        }

        if (teacherCount < 0 || studentCount < 0) {
            toast.error("Counts cannot be negative");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const payload = {
                ...formData,
                contact_number: formData.phone, // Map frontend phone to backend contact_number
                teacher_count: formData.teacherCount,
                student_count: formData.studentCount
            };

            if (editingSchool !== null) {
                // Update
                const id = schools[editingSchool].id;
                await api.put(`/schools/${id}`, payload);
                toast.success("School updated");
            } else {
                // Create
                await api.post('/schools', payload);
                toast.success("School added");
            }
            loadSchools(page);
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to save school");
        }
    };

    const handleEdit = (index) => {
        setEditingSchool(index);
        const school = schools[index];
        setFormData({
            name: school.name,
            address: school.address,
            principal: school.principal || '',
            email: school.email,
            phone: school.contact_number || '',
            status: school.status || 'Active',
            teacherCount: school.teacher_count || '',
            studentCount: school.student_count || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (index) => {
        if (window.confirm('Delete this school?')) {
            try {
                const id = schools[index].id;
                await api.delete(`/schools/${id}`);
                toast.info("School deleted");
                loadSchools(page);
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete");
            }
        }
    };

    const toggleStatus = async (index) => {
        const school = schools[index];
        const newStatus = school.status === 'Active' ? 'Inactive' : 'Active';

        try {
            await api.put(`/schools/${school.id}`, {
                ...school,
                status: newStatus
            });
            toast.success(`School marked as ${newStatus}`);
            loadSchools(page);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', address: '', principal: '', email: '', phone: '', status: 'Active'
        });
        setEditingSchool(null);
        setShowModal(false);
    };

    return (
        <div className="school-list-container">
            <div className="school-list-header">
                <div className="header-content">
                    <h1 className="page-title">School Management</h1>
                    <p className="page-subtitle">Oversee all registered schools and districts</p>
                </div>
                <button className="btn-add-school" onClick={() => setShowModal(true)}>
                    <i className="fa-solid fa-plus btn-icon"></i>
                    Add School
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search schools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table className="schools-table">
                    <thead>
                        <tr>
                            <th>School Name</th>
                            <th>Principal</th>
                            <th>Email</th>
                            <th>Stats</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSchools.map((school, index) => (
                            <tr key={school.id || index} className={school.status === 'Inactive' ? 'inactive-row' : ''}>
                                <td className="school-name">
                                    <div className="name-icon">
                                        <div className="s-icon"><i className="fa-solid fa-school"></i></div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{school.name}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{school.address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{school.principal}</td>
                                <td>{school.email}</td>
                                <td>
                                    <span className="stat-pill"><i className="fa-solid fa-chalkboard-user"></i> {school.teacher_count || 0}</span>
                                    <span className="stat-pill"><i className="fa-solid fa-graduation-cap"></i> {school.student_count || 0}</span>
                                </td>
                                <td>
                                    <span className={`status-badge ${school.status === 'Active' ? 'active' : 'inactive'}`}>
                                        {school.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-action btn-edit" onClick={() => handleEdit(index)}>
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button className={`btn-action ${school.status === 'Active' ? 'btn-block' : 'btn-activate'}`} onClick={() => toggleStatus(index)}>
                                            <i className={`fa-solid ${school.status === 'Active' ? 'fa-ban' : 'fa-check'}`}></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
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
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingSchool !== null ? 'Edit School' : 'Register School'}</h2>
                            <button className="modal-close" onClick={resetForm}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleSubmit} className="school-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>School Name <span className="required">*</span></label>
                                    <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Springfield High" />
                                </div>
                                <div className="form-group">
                                    <label>Address <span className="required">*</span></label>
                                    <input required name="address" value={formData.address} onChange={handleInputChange} placeholder="Full Address" />
                                </div>
                                <div className="form-group">
                                    <label>Principal <span className="required">*</span></label>
                                    <input required name="principal" value={formData.principal} onChange={handleInputChange} placeholder="Principal Name" />
                                </div>
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="official@school.com" />
                                </div>
                                <div className="form-group">
                                    <label>Phone <span className="required">*</span></label>
                                    <input required name="phone" value={formData.phone} onChange={handleInputChange} placeholder="10-digit number" />
                                </div>
                                <div className="form-group">
                                    <label>Teachers (Approx)</label>
                                    <input type="number" name="teacherCount" value={formData.teacherCount} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Students (Approx)</label>
                                    <input type="number" name="studentCount" value={formData.studentCount} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="btn-submit">Save School</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolList;
