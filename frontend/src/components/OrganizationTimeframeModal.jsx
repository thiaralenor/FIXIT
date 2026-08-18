import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { FolderPlus, Calendar, Clock, Building2, X, CheckCircle2 } from 'lucide-react';

export default function OrganizationTimeframeModal() {
  const { 
    isTimeframeModalOpen, 
    setIsTimeframeModalOpen, 
    selectedProblem, 
    setSelectedProblem, 
    addToProject,
    currentUser 
  } = useCivic();

  const [timeframe, setTimeframe] = useState('2 weeks');
  const [targetDate, setTargetDate] = useState('2026-09-05');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isTimeframeModalOpen || !selectedProblem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fullTimeframeText = `${timeframe} (Est. finish: ${targetDate})`;
    await addToProject(selectedProblem.id, fullTimeframeText, notes);
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="timeframe-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <FolderPlus size={22} className="header-icon" />
            <h3>Add Problem to Project Pipeline</h3>
          </div>
          <button className="modal-close-btn" onClick={() => setIsTimeframeModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="timeframe-form">
          <div className="problem-summary-box">
            <h4>{selectedProblem.title}</h4>
            <p className="summary-location">📍 {selectedProblem.location}</p>
            <p className="summary-desc">{selectedProblem.description}</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Building2 size={16} /> Organization / Department
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={currentUser.name} 
              disabled 
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">
                <Clock size={16} /> Estimated Duration
              </label>
              <select 
                className="form-select"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="Custom timeframe">Custom timeframe</option>
              </select>
            </div>

            <div className="form-group half">
              <label className="form-label">
                <Calendar size={16} /> Target Completion Date
              </label>
              <input 
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Scope & Execution Notes (Optional)</label>
            <textarea 
              rows={3}
              className="form-textarea"
              placeholder="e.g., Assigned to Road Maintenance Team B. Equipment scheduled..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="timeframe-notice">
            <CheckCircle2 size={18} className="notice-icon" />
            <p>Submitting this timeframe will automatically set the problem status to <strong>ONGOING</strong> (blue badge) on the public board.</p>
          </div>

          <div className="modal-footer-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setIsTimeframeModalOpen(false)}
            >
              Cancel
            </button>

            <button 
              type="submit" 
              className="btn-primary-green"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Add & Set ONGOING'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
