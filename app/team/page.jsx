'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Shield, User, Search, Activity, ChevronDown, Clock, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import './team.css';

export default function TeamDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    workload: ''
  });

  useEffect(() => {
    // Access control check
    const user = localStorage.getItem('project_tracker_user');
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== 'admin') {
        router.push('/');
        return;
      }
      setIsAuthorized(true);
    } catch (e) {
      console.error('Failed to parse user', e);
      router.push('/login');
      return;
    }

    async function fetchData() {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/projects')
        ]);

        if (usersRes.ok && projectsRes.ok) {
          const usersData = await usersRes.json();
          const projectsData = await projectsRes.json();
          setUsers(usersData);
          setProjects(projectsData);
        }
      } catch (error) {
        console.error('Failed to fetch team data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      workload: ''
    });
  };

  // Helper to check if a user is assigned to a project
  const getProjectMembers = (project) => {
    if (!project.owner) return [];
    return project.owner.split(',').map(o => o.trim()).filter(Boolean);
  };

  // Process members details
  const membersDetails = users.map(user => {
    const assignedProjects = projects.filter(p => {
      const members = getProjectMembers(p);
      // Match by display name or username
      return members.some(m => m.toLowerCase() === user.name.toLowerCase());
    });

    const activeProjects = assignedProjects.filter(p => p.status !== 'Completed');
    const completedProjects = assignedProjects.filter(p => p.status === 'Completed');
    
    // Workload: 20% per active project, capped at 100%
    const workload = Math.min(activeProjects.length * 20, 100);

    return {
      ...user,
      assignedProjects,
      activeProjectsCount: activeProjects.length,
      completedProjectsCount: completedProjects.length,
      workload
    };
  });

  // Calculate high-level stats based on processed details
  const totalMembers = users.length;
  
  const averageWorkload = totalMembers > 0
    ? Math.round(membersDetails.reduce((sum, m) => sum + m.workload, 0) / totalMembers)
    : 0;

  const overloadedCount = membersDetails.filter(m => m.workload >= 80).length;

  // Filter members list
  const filteredMembers = membersDetails.filter(member => {
    // 1. Search text filter
    const matchesSearch = 
      member.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      member.username.toLowerCase().includes(filters.search.toLowerCase());

    // 2. Role filter
    const matchesRole = !filters.role || member.role === filters.role;

    // 3. Workload filter
    let matchesWorkload = true;
    if (filters.workload === 'overloaded') {
      matchesWorkload = member.workload >= 80;
    } else if (filters.workload === 'high') {
      matchesWorkload = member.workload >= 60 && member.workload < 80;
    } else if (filters.workload === 'optimal') {
      matchesWorkload = member.workload >= 40 && member.workload < 60;
    } else if (filters.workload === 'underutilized') {
      matchesWorkload = member.workload < 40;
    }

    return matchesSearch && matchesRole && matchesWorkload;
  });

  // Styles/classes helpers
  const getWorkloadStyle = (workload) => {
    if (workload >= 80) return { colorClass: 'text-red', barClass: 'bandwidth-bar-red', label: 'Overloaded' };
    if (workload >= 60) return { colorClass: 'text-orange', barClass: 'bandwidth-bar-orange', label: 'High Load' };
    if (workload >= 40) return { colorClass: 'text-blue', barClass: 'bandwidth-bar-blue', label: 'Optimal' };
    return { colorClass: 'text-green', barClass: 'bandwidth-bar-green', label: 'Underutilized' };
  };

  const getProjectHealthDotClass = (project) => {
    const health = (project.health || 'On Track').toLowerCase();
    if (health === 'at risk') return 'health-dot-warning';
    if (health === 'off track' || health === 'delayed') return 'health-dot-danger';
    return 'health-dot-success'; // default to on track
  };

  const getProjectStatusBadgeStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return { backgroundColor: '#E1F5FE', color: '#0284C7' };
      case 'in progress': return { backgroundColor: '#FFF3E0', color: '#F59E0B' };
      case 'delayed':
      case 'blocked': return { backgroundColor: '#FFEBEE', color: '#EF4444' };
      default: return { backgroundColor: '#F1F5F9', color: '#64748B' };
    }
  };

  const formatRegistryDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="team-container">
      <div className="team-header-section">
        <div>
          <h1>Team Directory & Workloads</h1>
          <p>Monitor team details, project assignments, and bandwidth utilization</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '18.75rem', background: 'white', borderRadius: '0.75rem', border: '0.0625rem solid #E2E8F0' }}>
          <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Loading team metrics...</div>
        </div>
      ) : (
        <>
          {/* Dashboard Summary Cards */}
          <div className="team-stats-grid">
            <div className="team-stat-card glass-panel">
              <div className="team-stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                <Users size={20} />
              </div>
              <div className="team-stat-details">
                <span className="team-stat-title">Total Members</span>
                <span className="team-stat-value">{totalMembers}</span>
              </div>
            </div>

            <div className="team-stat-card glass-panel">
              <div className="team-stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <Activity size={20} />
              </div>
              <div className="team-stat-details">
                <span className="team-stat-title">Avg. Workload</span>
                <span className="team-stat-value">{averageWorkload}%</span>
              </div>
            </div>

            <div className="team-stat-card glass-panel">
              <div className="team-stat-icon-wrapper" style={{ backgroundColor: overloadedCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: overloadedCount > 0 ? '#EF4444' : '#10B981' }}>
                {overloadedCount > 0 ? <AlertTriangle size={20} /> : <UserCheck size={20} />}
              </div>
              <div className="team-stat-details">
                <span className="team-stat-title">Overloaded Members</span>
                <span className="team-stat-value" style={{ color: overloadedCount > 0 ? '#EF4444' : undefined }}>{overloadedCount}</span>
              </div>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="team-filters-panel glass-panel">
            <div className="team-filter-group search-group">
              <label>Search Members</label>
              <div className="team-input-wrapper">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search by name or username..."
                  className="team-filter-input has-icon"
                />
              </div>
            </div>

            <div className="team-filter-group select-group">
              <label>Access Role</label>
              <div className="team-input-wrapper">
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="team-filter-input team-filter-select"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="reportee">Team Member</option>
                </select>
                <ChevronDown size={12} className="team-select-chevron" />
              </div>
            </div>

            <div className="team-filter-group select-group">
              <label>Workload Status</label>
              <div className="team-input-wrapper">
                <select
                  name="workload"
                  value={filters.workload}
                  onChange={handleFilterChange}
                  className="team-filter-input team-filter-select"
                >
                  <option value="">All Loads</option>
                  <option value="overloaded">Overloaded (≥80%)</option>
                  <option value="high">High Load (60%-80%)</option>
                  <option value="optimal">Optimal (40%-60%)</option>
                  <option value="underutilized">Underutilized (&lt;40%)</option>
                </select>
                <ChevronDown size={12} className="team-select-chevron" />
              </div>
            </div>

            {(filters.search || filters.role || filters.workload) && (
              <button onClick={clearFilters} className="team-clear-filters-btn">
                Clear Filters
              </button>
            )}
          </div>

          {/* Team Cards Grid */}
          <div className="team-cards-grid">
            {filteredMembers.map(member => {
              const wlInfo = getWorkloadStyle(member.workload);
              return (
                <div key={member.id} className="member-card glass-panel">
                  <div className="member-card-header">
                    <div className="member-card-avatar">
                      {member.name ? member.name.substring(0, 2).toUpperCase() : '?'}
                    </div>
                    <div className="member-card-profile">
                      <span className="member-card-name">{member.name}</span>
                      <span className="member-card-username">@{member.username}</span>
                      <span className={`member-card-role-badge ${member.role === 'admin' ? 'admin-badge' : ''}`}>
                        {member.role === 'admin' ? 'Administrator' : 'Team Member'}
                      </span>
                    </div>
                  </div>

                  <div className="member-card-bandwidth-section">
                    <div className="bandwidth-label-row">
                      <span>Bandwidth</span>
                      <span className={`bandwidth-status-text ${wlInfo.colorClass}`}>
                        {wlInfo.label} ({member.workload}%)
                      </span>
                    </div>
                    <div className="bandwidth-bar-bg">
                      <div 
                        className={`bandwidth-bar-fill ${wlInfo.barClass}`}
                        style={{ width: `${member.workload}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="member-card-stats-breakdown">
                    <div className="member-card-stat-box">
                      <span className="member-card-stat-label">Active</span>
                      <span className="member-card-stat-value">{member.activeProjectsCount}</span>
                    </div>
                    <div className="member-card-stat-box">
                      <span className="member-card-stat-label">Completed</span>
                      <span className="member-card-stat-value">{member.completedProjectsCount}</span>
                    </div>
                  </div>

                  <div className="member-card-projects-section">
                    <h4>Assigned Projects ({member.assignedProjects.length})</h4>
                    <div className="member-card-projects-list">
                      {member.assignedProjects.map(p => (
                        <Link 
                          key={p.id} 
                          href={`/project/${p.id}`}
                          className="member-project-badge"
                          title={`Click to view project details`}
                        >
                          <span className="member-project-title">{p.title}</span>
                          <div className="member-project-meta">
                            <span 
                              className="member-project-status"
                              style={getProjectStatusBadgeStyle(p.status)}
                            >
                              {p.status || 'Not Started'}
                            </span>
                            <span 
                              className={`member-project-health-dot ${getProjectHealthDotClass(p)}`}
                            ></span>
                          </div>
                        </Link>
                      ))}
                      {member.assignedProjects.length === 0 && (
                        <span className="no-projects-text">No assigned projects</span>
                      )}
                    </div>
                  </div>

                  <div className="member-card-footer">
                    <Clock size={12} />
                    <span>Member since {formatRegistryDate(member.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="team-empty-state glass-panel">
              No team members match your filter criteria.
            </div>
          )}
        </>
      )}
    </div>
  );
}
