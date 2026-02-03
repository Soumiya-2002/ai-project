import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
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

    // Fake sparkline paths for visual aesthetics
    const sparklines = [
        "M0,80 C30,70 60,90 90,60 C120,30 150,50 180,40 C210,30 240,50 270,30 L270,100 L0,100 Z",
        "M0,70 C40,80 80,50 120,60 C160,70 200,40 240,50 C280,60 320,30 360,40 L360,100 L0,100 Z",
        "M0,90 C50,80 100,95 150,70 C200,45 250,60 300,40 C350,20 400,30 450,10 L450,100 L0,100 Z",
        "M0,60 C30,50 60,70 90,40 C120,10 150,30 180,20 C210,10 240,40 270,20 L270,100 L0,100 Z"
    ];

    const cards = [
        {
            title: 'Schools',
            label: 'Total Registered',
            value: stats.schools,
            icon: 'fa-school',
            path: '/schools'
        },
        // {
        //     title: 'Teachers',
        //     label: 'Active Educators',
        //     value: stats.teachers,
        //     icon: 'fa-chalkboard-user',
        //     path: '/teachers'
        // },
        {
            title: 'Users',
            label: 'System Access',
            value: stats.users,
            icon: 'fa-users',
            path: '/users'
        },
        {
            title: 'AI Reports',
            label: 'Analytics Generated',
            value: stats.lectures,
            icon: 'fa-file-lines',
            path: '/reports'
        }
    ];

    return (
        <div style={{ padding: '3rem', maxWidth: '1800px', margin: '0 auto', background: '#f9fafb', minHeight: '100%' }}>

            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111', letterSpacing: '-1px' }}>
                        Dashboard
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '1rem', marginTop: '5px' }}>
                        Welcome back, {user?.name?.split(' ')[0] || 'Admin'}. Here is your daily overview.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="dash-btn" onClick={() => navigate('/upload')}>
                        <i className="fa-solid fa-plus"></i> New Upload
                    </button>
                </div>
            </header>

            <style>
                {`
                    .dash-btn {
                        padding: 0.8rem 1.5rem;
                        background: #111;
                        color: white;
                        border: none;
                        border-radius: 50px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        gap: 10px;
                        align-items: center;
                        transition: all 0.2s;
                        white-space: nowrap;
                    }
                    .dash-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                    
                    .stat-card {
                        background: #fff;
                        border-radius: 20px;
                        padding: 0;
                        position: relative;
                        overflow: hidden;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        border: 1px solid #f3f4f6;
                        display: flex;
                        flex-direction: column;
                        height: 220px;
                    }
                    
                    .stat-card:hover {
                        transform: translateY(-10px);
                        box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1);
                        border-color: #111;
                    }

                    .stat-card:hover .arrow-icon {
                        background: #111;
                        color: white;
                        transform: rotate(-45deg);
                    }
                    
                    .stat-content {
                        padding: 1.5rem;
                        position: relative;
                        z-index: 2;
                    }
                    
                    .graph-container {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 80px;
                        opacity: 0.1;
                        transition: opacity 0.3s;
                    }
                    
                    .stat-card:hover .graph-container {
                        opacity: 0.2;
                    }

                    .card-icon-box {
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        background: #f9fafb;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                        color: #111;
                        margin-bottom: 1rem;
                    }

                    .value-text {
                        font-size: 3rem;
                        font-weight: 800;
                        color: #111;
                        line-height: 1;
                        margin: 10px 0;
                    }
                `}
            </style>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="stat-card"
                        onClick={() => navigate(card.path)}
                    >
                        <div className="stat-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="card-icon-box">
                                    <i className={`fa-solid ${card.icon}`}></i>
                                </div>
                                <div className="arrow-icon" style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s',
                                    color: '#9ca3af'
                                }}>
                                    <i className="fa-solid fa-arrow-right"></i>
                                </div>
                            </div>

                            <h2 className="value-text">{card.value}</h2>

                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#111' }}>{card.title}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{card.label}</p>
                            </div>
                        </div>

                        {/* Aesthetic SVG Wave at bottom */}
                        <div className="graph-container">
                            <svg viewBox="0 0 300 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', fill: '#111' }}>
                                <path d={sparklines[index % sparklines.length]} />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* Platform Health Section */}
            <div style={{ marginTop: '3rem', padding: '2rem', background: 'white', borderRadius: '24px', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '8px', height: '30px', background: '#111', borderRadius: '4px' }}></div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Platform Health</h3>
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', padding: '1.5rem', background: '#f9fafb', borderRadius: '16px' }}>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>System Status</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%' }}></span>
                            <span style={{ fontWeight: '600', color: '#111' }}>Operational</span>
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px', padding: '1.5rem', background: '#f9fafb', borderRadius: '16px' }}>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Data Refresh</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-arrows-rotate" style={{ color: '#111' }}></i>
                            <span style={{ fontWeight: '600', color: '#111' }}>Real-time</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
