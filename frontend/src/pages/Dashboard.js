import React from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [stats, setStats] = React.useState({ schools: 0, teachers: 0, lectures: 0, users: 0 });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to load stats", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <Navbar />
            <div className="dashboard-container">
                <h1>Welcome, {user ? user.name : 'User'}!</h1>
                <p>Role: {user ? user.role : ''}</p>

                <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <div className="card glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                        <h3><i className="fa-solid fa-school" style={{ marginRight: '10px', color: '#4a90e2' }}></i>Schools</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.schools}</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                        <h3><i className="fa-solid fa-chalkboard-user" style={{ marginRight: '10px', color: '#50e3c2' }}></i>Teachers</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.teachers}</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                        <h3><i className="fa-solid fa-users" style={{ marginRight: '10px', color: '#f5a623' }}></i>Users</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.users}</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                        <h3><i className="fa-solid fa-video" style={{ marginRight: '10px', color: '#e056fd' }}></i>Uploads</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.lectures}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
