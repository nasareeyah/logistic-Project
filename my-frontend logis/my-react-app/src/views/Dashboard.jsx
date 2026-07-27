import React from 'react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function Dashboard() {
  const calendarDays = [
    { day: 28, isMuted: true },
    { day: 29, isMuted: true },
    { day: 30, isMuted: true },
    { day: 1, isMuted: false },
    { day: 2, isMuted: false },
    { day: 3, isMuted: false },
    { day: 4, isMuted: false },
    { day: 5, isMuted: false },
    { day: 6, isMuted: false },
    { day: 7, isMuted: false },
    { day: 8, isMuted: false },
    { day: 9, isMuted: false },
    { day: 10, isMuted: false },
    { day: 11, isMuted: false },
    { day: 12, isMuted: false },
    { day: 13, isMuted: false },
    { day: 14, isMuted: false },
    { day: 15, isMuted: false },
    { day: 16, isMuted: false },
    { day: 17, isMuted: false },
    { day: 18, isMuted: false },
    { day: 19, isMuted: false },
    { day: 20, isMuted: false },
    { day: 21, isMuted: false },
    { day: 22, isMuted: false },
    { day: 23, isMuted: false },
    { day: 24, isMuted: false },
    { day: 25, isMuted: false },
    { day: 26, isMuted: false },
    { day: 27, isMuted: false, isToday: true }, // Today is July 27, 2026 matching local time
    { day: 28, isMuted: false },
    { day: 29, isMuted: false },
    { day: 30, isMuted: false },
    { day: 31, isMuted: false },
    { day: 1, isMuted: true },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="dashboard-breadcrumb">
        <span>Main</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span style={{ color: '#64748b' }}>Dashboard</span>
      </div>

      {/* Header Title */}
      <h2 className="dashboard-view-title">Dashboard</h2>
      <p className="dashboard-view-subtitle">Overview of your logistics operations</p>

      {/* Stat Cards Grid */}
      <div className="dashboard-stats-grid">
        {/* Total Bookings */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#eff6ff' }}>
              <ClipboardList size={20} color="#2563eb" />
            </div>
            <div>
              <span className="dashboard-stat-value">0</span>
              <div className="dashboard-stat-label">Total Bookings</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            <span className="dashboard-stat-trend up">
              <TrendingUp size={14} />
              <span>12%</span>
            </span>
          </div>
        </div>

        {/* Pending Jobs */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#fffbeb' }}>
              <Clock size={20} color="#d97706" />
            </div>
            <div>
              <span className="dashboard-stat-value">0</span>
              <div className="dashboard-stat-label">Pending Jobs</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            {/* No trend for pending jobs */}
          </div>
        </div>

        {/* Completed Jobs */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#f0fdf4' }}>
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
            <div>
              <span className="dashboard-stat-value">0</span>
              <div className="dashboard-stat-label">Completed Jobs</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            <span className="dashboard-stat-trend up">
              <TrendingUp size={14} />
              <span>8%</span>
            </span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#f0fdfa' }}>
              {/* Custom Baht Symbol as Icon */}
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>฿</span>
            </div>
            <div>
              <span className="dashboard-stat-value">฿0</span>
              <div className="dashboard-stat-label">Monthly Revenue</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            <span className="dashboard-stat-trend up">
              <TrendingUp size={14} />
              <span>15%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid Row: Chart + Schedule */}
      <div className="dashboard-grid-row-2">
        {/* Bookings & Revenue Panel */}
        <div className="dashboard-card-panel">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title-group">
              <h3 className="dashboard-card-title">Bookings & Revenue</h3>
              <span className="dashboard-card-subtitle">Last 6 months</span>
            </div>
            <TrendingUp size={18} color="#1872b2" />
          </div>
          {/* SVG Dotted Grid Line Chart Template */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
            <svg viewBox="0 0 600 220" width="100%" height="220" style={{ overflow: 'visible' }}>
              <line x1="30" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="10" y="34" fill="#94a3b8" fontSize="12" fontWeight="500">4</text>

              <line x1="30" y1="80" x2="580" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="10" y="84" fill="#94a3b8" fontSize="12" fontWeight="500">3</text>

              <line x1="30" y1="130" x2="580" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="10" y="134" fill="#94a3b8" fontSize="12" fontWeight="500">2</text>

              <line x1="30" y1="180" x2="580" y2="180" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="10" y="184" fill="#94a3b8" fontSize="12" fontWeight="500">1</text>
            </svg>
          </div>
        </div>

        {/* Schedule / Calendar Panel */}
        <div className="dashboard-card-panel">
          <div className="dashboard-card-header" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#64748b" />
              <h3 className="dashboard-card-title">Schedule</h3>
            </div>
          </div>
          
          <div className="calendar-container">
            <div className="calendar-header-nav">
              <span className="calendar-month-title">July 2026</span>
              <div className="calendar-nav-buttons">
                <button className="calendar-nav-btn"><ChevronLeft size={16} /></button>
                <button className="calendar-nav-btn calendar-today-btn">Today</button>
                <button className="calendar-nav-btn"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="calendar-grid">
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                <div key={idx} className="calendar-day-label">{label}</div>
              ))}
              
              {/* Calendar cell items */}
              {calendarDays.map((item, idx) => {
                let cellClass = 'calendar-day-cell';
                if (item.isMuted) cellClass += ' muted';
                if (item.isToday) cellClass += ' today';
                return (
                  <div key={idx} className={cellClass}>
                    {item.day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid Row: Job Status + Recent Bookings */}
      <div className="dashboard-grid-row-3">
        {/* Job Status Panel */}
        <div className="dashboard-card-panel">
          <h3 className="dashboard-card-title" style={{ marginBottom: '16px' }}>Job Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Waiting */}
            <div className="status-badge-item">
              <span className="status-badge-pill badge-waiting">
                <span className="status-dot"></span>
                Waiting
              </span>
              <span className="status-badge-count">0</span>
            </div>

            {/* Assigned */}
            <div className="status-badge-item">
              <span className="status-badge-pill badge-assigned">
                <span className="status-dot"></span>
                Assigned
              </span>
              <span className="status-badge-count">0</span>
            </div>

            {/* In Progress */}
            <div className="status-badge-item">
              <span className="status-badge-pill badge-inprogress">
                <span className="status-dot"></span>
                In Progress
              </span>
              <span className="status-badge-count">0</span>
            </div>

            {/* Delivered */}
            <div className="status-badge-item">
              <span className="status-badge-pill badge-delivered">
                <span className="status-dot"></span>
                Delivered
              </span>
              <span className="status-badge-count">0</span>
            </div>

            {/* Completed */}
            <div className="status-badge-item">
              <span className="status-badge-pill badge-completed">
                <span className="status-dot"></span>
                Completed
              </span>
              <span className="status-badge-count">0</span>
            </div>

            {/* Cancelled */}
            <div className="status-badge-item">
              <span className="status-badge-pill badge-cancelled">
                <span className="status-dot"></span>
                Cancelled
              </span>
              <span className="status-badge-count">0</span>
            </div>
          </div>
        </div>

        {/* Recent Bookings Panel */}
        <div className="dashboard-card-panel">
          <div className="dashboard-card-header" style={{ marginBottom: '0px' }}>
            <h3 className="dashboard-card-title">Recent Bookings</h3>
            <span style={{ fontSize: '0.85rem', color: '#1872b2', fontWeight: '600', cursor: 'pointer' }}>View all</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>No bookings yet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;