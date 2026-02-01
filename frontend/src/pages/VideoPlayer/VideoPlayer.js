import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnalyticsPanel from '../../components/AnalyticsPanel/AnalyticsPanel';
import './VideoPlayer.css';

const VideoPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch video from localStorage
        const videos = JSON.parse(localStorage.getItem('videos')) || [];
        // Comparison with string/number depending on how it was saved
        const found = videos.find(v => v.id.toString() === id);

        if (found) {
            setVideo(found);
        } else {
            // Mock video if not found (for dev/demo reliability)
            if (id === 'demo') {
                setVideo({
                    id: 'demo',
                    title: 'Demo Lecture: Introduction to Physics',
                    teacherName: 'Dr. Richard Feynman',
                    subject: 'Physics',
                    uploadDate: '2023-10-15',
                    description: 'A classic introduction to the nature of physical laws.',
                    thumbnail: null
                });
            }
        }
        setLoading(false);
    }, [id]);

    if (loading) return <div className="player-page" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    if (!video) return (
        <div className="player-page" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Video not found</h2>
            <button onClick={() => navigate('/admin/videos')} className="back-btn">Back to Videos</button>
        </div>
    );

    return (
        <div className="player-page">
            <div className="video-section">
                <button onClick={() => navigate('/admin/videos')} className="back-btn">← Back to Dashboard</button>

                <div className="video-container-wrapper">
                    {/* 
                       In a real app, this would be <video src={video.url} ... /> 
                       For this mock, since we used Data URLs which can be huge or just placeholders:
                     */}
                    {video.videoFile ? (
                        <video
                            className="video-element"
                            controls
                            autoPlay
                            src={video.videoFile}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            <p>Video Source Not Available (Mock)</p>
                        </div>
                    )}
                </div>

                <div className="video-info">
                    <div className="video-header">
                        <div>
                            <h1 className="video-title">{video.title}</h1>
                            <p className="video-meta">
                                {video.teacherName} • {video.subject} • {video.uploadDate}
                            </p>
                        </div>
                        <button className="back-btn" style={{ margin: 0, background: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                            Download Report
                        </button>
                    </div>

                    <div className="video-stats-row">
                        <div className="stat-item">
                            <span className="stat-label">Views</span>
                            <span className="stat-val">1,245</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Avg. Engagement</span>
                            <span className="stat-val" style={{ color: '#4ade80' }}>85%</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Grade Level</span>
                            <span className="stat-val">{video.standard || 'Sr'}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', lineHeight: '1.6', color: '#cbd5e0' }}>
                        <h3>Description</h3>
                        <p>{video.description}</p>
                    </div>
                </div>
            </div>

            <AnalyticsPanel video={video} />
        </div>
    );
};

export default VideoPlayer;
