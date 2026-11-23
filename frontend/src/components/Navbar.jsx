import React from 'react';
import { Calendar, UserCheck } from 'lucide-react';

const Navbar = ({ activeTab }) => {
  const pageTitles = {
    dashboard: 'Dashboard Overview',
    employees: 'Employee Management',
    payroll: 'Salary & Payroll Calculation',
    'salary-slips': 'Employee Salary Slips',
    history: 'Payroll Records & History',
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="navbar">
      <div className="navbar-left">
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
            <span className="user-name">Administrator</span>
            <span className="user-role">HR & Payroll Dept</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
