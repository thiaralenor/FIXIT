import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';
import { 
  X, 
  MapPin, 
  Clock, 
  Building2, 
  Calendar, 
  ThumbsUp, 
  Send, 
  CheckCircle2, 
  Trash2, 
  Video, 
  FolderPlus,
  MessageSquare,
  History
} from 'lucide-react';

export default function ProblemDetailModal() {
  const { 
    detailProblem, 
    setDetailProblem, 
    currentUser, 
    upvoteProblem, 
    addComment, 
    markCompleted, 
    removeFromProject,
    setSelectedProblem,
    setIsTimeframeModalOpen
  } = useCivic();

  const [commentText, setCommentText] = useState('');
  const [completionNoteInput, setCompletionNoteInput] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  if (!detailProblem) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="status-badge pending">PENDING</span>;
      case 'ONGOING': return <span className="status-badge ongoing">ONGOING</span>;
      case 'COMPLETED': return <span className="status-badge completed">COMPLETED</span>;
      default: return <span className="status-badge pending">{status}</span>;
    }
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(detailProblem.id, commentText);
    setCommentText('');
  };

  const handleFinishProject = (e) => {
    e.preventDefault();
    markCompleted(detailProblem.id, completionNoteInput);
    setShowCompletionForm(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="detail-modal">
        <div className="modal-header">
          <div className="detail-header-left">
            {getStatusBadge(detailProblem.status)}
            <span className="category-pill">{detailProblem.category}</span>
          </div>
          <button className="modal-close-btn" onClick={() => setDetailProblem(null)}>
            <X size={20} />
          </button>
        </div>

        <div className="detail-modal-body">
          {/* Main Title & Reporter */}
          <div className="detail-title-section">
            <h2 className="detail-title">{detailProblem.title}</h2>
            <div className="reporter-meta">
              <div className="reporter-avatar">
                {detailProblem.reporter ? detailProblem.reporter.avatar : 'NS'}
              </div>
              <div className="reporter-info">
                <span className="reporter-name">
                  {detailProblem.reporter ? detailProblem.reporter.name : 'Nora Smith'}
                </span>
                <span className="report-time">• Reported {detailProblem.time}</span>
              </div>
            </div>
          </div>

          {/* Media Gallery */}
          {detailProblem.media && detailProblem.media.length > 0 && (
            <div className="detail-media-gallery">
              {detailProblem.media.map((item, index) => (
                <div key={index} className="detail-media-item">
                  {item.type === 'video' ? (
                    <video src={item.url} controls className="detail-video-player" />
                  ) : (
                    <img src={item.url} alt={`Report detail ${index}`} className="detail-image" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Location & Timeframe Info Card */}
          <div className="detail-info-card">
            <div className="info-row">
              <MapPin size={18} className="info-icon" />
              <div>
                <strong>Location:</strong> {detailProblem.location}
                {detailProblem.landmarkDetails && (
                  <p className="sub-detail">Landmark: {detailProblem.landmarkDetails}</p>
                )}
              </div>
            </div>

            {detailProblem.assignedOrg && (
              <div className="info-row highlight-org">
                <Building2 size={18} className="info-icon" />
                <div>
                  <strong>Assigned Organization:</strong> {detailProblem.assignedOrg}
                  {detailProblem.timeframe && (
                    <p className="sub-detail">⏱️ Timeframe: {detailProblem.timeframe}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="detail-description-box">
            <h3>Description</h3>
            <p>{detailProblem.description}</p>
          </div>

          {/* Organization Workflow Controls inside Detail View */}
          {currentUser.role === 'Organization' && (
            <div className="detail-org-controls">
              <h4>Organization Controls ({currentUser.name})</h4>
              <div className="org-control-buttons">
                {detailProblem.status === 'PENDING' && (
                  <button 
                    className="btn-primary-green"
                    onClick={() => {
                      setSelectedProblem(detailProblem);
                      setIsTimeframeModalOpen(true);
                      setDetailProblem(null);
                    }}
                  >
                    <FolderPlus size={16} /> Add to Project & Set Timeframe
                  </button>
                )}

                {detailProblem.status === 'ONGOING' && (
                  <>
                    <button 
                      className="btn-primary-green"
                      onClick={() => setShowCompletionForm(!showCompletionForm)}
                    >
                      <CheckCircle2 size={16} /> Mark Project Completed
                    </button>

                    <button 
                      className="btn-outline-danger"
                      onClick={() => removeFromProject(detailProblem.id)}
                    >
                      <Trash2 size={16} /> Remove from Project List
                    </button>
                  </>
                )}
              </div>

              {showCompletionForm && (
                <form onSubmit={handleFinishProject} className="completion-form-box">
                  <textarea 
                    placeholder="Enter execution summary / proof notes (e.g. Repairs finalized and verified)..."
                    value={completionNoteInput}
                    onChange={(e) => setCompletionNoteInput(e.target.value)}
                    rows={2}
                    required
                  />
                  <button type="submit" className="btn-primary-green sm">
                    Confirm Completion
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Progress Timeline */}
          <div className="detail-timeline-section">
            <h3><History size={18} /> Execution Timeline</h3>
            <div className="timeline-list">
              {detailProblem.timeline && detailProblem.timeline.map((item, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-date">{item.date}</span>
                    <p className="timeline-text">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upvotes & Comments */}
          <div className="detail-comments-section">
            <div className="comments-header">
              <h3><MessageSquare size={18} /> Community Discussion ({detailProblem.comments ? detailProblem.comments.length : 0})</h3>
              <button className="upvote-pill" onClick={() => upvoteProblem(detailProblem.id)}>
                <ThumbsUp size={15} />
                <span>Upvote ({detailProblem.upvotes || 0})</span>
              </button>
            </div>

            <div className="comments-list">
              {detailProblem.comments && detailProblem.comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">{c.name ? c.name[0] : 'U'}</div>
                  <div className="comment-body">
                    <div className="comment-header-row">
                      <span className="comment-author">{c.name}</span>
                      <span className="comment-time">{c.time}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="add-comment-form">
              <input 
                type="text" 
                placeholder="Add a comment to this report..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <button type="submit" className="comment-send-btn">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
