'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import '../app/page.css';
import { Plus, Search, Calendar, MoreVertical, Edit2, Trash2, Download, ChevronDown, Folder, Clock, Activity, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
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
  const [currentUser, setCurrentUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('project_tracker_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchAllProjects();
    fetchOwners();
    fetchActivities();

    const handleProjectUpdated = () => {
      fetchProjects();
      fetchAllProjects();
      fetchOwners();
      fetchActivities();
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
        const res = await fetch(`/api/projects/${id}`, { 
          method: 'DELETE',
          headers: {
            'x-user-name': currentUser?.name || 'Someone',
            'x-user-role': currentUser?.role || 'user'
          }
        });
        if (res.ok) {
          fetchProjects();
          window.dispatchEvent(new Event('project-updated'));
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

  const fetchAllProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch all projects', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatActivityTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
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

  const totalProjectsCount = allProjects.length;
  const completedCount = allProjects.filter(p => p.status === 'Completed').length;
  const inProgressCount = allProjects.filter(p => p.status === 'In Progress').length;
  const notStartedCount = allProjects.filter(p => p.status === 'Not Started').length;
  const delayedCount = allProjects.filter(p => p.status === 'Delayed').length;

  const completedPct = totalProjectsCount ? (completedCount / totalProjectsCount * 100) : 0;
  const inProgressPct = totalProjectsCount ? (inProgressCount / totalProjectsCount * 100) : 0;
  const notStartedPct = totalProjectsCount ? (notStartedCount / totalProjectsCount * 100) : 0;
  const delayedPct = totalProjectsCount ? (delayedCount / totalProjectsCount * 100) : 0;

  const completedOffset = 25;
  const inProgressOffset = 25 - completedPct;
  const notStartedOffset = 25 - completedPct - inProgressPct;
  const delayedOffset = 25 - completedPct - inProgressPct - notStartedPct;

  // Month-over-month trend calculation
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const projectsThisMonth = allProjects.filter(p => p.createdAt && new Date(p.createdAt) >= thisMonthStart);
  const projectsLastMonth = allProjects.filter(p => p.createdAt && new Date(p.createdAt) >= lastMonthStart && new Date(p.createdAt) <= lastMonthEnd);

  const calcTrend = (thisMonthArr, lastMonthArr, statusFilter) => {
    const thisCnt = statusFilter ? thisMonthArr.filter(p => p.status === statusFilter).length : thisMonthArr.length;
    const lastCnt = statusFilter ? lastMonthArr.filter(p => p.status === statusFilter).length : lastMonthArr.length;
    const diff = thisCnt - lastCnt;
    return { diff, isUp: diff >= 0, thisCnt, lastCnt };
  };

  const totalTrend = calcTrend(projectsThisMonth, projectsLastMonth, null);
  const inProgressTrend = calcTrend(projectsThisMonth, projectsLastMonth, 'In Progress');
  const completedTrend = calcTrend(projectsThisMonth, projectsLastMonth, 'Completed');
  const delayedTrend = calcTrend(projectsThisMonth, projectsLastMonth, 'Delayed');

  const renderTrend = (trend, invertPositive = false) => {
    const { diff, isUp, lastCnt } = trend;
    const isGood = invertPositive ? !isUp : isUp;
    const absDiff = Math.abs(diff);
    if (lastCnt === 0 && diff === 0) {
      return <div className="metric-trend" style={{ color: '#94A3B8' }}><span>No data last month</span></div>;
    }
    const pct = lastCnt === 0 ? (diff > 0 ? 100 : 0) : Math.round((absDiff / lastCnt) * 100);
    const label = diff === 0 ? 'No change vs last month' : `${pct}% ${isUp ? 'up' : 'down'} from last month`;
    return (
      <div className={`metric-trend ${isGood ? 'trend-up' : 'trend-down'}`}>
        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{label}</span>
      </div>
    );
  };

  // Get upcoming deadlines dynamically based on projects
  const upcomingDeadlines = [];
  const todayVal = new Date();
  todayVal.setHours(0, 0, 0, 0);

  allProjects.forEach(project => {
    if (project.status === 'Completed') return;

    if (project.endDate) {
      upcomingDeadlines.push({
        projectName: project.title,
        milestone: 'End Date',
        date: new Date(project.endDate),
        projectId: project.id
      });
    }
    if (project.uatDate) {
      upcomingDeadlines.push({
        projectName: project.title,
        milestone: 'UAT',
        date: new Date(project.uatDate),
        projectId: project.id
      });
    }
    if (project.prodDate) {
      upcomingDeadlines.push({
        projectName: project.title,
        milestone: 'Production',
        date: new Date(project.prodDate),
        projectId: project.id
      });
    }
  });

  // Sort by date (ascending)
  upcomingDeadlines.sort((a, b) => a.date - b.date);

  const displayDeadlines = upcomingDeadlines.slice(0, 3);

  const getDeadlineBadge = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - todayVal.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        text: `${absDays}d overdue`,
        className: 'red-badge'
      };
    } else if (diffDays === 0) {
      return {
        text: 'Today',
        className: 'red-badge'
      };
    } else if (diffDays === 1) {
      return {
        text: 'Tomorrow',
        className: 'orange-badge'
      };
    } else if (diffDays <= 7) {
      return {
        text: `In ${diffDays}d`,
        className: 'orange-badge'
      };
    } else {
      return {
        text: `In ${diffDays}d`,
        className: 'purple-badge'
      };
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="metric-tiles">
            <div className={`metric-card ${!filters.status ? 'active' : ''}`} onClick={() => setFilters(prev => ({ ...prev, status: '' }))}>
              <div className="metric-header">
                <span className="metric-title">Total Projects</span>
                <div className="metric-icon-bg purple-bg">
                  <Folder size={18} color="#6366F1" fill="currentColor" />
                </div>
              </div>
              <div className="metric-value">{allProjects.length}</div>
              {renderTrend(totalTrend)}
            </div>

            <div className={`metric-card ${filters.status === 'In Progress' ? 'active' : ''}`} onClick={() => setFilters(prev => ({ ...prev, status: 'In Progress' }))}>
              <div className="metric-header">
                <span className="metric-title">In Progress</span>
                <div className="metric-icon-bg orange-bg">
                  <Activity size={18} color="#F59E0B" />
                </div>
              </div>
              <div className="metric-value">{allProjects.filter(p => p.status === 'In Progress').length}</div>
              {renderTrend(inProgressTrend)}
            </div>

            <div className={`metric-card ${filters.status === 'Completed' ? 'active' : ''}`} onClick={() => setFilters(prev => ({ ...prev, status: 'Completed' }))}>
              <div className="metric-header">
                <span className="metric-title">Completed</span>
                <div className="metric-icon-bg green-bg">
                  <CheckCircle2 size={18} color="#10B981" fill="currentColor" stroke="white" />
                </div>
              </div>
              <div className="metric-value">{allProjects.filter(p => p.status === 'Completed').length}</div>
              {renderTrend(completedTrend)}
            </div>

            <div className={`metric-card ${filters.status === 'Delayed' ? 'active' : ''}`} onClick={() => setFilters(prev => ({ ...prev, status: 'Delayed' }))}>
              <div className="metric-header">
                <span className="metric-title">Delayed</span>
                <div className="metric-icon-bg red-bg">
                  <Clock size={18} color="#EF4444" fill="currentColor" stroke="white" />
                </div>
              </div>
              <div className="metric-value">{allProjects.filter(p => p.status === 'Delayed').length}</div>
              {renderTrend(delayedTrend, true)}
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
                  <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input" style={{ appearance: 'none', minWidth: '90px', fontSize: '0.8rem', padding: '0.4rem 1.6rem 0.4rem 0.6rem' }}>
                    <option value="">All</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
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
                    {currentUser && <th style={{ width: '40px' }}></th>}
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
                          <span className={`health-dot ${(project.health || 'On Track') === 'On Track' ? 'dot-success' : project.health === 'At Risk' ? 'dot-warning' : 'dot-danger'}`}></span>
                          <span className={`health-text ${(project.health || 'On Track') === 'On Track' ? 'text-success' : project.health === 'At Risk' ? 'text-warning' : 'text-danger'}`}>
                            {project.health || 'On Track'}
                          </span>
                        </div>
                      </td>
                      {currentUser && (
                        <td className="actions-cell">
                          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); toggleDropdown(project.id); }}>
                            <MoreVertical size={16} />
                          </button>
                          {activeDropdown === project.id && (
                            <div className="action-dropdown glass-panel">
                              <button onClick={(e) => { e.stopPropagation(); openEditModal(project); }}>
                                <Edit2 size={14} /> Edit
                              </button>
                              {currentUser.role === 'admin' && (
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-danger">
                                  <Trash2 size={14} /> Delete
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard-right">
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

          <div className="deadlines-widget">
            <div className="widget-header">
              <h3>Upcoming Deadlines</h3>
              <a href="#" onClick={(e) => { e.preventDefault(); router.push('/projects'); }}>View all</a>
            </div>
            
            {displayDeadlines.length > 0 ? (
              displayDeadlines.map((item, idx) => {
                const badgeInfo = getDeadlineBadge(item.date);
                return (
                  <div 
                    key={idx} 
                    className="deadline-item" 
                    onClick={() => router.push(`/project/${item.projectId}`)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="deadline-info">
                      <span className="deadline-name">{item.projectName} - {item.milestone}</span>
                      <span className="deadline-date">{formatTableDate(item.date)}</span>
                    </div>
                    <span className={`deadline-badge ${badgeInfo.className}`}>{badgeInfo.text}</span>
                  </div>
                );
              })
            ) : (
              <div className="kanban-empty-state" style={{ padding: '1rem 0' }}>
                No upcoming deadlines
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY WIDGET */}
          <div className="recent-activity-widget glass-panel">
            <div className="widget-header">
              <h3>Recent Activity</h3>
            </div>
            
            <div className="activity-list">
              {activitiesLoading ? (
                <div className="activity-loading">Loading activities...</div>
              ) : activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="activity-item">
                    <div className="activity-user-avatar">
                      {act.userName ? act.userName.substring(0, 2).toUpperCase() : '?'}
                    </div>
                    <div className="activity-details-box">
                      <p className="activity-text">
                        <span className="activity-user-name">{act.userName}</span>{' '}
                        {act.details}
                      </p>
                      <span className="activity-time">{formatActivityTime(act.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="kanban-empty-state" style={{ padding: '1rem 0' }}>
                  No recent activities
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
