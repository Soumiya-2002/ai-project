import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Schedule = () => {
    const [lectures, setLectures] = useState([]);

    useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        try {
            const res = await api.get('/lectures');
            setLectures(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="dashboard-container">
                <h2>Class Schedule</h2>
                <div className="card">
                    {lectures.length === 0 ? (
                        <p>No lectures scheduled.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #ddd' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Class</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lectures.map(lec => (
                                    <tr key={lec.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{lec.date}</td>
                                        <td style={{ padding: '10px' }}>{lec.time_slot}</td>
                                        <td style={{ padding: '10px' }}>{lec.Class ? lec.Class.name : 'N/A'}</td>
                                        <td style={{ padding: '10px' }}>{lec.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Schedule;
