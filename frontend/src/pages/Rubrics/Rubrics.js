import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import './Rubrics.css';

/**
 * Rubrics.js (Frontend)
 * 
 * This component handles the UI for managing custom Grading Rubrics.
 * It uses a list with a search bar and a modal for uploading/editing, similar to the SchoolList design.
 */
const Rubrics = () => {
    const [rubrics, setRubrics] = useState([]);
    const [filteredRubrics, setFilteredRubrics] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    // Schools & Roles
    const session = JSON.parse(localStorage.getItem('user')) || {};
    const isSuperAdmin = (session.role || '').toLowerCase().replace(/[\s_]/g, '') === 'superadmin';
    const userSchoolId = session.school_id;
    const [schools, setSchools] = useState([]);
    const [filterSchoolId, setFilterSchoolId] = useState(isSuperAdmin ? '' : (userSchoolId || ''));

    // Form state
    const [file, setFile] = useState(null);
    const [grade, setGrade] = useState('');
    const [formSchoolId, setFormSchoolId] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isSuperAdmin) {
            loadSchools();
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        fetchRubrics();
    }, [filterSchoolId]);

    const loadSchools = async () => {
        try {
            const { data } = await api.get('/schools');
            setSchools(data.data || []);
        } catch (err) {
            console.error("Failed to load schools", err);
        }
    };

    const filterRubricsList = useCallback(() => {
        let filtered = rubrics;
        if (searchTerm) {
            filtered = filtered.filter(rubric =>
                (rubric.grade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (rubric.original_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (rubric.file_type || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredRubrics(filtered);
    }, [rubrics, searchTerm]);

    useEffect(() => {
        filterRubricsList();
    }, [filterRubricsList]);

    const fetchRubrics = async () => {
        try {
            setIsLoading(true);
            const url = filterSchoolId ? `/rubrics?school_id=${filterSchoolId}` : '/rubrics';
            const { data } = await api.get(url);
            setRubrics(data.data || []);
        } catch (err) {
            console.error("Failed to load rubrics", err);
            toast.error("Failed to load rubrics");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        const targetSchoolId = isSuperAdmin ? formSchoolId : userSchoolId;

        if (!file || !grade.trim() || !targetSchoolId) {
            toast.error("Please select a school, a grade, and a file.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('grade', grade.trim());
        formData.append('school_id', targetSchoolId);

        try {
            setIsUploading(true);
            await api.post('/rubrics', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Rubric ${isEditing ? 'updated' : 'uploaded'} successfully!`);
            resetForm();
            fetchRubrics(); // Refresh list
        } catch (err) {
            console.error("Upload failed", err);
            toast.error(err.response?.data?.message || "Failed to upload rubric");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this rubric?")) return;

        try {
            await api.delete(`/rubrics/${id}`);
            toast.success("Rubric deleted successfully!");
            fetchRubrics();
        } catch (err) {
            console.error("Delete failed", err);
            toast.error("Failed to delete rubric");
        }
    };

    const handleEdit = (rubric) => {
        setGrade(rubric.grade);
        setFormSchoolId(rubric.school_id);
        setFile(null);
        setIsEditing(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setGrade('');
        setFormSchoolId('');
        setFile(null);
        setIsEditing(false);
        setShowModal(false);
    };

    return (
        <div className="rubrics-list-container">
            <div className="rubrics-list-header">
                <div className="header-content">
                    <h1 className="page-title">Rubrics Management</h1>
                    <p className="page-subtitle">Upload and manage grading rubrics per School & Grade</p>
                </div>
                <button className="btn-add-rubric" onClick={() => { setFormSchoolId(filterSchoolId); setShowModal(true); }}>
                    <i className="fa-solid fa-plus btn-icon"></i>
                    Add Rubric
                </button>
            </div>

            <div className="filters-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="search-box" style={{ flex: 1 }}>
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search rubrics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                {isSuperAdmin && (
                    <select 
                        className="search-input" 
                        style={{ paddingLeft: '1rem', flex: 0.5 }}
                        value={filterSchoolId}
                        onChange={(e) => setFilterSchoolId(e.target.value)}
                    >
                        <option value="">All Schools</option>
                        {schools.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="table-wrapper">
                <table className="rubrics-table">
                    <thead>
                        <tr>
                            <th>Grade</th>
                            {isSuperAdmin && <th>School</th>}
                            <th>File Name</th>
                            <th>Type</th>
                            <th>Uploaded On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={isSuperAdmin ? "6" : "5"} className="text-center" style={{ padding: '2rem', color: '#64748b' }}>
                                    <i className="fa-solid fa-spinner fa-spin"></i> Loading rubrics...
                                </td>
                            </tr>
                        ) : filteredRubrics.length === 0 ? (
                            <tr>
                                <td colSpan={isSuperAdmin ? "6" : "5"} className="text-center" style={{ padding: '2rem', color: '#64748b' }}>
                                    No rubrics found. Click "Add Rubric" to upload one.
                                </td>
                            </tr>
                        ) : (
                            filteredRubrics.map(rubric => {
                                const sc = schools.find(s => s.id === rubric.school_id);
                                return (
                                    <tr key={rubric.id}>
                                        <td className="grade-cell">
                                            <div className="name-icon">
                                                <div className="r-icon"><i className="fa-solid fa-book-open"></i></div>
                                                <div style={{ fontWeight: 'bold' }}>{rubric.grade}</div>
                                            </div>
                                        </td>
                                        {isSuperAdmin && (
                                            <td>{sc ? sc.name : (rubric.school_id || 'Global')}</td>
                                        )}
                                        <td>{rubric.original_name}</td>
                                        <td>
                                            <span className={`file-type ${rubric.file_type}`}>
                                                {rubric.file_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{new Date(rubric.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <a href={`${api.defaults.baseURL.replace('/api', '')}${rubric.file_path}`} target="_blank" rel="noreferrer" className="btn-action view" title="View Document">
                                                    <i className="fa-solid fa-eye"></i>
                                                </a>
                                                <button onClick={() => handleEdit(rubric)} className="btn-action edit" title="Edit / Update">
                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                </button>
                                                <button onClick={() => handleDelete(rubric.id)} className="btn-action delete" title="Delete">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Update Existing Rubric' : 'Add New Rubric'}</h2>
                            <button className="modal-close" onClick={resetForm}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleUpload} className="rubric-form">
                            {isSuperAdmin && (
                                <div className="form-group-single">
                                    <label>School <span className="required">*</span></label>
                                    <select
                                        value={formSchoolId}
                                        onChange={(e) => setFormSchoolId(e.target.value)}
                                        required
                                        disabled={isEditing}
                                        className={isEditing ? "disabled-input" : ""}
                                    >
                                        <option value="" disabled>Select School...</option>
                                        {schools.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group-single">
                                <label>Grade / Category <span className="required">*</span></label>
                                <select
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    required
                                    disabled={isEditing}
                                    className={isEditing ? "disabled-input" : ""}
                                >
                                    <option value="" disabled>Select Grade Category...</option>
                                    <option value="KG 1 and KG 2">KG 1 and KG 2</option>
                                    <option value="Grade 1 to 8">Grade 1 to 8</option>
                                    <option value="Grade 9 to 12">Grade 9 to 12</option>
                                </select>
                            </div>
                            <div className="form-group-single">
                                <label>File (.doc, .docx, .xls, .xlsx, .pdf) <span className="required">*</span></label>
                                <div className="file-drop-area">
                                    <input
                                        type="file"
                                        accept=".pdf, .doc, .docx, .xls, .xlsx"
                                        onChange={handleFileChange}
                                        className="file-input"
                                    />
                                    {file ? (
                                        <div className="file-selected">
                                            <i className="fa-solid fa-file-circle-check"></i>
                                            <span>{file.name}</span>
                                        </div>
                                    ) : (
                                        <div className="file-placeholder">
                                            <i className="fa-solid fa-cloud-arrow-up"></i>
                                            <span>Click or drag to select file</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={!file || !grade || (isSuperAdmin && !formSchoolId) || isUploading}>
                                    {isUploading ? (
                                        <><i className="fa-solid fa-spinner fa-spin"></i> {isEditing ? 'Updating...' : 'Uploading...'}</>
                                    ) : (
                                        <><i className={`fa-solid ${isEditing ? 'fa-arrows-rotate' : 'fa-cloud-arrow-up'}`}></i> {isEditing ? 'Update Document' : 'Save Rubric'}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rubrics;
