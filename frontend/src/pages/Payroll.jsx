import React, { useState, useEffect } from 'react';
import {
  Calculator,
  User,
  Calendar,
  DollarSign,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { getEmployees, createPayroll, formatCurrency } from '../api';

const monthsList = [
  'January 2026', 'February 2026', 'March 2026', 'April 2026',
  'May 2026', 'June 2026', 'July 2026', 'August 2026',
  'September 2026', 'October 2026', 'November 2026', 'December 2026'
];

const Payroll = ({ setActiveTab, setSelectedPayrollId }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('November 2026');

  // Salary Components
  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('');
  const [allowances, setAllowances] = useState('');
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
        if (data.length > 0) {
          handleSelectEmployee(data[0].id, data);
        }
      } catch (err) {
        console.error('Failed to load employees for payroll:', err);
      }
    };
    loadEmployees();
  }, []);

  const handleSelectEmployee = (empId, list = employees) => {
    setSelectedEmpId(empId);
    setError('');
    setSuccessResult(null);

    const emp = list.find((e) => String(e.id) === String(empId));
    if (emp) {
      const base = Number(emp.basic_salary) || 0;
      setBasicSalary(base);
      // Auto-suggest standard HRA (20%), Standard Allowances (8%), Standard Deductions (10%)
      setHra(Math.round(base * 0.20));
      setAllowances(Math.round(base * 0.08));
      setBonus(0);
      setDeductions(Math.round(base * 0.10));
    }
  };

  // Live Automatic Calculations with 2-decimal precision
  const numBasic = parseFloat(basicSalary) || 0;
  const numHra = parseFloat(hra) || 0;
  const numAllowances = parseFloat(allowances) || 0;
  const numBonus = parseFloat(bonus) || 0;
  const numDeductions = parseFloat(deductions) || 0;

  const grossSalary = Math.round((numBasic + numHra + numAllowances + numBonus) * 100) / 100;
  const netSalary = Math.round((grossSalary - numDeductions) * 100) / 100;

  const handleApplyDefaults = () => {
    if (numBasic > 0) {
      setHra(Math.round(numBasic * 0.20));
      setAllowances(Math.round(numBasic * 0.08));
      setBonus(0);
      setDeductions(Math.round(numBasic * 0.10));
    }
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessResult(null);

    if (!selectedEmpId) {
      return setError('Please select an employee.');
    }
    if (numBasic <= 0) {
      return setError('Basic salary must be greater than zero.');
    }
    if (netSalary < 0) {
      return setError('Net salary cannot be negative. Please check deductions.');
    }

    try {
      setLoading(true);
      const payload = {
        employee_id: Number(selectedEmpId),
        month: selectedMonth,
        basic_salary: numBasic,
        hra: numHra,
        allowances: numAllowances,
        bonus: numBonus,
        deductions: numDeductions,
      };

      const result = await createPayroll(payload);
      setSuccessResult(result);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to process payroll.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGeneratedSlip = () => {
    if (successResult && setSelectedPayrollId) {
      setSelectedPayrollId(successResult.id);
    }
    setActiveTab('salary-slips');
  };

  const selectedEmployeeObj = employees.find((e) => String(e.id) === String(selectedEmpId));

  return (
    <div className="payroll-page">
      <div className="payroll-layout-grid">
        {/* Left Column: Form Inputs */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <h3>Salary Calculation & Payroll Entry</h3>
              <p className="card-subtitle">Select employee, specify earnings & deductions, and calculate payout.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleApplyDefaults}
              title="Apply standard 20% HRA and 10% tax rates"
            >
              <Sparkles size={14} />
              <span>Standard Rates</span>
            </button>
          </div>

          {error && (
            <div className="modal-error-box m-3">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleProcessPayroll} className="payroll-form">
            <div className="form-grid">
              {/* Select Employee */}
              <div className="form-group col-span-2">
                <label>Select Employee *</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="input-select-lg"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.emp_id} - {emp.name} ({emp.department} • {emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary Month */}
              <div className="form-group col-span-2">
                <label>Salary Month / Period *</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  required
                >
                  {monthsList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Earnings Section Header */}
              <div className="form-section-title col-span-2">
                <PlusCircle size={16} color="#2563eb" />
                <span>Earnings & Allowances</span>
              </div>

              <div className="form-group">
                <label>Basic Salary ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>House Rent Allowance (HRA) ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={hra}
                  onChange={(e) => setHra(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Special Allowances ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={allowances}
                  onChange={(e) => setAllowances(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Bonus / Incentives ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Deductions Section Header */}
              <div className="form-section-title col-span-2 text-red">
                <MinusCircle size={16} color="#ef4444" />
                <span>Deductions</span>
              </div>

              <div className="form-group col-span-2">
                <label>Total Deductions ($) (Tax + PF + Insurance)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="payroll-submit-box">
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                <Calculator size={20} />
                <span>{loading ? 'Processing...' : 'Process & Save Payroll'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Calculation Card */}
        <div className="payroll-summary-column">
          <div className="card calculation-card">
            <div className="card-header">
              <h3>Live Salary Breakdown</h3>
              <span className="badge badge-primary">{selectedMonth}</span>
            </div>

            {selectedEmployeeObj && (
              <div className="calc-employee-header">
                <div className="calc-avatar">
                  <User size={20} />
                </div>
                <div>
                  <h4>{selectedEmployeeObj.name}</h4>
                  <p>{selectedEmployeeObj.emp_id} • {selectedEmployeeObj.designation}</p>
                </div>
              </div>
            )}

            <div className="calculation-breakdown-list">
              <div className="calc-row">
                <span>Basic Salary</span>
                <span className="font-semibold">{formatCurrency(numBasic)}</span>
              </div>
              <div className="calc-row">
                <span>House Rent Allowance (HRA)</span>
                <span className="text-secondary">+ {formatCurrency(numHra)}</span>
              </div>
              <div className="calc-row">
                <span>Special Allowances</span>
                <span className="text-secondary">+ {formatCurrency(numAllowances)}</span>
              </div>
              <div className="calc-row">
                <span>Bonus & Incentives</span>
                <span className="text-secondary">+ {formatCurrency(numBonus)}</span>
              </div>

              <div className="calc-divider"></div>

              <div className="calc-row calc-row-highlight">
                <span className="font-semibold text-dark">Gross Earnings</span>
                <span className="font-bold text-dark">{formatCurrency(grossSalary)}</span>
              </div>

              <div className="calc-row text-danger">
                <span>Total Deductions</span>
                <span>- {formatCurrency(numDeductions)}</span>
              </div>

              <div className="calc-divider double-divider"></div>

              <div className="calc-net-box">
                <span className="net-title">Net Take-Home Salary</span>
                <span className="net-amount">{formatCurrency(netSalary)}</span>
                <span className="net-subtext">Gross Salary ({formatCurrency(grossSalary)}) - Deductions ({formatCurrency(numDeductions)})</span>
              </div>
            </div>

            {/* Success Feedback Card */}
            {successResult && (
              <div className="success-banner-box">
                <div className="success-banner-content">
                  <CheckCircle size={22} color="#10b981" />
                  <div>
                    <h5>Payroll Recorded Successfully!</h5>
                    <p>Salary slip #{successResult.id} for {successResult.employee_name} has been saved.</p>
                  </div>
                </div>
                <button
                  className="btn btn-success btn-sm mt-3"
                  onClick={handleViewGeneratedSlip}
                >
                  <span>View & Download Salary Slip</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
