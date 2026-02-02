import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [stats, setStats] = useState({ schools: 0, teachers: 0, lectures: 0, users: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard/stats');
                setStats(data || { schools: 0, teachers: 0, lectures: 0, users: 0 });
            } catch (error) {
                console.error("Failed to load stats", error);
            }
        };
        fetchStats();
    }, []);

    const cardStyle = (gradient) => ({
        background: gradient,
        borderRadius: '20px',
        padding: '1.5rem',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        transition: 'transform 0.3s ease',
        cursor: 'default'
    });

    const iconContainerStyle = {
        background: 'rgba(255, 255, 255, 0.2)',
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.8rem',
        backdropFilter: 'blur(5px)'
    };

    const textContainerStyle = {
        display: 'flex',
        flexDirection: 'column'
    };

    const labelStyle = {
        fontSize: '0.9rem',
        fontWeight: '500',
        opacity: 0.9,
        marginBottom: '0.2rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const valueStyle = {
        fontSize: '2.5rem',
        fontWeight: '800',
        lineHeight: '1'
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111', marginBottom: '0.5rem' }}>
                    Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                    Here's an overview of your platform's performance and key metrics.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                {/* Schools Card */}
                <div style={cardStyle('linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')}>
                    <div style={iconContainerStyle}>
                        <i className="fa-solid fa-school"></i>
                    </div>
                    <div style={textContainerStyle}>
                        <span style={labelStyle}>Total Schools</span>
                        <span style={valueStyle}>{stats.schools}</span>
                    </div>
                </div>

                {/* Teachers Card */}
                <div style={cardStyle('linear-gradient(135deg, #10b981 0%, #059669 100%)')}>
                    <div style={iconContainerStyle}>
                        <i className="fa-solid fa-chalkboard-user"></i>
                    </div>
                    <div style={textContainerStyle}>
                        <span style={labelStyle}>Active Teachers</span>
                        <span style={valueStyle}>{stats.teachers}</span>
                    </div>
                </div>

                {/* Users Card */}
                <div style={cardStyle('linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}>
                    <div style={iconContainerStyle}>
                        <i className="fa-solid fa-users"></i>
                    </div>
                    <div style={textContainerStyle}>
                        <span style={labelStyle}>Total Users</span>
                        <span style={valueStyle}>{stats.users}</span>
                    </div>
                </div>

                {/* Uploads Card */}
                <div style={cardStyle('linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)')}>
                    <div style={iconContainerStyle}>
                        <i className="fa-solid fa-video"></i>
                    </div>
                    <div style={textContainerStyle}>
                        <span style={labelStyle}>Lecture Uploads</span>
                        <span style={valueStyle}>{stats.lectures}</span>
                    </div>
                </div>

            </div>

            {/* Quick Actions or Charts could go here */}
            {/* <div style={{ marginTop: '3rem', background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>  
                <h3>Platform Activity</h3>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Activity Chart Placeholder
                </div>
            </div> */}
        </div>
    );
};

export default Dashboard;
