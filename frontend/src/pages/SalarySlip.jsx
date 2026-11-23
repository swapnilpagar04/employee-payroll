import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  User,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { getPayrolls, getPayrollById, formatCurrency, formatDate } from '../api';

const SalarySlip = ({ selectedPayrollId, setSelectedPayrollId, setActiveTab }) => {
  const [payrolls, setPayrolls] = useState([]);
  const [currentId, setCurrentId] = useState(selectedPayrollId || '');
  const [slipData, setSlipData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load all payrolls for selector
  useEffect(() => {
    const loadList = async () => {
      try {
        const list = await getPayrolls();
        setPayrolls(list);
        if (list.length > 0 && !currentId) {
          setCurrentId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load payrolls list:', err);
      }
    };
    loadList();
  }, []);

  // Sync with selectedPayrollId prop if changed from outside
  useEffect(() => {
    if (selectedPayrollId) {
      setCurrentId(selectedPayrollId);
    }
  }, [selectedPayrollId]);

  // Load specific slip data
  useEffect(() => {
    if (!currentId) return;
    const fetchSlip = async () => {
      try {
        setLoading(true);
        const data = await getPayrollById(currentId);
        setSlipData(data);
      } catch (err) {
        console.error('Failed to load slip:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlip();
  }, [currentId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="salary-slip-page">
      {/* Controls Bar (Hidden during print) */}
      <div className="slip-controls no-print">
        <div className="slip-selector-group">
          <label>Choose Payroll Record:</label>
          <select
            value={currentId}
            onChange={(e) => {
              setCurrentId(e.target.value);
              if (setSelectedPayrollId) setSelectedPayrollId(e.target.value);
            }}
            className="slip-select"
          >
            {payrolls.length === 0 && <option value="">No records available</option>}
            {payrolls.map((p) => (
              <option key={p.id} value={p.id}>
                {p.month} — {p.employee_name} ({p.emp_id}) — Net: {formatCurrency(p.net_salary)}
              </option>
            ))}
          </select>
        </div>

        <div className="slip-actions">
          {setActiveTab && (
            <button className="btn btn-secondary" onClick={() => setActiveTab('history')}>
              <ArrowLeft size={16} />
              <span>Back to History</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state no-print">
          <RefreshCw className="spin-icon" size={28} />
          <p>Loading payslip details...</p>
        </div>
      ) : !slipData ? (
        <div className="empty-state-card no-print">
          <FileText size={48} color="#94a3b8" />
          <h3>No Payroll Record Selected</h3>
          <p>Please select a payroll transaction from the dropdown above or process a new salary in the Payroll tab.</p>
        </div>
      ) : (
        /* Printable Salary Slip Document */
        <div className="printable-slip-container">
          <div className="slip-card" id="salary-slip-document">
            {/* Header: Company Info */}
            <div className="slip-header">
              <div className="slip-company-info">
                <div className="company-logo-placeholder">
                  <Building size={28} color="#2563eb" />
                </div>
                <div>
                  <h2 className="company-name">ACME TECHNOLOGIES INC.</h2>
                  <p className="company-address">100 Innovation Way, Suite 400, Tech Park, CA 94025</p>
                  <p className="company-contact">Phone: +1 (800) 555-0199 • Email: payroll@acmetech.com</p>
                </div>
              </div>
              <div className="slip-badge-info">
                <span className="slip-type-tag">OFFICIAL SALARY SLIP</span>
                <span className="slip-period">{slipData.month}</span>
                <span className="slip-ref-no">Slip Ref: PAY-{String(slipData.id).padStart(5, '0')}</span>
              </div>
            </div>

            <div className="slip-divider"></div>

            {/* Employee Details Grid */}
            <div className="slip-employee-details">
              <div className="detail-col">
                <div className="detail-item">
                  <span className="detail-label">Employee ID:</span>
                  <span className="detail-value font-mono font-bold">{slipData.emp_id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Employee Name:</span>
                  <span className="detail-value font-bold">{slipData.employee_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{slipData.department}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Designation:</span>
                  <span className="detail-value">{slipData.designation}</span>
                </div>
              </div>

              <div className="detail-col">
                <div className="detail-item">
                  <span className="detail-label">Joining Date:</span>
                  <span className="detail-value">{formatDate(slipData.joining_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address:</span>
                  <span className="detail-value">{slipData.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Phone:</span>
                  <span className="detail-value">{slipData.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payment Mode:</span>
                  <span className="detail-value">Direct Bank Deposit</span>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Tables Grid */}
            <div className="slip-components-grid">
              {/* Earnings Table */}
              <div className="component-box earnings-box">
                <div className="component-box-header">
                  <h4>EARNINGS</h4>
                  <span>AMOUNT ($)</span>
                </div>
                <div className="component-rows">
                  <div className="comp-row">
                    <span>Basic Salary</span>
                    <span>{formatCurrency(slipData.basic_salary)}</span>
                  </div>
                  <div className="comp-row">
                    <span>House Rent Allowance (HRA)</span>
                    <span>{formatCurrency(slipData.hra)}</span>
                  </div>
                  <div className="comp-row">
                    <span>Special Allowances</span>
                    <span>{formatCurrency(slipData.allowances)}</span>
                  </div>
                  <div className="comp-row">
                    <span>Bonus / Incentives</span>
                    <span>{formatCurrency(slipData.bonus)}</span>
                  </div>
                </div>
                <div className="component-subtotal">
                  <span>Gross Earnings (A)</span>
                  <span className="font-bold text-dark">{formatCurrency(slipData.gross_salary)}</span>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="component-box deductions-box">
                <div className="component-box-header">
                  <h4>DEDUCTIONS</h4>
                  <span>AMOUNT ($)</span>
                </div>
                <div className="component-rows">
                  <div className="comp-row">
                    <span>Statutory Tax & TDS</span>
                    <span>{formatCurrency(slipData.deductions * 0.65)}</span>
                  </div>
                  <div className="comp-row">
                    <span>Provident Fund (PF) / 401(k)</span>
                    <span>{formatCurrency(slipData.deductions * 0.25)}</span>
                  </div>
                  <div className="comp-row">
                    <span>Health & Group Insurance</span>
                    <span>{formatCurrency(slipData.deductions * 0.10)}</span>
                  </div>
                  <div className="comp-row text-muted">
                    <span>Other Deductions</span>
                    <span>$0.00</span>
                  </div>
                </div>
                <div className="component-subtotal">
                  <span>Total Deductions (B)</span>
                  <span className="font-bold text-red">{formatCurrency(slipData.deductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Payout Callout */}
            <div className="slip-net-summary">
              <div className="net-summary-left">
                <span className="net-summary-label">NET TAKE-HOME PAY (A - B):</span>
                <span className="net-summary-words">Calculated based on standard payroll calendar</span>
              </div>
              <div className="net-summary-amount">
                {formatCurrency(slipData.net_salary)}
              </div>
            </div>

            {/* Signature & Verification Block */}
            <div className="slip-signatures">
              <div className="sig-block">
                <div className="sig-line"></div>
                <span>Employee Signature</span>
              </div>
              <div className="sig-block text-right">
                <div className="sig-line"></div>
                <span>Authorized Signatory (HR / Finance)</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="slip-footer">
              <p>This is a computer-generated salary slip and does not require physical stamp.</p>
              <p className="confidential-text">CONFIDENTIAL • ACME TECHNOLOGIES INC. © 2026</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalarySlip;
