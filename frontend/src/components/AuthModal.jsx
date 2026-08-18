import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { User, Building2, X, Check, Shield, UserPlus } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, switchUser } = useCivic();

  const [activeTab, setActiveTab] = useState('switch'); // 'switch' or 'signup'
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('Citizen');
  const [customEmail, setCustomEmail] = useState('');

  if (!isAuthModalOpen) return null;

  const predefinedAccounts = [
    {
      id: 'usr-1',
      name: 'Nora Smith',
      role: 'Citizen',
      avatar: 'NS',
      email: 'nora@fixit.org',
      desc: 'Active Community Reporter'
    },
    {
      id: 'usr-2',
      name: 'Buea Municipal Council',
      role: 'Organization',
      avatar: 'BM',
      email: 'council@buea.gov.cm',
      desc: 'Local Government Authority'
    },
    {
      id: 'usr-3',
      name: 'Public Works Dept',
      role: 'Organization',
      avatar: 'PW',
      email: 'infrastructure@publicworks.org',
      desc: 'Roads & Lighting Department'
    }
  ];

  const handleSelectPredefined = (acc) => {
    switchUser(acc);
    setIsAuthModalOpen(false);
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const initials = customName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US';
    const newAcc = {
      id: `usr-${Date.now()}`,
      name: customName,
      role: customRole,
      avatar: initials,
      email: customEmail || `${customName.toLowerCase().replace(/\s+/g, '')}@fixit.org`
    };

    switchUser(newAcc);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="auth-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <User size={22} className="header-icon" />
            <h3>Sign In / Switch Account</h3>
          </div>
          <button className="modal-close-btn" onClick={() => setIsAuthModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${activeTab === 'switch' ? 'active' : ''}`}
            onClick={() => setActiveTab('switch')}
          >
            Quick Account Switcher
          </button>
          <button 
            className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up New Account
          </button>
        </div>

        {activeTab === 'switch' ? (
          <div className="auth-body">
            <p className="auth-intro">Choose an account role to interact with FIXIT platform features:</p>

            <div className="accounts-grid">
              {predefinedAccounts.map((acc) => {
                const isSelected = currentUser.id === acc.id || currentUser.name === acc.name;
                return (
                  <div 
                    key={acc.id}
                    className={`account-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectPredefined(acc)}
                  >
                    <div className="account-avatar-box">
                      {acc.avatar}
                    </div>
                    <div className="account-info">
                      <div className="acc-name-row">
                        <strong>{acc.name}</strong>
                        {isSelected && <Check size={16} className="selected-check" />}
                      </div>
                      <span className={`role-badge ${acc.role.toLowerCase()}`}>
                        {acc.role === 'Organization' ? <Building2 size={12} /> : <User size={12} />}
                        {acc.role}
                      </span>
                      <p className="acc-desc">{acc.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAccount} className="auth-signup-form">
            <div className="form-group">
              <label className="form-label">Full Name or Organization Name*</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. John Doe or Limbe Water Authority"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Type / Role*</label>
              <div className="role-selector-radios">
                <label className={`role-radio-btn ${customRole === 'Citizen' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="Citizen" 
                    checked={customRole === 'Citizen'}
                    onChange={() => setCustomRole('Citizen')} 
                  />
                  <User size={16} />
                  <span>Citizen / Resident</span>
                </label>

                <label className={`role-radio-btn ${customRole === 'Organization' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="Organization" 
                    checked={customRole === 'Organization'}
                    onChange={() => setCustomRole('Organization')} 
                  />
                  <Building2 size={16} />
                  <span>Organization / Authority</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input 
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary-green full">
              <UserPlus size={18} />
              <span>Create & Sign In</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
