import React, { useState, useEffect } from 'react';
import './Dashboard.css';

/**
 * Dashboard.js (Frontend)
 * 
 * Serves as the landing page after login.
 * Displays interactive quick stats (Charts, Videos, Engagement) tailored to the logged-in user's role.
 * It fetches the current session and real statistics from localStorage/API logic.
 */
const Dashboard = () => {
    const [session, setSession] = useState({ role: 'school_admin', user: { name: 'User' } });
    const [realStats, setRealStats] = useState({ teachers: 0, videos: 0 });

    useEffect(() => {
        // Load session info
        const sessionStr = localStorage.getItem('session');
        if (sessionStr) {
            const loadedSession = JSON.parse(sessionStr);
            setSession(prev => ({
                ...prev,
                role: loadedSession.role || 'school_admin',
                user: loadedSession.user || { name: 'User' }
            }));
        }

        // Load real counts from localStorage
        const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
        // Mock videos if not strictly in LS yet, or try to load
        // const videos = JSON.parse(localStorage.getItem('videos')) || []; 
        // For now, let's just use teachers count as it's reliable from TeacherList
        setRealStats({ teachers: teachers.length, videos: 12 }); // Keep videos mock or 0
    }, []);

    // Generate role-specific content
    /**
     * Determines which statistic cards to display based on the active user's role.
     * For instance, teachers see 'My Videos' while admins see 'Total Schools'.
     */
    const getStats = () => {
        if (session.role === 'teacher') {
            return [
                { title: 'My Videos', value: '12', icon: 'fa-solid fa-file-video', color: 'blue' },
                { title: 'Avg Engagement', value: '85%', icon: 'fa-solid fa-chart-line', color: 'green' },
                { title: 'Processing', value: '2', icon: 'fa-solid fa-spinner', color: 'orange' },
                { title: 'Pending Review', value: '3', icon: 'fa-solid fa-clipboard-check', color: 'purple' }
            ];
        }
        return [
            { title: 'Total Schools', value: '1', icon: 'fa-solid fa-school', color: 'blue' },
            { title: 'Active Teachers', value: realStats.teachers || '0', icon: 'fa-solid fa-chalkboard-user', color: 'green' },
            { title: 'Videos Analyzed', value: '54', icon: 'fa-solid fa-play', color: 'orange' },
            { title: 'Alerts', value: '5', icon: 'fa-solid fa-triangle-exclamation', color: 'red' }
        ];
    };

    const stats = getStats();

    // Mock Recent Activity
    const activities = [
        { id: 1, type: 'upload', message: 'New physics lecture uploaded by Sarah Connors', time: '10 mins ago', icon: 'fa-solid fa-cloud-arrow-up' },
        { id: 2, type: 'alert', message: 'Low engagement detected in Math 101', time: '1 hour ago', icon: 'fa-solid fa-triangle-exclamation' },
        { id: 3, type: 'system', message: 'System maintenance scheduled for tonight', time: '3 hours ago', icon: 'fa-solid fa-gears' },
        { id: 4, type: 'upload', message: 'History class processing completed', time: '5 hours ago', icon: 'fa-solid fa-check-double' }
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header animate-fadeIn">
                <div>
                    <h1 className="welcome-text">Welcome back, {session.user?.name || 'Admin'}</h1>
                    <p className="date-text">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="user-profile">
                    <div className="avatar-circle">
                        {(session.user?.name || 'A').charAt(0)}
                    </div>
                </div>
            </header>

            {/* Quick Stats Row */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className={`stat-card ${stat.color} animate-fadeInUp`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="stat-icon-wrapper">
                            <i className={stat.icon}></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stat.value}</h3>
                            <p>{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content-grid">
                {/* Main Chart Area */}
                <div className="chart-section glass-panel animate-scaleIn">
                    <div className="section-header">
                        <h2>{session.role === 'teacher' ? 'My Performance' : 'Teacher Distribution'}</h2>
                        <button className="btn-icon"><i className="fa-solid fa-ellipsis"></i></button>
                    </div>
                    <div className="chart-placeholder">
                        <div className="chart-bars">
                            {[40, 70, 55, 90, 65, 80, 50].map((h, i) => (
                                <div key={i} className="chart-bar-group">
                                    <div className="bar" style={{ height: `${h}%` }}></div>
                                    <span className="bar-label">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="side-panel">
                    {/* Recent Activity */}
                    <div className="activity-feed glass-panel animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                        <div className="section-header">
                            <h2>Recent Activity</h2>
                            <button className="view-all">View All</button>
                        </div>
                        <div className="activity-list">
                            {activities.map(act => (
                                <div key={act.id} className="activity-item">
                                    <div className={`activity-icon ${act.type}`}>
                                        <i className={act.icon}></i>
                                    </div>
                                    <div className="activity-details">
                                        <p className="activity-msg">{act.message}</p>
                                        <span className="activity-time">{act.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions glass-panel animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                        <h3>Quick Actions</h3>
                        <div className="action-buttons-grid">
                            <button className="btn-quick primary">
                                <i className="fa-solid fa-plus"></i>
                                <span>Add {session.role === 'teacher' ? 'Video' : 'User'}</span>
                            </button>
                            <button className="btn-quick secondary">
                                <i className="fa-solid fa-file-export"></i>
                                <span>Export Report</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
