'use client';

import { useState, useEffect } from 'react';
import './page.css';
import { Plus, Search, Filter, Calendar } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableOwners, setAvailableOwners] = useState([]);
  const [filters, setFilters] = useState({ owner: '', startDate: '', endDate: '' });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', type: '', owner: '', status: 'Not Started',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          title: '', description: '', type: '', owner: '', status: 'Not Started',
          startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: ''
        });
        fetchProjects();
        fetchOwners();
      }
    } catch (error) {
      console.error('Failed to create project', error);
    }
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
    <div className="dashboard">
      <div className="glass-panel dashboard-header">
        <div className="filter-bar">
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
          <button className="btn btn-secondary" onClick={() => setFilters({ owner: '', startDate: '', endDate: '' })}>
            Clear Filters
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} style={{ marginRight: '8px' }} />
          New Project
        </button>
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
              <h2>Add New Project</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Title *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Owner</label>
                  <input type="text" name="owner" value={formData.owner} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Project Type</label>
                  <input type="text" name="type" value={formData.type} onChange={handleFormChange} />
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
  );
}
