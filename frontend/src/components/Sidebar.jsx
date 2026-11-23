import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calculator,
  FileText,
  History,
  Building2,
  X
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'payroll', label: 'Process Payroll', icon: Calculator },
    { id: 'salary-slips', label: 'Salary Slips', icon: FileText },
    { id: 'history', label: 'Payroll History', icon: History },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <div className="brand-icon">
            <Building2 size={24} color="#ffffff" />
          </div>
          <div className="brand-text">
            <h2>PayMaster</h2>
            <span>Payroll Management</span>
          </div>
        </div>
        {setMobileMenuOpen && (
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-pill">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
        <p className="version-text">v1.0 • Python + React</p>
      </div>
    </aside>
  );
};

export default Sidebar;
