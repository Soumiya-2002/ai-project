import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalVideos: 0,
    seniorTeachers: 0,
    juniorTeachers: 0,
    standardTeachers: 0,
    avgScore: 0
  });

  useEffect(() => {
    // Load stats from localStorage or API
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    
    const seniorCount = teachers.filter(t => t.standard === 'Sr').length;
    const juniorCount = teachers.filter(t => t.standard === 'Jr').length;
    const standardCount = teachers.filter(t => !['Sr', 'Jr'].includes(t.standard)).length;
    const totalScore = teachers.reduce((sum, t) => sum + (parseFloat(t.score) || 0), 0);
    const avgScore = teachers.length > 0 ? (totalScore / teachers.length).toFixed(2) : 0;

    setStats({
      totalTeachers: teachers.length,
      totalVideos: videos.length,
      seniorTeachers: seniorCount,
      juniorTeachers: juniorCount,
      standardTeachers: standardCount,
      avgScore: avgScore
    });
  }, []);

  const statCards = [
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: '👨‍🏫',
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Total Videos',
      value: stats.totalVideos,
      icon: '🎥',
      color: 'success',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Senior Teachers',
      value: stats.seniorTeachers,
      icon: '🎓',
      color: 'info',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Junior Teachers',
      value: stats.juniorTeachers,
      icon: '📚',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      title: 'Standard Teachers',
      value: stats.standardTeachers,
      icon: '📖',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Average Score',
      value: stats.avgScore,
      icon: '⭐',
      color: 'danger',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's your overview</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="stat-card"
            style={{ '--card-gradient': card.gradient }}
          >
            <div className="stat-card-inner">
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-content">
                <h3 className="stat-value">{card.value}</h3>
                <p className="stat-title">{card.title}</p>
              </div>
            </div>
            <div className="stat-card-glow"></div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">Teacher Distribution by Standard</h3>
          <div className="chart-content">
            <div className="bar-chart">
              <div className="bar-item">
                <div className="bar-label">Senior</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill bar-senior" 
                    style={{ width: `${(stats.seniorTeachers / stats.totalTeachers * 100) || 0}%` }}
                  >
                    <span className="bar-value">{stats.seniorTeachers}</span>
                  </div>
                </div>
              </div>
              <div className="bar-item">
                <div className="bar-label">Junior</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill bar-junior" 
                    style={{ width: `${(stats.juniorTeachers / stats.totalTeachers * 100) || 0}%` }}
                  >
                    <span className="bar-value">{stats.juniorTeachers}</span>
                  </div>
                </div>
              </div>
              <div className="bar-item">
                <div className="bar-label">Standard (1-10)</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill bar-standard" 
                    style={{ width: `${(stats.standardTeachers / stats.totalTeachers * 100) || 0}%` }}
                  >
                    <span className="bar-value">{stats.standardTeachers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Quick Actions</h3>
          <div className="quick-actions">
            <button className="action-btn action-primary" onClick={() => window.location.href = '/teachers'}>
              <span className="action-icon">👥</span>
              <span className="action-text">View Teachers</span>
            </button>
            <button className="action-btn action-success" onClick={() => window.location.href = '/videos'}>
              <span className="action-icon">📹</span>
              <span className="action-text">Upload Video</span>
            </button>
            <button className="action-btn action-info" onClick={() => window.location.href = '/teachers'}>
              <span className="action-icon">➕</span>
              <span className="action-text">Add Teacher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
