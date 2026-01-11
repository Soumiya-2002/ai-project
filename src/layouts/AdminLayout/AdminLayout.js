import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Get user role with fallbacks
    const session = JSON.parse(localStorage.getItem('user')) || {};
    let rawRole = session.role || 'school_admin';

    // Normalize: lowercase, replace spaces/underscores with empty string for loose comparison
    // e.g., "Super Admin", "super_admin", "SUPER_ADMIN" -> "superadmin"
    const normalize = (r) => r.toLowerCase().replace(/[\s_]/g, '');
    const role = normalize(rawRole);

    console.log("Raw Role:", session, "Normalized Role:", role);

    const getMenuItems = (currentRole) => {
        const items = [
            {
                path: '/dashboard',
                icon: 'fa-solid fa-chart-line',
                label: 'Dashboard',
                description: 'Overview & Statistics'
            }
        ];

        // Check against normalized strings
        if (currentRole === 'superadmin') {
            items.push({
                path: '/users',
                icon: 'fa-solid fa-users',
                label: 'Users',
                description: 'Manage All Users'
            });
            items.push({
                path: '/schools',
                icon: 'fa-solid fa-school',
                label: 'Schools',
                description: 'Manage Schools'
            });
        }

        if (currentRole === 'superadmin' || currentRole === 'schooladmin') {
            items.push({
                path: '/teachers',
                icon: 'fa-solid fa-chalkboard-user',
                label: 'Teachers',
                description: 'Manage Teachers'
            });
        }

        items.push({
            path: '/upload',
            icon: 'fa-solid fa-video',
            label: 'Upload Lecture',
            description: 'Upload & Manage'
        });

        if (currentRole === 'superadmin' || currentRole === 'schooladmin') {
            items.push({
                path: '/reports',
                icon: 'fa-solid fa-file-contract',
                label: 'Reports',
                description: 'AI Analysis & COB'
            });
        }

        // items.push({
        //     path: '/admin/settings',
        //     icon: 'fa-solid fa-gear',
        //     label: 'Settings',
        //     description: 'Platform Configuration'
        // });

        return items;
    };

    const menuItems = getMenuItems(role);

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('session'); // Clear session
            navigate('/');
        }
    };

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon"><i className="fa-solid fa-graduation-cap"></i></span>
                        {isSidebarOpen && <span className="logo-text">Admin Panel</span>}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
                    </button>
                </div>

                <div className="sidebar-info" style={{ padding: '10px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                    {isSidebarOpen && <span><i className="fa-solid fa-user-shield" style={{ marginRight: '8px' }}></i>{role.replace('_', ' ')}</span>}
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon"><i className={item.icon}></i></span>
                            {isSidebarOpen && (
                                <div className="nav-content">
                                    <span className="nav-label">{item.label}</span>
                                    <span className="nav-description">{item.description}</span>
                                </div>
                            )}
                            {isActive(item.path) && <div className="active-indicator"></div>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <span className="logout-icon"><i className="fa-solid fa-right-from-bracket"></i></span>
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <main className={`admin-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
