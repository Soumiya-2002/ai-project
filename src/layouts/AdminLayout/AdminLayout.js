import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            path: '/admin/dashboard',
            icon: '📊',
            label: 'Dashboard',
            description: 'Overview & Statistics'
        },
        {
            path: '/admin/teachers',
            icon: '👨‍🏫',
            label: 'Teachers',
            description: 'Manage Teachers'
        },
        {
            path: '/admin/videos',
            icon: '🎥',
            label: 'Videos',
            description: 'Upload & Manage'
        }
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            navigate('/');
        }
    };

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🎓</span>
                        {isSidebarOpen && <span className="logo-text">Admin Panel</span>}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
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
                        <span className="logout-icon">🚪</span>
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
