import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import './UserList.css';

/**
 * UserList.js (Frontend)
 * 
 * A system-wide user directory UI. 
 * Allows creating specialized user roles (Super Admin, School Admin, Teacher) 
 * and strictly enforcing school assignment for non-super roles.
 */
const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [schools, setSchools] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'school_admin',
        school_id: ''
    });

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadUsers(page);
        loadSchools();
    }, [page]);

    /**
     * Grabs the list of all available schools. 
     * Used exclusively to populate the School assignment dropdown for lower-tier roles.
     */
    const loadSchools = async () => {
        try {
            const { data } = await api.get('/schools');
            setSchools(data.data || data);
        } catch (error) {
            console.error("Failed to load schools", error);
        }
    };

    /**
     * Fetches user accounts from the backend API.
     * Incorporates pagination to handle large datasets effectively.
     */
    const loadUsers = async (startPage) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/users?page=${startPage}&limit=${limit}`);
            if (data.data) {
                setUsers(data.data);
                setTotalPages(data.totalPages);
            } else {
                setUsers(data || []);
            }
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Syncs changes from input fields directly to the formData state.
     */
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /**
     * Client-side gatekeeper before making network requests.
     * Validates email structures, mandatory fields, and role-based conditionals (e.g. required school).
     */
    const validateForm = () => {
        const { name, email, password, role, school_id } = formData;

        if (!name) return toast.error("Name is required");
        if (!email) return toast.error("Email is required");

        // Password is required only for new users
        if (!editingUser && !password) return toast.error("Password is required for new users");

        // School is required for school_admin and teacher
        if ((role === 'school_admin' || role === 'teacher') && !school_id) {
            return toast.error("Please select a school for this role");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return false;
        }

        return true;
    };

    /**
     * Triggers the User creation or updates workflow via Axios.
     * Clears form data and re-pulls the fresh list of users on success.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (editingUser) {
                await api.put(`/users/${editingUser}`, formData);
                toast.success("User updated successfully");
            } else {
                await api.post('/users', formData);
                toast.success("User created successfully");
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'school_admin', school_id: '' });
            loadUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    /**
     * Mounts an extant user record's data into the creation form structure
     * for easy administrative edits.
     */
    const handleEdit = (user) => {
        setEditingUser(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Prevent password overwrite if left blank, backend handles optionality if implemented, else require new one. For now assume re-set.
            role: user.role,
            school_id: user.school_id || ''
        });
        setShowModal(true);
    };

    /**
     * Forces definitive removal of a user profile spanning across the system.
     */
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/users/${id}`);
                toast.success("User deleted");
                loadUsers();
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete user");
            }
        }
    };

    return (
        <div className="teacher-list-container">
            <div className="teacher-list-header">
                <div className="header-content">
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage system access for all users</p>
                </div>
                <button className="btn-add-teacher" onClick={() => {
                    setEditingUser(null);
                    setFormData({ name: '', email: '', password: '', role: 'school_admin', school_id: '' });
                    setShowModal(true);
                }}>
                    <i className="fa-solid fa-plus btn-icon"></i>
                    Add User
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="teacher-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Name <span className="required">*</span></label>
                                    <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" />
                                </div>
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" />
                                </div>
                                <div className="form-group">
                                    <label>Password {editingUser ? '(Leave blank to keep current)' : <span className="required">*</span>}</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange}>
                                        <option value="school_admin">School Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                        <option value="teacher">Teacher</option>
                                    </select>
                                </div>
                                {/* Show school dropdown only for school_admin and teacher */}
                                {(formData.role === 'school_admin' || formData.role === 'teacher') && (
                                    <div className="form-group">
                                        <label>School <span className="required">*</span></label>
                                        <select name="school_id" value={formData.school_id} onChange={handleInputChange} required>
                                            <option value="">Select School</option>
                                            {schools.map(school => (
                                                <option key={school.id} value={school.id}>{school.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">{editingUser ? 'Update User' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="teachers-table-wrapper">
                <table className="teachers-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>School</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`badge ${user.role === 'super_admin' ? 'badge-senior' : 'badge-standard'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.school || 'N/A'}</td>
                                <td>
                                    {user.role !== 'super_admin' && (
                                        <div className="action-buttons">
                                            <button className="btn-action btn-edit" onClick={() => handleEdit(user)}>
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button className="btn-action btn-delete" onClick={() => handleDelete(user.id)}>
                                                🗑️
                                            </button>
                                        </div>
                                    )}
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
        </div>
    );
};

export default UserList;
