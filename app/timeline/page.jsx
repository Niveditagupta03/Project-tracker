'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import './timeline.css';

export default function TimelinePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState('projects');
  
  // Set initial reference date to today (May 21, 2026 based on metadata, or system current)
  const [referenceDate, setReferenceDate] = useState(() => {
    const today = new Date();
    // If the year is not 2026, default to May 21, 2026 to match mock data
    if (today.getFullYear() !== 2026) {
      return new Date('2026-05-21T12:00:00');
    }
    return today;
  });

  useEffect(() => {
    async function fetchProjects() {
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
    }
    fetchProjects();
  }, []);

  // ISO Week calculation helper
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Calculate the 5-week range centered on referenceDate
  const { timelineStart, timelineEnd, weeksList, monthLabel } = (() => {
    // Find the Monday of the reference date's week
    const dayOfWeek = referenceDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(referenceDate);
    currentMonday.setDate(referenceDate.getDate() + diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    // Let the range start 3 weeks before current Monday (making the reference week Week 4 of the Gantt chart)
    const startOfWeek1 = new Date(currentMonday);
    startOfWeek1.setDate(currentMonday.getDate() - 3 * 7);

    // Let the range end at Sunday of Week 5 (2 weeks after current Monday, minus 1 day)
    const endOfWeek5 = new Date(currentMonday);
    endOfWeek5.setDate(currentMonday.getDate() + 2 * 7 - 1);
    endOfWeek5.setHours(23, 59, 59, 999);

    // Generate week items
    const weeksList = [];
    for (let i = 0; i < 5; i++) {
      const weekDate = new Date(startOfWeek1);
      weekDate.setDate(startOfWeek1.getDate() + i * 7);
      weeksList.push({
        label: `W${getWeekNumber(weekDate)}`,
        date: weekDate
      });
    }

    // Month label of the middle week (Week 3)
    const middleDate = new Date(startOfWeek1.getTime() + 14 * 86400000);
    const label = middleDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return {
      timelineStart: startOfWeek1,
      timelineEnd: endOfWeek5,
      weeksList,
      monthLabel: label
    };
  })();

  const totalDurationMs = timelineEnd.getTime() - timelineStart.getTime();

  // Navigation handlers
  const handlePrevWeeks = () => {
    setReferenceDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7); // Shift back by 1 week
      return next;
    });
  };

  const handleNextWeeks = () => {
    setReferenceDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7); // Shift forward by 1 week
      return next;
    });
  };

  const handleResetToToday = () => {
    const today = new Date();
    if (today.getFullYear() !== 2026) {
      setReferenceDate(new Date('2026-05-21T12:00:00'));
    } else {
      setReferenceDate(today);
    }
  };

  // "Today" marker positioning
  const todayDate = new Date();
  const adjustedToday = todayDate.getFullYear() !== 2026 ? new Date('2026-05-21T12:00:00') : todayDate;
  const todayPositionPct = (() => {
    if (adjustedToday < timelineStart || adjustedToday > timelineEnd) return -1;
    const elapsed = adjustedToday.getTime() - timelineStart.getTime();
    return (elapsed / totalDurationMs) * 100;
  })();

  // Helper to map project dates to percentage positions safely
  const getBarPositionStyles = (startDateStr, endDateStr) => {
    if (!startDateStr && !endDateStr) return { display: 'none' };

    try {
      const start = startDateStr ? new Date(startDateStr) : new Date(endDateStr);
      const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { display: 'none' };
      }

      // Clamp values to timeline window for visual rendering
      const clampedStart = new Date(Math.max(start.getTime(), timelineStart.getTime()));
      const clampedEnd = new Date(Math.min(end.getTime(), timelineEnd.getTime()));

      if (clampedStart > clampedEnd) return { display: 'none' };

      const leftMs = clampedStart.getTime() - timelineStart.getTime();
      const widthMs = clampedEnd.getTime() - clampedStart.getTime();

      const leftPct = (leftMs / totalDurationMs) * 100;
      const widthPct = (widthMs / totalDurationMs) * 100;

      return {
        left: `${leftPct}%`,
        width: `${Math.max(widthPct, 2)}%`, // At least 2% width so a dot is visible
      };
    } catch (e) {
      console.error("Error parsing dates", e);
      return { display: 'none' };
    }
  };

  // Helper for project timeline bar color
  const getBarColor = (project) => {
    const health = (project.health || 'On Track').toLowerCase();
    const status = project.status?.toLowerCase() || '';

    if (health === 'on track') return '#10B981'; // Green
    if (health === 'at risk') return '#F59E0B'; // Amber
    if (health === 'off track' || health === 'delayed' || status === 'delayed') return '#EF4444'; // Red
    if (status === 'completed') return '#3B82F6'; // Blue
    return '#818CF8'; // Indigo/Purple default
  };

  // Compute dynamic workloads based on actual owners in the database
  const allOwnersSet = new Set();
  projects.forEach(p => {
    if (p.owner) {
      const owners = p.owner.split(',').map(o => o.trim()).filter(o => o !== '');
      owners.forEach(owner => allOwnersSet.add(owner));
    }
  });

  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const activeCountsByOwner = {};
  activeProjects.forEach(p => {
    if (p.owner) {
      const owners = p.owner.split(',').map(o => o.trim()).filter(o => o !== '');
      owners.forEach(owner => {
        activeCountsByOwner[owner] = (activeCountsByOwner[owner] || 0) + 1;
      });
    }
  });

  const workloadList = Array.from(allOwnersSet).map(name => {
    const activeCount = activeCountsByOwner[name] || 0;
    const workload = Math.min(activeCount * 20, 100);
    
    // Choose appropriate avatar styles/colors
    let background = 'EEF2FF';
    let color = '4F46E5';
    if (name.toLowerCase() === 'nivedita') {
      background = 'FDF2F8';
      color = 'EC4899';
    } else if (name.toLowerCase() === 'pradeep') {
      background = 'EEF2FF';
      color = '4F46E5';
    } else if (name.toLowerCase() === 'shiva') {
      background = 'E0F2FE';
      color = '0284C7';
    } else {
      background = 'ECFDF5';
      color = '059669';
    }

    return {
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=${color}&bold=true`,
      workload
    };
  });

  // Sort workload list descending by workload, then alphabetically by name
  workloadList.sort((a, b) => {
    if (b.workload !== a.workload) {
      return b.workload - a.workload;
    }
    return a.name.localeCompare(b.name);
  });

  // Helper for workload bar fill class
  const getWorkloadBarClass = (workload) => {
    if (workload >= 80) return 'workload-bar-red';
    if (workload >= 60) return 'workload-bar-orange';
    if (workload >= 40) return 'workload-bar-blue';
    return 'workload-bar-green';
  };

  const getProjectMembers = (project) => {
    if (!project.owner) return [];
    return project.owner.split(',').map(o => o.trim()).filter(o => o !== '');
  };

  const allMembers = Array.from(allOwnersSet);

  const memberAssignments = workloadList.map(item => {
    const memProjects = projects.filter(p => {
      const pMembers = getProjectMembers(p);
      return pMembers.includes(item.name);
    });
    const activeCount = memProjects.filter(p => p.status !== 'Completed').length;
    const completedCount = memProjects.filter(p => p.status === 'Completed').length;
    return {
      ...item,
      projects: memProjects,
      activeCount,
      completedCount
    };
  });

  const dateCollisions = [];
  memberAssignments.forEach(mem => {
    const weekDeadlines = {};
    mem.projects.filter(p => p.status !== 'Completed' && p.endDate).forEach(p => {
      const date = new Date(p.endDate);
      const week = `${date.getFullYear()}-W${getWeekNumber(date)}`;
      if (!weekDeadlines[week]) weekDeadlines[week] = [];
      weekDeadlines[week].push(p);
    });

    Object.keys(weekDeadlines).forEach(week => {
      if (weekDeadlines[week].length > 1) {
        dateCollisions.push({
          member: mem.name,
          week,
          projects: weekDeadlines[week]
        });
      }
    });
  });

  // Health distribution calculations
  const totalProjectsCount = projects.length;

  const getTrendText = (trendValues) => {
    const startVal = trendValues[0];
    const endVal = trendValues[5];
    if (startVal === endVal) return '0%';
    if (startVal === 0) return `+${endVal * 100}%`;
    const pct = Math.round(((endVal - startVal) / startVal) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const getTrendIcon = (trendValues) => {
    const startVal = trendValues[0];
    const endVal = trendValues[5];
    return endVal >= startVal ? <TrendingUp size={12} /> : <TrendingDown size={12} />;
  };

  // Dynamic 6-week trend calculation based on project createdAt/endDate and health
  const { onTrackTrend, atRiskTrend, offTrackTrend } = (() => {
    if (projects.length === 0) {
      // Mock trends if database is empty
      return {
        onTrackTrend: [0, 0, 0, 0, 0, 0],
        atRiskTrend: [0, 0, 0, 0, 0, 0],
        offTrackTrend: [0, 0, 0, 0, 0, 0]
      };
    }

    const trendDates = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(referenceDate);
      date.setDate(referenceDate.getDate() - i * 7);
      trendDates.push(date);
    }

    const otTrend = [];
    const arTrend = [];
    const oftTrend = [];

    trendDates.forEach(date => {
      let onTrack = 0;
      let atRisk = 0;
      let offTrack = 0;

      projects.forEach(p => {
        const start = new Date(p.createdAt);
        if (date < start) return; // Project didn't exist yet

        const end = p.endDate ? new Date(p.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
        const duration = Math.max(end.getTime() - start.getTime(), 1);
        const timeElapsed = date.getTime() - start.getTime();
        const progressRatio = timeElapsed / duration;

        const currentHealth = p.health || 'On Track';

        if (currentHealth === 'On Track') {
          onTrack++;
        } else if (currentHealth === 'At Risk') {
          if (progressRatio >= 0.5) {
            atRisk++;
          } else {
            onTrack++;
          }
        } else {
          // Off Track / Delayed
          if (progressRatio >= 0.7) {
            offTrack++;
          } else if (progressRatio >= 0.4) {
            atRisk++;
          } else {
            onTrack++;
          }
        }
      });

      otTrend.push(onTrack);
      arTrend.push(atRisk);
      oftTrend.push(offTrack);
    });

    return {
      onTrackTrend: otTrend,
      atRiskTrend: arTrend,
      offTrackTrend: oftTrend
    };
  })();

  const displayOnTrack = onTrackTrend[5];
  const displayAtRisk = atRiskTrend[5];
  const displayOffTrack = offTrackTrend[5];

  const maxTrendVal = Math.max(...onTrackTrend, ...atRiskTrend, ...offTrackTrend, 10);

  // SVG drawing helpers
  const getSvgPoints = (trend) => {
    return trend.map((val, idx) => {
      const x = 50 + idx * 100;
      const y = 110 - (val / maxTrendVal) * 80;
      return { x, y, val };
    });
  };

  const onTrackPoints = getSvgPoints(onTrackTrend);
  const atRiskPoints = getSvgPoints(atRiskTrend);
  const offTrackPoints = getSvgPoints(offTrackTrend);

  const getPathString = (points) => {
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const getAreaPathString = (points) => {
    if (points.length === 0) return '';
    const linePath = getPathString(points);
    return `${linePath} L ${points[points.length - 1].x} 125 L ${points[0].x} 125 Z`;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header-section">
        <div>
          <h1>Projects Timeline</h1>
          <p>Track project schedules, team workloads, and overall portfolio health</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'white', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Loading timeline data...</div>
        </div>
      ) : (
        <div className="timeline-grid">
          {/* GANTT CHART */}
          <div className="gantt-chart-wrapper timeline-card">
            <div className="timeline-card-header">
              <h3>Projects Timeline (Gantt)</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  onClick={handleResetToToday} 
                  className="chart-time-select"
                  style={{ fontWeight: '600' }}
                >
                  Today
                </button>
                <button 
                  onClick={handlePrevWeeks} 
                  className="chart-time-select"
                  style={{ padding: '0.25rem 0.6rem', fontWeight: 'bold' }}
                  title="Previous Week"
                >
                  &larr;
                </button>
                <button 
                  onClick={handleNextWeeks} 
                  className="chart-time-select"
                  style={{ padding: '0.25rem 0.6rem', fontWeight: 'bold' }}
                  title="Next Week"
                >
                  &rarr;
                </button>
              </div>
            </div>

            <div className="gantt-table-header">
              <div className="gantt-project-col-header">Project Name</div>
              <div className="gantt-timeline-col-header">
                <div className="gantt-months">{monthLabel}</div>
                <div className="gantt-weeks">
                  {weeksList.map((w, idx) => (
                    <span key={idx}>{w.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="gantt-body">
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                  No projects available. Create a project to view the timeline.
                </div>
              ) : (
                projects.map((project) => {
                  const barStyle = getBarPositionStyles(project.startDate, project.endDate);
                  const barColor = getBarColor(project);
                  return (
                    <div key={project.id} className="gantt-row">
                      <div className="gantt-project-label-cell" title={project.title}>
                        <Link href={`/project/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {project.title}
                        </Link>
                      </div>
                      <div className="gantt-timeline-cell">
                        {/* Weekly grid columns */}
                        <div className="gantt-grid-columns">
                          <div className="gantt-grid-col"></div>
                          <div className="gantt-grid-col"></div>
                          <div className="gantt-grid-col"></div>
                          <div className="gantt-grid-col"></div>
                          <div className="gantt-grid-col"></div>
                        </div>

                        {/* Project Gantt bar */}
                        {barStyle.display !== 'none' && (
                          <Link
                            href={`/project/${project.id}`}
                            className="gantt-project-bar"
                            style={{
                              ...barStyle,
                              backgroundColor: barColor,
                            }}
                            title={`${project.title}: ${project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : 'N/A'} to ${project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB') : 'N/A'}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Today line indicator */}
              {todayPositionPct >= 0 && (
                <div
                  className="gantt-today-line-marker"
                  style={{
                    left: `calc(220px + (100% - 220px) * ${todayPositionPct / 100})`,
                  }}
                  title={`Today: ${adjustedToday.toLocaleDateString('en-GB')}`}
                />
              )}
            </div>
          </div>

          {/* TEAM WORKLOAD */}
          <div className="timeline-card glass-panel" style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
            <div className="timeline-card-header">
              <h3>Team Workload</h3>
              <button 
                className="header-link-btn"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#4F46E5', 
                  fontWeight: '600', 
                  fontSize: '0.85rem', 
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => setShowReportModal(true)}
              >
                View report
              </button>
            </div>

            <div className="workload-list">
              {workloadList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                  No project workload data available.
                </div>
              ) : (
                workloadList.map((member) => (
                  <div key={member.name} className="workload-row">
                    <div className="workload-member-info">
                      <div className="workload-avatar">
                        <img src={member.avatar} alt={member.name} />
                      </div>
                      <span className="workload-name" title={member.name}>
                        {member.name}
                      </span>
                    </div>
                    <div className="workload-progress-container">
                      <div className="workload-bar-bg">
                        <div
                          className={`workload-bar-fill ${getWorkloadBarClass(member.workload)}`}
                          style={{ width: `${member.workload}%` }}
                        />
                      </div>
                      <span className="workload-percentage">{member.workload}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* HEALTH TREND */}
          <div className="health-trend-container timeline-card" style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
            <div className="health-trend-flex">
              <div className="health-distribution-col">
                 <div className="health-stat-box">
                  <div className="health-stat-left">
                    <div className="health-stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                      <CheckCircle2 size={16} color="#10B981" />
                    </div>
                    <div className="health-stat-details">
                      <span className="health-stat-title">On Track</span>
                      <span className="health-stat-count">{displayOnTrack} projects</span>
                    </div>
                  </div>
                  <span className="health-stat-trend" style={{ color: '#10B981' }}>
                    {getTrendIcon(onTrackTrend)} {getTrendText(onTrackTrend)}
                  </span>
                </div>

                <div className="health-stat-box">
                  <div className="health-stat-left">
                    <div className="health-stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                      <AlertTriangle size={16} color="#F59E0B" />
                    </div>
                    <div className="health-stat-details">
                      <span className="health-stat-title">At Risk</span>
                      <span className="health-stat-count">{displayAtRisk} projects</span>
                    </div>
                  </div>
                  <span className="health-stat-trend" style={{ color: '#F59E0B' }}>
                    {getTrendIcon(atRiskTrend)} {getTrendText(atRiskTrend)}
                  </span>
                </div>

                <div className="health-stat-box">
                  <div className="health-stat-left">
                    <div className="health-stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                      <Clock size={16} color="#EF4444" />
                    </div>
                    <div className="health-stat-details">
                      <span className="health-stat-title">Off Track</span>
                      <span className="health-stat-count">{displayOffTrack} projects</span>
                    </div>
                  </div>
                  <span className="health-stat-trend" style={{ color: '#EF4444' }}>
                    {getTrendIcon(offTrackTrend)} {getTrendText(offTrackTrend)}
                  </span>
                </div>
              </div>

              <div className="health-trend-chart-col">
                <div className="chart-header">
                  <h4>Health Trend (Last 6 Weeks)</h4>
                  <div className="chart-time-select" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>Last 6 weeks</span>
                    <ChevronDown size={12} />
                  </div>
                </div>

                <div className="svg-chart-wrapper">
                  <svg width="100%" height="130" viewBox="0 0 600 130" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="gradient-ontrack" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gradient-atrisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gradient-delayed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area charts fill */}
                    <path d={getAreaPathString(onTrackPoints)} fill="url(#gradient-ontrack)" />
                    <path d={getAreaPathString(atRiskPoints)} fill="url(#gradient-atrisk)" />
                    <path d={getAreaPathString(offTrackPoints)} fill="url(#gradient-delayed)" />

                    {/* Line paths */}
                    <path d={getPathString(onTrackPoints)} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                    <path d={getPathString(atRiskPoints)} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                    <path d={getPathString(offTrackPoints)} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />

                    {/* Circles on dots */}
                    {onTrackPoints.map((p, i) => (
                      <circle key={`ot-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="#10B981" strokeWidth="2" />
                    ))}
                    {atRiskPoints.map((p, i) => (
                      <circle key={`ar-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
                    ))}
                    {offTrackPoints.map((p, i) => (
                      <circle key={`dl-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="#EF4444" strokeWidth="2" />
                    ))}
                  </svg>
                </div>
                <div className="chart-tooltip-hint">Hover on points to see project distribution trend</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Workload Assignment Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content timeline-report-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="report-modal-title">Team Workload & Assignment Report</h2>
                <p className="report-modal-subtitle">In-depth analysis of team assignments, active project involvement, and workload dynamics.</p>
              </div>
              <button className="close-btn" onClick={() => setShowReportModal(false)}>&times;</button>
            </div>

            {/* Overview Cards */}
            <div className="report-overview-grid">
              <div className="overview-card">
                <span className="overview-label">Total Assigned Members</span>
                <span className="overview-value">{allMembers.length}</span>
              </div>
              <div className="overview-card">
                <span className="overview-label">Active Projects</span>
                <span className="overview-value">{activeProjects.length}</span>
              </div>
              <div className="overview-card">
                <span className="overview-label">Avg. Projects/Member</span>
                <span className="overview-value">
                  {allMembers.length > 0 ? (activeProjects.length / allMembers.length).toFixed(1) : 0}
                </span>
              </div>
              <div className="overview-card">
                <span className="overview-label">Collaboration Rate</span>
                <span className="overview-value">
                  {projects.length > 0 ? (projects.reduce((acc, p) => acc + getProjectMembers(p).length, 0) / projects.length).toFixed(1) : 0}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="report-tabs">
              <button 
                className={`report-tab-btn ${activeReportTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveReportTab('projects')}
              >
                Project-centric View
              </button>
              <button 
                className={`report-tab-btn ${activeReportTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveReportTab('members')}
              >
                Member-centric View
              </button>
              <button 
                className={`report-tab-btn ${activeReportTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveReportTab('insights')}
              >
                Smart Insights & Warnings
              </button>
            </div>

            {/* Content Area */}
            <div className="report-modal-body">
              {activeReportTab === 'projects' && (
                <div className="report-table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Status</th>
                        <th>Health</th>
                        <th style={{ textAlign: 'center' }}>Members Count</th>
                        <th>Assigned Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(p => {
                        const pMembers = getProjectMembers(p);
                        return (
                          <tr key={p.id}>
                            <td className="p-title-cell">
                              <Link href={`/project/${p.id}`} className="p-link" onClick={() => setShowReportModal(false)}>
                                {p.title}
                              </Link>
                              <span className="p-type">{p.type || 'N/A'}</span>
                            </td>
                            <td>
                              <span className={`badge ${
                                p.status === 'Completed' ? 'badge-success' :
                                p.status === 'In Progress' ? 'badge-warning' :
                                p.status === 'Blocked' || p.status === 'Delayed' ? 'badge-danger' : 'badge-neutral'
                              }`}>
                                {p.status || 'Not Started'}
                              </span>
                            </td>
                            <td>
                              <span className={`health-badge ${
                                (p.health || 'On Track') === 'On Track' ? 'health-on-track' :
                                p.health === 'At Risk' ? 'health-at-risk' : 'health-off-track'
                              }`}>
                                {p.health || 'On Track'}
                              </span>
                            </td>
                            <td style={{ fontWeight: '700', textAlign: 'center' }}>
                              {pMembers.length}
                            </td>
                            <td>
                              <div className="members-avatars-list">
                                {pMembers.map(name => (
                                  <span key={name} className="member-avatar-badge" title={name}>
                                    {name.substring(0, 2).toUpperCase()}
                                  </span>
                                ))}
                                {pMembers.length === 0 && <span className="unassigned-text">Unassigned</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeReportTab === 'members' && (
                <div className="report-members-grid">
                  {memberAssignments.map(mem => (
                    <div key={mem.name} className="member-report-card glass-panel">
                      <div className="member-report-header">
                        <div className="member-profile-box">
                          <div className="member-avatar-initials">
                            {mem.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{mem.name}</h4>
                            <span className="member-capacity">
                              Workload: <strong className={mem.workload >= 80 ? 'text-red' : mem.workload >= 60 ? 'text-orange' : 'text-green'}>{mem.workload}%</strong>
                            </span>
                          </div>
                        </div>
                        <span className={`workload-status-pill ${
                          mem.workload >= 80 ? 'status-overloaded' :
                          mem.workload >= 60 ? 'status-high' :
                          mem.workload >= 40 ? 'status-optimal' : 'status-underutilized'
                        }`}>
                          {mem.workload >= 80 ? 'Overloaded' : mem.workload >= 60 ? 'High load' : mem.workload >= 40 ? 'Optimal' : 'Underutilized'}
                        </span>
                      </div>

                      <div className="member-projects-list" style={{ marginTop: '1rem' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                          Assigned Projects ({mem.projects.length})
                        </h5>
                        {mem.projects.map(p => (
                          <div key={p.id} className="member-project-item">
                            <div className="m-p-details">
                              <Link href={`/project/${p.id}`} className="m-p-title" onClick={() => setShowReportModal(false)}>
                                {p.title}
                              </Link>
                              <span className="m-p-date">Target: {p.endDate ? new Date(p.endDate).toLocaleDateString('en-GB') : 'Not set'}</span>
                            </div>
                            <div className="m-p-status-row">
                              <span className={`badge ${
                                p.status === 'Completed' ? 'badge-success' :
                                p.status === 'In Progress' ? 'badge-warning' :
                                p.status === 'Blocked' || p.status === 'Delayed' ? 'badge-danger' : 'badge-neutral'
                              }`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                {p.status}
                              </span>
                              <span className="m-p-progress">{p.progress || 0}%</span>
                            </div>
                          </div>
                        ))}
                        {mem.projects.length === 0 && (
                          <div className="no-projects-assigned">No projects assigned</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeReportTab === 'insights' && (
                <div className="report-insights-container">
                  <h4 className="insights-section-title">Critical Attention Items</h4>
                  <div className="insights-list">
                    {/* Overallocation */}
                    {memberAssignments.filter(mem => mem.workload >= 80).map(mem => (
                      <div key={mem.name} className="insight-item danger-insight">
                        <div className="insight-icon"><AlertTriangle size={18} /></div>
                        <div className="insight-content">
                          <h5>Resource Bottleneck: {mem.name} is Overloaded</h5>
                          <p>{mem.name} is currently assigned to {mem.activeCount} active projects, bringing utilization to {mem.workload}%. This increases risk of burnout and project delivery delays. Consider offloading or shifting dates.</p>
                        </div>
                      </div>
                    ))}

                    {/* Unassigned Projects */}
                    {projects.filter(p => !p.owner).map(p => (
                      <div key={p.id} className="insight-item danger-insight">
                        <div className="insight-icon"><AlertTriangle size={18} /></div>
                        <div className="insight-content">
                          <h5>Unassigned Project Risk</h5>
                          <p>The project <strong>"{p.title}"</strong> has no team members assigned to it. It is currently in state <em>"{p.status}"</em> with health <em>"{p.health}"</em>. Please assign an owner to prevent stalling.</p>
                        </div>
                      </div>
                    ))}

                    {/* At Risk Projects with Low Staffing */}
                    {projects.filter(p => p.health === 'At Risk' && getProjectMembers(p).length <= 1).map(p => (
                      <div key={p.id} className="insight-item warning-insight">
                        <div className="insight-icon"><AlertTriangle size={18} /></div>
                        <div className="insight-content">
                          <h5>Understaffed Project At Risk</h5>
                          <p>The project <strong>"{p.title}"</strong> is marked <strong>At Risk</strong> but only has {getProjectMembers(p).length === 0 ? 'no' : '1'} member assigned ({p.owner || 'None'}). Consider assigning backup members to stabilize project health.</p>
                        </div>
                      </div>
                    ))}

                    {/* Date Collision Alerts */}
                    {dateCollisions.map((col, idx) => (
                      <div key={idx} className="insight-item info-insight">
                        <div className="insight-icon"><Clock size={18} /></div>
                        <div className="insight-content">
                          <h5>Deadline Conflict: {col.member} ({col.week})</h5>
                          <p>
                            {col.member} has multiple active projects ending in the same calendar week ({col.week}):
                            {col.projects.map((p, index) => (
                              <span key={p.id}>
                                <strong> {p.title}</strong> (Ends: {new Date(p.endDate).toLocaleDateString('en-GB')}){index < col.projects.length - 1 ? ',' : ''}
                              </span>
                            ))}.
                            This might lead to quality bottlenecks or delays. Recommend shifting dates or sharing workload.
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* If no insights */}
                    {memberAssignments.filter(mem => mem.workload >= 80).length === 0 &&
                     projects.filter(p => !p.owner).length === 0 &&
                     projects.filter(p => p.health === 'At Risk' && getProjectMembers(p).length <= 1).length === 0 &&
                     dateCollisions.length === 0 && (
                      <div className="insight-item success-insight">
                        <div className="insight-icon"><CheckCircle2 size={18} /></div>
                        <div className="insight-content">
                          <h5>Portfolio Load is Balanced</h5>
                          <p>No critical workload imbalances, date collisions, or unassigned project risks were detected. All projects have members assigned, and workload is distributed efficiently.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="insights-general-tips" style={{ marginTop: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed #E2E8F0' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.85rem', fontWeight: '700' }}>Portfolio Recommendations</h5>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                      <li>Optimal loading for team members is 40% - 60% (2-3 active projects).</li>
                      <li>Ensure all At Risk or Off Track projects have at least two team members assigned to support coordination.</li>
                      <li>Avoid having a single team member own multiple critical path deadlines in the same week.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Close Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
