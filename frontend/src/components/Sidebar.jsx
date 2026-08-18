import React from 'react';
import { useCivic } from '../context/CivicContext';
import { 
  MapPin, 
  Home, 
  Globe, 
  FileText, 
  Briefcase, 
  Bell, 
  User, 
  Settings, 
  Info, 
  LogOut,
  X,
  Menu,
  ChevronLeft
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    setIsAuthModalOpen, 
    problems,
    isSidebarCollapsed,
    toggleSidebarCollapse
  } = useCivic();

  const myProjectsCount = problems.filter(p => p.assignedOrg === currentUser.name || p.status === 'ONGOING').length;

  const navItems = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'All Problems', label: 'All Problems', icon: Globe },
    { id: 'My Reports', label: 'My Reports', icon: FileText },
    { id: 'My Projects', label: 'My Projects', icon: Briefcase, badge: currentUser.role === 'Organization' ? myProjectsCount : null },
    { id: 'Notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { id: 'Profile', label: 'Profile', icon: User },
    { id: 'Settings', label: 'Settings', icon: Settings },
    { id: 'About', label: 'About', icon: Info },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Logo Header */}
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="logo-icon-badge">
              <MapPin size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span className="brand-name">
              FIX<span className="brand-highlight">IT</span>
            </span>
          </div>
          
          <button 
            className="sidebar-toggle-btn" 
            onClick={toggleSidebarCollapse}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button className="mobile-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>


        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button 
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onClose) onClose();
                    }}
                  >
                    <Icon size={19} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    {item.badge ? (
                      <span className="nav-badge">{item.badge}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn" 
            onClick={() => setIsAuthModalOpen(true)}
            title="Switch Account / Log out"
          >
            <LogOut size={18} />
            <span>Switch / Logout</span>
          </button>

          <div className="copyright-container">
            <p className="copyright-text">© 2026 FIXIT. All rights reserved.</p>
            <div className="footer-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#contact">Contact Us</a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
