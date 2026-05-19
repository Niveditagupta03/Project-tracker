'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './page.css';
import { Plus, Search, Filter, Calendar, MoreVertical, Edit2, Trash2, Download, Hexagon, Bell, Moon, ChevronDown } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableOwners, setAvailableOwners] = useState([]);
  const [filters, setFilters] = useState({ owner: '', status: '', startDate: '', endDate: '' });
  const [newPersonName, setNewPersonName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', type: '', owners: [], status: 'Not Started',
    startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: ''
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
      startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: ''
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
      comments: project.comments || ''
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

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'badge badge-success';
      case 'in progress': return 'badge badge-warning';
      case 'not started': return 'badge badge-neutral';
      case 'blocked': return 'badge badge-danger';
      default: return 'badge badge-neutral';
    }
  };

  return (
    <div className="dashboard-layout">
      <header className="top-nav-bar">
        <div className="nav-left">
          <div className="logo-icon">
            <Hexagon size={24} fill="currentColor" />
          </div>
          <span className="nav-title">Project Tracker</span>
          <span className="v2-badge">V2</span>
        </div>
        
        <div className="nav-center">
          <div className="global-search">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search projects, tasks, teams..." />
            <kbd className="kbd-shortcut">⌘K</kbd>
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
          
          <button className="icon-btn">
            <Moon size={20} />
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

      <div className="dashboard-content">
        <div className="glass-panel dashboard-header">
        <div className="filter-bar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>Filter by Owner</span>
            <div className="filter-group">
              <Filter size={18} className="icon" />
              <select 
                name="owner" 
                value={filters.owner} 
                onChange={handleFilterChange} 
                className="filter-input"
                style={{ appearance: 'none', minWidth: '150px' }}
              >
                <option value="">All Owners</option>
                {availableOwners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>Filter by Status</span>
            <div className="filter-group">
              <Filter size={18} className="icon" />
              <select 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange} 
                className="filter-input"
                style={{ appearance: 'none', minWidth: '130px' }}
              >
                <option value="">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>Start Date (From)</span>
            <div className="filter-group">
              <Calendar size={18} className="icon" />
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange} 
                className="filter-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>End Date (To)</span>
            <div className="filter-group">
              <Calendar size={18} className="icon" />
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange} 
                className="filter-input"
              />
            </div>
          </div>

          <button className="btn btn-secondary" style={{ marginTop: '1.25rem' }} onClick={() => setFilters({ owner: '', status: '', startDate: '', endDate: '' })}>
            Clear Filters
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={exportToXLSX}>
            <Download size={18} style={{ marginRight: '8px' }} />
            Download Excel
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
                <th>Sr No</th>
                <th>Project Title</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>UAT Date</th>
                <th>Prod Date</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>#{project.id}</td>
                  <td>
                    <div className="font-medium">{project.title}</div>
                    <div className="text-xs text-muted">{project.type}</div>
                  </td>
                  <td>{project.owner || '-'}</td>
                  <td>
                    <span className={getStatusBadgeClass(project.status)}>
                      {project.status || 'Unknown'}
                    </span>
                  </td>
                  <td>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</td>
                  <td>{project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</td>
                  <td>{project.uatDate ? new Date(project.uatDate).toLocaleDateString() : '-'}</td>
                  <td>{project.prodDate ? new Date(project.prodDate).toLocaleDateString() : '-'}</td>
                  <td className="actions-cell">
                    <button className="icon-btn" onClick={() => toggleDropdown(project.id)}>
                      <MoreVertical size={16} />
                    </button>
                    {activeDropdown === project.id && (
                      <div className="action-dropdown glass-panel">
                        <button onClick={() => openEditModal(project)}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="text-danger">
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
    </div>
  );
}
