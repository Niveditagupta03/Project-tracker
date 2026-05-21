'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Activity, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import './project.css';

export default function ProjectDetail({ params }) {
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchProject();
    const user = localStorage.getItem('project_tracker_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
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

  if (loading) {
    return (
      <div className="project-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail-error">
        <h2>Project not found</h2>
        <button className="btn btn-secondary" onClick={() => router.push('/')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <header className="project-header">
        <div className="header-top">
          <button className="btn-back" onClick={() => router.push('/')}>
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <span className={getStatusBadgeClass(project.status)}>
            {project.status || 'Unknown'}
          </span>
        </div>
        
        <div className="header-main">
          <div>
            <h1 className="project-title">{project.title}</h1>
            <p className="project-type">{project.type}</p>
          </div>
          <div className="project-health">
            <span className={`health-dot ${project.health === 'On Track' ? 'dot-success' : project.health === 'At Risk' ? 'dot-warning' : 'dot-danger'}`}></span>
            <span className={`health-text ${project.health === 'On Track' ? 'text-success' : project.health === 'At Risk' ? 'text-warning' : 'text-danger'}`}>
              {project.health || 'On Track'}
            </span>
          </div>
        </div>
      </header>

      <div className="project-grid">
        <div className="project-main-col">
          <div className="glass-panel detail-card">
            <h3>Project Details</h3>
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">Owner</span>
                <span className="info-value">{project.owner || 'Unassigned'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dependency</span>
                <span className="info-value">{project.dependencyWith || 'None'}</span>
              </div>
              <div className="info-item col-span-2">
                <span className="info-label">Description</span>
                <p className="info-text">{project.description || 'No description provided.'}</p>
              </div>
              <div className="info-item col-span-2">
                <span className="info-label">Comments</span>
                <p className="info-text">{project.comments || 'No comments.'}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel tasks-card">
            <div className="card-header">
              <h3>Task Board</h3>
              {currentUser?.role === 'admin' && (
                <button className="btn btn-secondary btn-sm">Add Task</button>
              )}
            </div>
            <div className="tasks-placeholder">
              <div className="empty-tasks">
                <CheckCircle2 size={32} color="#CBD5E1" />
                <p>No tasks created yet.</p>
                <span>Break this project down into actionable tasks.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="project-side-col">
          <div className="glass-panel summary-card">
            <h3>Key Metrics</h3>
            <div className="metric-row">
              <div className="metric-icon"><Calendar size={16} /></div>
              <div className="metric-data">
                <span className="metric-label">Start Date</span>
                <span className="metric-value">{formatDate(project.startDate)}</span>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-icon"><Clock size={16} /></div>
              <div className="metric-data">
                <span className="metric-label">Target End Date</span>
                <span className="metric-value">{formatDate(project.endDate)}</span>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-icon"><Activity size={16} /></div>
              <div className="metric-data">
                <span className="metric-label">Progress</span>
                <div className="progress-bar-container">
                  <span className="metric-value">{project.progress || 0}%</span>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill bg-success" style={{ width: `${project.progress || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="metric-row">
              <div className="metric-icon"><AlertCircle size={16} /></div>
              <div className="metric-data">
                <span className="metric-label">Priority</span>
                <span className={`priority-badge ${project.priority === 'High' ? 'priority-high' : project.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                  {project.priority || 'Medium'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel timeline-card">
            <h3>Project Milestones</h3>
            <div className={`milestone-list ${
              project.status === 'Completed' ? 'completed-prod' :
              project.status === 'UAT' ? 'completed-uat' :
              project.status !== 'Not Started' ? 'completed-start' : ''
            }`}>
              <div className={`milestone-item ${project.status !== 'Not Started' ? 'completed' : 'pending'}`}>
                <div className="milestone-node"></div>
                <div className="milestone-content">
                  <h4>Project Start</h4>
                  <span>{formatDate(project.startDate)}</span>
                </div>
              </div>
              <div className={`milestone-item ${
                project.status === 'UAT' || project.status === 'Completed' ? 'completed' : 'pending'
              }`}>
                <div className="milestone-node"></div>
                <div className="milestone-content">
                  <h4>UAT Delivery</h4>
                  <span>{formatDate(project.uatDate)}</span>
                </div>
              </div>
              <div className={`milestone-item ${project.status === 'Completed' ? 'completed' : 'pending'}`}>
                <div className="milestone-node"></div>
                <div className="milestone-content">
                  <h4>Production Go-Live</h4>
                  <span>{formatDate(project.prodDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
