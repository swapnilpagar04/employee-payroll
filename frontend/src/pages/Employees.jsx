import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  X,
  AlertCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  formatCurrency,
  formatDate
} from '../api';

const initialFormData = {
  emp_id: '',
  name: '',
  email: '',
  phone: '',
  department: 'Engineering',
  designation: '',
  joining_date: new Date().toISOString().split('T')[0],
  basic_salary: '',
};

const departmentsList = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Customer Support',
  'Legal'
];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchList = async (search = '') => {
    try {
      setLoading(true);
      const data = await getEmployees(search);
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchList(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleOpenModal = (emp = null) => {
    setFormError('');
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        emp_id: emp.emp_id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        designation: emp.designation,
        joining_date: emp.joining_date,
        basic_salary: emp.basic_salary,
      });
    } else {
      setEditingEmployee(null);
      // Auto-suggest next employee ID like EMP005
      const nextNum = employees.length + 1;
      const suggestedId = `EMP${String(nextNum).padStart(3, '0')}`;
      setFormData({
        ...initialFormData,
        emp_id: suggestedId,
        joining_date: new Date().toISOString().split('T')[0],
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEmployee(null);
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formData.emp_id.trim()) return setFormError('Employee ID is required');
    if (!formData.name.trim()) return setFormError('Full Name is required');
    if (!formData.email.trim()) return setFormError('Email address is required');
    if (!formData.phone.trim()) return setFormError('Phone number is required');
    if (!formData.designation.trim()) return setFormError('Designation/Role is required');
    if (!formData.basic_salary || Number(formData.basic_salary) < 0) {
      return setFormError('Please enter a valid non-negative basic salary');
    }

    try {
      setSubmitting(true);
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
        showNotification('Employee details updated successfully!');
      } else {
        await createEmployee(formData);
        showNotification('New employee added successfully!');
      }
      handleCloseModal();
      fetchList(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.error || 'Operation failed. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      setDeleteConfirmId(null);
      showNotification('Employee removed successfully.');
      fetchList(searchTerm);
    } catch (err) {
      console.error('Failed to delete employee:', err);
      alert('Failed to delete employee. Associated records might exist.');
    }
  };

  const showNotification = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="employees-page">
      {statusMessage && (
        <div className="toast-notification">
          <Check size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Controls: Search + Add Button */}
      <div className="page-header-row">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search employees by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Employees Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-title">
            <h3>Staff Directory</h3>
            <span className="badge badge-neutral">{employees.length} Members</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Contact Details</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Joining Date</th>
                <th>Basic Salary</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="loading-cell">
                    <RefreshCw className="spin-icon" size={24} />
                    <span>Loading directory...</span>
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <span className="code-pill font-mono">{emp.emp_id}</span>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span className="font-semibold text-dark">{emp.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-item"><Mail size={13} /> {emp.email}</span>
                        <span className="contact-item"><Phone size={13} /> {emp.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span className="dept-tag">{emp.department}</span>
                    </td>
                    <td className="text-secondary">{emp.designation}</td>
                    <td>
                      <span className="date-badge-cell">
                        <Calendar size={13} />
                        {formatDate(emp.joining_date)}
                      </span>
                    </td>
                    <td className="font-semibold text-dark">
                      {formatCurrency(emp.basic_salary)}
                    </td>
                    <td className="text-right">
                      <div className="table-actions-group">
                        <button
                          className="btn-icon btn-icon-edit"
                          onClick={() => handleOpenModal(emp)}
                          title="Edit Employee"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-delete"
                          onClick={() => setDeleteConfirmId(emp.id)}
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-table-msg">
                    No employees matched your search. Try adjusting the query or click "Add New Employee".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee Details' : 'Add New Employee'}</h3>
              <button className="btn-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="modal-error-box">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleChange}
                    placeholder="e.g. EMP005"
                    disabled={!!editingEmployee}
                    className={editingEmployee ? 'input-disabled' : ''}
                    required
                  />
                  <small className="form-tip">Unique identifier code</small>
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sarah Connor"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Work Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="sarah.c@company.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1-555-0105"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Designation / Role *</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Joining Date *</label>
                  <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Monthly Basic Salary ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="basic_salary"
                    value={formData.basic_salary}
                    onChange={handleChange}
                    placeholder="e.g. 5500.00"
                    required
                  />
                  <small className="form-tip">Standard monthly base pay</small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <p>Are you sure you want to delete this employee? All related salary slips will also be permanently removed.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
