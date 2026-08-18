import React from 'react';
import { useCivic } from '../context/CivicContext';
import { Layers, Clock, Activity, CheckCircle2 } from 'lucide-react';

export default function MetricCards() {
  const { stats, setFilters, filters } = useCivic();

  const metrics = [
    {
      id: 'ALL',
      title: 'Total Problems',
      value: stats.total,
      icon: Layers,
      color: 'green',
      bgColor: '#e8f5e9',
      iconColor: '#16a34a'
    },
    {
      id: 'PENDING',
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'amber',
      bgColor: '#fef3c7',
      iconColor: '#d97706'
    },
    {
      id: 'ONGOING',
      title: 'Ongoing',
      value: stats.ongoing,
      icon: Activity,
      color: 'blue',
      bgColor: '#e0f2fe',
      iconColor: '#0284c7'
    },
    {
      id: 'COMPLETED',
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'green',
      bgColor: '#dcfce7',
      iconColor: '#16a34a'
    }
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((m) => {
        const Icon = m.icon;
        const isActive = filters.status === m.id;
        return (
          <div 
            key={m.id} 
            className={`metric-card ${m.color} ${isActive ? 'selected' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, status: m.id }))}
          >
            <div className="metric-header">
              <div className="metric-icon-box" style={{ backgroundColor: m.bgColor }}>
                <Icon size={20} color={m.iconColor} />
              </div>
              <span className="metric-value">{m.value}</span>
            </div>
            <div className="metric-body">
              <span className="metric-title">{m.title}</span>
              <button 
                className="metric-view-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters(prev => ({ ...prev, status: m.id }));
                }}
              >
                View all
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
