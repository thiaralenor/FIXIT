import React, { createContext, useContext, useState, useEffect } from 'react';

const CivicContext = createContext();

export const useCivic = () => useContext(CivicContext);

export const CivicProvider = ({ children }) => {
  // Current user state (Default Nora Smith citizen account)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('fixit_user');
    return saved ? JSON.parse(saved) : {
      id: 'usr-1',
      name: 'Nora Smith',
      role: 'Citizen',
      avatar: 'NS',
      email: 'nora@civicfix.org'
    };
  });

  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({ total: 128, pending: 32, ongoing: 18, completed: 78 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Home'); // Home, All Problems, My Reports, My Projects
  const [filters, setFilters] = useState({
    search: '',
    category: 'All Categories',
    status: 'ALL',
    sort: 'latest'
  });
  
  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTimeframeModalOpen, setIsTimeframeModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [detailProblem, setDetailProblem] = useState(null);
  const [toast, setToast] = useState(null);

  // Sidebar collapse state (persisted in sessionStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return sessionStorage.getItem('fixit_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      sessionStorage.setItem('fixit_sidebar_collapsed', String(next));
      return next;
    });
  };


  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Save current user in storage
  useEffect(() => {
    localStorage.setItem('fixit_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Fetch problems and stats from Express API
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'All Categories') params.append('category', filters.category);
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);
      
      if (activeTab === 'My Reports') {
        params.append('myReportsOnly', 'true');
        params.append('user', currentUser.name);
      } else if (activeTab === 'My Projects') {
        params.append('myProjectsOnly', 'true');
        params.append('user', currentUser.name);
      }

      const res = await fetch(`/api/problems?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProblems(data.problems || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [filters, activeTab, currentUser]);

  // Switch user profile/role
  const switchUser = (userObj) => {
    setCurrentUser(userObj);
    showToast(`Logged in as ${userObj.name} (${userObj.role})`);
  };

  // Add new report
  const addReport = async (reportData) => {
    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          reporter: {
            name: currentUser.name,
            role: currentUser.role,
            avatar: currentUser.avatar
          }
        })
      });
      if (res.ok) {
        showToast('Problem report submitted successfully!');
        setIsReportModalOpen(false);
        fetchProblems();
        return true;
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
      showToast('Failed to submit report', 'error');
    }
    return false;
  };

  // Toggle bookmark
  const toggleBookmark = async (id) => {
    try {
      const res = await fetch(`/api/problems/${id}/bookmark`, { method: 'POST' });
      if (res.ok) {
        setProblems(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err);
    }
  };

  // Upvote problem
  const upvoteProblem = async (id) => {
    try {
      const res = await fetch(`/api/problems/${id}/upvote`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProblems(prev => prev.map(p => p.id === id ? { ...p, upvotes: data.upvotes } : p));
        if (detailProblem && detailProblem.id === id) {
          setDetailProblem(prev => ({ ...prev, upvotes: data.upvotes }));
        }
      }
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  // Organization: Add to project & set timeframe (ONGOING)
  const addToProject = async (id, timeframe, notes) => {
    try {
      const res = await fetch(`/api/problems/${id}/add-to-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: currentUser.name,
          timeframe,
          notes
        })
      });
      if (res.ok) {
        showToast(`Added to ${currentUser.name} project list! Status updated to ONGOING.`);
        setIsTimeframeModalOpen(false);
        setSelectedProblem(null);
        fetchProblems();
      }
    } catch (err) {
      console.error('Add to project error:', err);
      showToast('Error adding to project', 'error');
    }
  };

  // Organization: Mark Completed
  const markCompleted = async (id, completionNotes) => {
    try {
      const res = await fetch(`/api/problems/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: currentUser.name,
          completionNotes
        })
      });
      if (res.ok) {
        showToast('Problem marked as COMPLETED!');
        fetchProblems();
        if (detailProblem && detailProblem.id === id) {
          const updated = await res.json();
          setDetailProblem(updated);
        }
      }
    } catch (err) {
      console.error('Mark complete error:', err);
    }
  };

  // Organization: Remove from project list
  const removeFromProject = async (id) => {
    try {
      const res = await fetch(`/api/problems/${id}/project`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Removed from organization project list.');
        fetchProblems();
        if (detailProblem && detailProblem.id === id) {
          const updated = await res.json();
          setDetailProblem(updated);
        }
      }
    } catch (err) {
      console.error('Remove from project error:', err);
    }
  };

  // Add Comment
  const addComment = async (id, text) => {
    try {
      const res = await fetch(`/api/problems/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser.name,
          text
        })
      });
      if (res.ok) {
        const comment = await res.json();
        setProblems(prev => prev.map(p => {
          if (p.id === id) {
            return { ...p, comments: [...(p.comments || []), comment] };
          }
          return p;
        }));
        if (detailProblem && detailProblem.id === id) {
          setDetailProblem(prev => ({
            ...prev,
            comments: [...(prev.comments || []), comment]
          }));
        }
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  return (
    <CivicContext.Provider value={{
      currentUser,
      switchUser,
      problems,
      stats,
      loading,
      activeTab,
      setActiveTab,
      filters,
      setFilters,
      isReportModalOpen,
      setIsReportModalOpen,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isTimeframeModalOpen,
      setIsTimeframeModalOpen,
      selectedProblem,
      setSelectedProblem,
      detailProblem,
      setDetailProblem,
      addReport,
      toggleBookmark,
      upvoteProblem,
      addToProject,
      markCompleted,
      removeFromProject,
      addComment,
      toast,
      isSidebarCollapsed,
      toggleSidebarCollapse
    }}>
      {children}
    </CivicContext.Provider>

  );
};
