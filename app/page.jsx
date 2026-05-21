'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import './page.css';
import { Plus, Search, Filter, Calendar, MoreVertical, Edit2, Trash2, Download, Hexagon, Bell, Moon, ChevronDown, LayoutDashboard, Folder, Clock, Users, BarChart2, Sparkles, FileText, AlertCircle, Settings, Gem, ChevronRight, Activity, CheckCircle2, TrendingUp, TrendingDown, Bot, AlertTriangle, PanelLeft } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableOwners, setAvailableOwners] = useState([]);
  const [filters, setFilters] = useState({ 
    owner: '', 
    status: '', 
    startDate: '', 
    endDate: '', 
    search: searchParams.get('search') || '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchOwners();

    const handleProjectUpdated = () => {
      fetchProjects();
      fetchOwners();
    };

    const handleGlobalSearch = (e) => {
      setFilters(prev => ({ ...prev, search: e.detail.search }));
    };

    window.addEventListener('project-updated', handleProjectUpdated);
    window.addEventListener('global-search', handleGlobalSearch);
    
    return () => {
      window.removeEventListener('project-updated', handleProjectUpdated);
      window.removeEventListener('global-search', handleGlobalSearch);
    };
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/owners');
      if (res.ok) {
        const data = await res.json();
        setAvailableOwners(data);
      }
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    }
  };

  const toggleDropdown = (id) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  useEffect(() => {
    const closeDropdowns = (e) => {
      if (!e.target.closest('.actions-cell')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchProjects();
        }
      } catch (error) {
        console.error('Failed to delete project', error);
      }
    }
    setActiveDropdown(null);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.owner) query.append('owner', filters.owner);
      if (filters.status) query.append('status', filters.status);
      if (filters.startDate) query.append('startDate', filters.startDate);
      if (filters.endDate) query.append('endDate', filters.endDate);
      if (filters.search) query.append('search', filters.search);

      const res = await fetch(`/api/projects?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const openNewModal = () => {
    window.dispatchEvent(new CustomEvent('open-project-modal'));
  };

  const openEditModal = (project) => {
    setEditingId(project.id);
    window.dispatchEvent(new CustomEvent('open-project-modal', { detail: { project } }));
  };



  const exportToXLSX = () => {
    if (projects.length === 0) return alert("No projects to download!");

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '';

    const data = projects.map(p => ({
      'Sr No': p.id,
      'Project Title': p.title,
      'Project Description': p.description,
      'Project Type': p.type,
      'Owner': p.owner,
      'Status': p.status,
      'Start Date': formatDate(p.startDate),
      'End Date': formatDate(p.endDate),
      'UAT Date': formatDate(p.uatDate),
      'Prod Date': formatDate(p.prodDate),
      'Dependency With': p.dependencyWith,
      'Comments': p.comments
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

    XLSX.writeFile(workbook, "Project_Tracker_Export.xlsx");
  };

  const formatTableDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'badge badge-success';
      case 'in progress': return 'badge badge-warning';
      case 'not started': return 'badge badge-neutral';
      case 'blocked': return 'badge badge-danger';
      default: return 'badge badge-neutral';
    }
  };

  const totalProjectsCount = projects.length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
  const notStartedCount = projects.filter(p => p.status === 'Not Started').length;
  const delayedCount = projects.filter(p => p.status === 'Delayed').length;

  const completedPct = totalProjectsCount ? (completedCount / totalProjectsCount * 100) : 0;
  const inProgressPct = totalProjectsCount ? (inProgressCount / totalProjectsCount * 100) : 0;
  const notStartedPct = totalProjectsCount ? (notStartedCount / totalProjectsCount * 100) : 0;
  const delayedPct = totalProjectsCount ? (delayedCount / totalProjectsCount * 100) : 0;

  const completedOffset = 25;
  const inProgressOffset = 25 - completedPct;
  const notStartedOffset = 25 - completedPct - inProgressPct;
  const delayedOffset = 25 - completedPct - inProgressPct - notStartedPct;

  return (
    <div className="dashboard-content">
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="metric-tiles">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Total Projects</span>
                    <div className="metric-icon-bg purple-bg">
                      <Folder size={18} color="#6366F1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="metric-value">{projects.length}</div>
                  <div className="metric-trend trend-up">
                    <TrendingUp size={12} />
                    <span>12% from last month</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">In Progress</span>
                    <div className="metric-icon-bg orange-bg">
                      <Activity size={18} color="#F59E0B" />
                    </div>
                  </div>
                  <div className="metric-value">{projects.filter(p => p.status === 'In Progress').length}</div>
                  <div className="metric-trend trend-up">
                    <TrendingUp size={12} />
                    <span>8% from last month</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Completed</span>
                    <div className="metric-icon-bg green-bg">
                      <CheckCircle2 size={18} color="#10B981" fill="currentColor" stroke="white" />
                    </div>
                  </div>
                  <div className="metric-value">{projects.filter(p => p.status === 'Completed').length}</div>
                  <div className="metric-trend trend-up">
                    <TrendingUp size={12} />
                    <span>20% from last month</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Delayed</span>
                    <div className="metric-icon-bg red-bg">
                      <Clock size={18} color="#EF4444" fill="currentColor" stroke="white" />
                    </div>
                  </div>
                  <div className="metric-value">{projects.filter(p => p.status === 'Delayed').length || 3}</div>
                  <div className="metric-trend trend-down">
                    <TrendingDown size={12} />
                    <span>5% from last month</span>
                  </div>
                </div>
              </div>


      {/* FILTER BAR AND TABLE */}
      <div className="glass-panel dashboard-header" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="filter-bar" style={{ flexWrap: 'nowrap', gap: '0.5rem', alignItems: 'flex-end', overflowX: 'auto', paddingBottom: '4px' }}>
          <div className="filter-group-container" style={{ flex: '1 1 120px', minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748B', marginLeft: '0.25rem' }}>Search</label>
            <div className="filter-group search-filter">
              <Search size={14} className="icon" style={{ left: '8px' }} />
              <input 
                type="text" 
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search..." 
                className="filter-input" 
                style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.4rem 0.4rem 1.8rem' }} 
              />
            </div>
          </div>
          
          <div className="filter-group-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748B', marginLeft: '0.25rem' }}>Owner</label>
            <div className="filter-group">
              <select name="owner" value={filters.owner} onChange={handleFilterChange} className="filter-input" style={{ appearance: 'none', minWidth: '90px', fontSize: '0.8rem', padding: '0.4rem 1.6rem 0.4rem 0.6rem' }}>
                <option value="">All Owners</option>
                {availableOwners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
              <ChevronDown size={12} className="icon-right" style={{ right: '6px' }} />
            </div>
          </div>
          
          <div className="filter-group-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748B', marginLeft: '0.25rem' }}>Status</label>
            <div className="filter-group">
              <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input" style={{ appearance: 'none', minWidth: '110px', fontSize: '0.8rem', padding: '0.4rem 1.6rem 0.4rem 0.6rem' }}>
                <option value="">All Status</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown size={12} className="icon-right" style={{ right: '6px' }} />
            </div>
          </div>
          
          <div className="filter-group-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748B', marginLeft: '0.25rem' }}>Date Range</label>
            <div className="filter-group" style={{ gap: '0.2rem' }}>
              <Calendar size={14} className="icon" style={{ left: '8px' }} />
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="filter-input" style={{ padding: '0.4rem 0.2rem 0.4rem 1.8rem', fontSize: '0.75rem', width: '105px' }} />
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>-</span>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="filter-input" style={{ padding: '0.4rem 0.2rem 0.4rem 0.4rem', fontSize: '0.75rem', width: '105px' }} />
            </div>
          </div>

          <button className="btn btn-secondary" onClick={exportToXLSX} style={{ marginLeft: 'auto', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem', height: '31px', fontSize: '0.8rem', flexShrink: 0 }}>
            <Download size={14} style={{ marginRight: '4px' }} />
            Export
          </button>
          
          <button className="text-btn" style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500', height: '31px', padding: '0 0.5rem', flexShrink: 0 }} onClick={() => setFilters({ owner: '', status: '', startDate: '', endDate: '', search: '' })}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">No projects found. Create one to get started!</div>
        ) : (
          <table className="projects-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>S.NO</th>
                <th>PROJECT</th>
                <th>OWNER</th>
                <th>STATUS</th>
                <th>PROGRESS</th>
                <th>PRIORITY</th>
                <th>START DATE</th>
                <th>END DATE</th>
                <th>UAT DATE</th>
                <th>PROD DATE</th>
                <th>HEALTH</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr 
                  key={project.id} 
                  onClick={() => router.push(`/project/${project.id}`)}
                  style={{ cursor: 'pointer' }}
                  className="project-row"
                >
                  <td className="text-muted" style={{ fontWeight: '500' }}>{index + 1}</td>
                  <td>
                    <div className="font-medium text-dark">{project.title}</div>
                    <div className="text-xs text-muted">{project.type}</div>
                  </td>
                  <td>
                    <div className="owner-text">{project.owner || '-'}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={getStatusBadgeClass(project.status)}>
                      {project.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <span className="progress-text">{project.progress || 0}%</span>
                      <div className="progress-bar-bg">
                        <div 
                          className={`progress-bar-fill ${project.status === 'Completed' ? 'bg-success' : 'bg-warning'}`} 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`priority-badge ${project.priority === 'High' ? 'priority-high' : project.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                      {project.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="date-cell">{formatTableDate(project.startDate)}</td>
                  <td className="date-cell">{formatTableDate(project.endDate)}</td>
                  <td className="date-cell">{formatTableDate(project.uatDate)}</td>
                  <td className="date-cell">{formatTableDate(project.prodDate)}</td>
                  <td>
                    <div className="health-cell">
                      <span className={`health-dot ${project.health === 'On Track' ? 'dot-success' : project.health === 'At Risk' ? 'dot-warning' : 'dot-danger'}`}></span>
                      <span className={`health-text ${project.health === 'On Track' ? 'text-success' : project.health === 'At Risk' ? 'text-warning' : 'text-danger'}`}>
                        {project.health || 'On Track'}
                      </span>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); toggleDropdown(project.id); }}>
                      <MoreVertical size={16} />
                    </button>
                    {activeDropdown === project.id && (
                      <div className="action-dropdown glass-panel">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(project); }}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-danger">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


            </div> {/* End of dashboard-main */}

            <div className="dashboard-right">
              <div className="ai-assistant-card">
                <div className="ai-header">
                  <Bot size={16} color="#6366F1" />
                  <span>AI Project Assistant</span>
                  <Sparkles size={12} color="#6366F1" style={{ marginLeft: '4px' }} />
                </div>
                
                <div className="ai-warning-box">
                  <div className="warning-title">
                    <AlertTriangle size={14} color="#F59E0B" />
                    <span>UAT may be delayed by</span>
                  </div>
                  <div className="warning-days">3 days</div>
                  <div className="warning-impact">Impact: 2 dependent projects</div>
                  <button className="btn btn-secondary ai-btn">View Insight</button>
                </div>
                
                <div className="ai-dots">
                  <span className="dot active"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>

              <div className="deadlines-widget">
                <div className="widget-header">
                  <h3>Upcoming Deadlines</h3>
                  <a href="#">View all</a>
                </div>
                
                <div className="deadline-item">
                  <div className="deadline-info">
                    <span className="deadline-name">Client Portal - UAT</span>
                    <span className="deadline-date">20 May 2026</span>
                  </div>
                  <span className="deadline-badge orange-badge">In 3 days</span>
                </div>
                
                <div className="deadline-item">
                  <div className="deadline-info">
                    <span className="deadline-name">HRMS - Production</span>
                    <span className="deadline-date">29 May 2026</span>
                  </div>
                  <span className="deadline-badge red-badge">In 12 days</span>
                </div>
                
                <div className="deadline-item">
                  <div className="deadline-info">
                    <span className="deadline-name">Data Platform - End Date</span>
                    <span className="deadline-date">19 Jun 2026</span>
                  </div>
                  <span className="deadline-badge purple-badge">In 33 days</span>
                </div>
              </div>

              {/* PROJECT PROGRESS OVERVIEW WIDGET */}
              <div className="progress-overview-widget glass-panel">
                <div className="widget-header">
                  <h3>Project Progress Overview</h3>
                </div>
                
                <div className="progress-overview-content">
                  <div className="donut-chart-container">
                    <svg viewBox="0 0 36 36" className="donut-chart">
                      <circle className="donut-ring" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#E2E8F0" strokeWidth="4"></circle>
                      
                      {completedPct > 0 && (
                        <circle className="donut-segment segment-completed" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#10B981" strokeWidth="4"
                          strokeDasharray={`${completedPct} ${100 - completedPct}`} strokeDashoffset={completedOffset}></circle>
                      )}
                      
                      {inProgressPct > 0 && (
                        <circle className="donut-segment segment-inprogress" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#FBBF24" strokeWidth="4"
                          strokeDasharray={`${inProgressPct} ${100 - inProgressPct}`} strokeDashoffset={inProgressOffset}></circle>
                      )}
                      
                      {notStartedPct > 0 && (
                        <circle className="donut-segment segment-notstarted" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#CBD5E1" strokeWidth="4"
                          strokeDasharray={`${notStartedPct} ${100 - notStartedPct}`} strokeDashoffset={notStartedOffset}></circle>
                      )}
                      
                      {delayedPct > 0 && (
                        <circle className="donut-segment segment-delayed" cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#F87171" strokeWidth="4"
                          strokeDasharray={`${delayedPct} ${100 - delayedPct}`} strokeDashoffset={delayedOffset}></circle>
                      )}
                    </svg>
                    <div className="donut-center-text">
                      <span className="donut-total">{totalProjectsCount}</span>
                      <span className="donut-label">Total Projects</span>
                    </div>
                  </div>

                  <div className="progress-legend">
                    <div className="legend-item">
                      <div className="legend-label">
                        <span className="legend-dot" style={{ background: '#10B981' }}></span>
                        Completed
                      </div>
                      <div className="legend-value">{completedCount} <span className="legend-pct">({completedPct.toFixed(1)}%)</span></div>
                    </div>
                    
                    <div className="legend-item">
                      <div className="legend-label">
                        <span className="legend-dot" style={{ background: '#FBBF24' }}></span>
                        In Progress
                      </div>
                      <div className="legend-value">{inProgressCount} <span className="legend-pct">({inProgressPct.toFixed(1)}%)</span></div>
                    </div>
                    
                    <div className="legend-item">
                      <div className="legend-label">
                        <span className="legend-dot" style={{ background: '#CBD5E1' }}></span>
                        Not Started
                      </div>
                      <div className="legend-value">{notStartedCount} <span className="legend-pct">({notStartedPct.toFixed(1)}%)</span></div>
                    </div>
                    
                    <div className="legend-item">
                      <div className="legend-label">
                        <span className="legend-dot" style={{ background: '#F87171' }}></span>
                        Delayed
                      </div>
                      <div className="legend-value">{delayedCount} <span className="legend-pct">({delayedPct.toFixed(1)}%)</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
  );
}
