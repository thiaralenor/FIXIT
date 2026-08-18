import React, { useState } from 'react';
import { CivicProvider, useCivic } from './context/CivicContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import FilterBar from './components/FilterBar';
import ProblemCard from './components/ProblemCard';
import ReportModal from './components/ReportModal';
import OrganizationTimeframeModal from './components/OrganizationTimeframeModal';
import ProblemDetailModal from './components/ProblemDetailModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import { PlusCircle, ArrowRight } from 'lucide-react';

function DashboardContent() {
  const { 
    problems, 
    loading, 
    activeTab, 
    setIsReportModalOpen,
    setFilters,
    isSidebarCollapsed
  } = useCivic();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />


      {/* Main Content Area */}
      <main className="main-viewport">
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="content-container">
          {/* Top Metric Stats Summary Cards */}
          <MetricCards />

          {/* Search and Filters Toolbar */}
          <FilterBar />

          {/* Feed Title Bar */}
          <div className="section-title-bar">
            <h2 className="section-title">
              {activeTab === 'My Reports' ? 'My Reported Problems' : 
               activeTab === 'My Projects' ? 'My Organization Projects' : 'Recent Problems'}
            </h2>
            <button 
              className="view-all-link"
              onClick={() => setFilters(prev => ({ ...prev, category: 'All Categories', status: 'ALL', search: '' }))}
            >
              View all
            </button>
          </div>

          {/* Problems Grid Feed */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading community reports...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="empty-state">
              <h3>No problems found</h3>
              <p>Try adjusting your search or category filter criteria.</p>
              <button 
                className="btn-primary-green"
                onClick={() => setIsReportModalOpen(true)}
              >
                Report a Problem Now
              </button>
            </div>
          ) : (
            <div className="problems-feed-grid">
              {problems.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          )}

          {/* Bottom Sticky Banner CTA matching design */}
          <div className="report-cta-banner">
            <div className="cta-left">
              <div className="cta-icon-box">
                <PlusCircle size={28} color="#ffffff" fill="#16a34a" />
              </div>
              <div className="cta-text">
                <h3>See a problem in your community?</h3>
                <p>Report it now and help make a difference.</p>
              </div>
            </div>
            <button 
              className="cta-action-btn"
              onClick={() => setIsReportModalOpen(true)}
            >
              Report a Problem
            </button>
          </div>
        </div>
      </main>

      {/* Modals & Popups */}
      <ReportModal />
      <OrganizationTimeframeModal />
      <ProblemDetailModal />
      <AuthModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <CivicProvider>
      <DashboardContent />
    </CivicProvider>
  );
}
