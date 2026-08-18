import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { Menu, Bell, ChevronDown, Building2, User, Sparkles } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { currentUser, setIsAuthModalOpen, activeTab } = useCivic();
  const [showDropdown, setShowDropdown] = useState(false);

  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'User';

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <div className="greeting-container">
          <h1 className="greeting-title">
            Hello, {firstName} <span className="wave-emoji">👋</span>
          </h1>
          <p className="greeting-subtitle">Let's make our community better together.</p>
        </div>
      </div>

      <div className="header-right">
        {/* Active Role Pill */}
        <div 
          className={`role-pill ${currentUser.role === 'Organization' ? 'org' : 'citizen'}`}
          onClick={() => setIsAuthModalOpen(true)}
          title="Click to switch between Citizen and Organization account"
        >
          {currentUser.role === 'Organization' ? (
            <>
              <Building2 size={15} />
              <span>Organization</span>
            </>
          ) : (
            <>
              <User size={15} />
              <span>Citizen</span>
            </>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button 
          className="notification-btn" 
          aria-label="Notifications"
          title="3 Unread Notifications"
        >
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        {/* User Profile Avatar Pill */}
        <div className="user-profile-wrapper">
          <button 
            className="user-avatar-btn"
            onClick={() => setIsAuthModalOpen(true)}
            title="Account Profile & Role Switcher"
          >
            <div className="avatar-circle">
              {currentUser.avatar || 'NS'}
            </div>
            <ChevronDown size={14} className="avatar-chevron" />
          </button>
        </div>
      </div>
    </header>
  );
}
