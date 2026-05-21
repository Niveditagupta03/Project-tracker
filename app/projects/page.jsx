'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Clock } from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();

    const handleProjectUpdated = () => {
      fetchProjects();
    };

    window.addEventListener('project-updated', handleProjectUpdated);
    return () => window.removeEventListener('project-updated', handleProjectUpdated);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTableDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const openNewModal = () => {
    window.dispatchEvent(new CustomEvent('open-project-modal'));
  };

  const openEditModal = (project) => {
    window.dispatchEvent(new CustomEvent('open-project-modal', { detail: { project } }));
  };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="projects-board-view">
        <div className="board-header glass-panel">
          <div>
            <h2>Projects Board</h2>
            <p>Manage and track all your ongoing projects</p>
          </div>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Create Project
          </button>
        </div>
        
        <div className="kanban-board">
          {['Not Started', 'In Progress', 'Completed', 'Delayed'].map(status => (
            <div key={status} className="kanban-column glass-panel">
              <div className="kanban-col-header">
                <h3>
                  <span className={`health-dot ${status === 'Completed' ? 'dot-success' : status === 'In Progress' ? 'dot-warning' : status === 'Delayed' ? 'dot-danger' : ''}`} style={{ backgroundColor: status === 'Not Started' ? '#CBD5E1' : undefined }}></span>
                  {status}
                </h3>
                <span className="kanban-col-header-count">
                  {projects.filter(p => (status === 'Delayed' ? p.status === 'Delayed' : p.status === status)).length}
                </span>
              </div>
              
              <div className="kanban-col-body">
                {projects.filter(p => (status === 'Delayed' ? p.status === 'Delayed' : p.status === status)).map(project => (
                  <div key={project.id} className="kanban-card" onClick={() => router.push(`/project/${project.id}`)}>
                    <div className="kanban-card-header">
                      <span className={`priority-badge ${project.priority === 'High' ? 'priority-high' : project.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`} style={{ fontSize: '0.65rem' }}>
                        {project.priority || 'Medium'}
                      </span>
                      <button className="icon-btn" style={{ padding: '0.2rem' }} onClick={(e) => { e.stopPropagation(); openEditModal(project); }}>
                        <MoreVertical size={14} color="#94A3B8" />
                      </button>
                    </div>
                    
                    <h4 className="kanban-card-title">{project.title}</h4>
                    <p className="kanban-card-desc">{project.description || 'No description provided'}</p>
                    
                    <div className="kanban-card-footer">
                      <div className="kanban-card-date">
                        <Clock size={12} />
                        {formatTableDate(project.endDate)}
                      </div>
                      <div className="kanban-card-owner">
                        {project.owner ? project.owner.substring(0, 2).toUpperCase() : '?'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {projects.filter(p => (status === 'Delayed' ? p.status === 'Delayed' : p.status === status)).length === 0 && (
                  <div className="kanban-empty-state">
                    No projects
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
