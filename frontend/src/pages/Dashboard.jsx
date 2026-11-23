import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Layers,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { getDashboardData, formatCurrency, formatDate } from '../api';

const Dashboard = ({ setActiveTab, setSelectedPayrollId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardData();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to connect to backend server. Make sure the backend is accessible.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleViewSlip = (id) => {
    if (setSelectedPayrollId) {
      setSelectedPayrollId(id);
    }
    setActiveTab('salary-slips');
  };

  if (loading) {
    return (
      <div className="loading-state">
        <RefreshCw className="spin-icon" size={32} />
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <p>{error}</p>
        <button onClick={fetchDashboard} className="btn btn-secondary btn-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Quick Action Top Bar */}
      <div className="dashboard-header-actions">
        <div>
          <h2>Welcome back, Admin 👋</h2>
          <p className="text-secondary">Here is a quick overview of your organization's payroll and staff.</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn btn-primary" onClick={() => setActiveTab('employees')}>
            <UserPlus size={18} />
            <span>Manage Employees</span>
          </button>
          <button className="btn btn-dark" onClick={() => setActiveTab('payroll')}>
            <Calculator size={18} />
            <span>Calculate Payroll</span>
          </button>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue">
            <Users size={24} color="#2563eb" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Employees</span>
            <h3 className="stat-value">{data?.total_employees || 0}</h3>
            <span className="stat-subtext">Active staff members</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-green">
            <DollarSign size={24} color="#10b981" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Net Payroll</span>
            <h3 className="stat-value">{formatCurrency(data?.total_monthly_payroll || 0)}</h3>
            <span className="stat-subtext">Total payout recorded</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-purple">
            <Layers size={24} color="#8b5cf6" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Departments</span>
            <h3 className="stat-value">{data?.total_departments || 0}</h3>
            <span className="stat-subtext">Operational divisions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-orange">
            <CheckCircle2 size={24} color="#f97316" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Processed Slips</span>
            <h3 className="stat-value">{data?.total_payrolls_count || 0}</h3>
            <span className="stat-subtext">Total payslips issued</span>
          </div>
        </div>
      </div>

      {/* Content Grid: Recently Added Employees & Recent Payrolls */}
      <div className="dashboard-tables-grid">
        {/* Recent Employees Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <h3>Recently Added Employees</h3>
              <span className="badge badge-neutral">{data?.recent_employees?.length || 0} recent</span>
            </div>
            <button className="btn-link" onClick={() => setActiveTab('employees')}>
              View All <ArrowRight size={16} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Base Salary</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_employees?.length > 0 ? (
                  data.recent_employees.map((emp) => (
                    <tr key={emp.id}>
                      <td><span className="code-pill">{emp.emp_id}</span></td>
                      <td className="font-medium">{emp.name}</td>
                      <td><span className="dept-tag">{emp.department}</span></td>
                      <td className="text-secondary">{emp.designation}</td>
                      <td className="font-medium text-dark">{formatCurrency(emp.basic_salary)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-table-msg">No employees added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payroll Transactions */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <h3>Recent Payroll Transactions</h3>
              <span className="badge badge-success">Processed</span>
            </div>
            <button className="btn-link" onClick={() => setActiveTab('history')}>
              View History <ArrowRight size={16} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month</th>
                  <th>Net Payout</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_payrolls?.length > 0 ? (
                  data.recent_payrolls.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-user-cell">
                          <span className="font-medium">{p.employee_name}</span>
                          <span className="subtext">{p.emp_id} • {p.department}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-outline">{p.month}</span></td>
                      <td className="font-semibold text-green">{formatCurrency(p.net_salary)}</td>
                      <td>
                        <button
                          className="btn-action-view"
                          onClick={() => handleViewSlip(p.id)}
                          title="View Salary Slip"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-table-msg">No payroll records yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
