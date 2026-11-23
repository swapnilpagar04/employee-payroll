import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Trash2,
  FileText,
  DollarSign,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';
import { getPayrolls, deletePayroll, formatCurrency, formatDate } from '../api';

const monthsFilterList = [
  'All Months',
  'January 2026', 'February 2026', 'March 2026', 'April 2026',
  'May 2026', 'June 2026', 'July 2026', 'August 2026',
  'September 2026', 'October 2026', 'November 2026', 'December 2026'
];

const PayrollHistory = ({ setActiveTab, setSelectedPayrollId }) => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedMonth && selectedMonth !== 'All Months') {
        params.month = selectedMonth;
      }
      if (searchTerm.trim()) {
        params.employee_id = searchTerm.trim();
      }
      const data = await getPayrolls(params);
      setPayrolls(data);
    } catch (err) {
      console.error('Failed to load payroll history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedMonth]);

  const handleDeleteRecord = async (id) => {
    try {
      await deletePayroll(id);
      setDeleteConfirmId(null);
      fetchRecords();
    } catch (err) {
      console.error('Failed to delete payroll record:', err);
      alert('Failed to delete payroll record.');
    }
  };

  const handleViewSlip = (id) => {
    if (setSelectedPayrollId) {
      setSelectedPayrollId(id);
    }
    setActiveTab('salary-slips');
  };

  return (
    <div className="payroll-history-page">
      {/* Top Filter and Search Bar */}
      <div className="page-header-row">
        <div className="filter-group-left">
          <div className="search-bar-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Employee Name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="select-filter-wrapper">
            <Filter size={16} className="filter-icon" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              {monthsFilterList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setActiveTab('payroll')}>
          <DollarSign size={18} />
          <span>Process New Payroll</span>
        </button>
      </div>

      {/* History Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <h3>Disbursement Records</h3>
            <span className="badge badge-neutral">{payrolls.length} Transactions</span>
          </div>
          {selectedMonth !== 'All Months' && (
            <span className="badge badge-primary">Filtered: {selectedMonth}</span>
          )}
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Slip ID</th>
                <th>Month</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Basic Salary</th>
                <th>Gross Earnings</th>
                <th>Deductions</th>
                <th>Net Payout</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="loading-cell">
                    <RefreshCw className="spin-icon" size={24} />
                    <span>Loading payroll records...</span>
                  </td>
                </tr>
              ) : payrolls.length > 0 ? (
                payrolls.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="code-pill font-mono">PAY-{String(row.id).padStart(4, '0')}</span>
                    </td>
                    <td>
                      <span className="badge badge-outline">{row.month}</span>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span className="font-semibold text-dark">{row.employee_name}</span>
                        <span className="subtext">{row.emp_id} • {row.designation}</span>
                      </div>
                    </td>
                    <td>
                      <span className="dept-tag">{row.department}</span>
                    </td>
                    <td>{formatCurrency(row.basic_salary)}</td>
                    <td className="font-medium text-dark">{formatCurrency(row.gross_salary)}</td>
                    <td className="text-red">- {formatCurrency(row.deductions)}</td>
                    <td className="font-bold text-green">{formatCurrency(row.net_salary)}</td>
                    <td className="text-right">
                      <div className="table-actions-group">
                        <button
                          className="btn-action-view"
                          onClick={() => handleViewSlip(row.id)}
                          title="View Official Salary Slip"
                        >
                          <FileText size={15} />
                          <span>View Slip</span>
                        </button>
                        <button
                          className="btn-icon btn-icon-delete"
                          onClick={() => setDeleteConfirmId(row.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-table-msg">
                    No payroll records found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-card modal-confirm">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="btn-close" onClick={() => setDeleteConfirmId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this payroll transaction? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteRecord(deleteConfirmId)}>
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollHistory;
