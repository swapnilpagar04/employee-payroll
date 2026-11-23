import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import SalarySlip from './pages/SalarySlip';
import PayrollHistory from './pages/PayrollHistory';
import './App.css';

function App() {
  // Navigation active tab: 'dashboard' | 'employees' | 'payroll' | 'salary-slips' | 'history'
  const [activeTab, setActiveTab] = useState('dashboard');
  // Currently highlighted payroll record for viewing salary slip
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  // Mobile drawer open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            setSelectedPayrollId={setSelectedPayrollId}
          />
        );
      case 'employees':
        return <Employees />;
      case 'payroll':
        return (
          <Payroll
            setActiveTab={setActiveTab}
            setSelectedPayrollId={setSelectedPayrollId}
          />
        );
      case 'salary-slips':
        return (
          <SalarySlip
            selectedPayrollId={selectedPayrollId}
            setSelectedPayrollId={setSelectedPayrollId}
            setActiveTab={setActiveTab}
          />
        );
      case 'history':
        return (
          <PayrollHistory
            setActiveTab={setActiveTab}
            setSelectedPayrollId={setSelectedPayrollId}
          />
        );
      default:
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            setSelectedPayrollId={setSelectedPayrollId}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          activeTab={activeTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className="content-container">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
