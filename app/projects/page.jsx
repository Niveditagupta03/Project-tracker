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
        <div className="board-header glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0F172A', fontSize: '1.5rem' }}>Projects Board</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>Manage and track all your ongoing projects</p>
          </div>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Create Project
          </button>
        </div>
        
        <div className="kanban-board" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', height: 'calc(100vh - 120px)' }}>
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
    </div>
  );
}
