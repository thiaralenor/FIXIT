import React from 'react';
import { useCivic } from '../context/CivicContext';
import { Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';

export default function FilterBar() {
  const { filters, setFilters } = useCivic();

  const categories = [
    'All Categories',
    'Roads & Potholes',
    'Water & Sanitation',
    'Waste Management',
    'Street Lighting',
    'Public Infrastructure',
    'Traffic & Safety'
  ];

  return (
    <div className="filter-bar">
      {/* Search Input */}
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input 
          type="text"
          placeholder="Search problems..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
        {filters.search && (
          <button 
            className="clear-search-btn"
            onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="filter-controls">
        {/* Category Dropdown */}
        <div className="select-wrapper">
          <select 
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown size={16} className="select-chevron" />
        </div>

        {/* Sort Dropdown */}
        <div className="select-wrapper">
          <select 
            value={filters.sort}
            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="most_upvoted">Most Upvoted</option>
          </select>
          <ChevronDown size={16} className="select-chevron" />
        </div>

        {/* Filter Toggle Button */}
        <button 
          className="filter-toggle-btn"
          title="Filter Options"
          onClick={() => {
            // Toggle resetting filters
            if (filters.category !== 'All Categories' || filters.status !== 'ALL') {
              setFilters(prev => ({ ...prev, category: 'All Categories', status: 'ALL', search: '' }));
            }
          }}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
