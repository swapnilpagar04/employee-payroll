import React from 'react';
import { Calendar, UserCheck, Menu } from 'lucide-react';

const Navbar = ({ activeTab, mobileMenuOpen, setMobileMenuOpen }) => {
  const pageTitles = {
    dashboard: 'Dashboard Overview',
    employees: 'Employee Management',
    payroll: 'Salary & Payroll Calculation',
    'salary-slips': 'Employee Salary Slips',
    history: 'Payroll Records & History',
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="navbar">
      <div className="navbar-left">
        {setMobileMenuOpen && (
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        )}
        <h1 className="page-title">{pageTitles[activeTab] || 'Payroll Management'}</h1>
      </div>
      <div className="navbar-right">
        <div className="date-badge">
          <Calendar size={16} />
          <span>{currentDate}</span>
        </div>
        <div className="user-profile">
          <div className="avatar">
            <UserCheck size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">Admin</span>
            <span className="user-role">Payroll</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
