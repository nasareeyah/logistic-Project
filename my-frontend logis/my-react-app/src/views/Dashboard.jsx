function Dashboard({ customersCount, carsCount, driversCount }) {
  return (
    <div>
      <h2 className="dashboard-view-title">Dashboard</h2>
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customers</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>{customersCount}</span>
        </div>
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Trucks</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>{carsCount}</span>
        </div>
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Drivers</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>{driversCount}</span>
        </div>
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Bookings</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>5</span>
        </div>
      </div>
      <div className="dashboard-panels-grid">
        <div className="dashboard-panel-main" style={{ padding: '24px', boxSizing: 'border-box', color: '#1e293b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: '700' }}>Recent Logistics Activities</h3>
          <div style={{ borderTop: '2px solid rgba(0,0,0,0.05)', paddingTop: '15px' }}>
            <p style={{ margin: '12px 0', fontSize: '0.95rem', color: '#475569', textAlign: 'left' }}>🚚 <strong>Vehicle dispatched:</strong> 72-2955 was assigned to route A.</p>
            <p style={{ margin: '12px 0', fontSize: '0.95rem', color: '#475569', textAlign: 'left' }}>👤 <strong>New profile registered:</strong> Customer SCG Group updated phone records.</p>
            <p style={{ margin: '12px 0', fontSize: '0.95rem', color: '#475569', textAlign: 'left' }}>👮 <strong>Driver status:</strong> สมชาย ดีใจ completed vehicle checklist.</p>
          </div>
        </div>
        <div className="dashboard-panel-side" style={{ padding: '24px', boxSizing: 'border-box', color: '#1e293b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: '700' }}>Status Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span>On Route</span>
              <strong>70%</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '70%', background: '#1890ff', height: '100%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '10px' }}>
              <span>Available</span>
              <strong>30%</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '30%', background: '#52c41a', height: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-panel-bottom" style={{ padding: '24px', boxSizing: 'border-box', color: '#1e293b', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '700' }}>System Information</h3>
        <p style={{ margin: '5px 0', fontSize: '0.95rem', color: '#475569' }}>All systems operational. Connected to MariaDB database: <strong>Back-logistic</strong>.</p>
        <p style={{ margin: '5px 0', fontSize: '0.95rem', color: '#475569' }}>API Server running at <strong>http://localhost:3000</strong></p>
      </div>
    </div>
  );
}

export default Dashboard;