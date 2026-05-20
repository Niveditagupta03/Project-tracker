'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import './page.css';
import { Plus, Search, Filter, Calendar, MoreVertical, Edit2, Trash2, Download, Hexagon, Bell, Moon, ChevronDown, LayoutDashboard, Folder, Clock, Users, BarChart2, Sparkles, FileText, AlertCircle, Settings, Gem, ChevronRight, Activity, CheckCircle2, TrendingUp, TrendingDown, Bot, AlertTriangle, PanelLeft } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableOwners, setAvailableOwners] = useState([]);
  const [filters, setFilters] = useState({ owner: '', status: '', startDate: '', endDate: '' });
  const [newPersonName, setNewPersonName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', type: '', owners: [], status: 'Not Started',
    startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: '',
    progress: 0, priority: 'Medium', health: 'On Track'
  });

  useEffect(() => {
    fetchOwners();
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
      console.error('Failed to fetch owners', error);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.owner) query.append('owner', filters.owner);
      if (filters.status) query.append('status', filters.status);
      if (filters.startDate) query.append('startDate', filters.startDate);
      if (filters.endDate) query.append('endDate', filters.endDate);

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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOwnerToggle = (ownerName) => {
    setFormData(prev => {
      const isSelected = prev.owners.includes(ownerName);
      if (isSelected) {
        return { ...prev, owners: prev.owners.filter(name => name !== ownerName) };
      } else {
        return { ...prev, owners: [...prev.owners, ownerName] };
      }
    });
  };

  const handleAddPerson = () => {
    const trimmed = newPersonName.trim();
    if (trimmed && !availableOwners.includes(trimmed)) {
      setAvailableOwners(prev => [...prev, trimmed].sort());
      setFormData(prev => ({ ...prev, owners: [...prev.owners, trimmed] }));
    } else if (trimmed && availableOwners.includes(trimmed)) {
      if (!formData.owners.includes(trimmed)) {
        setFormData(prev => ({ ...prev, owners: [...prev.owners, trimmed] }));
      }
    }
    setNewPersonName('');
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      title: '', description: '', type: '', owners: [], status: 'Not Started',
      startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: '',
      progress: 0, priority: 'Medium', health: 'On Track'
    });
    setNewPersonName('');
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingId(project.id);
    setFormData({
      title: project.title || '',
      description: project.description || '',
      type: project.type || '',
      owners: project.owner ? project.owner.split(', ') : [],
      status: project.status || 'Not Started',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      uatDate: project.uatDate ? project.uatDate.split('T')[0] : '',
      prodDate: project.prodDate ? project.prodDate.split('T')[0] : '',
      dependencyWith: project.dependencyWith || '',
      comments: project.comments || '',
      progress: project.progress || 0,
      priority: project.priority || 'Medium',
      health: project.health || 'On Track'
    });
    setShowModal(true);
    setActiveDropdown(null);
  };

  const toggleDropdown = (id) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchProjects();
          fetchOwners();
        }
      } catch (error) {
        console.error('Failed to delete project', error);
      }
    }
    setActiveDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        owner: formData.owners.join(', ')
      };
      
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          title: '', description: '', type: '', owners: [], status: 'Not Started',
          startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: ''
        });
        setNewPersonName('');
        fetchProjects();
        fetchOwners();
      }
    } catch (error) {
      console.error('Failed to save project', error);
    }
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
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <header className="top-nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '200px' }}>
          <div className="logo-icon">
            <Hexagon size={24} fill="currentColor" />
          </div>
          <span className="nav-title">Project Tracker</span>
          <span className="v2-badge">V2</span>
        </div>
        
        <div className="nav-center" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '1rem' }}>
          <button 
            className="icon-btn" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            style={{ marginRight: '1rem' }}
            title="Toggle Sidebar"
          >
            <PanelLeft size={20} color="#64748B" />
          </button>
          <div className="global-search" style={{ maxWidth: '400px', width: '100%' }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search projects, tasks, teams..." style={{ width: '100%' }} />
            <kbd className="kbd-shortcut">Ctrl K</kbd>
          </div>
        </div>
        
        <div className="nav-right">
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            New Project
          </button>
          
          <button className="icon-btn notification-btn">
            <Bell size={20} />
            <span className="notification-dot">6</span>
          </button>
          
          <div className="profile-section">
            <div className="avatar">
              <img src="https://ui-avatars.com/api/?name=Admin&background=E2E8F0&color=475569" alt="User" />
            </div>
            <div className="profile-info">
              <span className="profile-name">Admin</span>
              <span className="profile-role">Super Admin</span>
            </div>
            <ChevronDown size={14} className="chevron" />
          </div>
        </div>
      </header>

      <div className="content-wrapper" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside className="sidebar" style={{ display: isSidebarOpen ? 'flex' : 'none' }}>
          <nav className="sidebar-nav" style={{ marginTop: '1.5rem' }}>
          <a href="#" className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </a>
          <a href="#" className={`nav-item ${currentView === 'projects' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('projects'); }}>
            <Folder size={18} />
            <span>Projects</span>
            <ChevronDown size={14} className="nav-chevron" />
          </a>
          <a href="#" className="nav-item">
            <Clock size={18} />
            <span>Timeline</span>
          </a>
          <a href="#" className="nav-item">
            <Users size={18} />
            <span>Teams</span>
          </a>
          <a href="#" className="nav-item">
            <BarChart2 size={18} />
            <span>Reports</span>
          </a>
          <a href="#" className="nav-item">
            <Sparkles size={18} color="#6366F1" />
            <span>AI Insights</span>
            <ChevronRight size={14} className="nav-chevron" />
          </a>
          <a href="#" className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </a>
        </nav>

      </aside>

      <div className="main-wrapper">

        <div className="dashboard-content">
          {currentView === 'dashboard' ? (
            <div className="dashboard-grid">
              <div className="dashboard-main">
                {/* TOP METRIC TILES */}
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
        <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="filter-group search-filter" style={{ minWidth: '200px', flex: 1 }}>
            <Search size={16} className="icon" />
            <input type="text" placeholder="Search projects..." className="filter-input" style={{ width: '100%' }} />
          </div>
          
          <div className="filter-group">
            <select name="owner" value={filters.owner} onChange={handleFilterChange} className="filter-input" style={{ appearance: 'none', minWidth: '120px' }}>
              <option value="">All Owners</option>
              {availableOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
            <ChevronDown size={14} className="icon-right" />
          </div>
          
          <div className="filter-group">
            <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input" style={{ appearance: 'none', minWidth: '120px' }}>
              <option value="">All Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown size={14} className="icon-right" />
          </div>
          
          <div className="filter-group" style={{ minWidth: '200px' }}>
            <Calendar size={16} className="icon" />
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="filter-input" style={{ paddingRight: '0' }} />
            <span style={{ color: '#94A3B8' }}>-</span>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="filter-input" />
          </div>

          <div className="filter-group" style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: '0.5rem' }}>Sort:</span>
            <select className="filter-input" style={{ appearance: 'none', border: 'none', backgroundColor: 'transparent', paddingLeft: '0.5rem', fontWeight: '500' }}>
              <option>Start Date</option>
              <option>Project Name</option>
              <option>Status</option>
            </select>
            <ChevronDown size={14} className="icon-right" />
          </div>
          
          <button className="btn btn-secondary" onClick={exportToXLSX} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.5rem 1rem' }}>
            <Download size={16} style={{ marginRight: '6px' }} />
            Export
          </button>
        </div>

        <div className="filter-pills" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`pill-btn ${filters.status === '' ? 'pill-active' : ''}`} onClick={() => setFilters({...filters, status: ''})}>All</button>
            <button className={`pill-btn ${filters.status === 'Not Started' ? 'pill-active' : ''}`} onClick={() => setFilters({...filters, status: 'Not Started'})}>Not Started</button>
            <button className={`pill-btn ${filters.status === 'In Progress' ? 'pill-active' : ''}`} onClick={() => setFilters({...filters, status: 'In Progress'})}>In Progress</button>
            <button className={`pill-btn ${filters.status === 'UAT' ? 'pill-active' : ''}`} onClick={() => setFilters({...filters, status: 'UAT'})}>UAT</button>
            <button className={`pill-btn ${filters.status === 'Completed' ? 'pill-active' : ''}`} onClick={() => setFilters({...filters, status: 'Completed'})}>Completed</button>
            <button className={`pill-btn ${filters.status === 'Delayed' ? 'pill-active' : ''}`} onClick={() => setFilters({...filters, status: 'Delayed'})}>Delayed</button>
          </div>
          <button className="text-btn" style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }} onClick={() => setFilters({ owner: '', status: '', startDate: '', endDate: '' })}>
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
                <th style={{ width: '50px' }}>ACTIONS</th>
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
                  <td>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>{editingId ? "Edit Project" : "Add New Project"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Title *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleFormChange} />
                </div>
                <div className="form-group col-span-2">
                  <label>Owners</label>
                  <div className="checkbox-list">
                    {availableOwners.map(owner => (
                      <label key={owner} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={formData.owners.includes(owner)} 
                          onChange={() => handleOwnerToggle(owner)} 
                        />
                        {owner}
                      </label>
                    ))}
                  </div>
                  <div className="add-person-group">
                    <input 
                      type="text" 
                      placeholder="Add new person..." 
                      value={newPersonName} 
                      onChange={(e) => setNewPersonName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPerson())}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddPerson}>Add</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Project Type</label>
                  <select name="type" value={formData.type} onChange={handleFormChange}>
                    <option value="">Select Type</option>
                    <option value="BAU">BAU</option>
                    <option value="CR/New Requirement">CR/New Requirement</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>UAT Date</label>
                  <input type="date" name="uatDate" value={formData.uatDate} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Prod Date</label>
                  <input type="date" name="prodDate" value={formData.prodDate} onChange={handleFormChange} />
                </div>
                <div className="form-group col-span-2">
                  <label>Dependency With</label>
                  <input type="text" name="dependencyWith" value={formData.dependencyWith} onChange={handleFormChange} />
                </div>
                <div className="form-group col-span-2">
                  <label>Project Description</label>
                  <textarea name="description" rows="3" value={formData.description} onChange={handleFormChange}></textarea>
                </div>
                <div className="form-group col-span-2">
                  <label>Comments</label>
                  <textarea name="comments" rows="2" value={formData.comments} onChange={handleFormChange}></textarea>
                </div>
                <div className="form-group">
                  <label>Progress (%)</label>
                  <input type="number" min="0" max="100" name="progress" value={formData.progress} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleFormChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Health</label>
                  <select name="health" value={formData.health} onChange={handleFormChange}>
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
          ) : (
            <div className="projects-board-view">
              <div className="board-header glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0F172A', fontSize: '1.5rem' }}>Projects Board</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Manage and track all your ongoing projects</p>
                </div>
                <button className="btn btn-primary" onClick={openNewModal}>
                  <Plus size={16} style={{ marginRight: '6px' }} /> Create Project
                </button>
              </div>
              
              <div className="kanban-board" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', height: 'calc(100vh - 250px)' }}>
                {['Not Started', 'In Progress', 'Completed', 'Delayed'].map(status => (
                  <div key={status} className="kanban-column glass-panel" style={{ minWidth: '300px', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(248, 250, 252, 0.8)' }}>
                    <div className="kanban-col-header" style={{ padding: '1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`health-dot ${status === 'Completed' ? 'dot-success' : status === 'In Progress' ? 'dot-warning' : status === 'Delayed' ? 'dot-danger' : ''}`} style={{ background: status === 'Not Started' ? '#CBD5E1' : '' }}></span>
                        {status}
                      </h3>
                      <span style={{ background: '#E2E8F0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}>
                        {projects.filter(p => (status === 'Delayed' ? p.status === 'Delayed' : p.status === status)).length}
                      </span>
                    </div>
                    
                    <div className="kanban-col-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
                      {projects.filter(p => (status === 'Delayed' ? p.status === 'Delayed' : p.status === status)).map(project => (
                        <div key={project.id} className="kanban-card" style={{ background: 'white', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => router.push(`/project/${project.id}`)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span className={`priority-badge ${project.priority === 'High' ? 'priority-high' : project.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`} style={{ fontSize: '0.65rem' }}>
                              {project.priority || 'Medium'}
                            </span>
                            <button className="icon-btn" style={{ padding: '0.2rem' }} onClick={(e) => { e.stopPropagation(); openEditModal(project); }}>
                              <MoreVertical size={14} color="#94A3B8" />
                            </button>
                          </div>
                          
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '0.95rem' }}>{project.title}</h4>
                          <p style={{ margin: '0 0 1rem 0', color: '#64748B', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description || 'No description provided'}</p>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                              <Clock size={12} />
                              {formatTableDate(project.endDate)}
                            </div>
                            <div className="owner-avatar" style={{ width: '24px', height: '24px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}>
                              {project.owner ? project.owner.substring(0, 2).toUpperCase() : '?'}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {projects.filter(p => (status === 'Delayed' ? p.status === 'Delayed' : p.status === status)).length === 0 && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                          No projects
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>{editingId ? "Edit Project" : "Add New Project"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Title *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleFormChange} />
                </div>
                <div className="form-group col-span-2">
                  <label>Owners</label>
                  <div className="checkbox-list">
                    {availableOwners.map(owner => (
                      <label key={owner} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={formData.owners.includes(owner)} 
                          onChange={() => handleOwnerToggle(owner)} 
                        />
                        {owner}
                      </label>
                    ))}
                  </div>
                  <div className="add-person-group">
                    <input 
                      type="text" 
                      placeholder="Add new person..." 
                      value={newPersonName} 
                      onChange={(e) => setNewPersonName(e.target.value)} 
                    />
                    <button type="button" onClick={handleAddPerson}>Add</button>
                  </div>
                </div>
                
                <div className="form-group col-span-2">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} />
                </div>
                
                <div className="form-group">
                  <label>Type</label>
                  <input type="text" name="type" value={formData.type} onChange={handleFormChange} />
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="UAT">UAT</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Progress (%)</label>
                  <input type="number" min="0" max="100" name="progress" value={formData.progress} onChange={handleFormChange} />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleFormChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Health</label>
                  <select name="health" value={formData.health} onChange={handleFormChange}>
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Off Track">Off Track</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} />
                </div>

                <div className="form-group">
                  <label>Target End Date</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} />
                </div>

                <div className="form-group">
                  <label>UAT Date</label>
                  <input type="date" name="uatDate" value={formData.uatDate} onChange={handleFormChange} />
                </div>

                <div className="form-group">
                  <label>Prod Date</label>
                  <input type="date" name="prodDate" value={formData.prodDate} onChange={handleFormChange} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
