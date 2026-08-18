import React from 'react';
import { useCivic } from '../context/CivicContext';
import { 
  MapPin, 
  Clock, 
  Bookmark, 
  ChevronRight, 
  FolderPlus, 
  CheckCircle2, 
  Trash2, 
  Video, 
  ThumbsUp, 
  MessageSquare,
  Building2,
  Calendar
} from 'lucide-react';

export default function ProblemCard({ problem }) {
  const { 
    currentUser, 
    toggleBookmark, 
    upvoteProblem, 
    setSelectedProblem, 
    setIsTimeframeModalOpen, 
    setDetailProblem,
    markCompleted,
    removeFromProject
  } = useCivic();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="status-badge pending">PENDING</span>;
      case 'ONGOING':
        return <span className="status-badge ongoing">ONGOING</span>;
      case 'COMPLETED':
        return <span className="status-badge completed">COMPLETED</span>;
      default:
        return <span className="status-badge pending">{status}</span>;
    }
  };

  const primaryMedia = problem.media && problem.media.length > 0 ? problem.media[0] : null;
  const isVideo = primaryMedia && primaryMedia.type === 'video';

  return (
    <div className="problem-card">
      {/* Media Image or Video Thumbnail */}
      <div className="card-media-wrapper" onClick={() => setDetailProblem(problem)}>
        {primaryMedia ? (
          isVideo ? (
            <div className="video-thumbnail-container">
              <video src={primaryMedia.url} className="card-media" preload="metadata" />
              <div className="video-play-overlay">
                <Video size={24} color="#ffffff" />
              </div>
            </div>
          ) : (
            <img src={primaryMedia.url} alt={problem.title} className="card-media" />
          )
        ) : (
          <div className="media-placeholder">
            <MapPin size={32} color="#94a3b8" />
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="card-content">
        <div className="card-top-row">
          {getStatusBadge(problem.status)}
          
          <button 
            className={`bookmark-btn ${problem.bookmarked ? 'active' : ''}`}
            onClick={() => toggleBookmark(problem.id)}
            title={problem.bookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}
          >
            <Bookmark size={18} fill={problem.bookmarked ? '#16a34a' : 'none'} color={problem.bookmarked ? '#16a34a' : '#64748b'} />
          </button>
        </div>

        <h3 className="card-title" onClick={() => setDetailProblem(problem)}>
          {problem.title}
        </h3>

        <p className="card-description">
          {problem.description}
        </p>

        {/* Location & Time Metadata */}
        <div className="card-meta-row">
          <div className="meta-item">
            <MapPin size={15} className="meta-icon" />
            <span>{problem.location}</span>
          </div>

          <div className="meta-item">
            <Clock size={15} className="meta-icon" />
            <span>{problem.time}</span>
          </div>
        </div>

        {/* Organization Project Execution Badge (If assigned) */}
        {problem.assignedOrg && (
          <div className="org-assignment-badge">
            <Building2 size={14} className="org-icon" />
            <span>{problem.assignedOrg}</span>
            {problem.timeframe && (
              <span className="timeframe-tag">
                <Calendar size={12} /> {problem.timeframe}
              </span>
            )}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="card-bottom-actions">
          <div className="social-stats">
            <button className="stat-btn" onClick={() => upvoteProblem(problem.id)}>
              <ThumbsUp size={15} />
              <span>{problem.upvotes || 0}</span>
            </button>

            <button className="stat-btn" onClick={() => setDetailProblem(problem)}>
              <MessageSquare size={15} />
              <span>{problem.comments ? problem.comments.length : 0}</span>
            </button>
          </div>

          {/* Organization Workflow Buttons */}
          {currentUser.role === 'Organization' && (
            <div className="org-card-actions">
              {problem.status === 'PENDING' && (
                <button 
                  className="add-to-project-btn"
                  onClick={() => {
                    setSelectedProblem(problem);
                    setIsTimeframeModalOpen(true);
                  }}
                  title="Add this problem to your organization project pipeline & set timeframe"
                >
                  <FolderPlus size={15} />
                  <span>Add to Project</span>
                </button>
              )}

              {problem.status === 'ONGOING' && (
                <>
                  <button 
                    className="mark-complete-btn"
                    onClick={() => markCompleted(problem.id, 'Execution completed by ' + currentUser.name)}
                    title="Mark project as COMPLETED"
                  >
                    <CheckCircle2 size={15} />
                    <span>Complete</span>
                  </button>

                  <button 
                    className="remove-project-btn"
                    onClick={() => removeFromProject(problem.id)}
                    title="Remove from project list"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Navigation Arrow */}
          <button 
            className="arrow-nav-btn" 
            onClick={() => setDetailProblem(problem)}
            title="View full report detail & timeline"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
