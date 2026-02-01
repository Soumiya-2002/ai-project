import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src={logo} alt="NITI Solutions" style={{ height: '50px', objectFit: 'contain' }} />
            </div>
            {/* <div className="navbar-links">
                <Link to="/dashboard">Dashboard</Link>
                {user && user.role === 'admin' && <Link to="/schools">Schools</Link>}
                <Link to="/schedule">Schedule</Link>
                <Link to="/upload">Upload Video</Link>
                <Link to="/reports">Reports</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div> */}
        </nav>
    );
};

export default Navbar;
