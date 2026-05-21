'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import './timeline.css';

export default function TimelinePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
    const health = project.health?.toLowerCase() || '';
    const status = project.status?.toLowerCase() || '';

    if (health === 'on track') return '#10B981'; // Green
    if (health === 'at risk') return '#F59E0B'; // Amber
    if (health === 'delayed' || status === 'delayed') return '#EF4444'; // Red
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

  // Health distribution calculations
  const totalProjectsCount = projects.length;
  const onTrackCount = projects.filter(p => p.health === 'On Track').length;
  const atRiskCount = projects.filter(p => p.health === 'At Risk').length;
  const delayedCount = projects.filter(p => p.health === 'Delayed' || p.status === 'Delayed').length;

  // Real or mockup values if database is completely empty
  const displayOnTrack = totalProjectsCount > 0 ? onTrackCount : 16;
  const displayAtRisk = totalProjectsCount > 0 ? atRiskCount : 5;
  const displayDelayed = totalProjectsCount > 0 ? delayedCount : 3;

  // Simulated 6 weeks trend coordinates ending at current database numbers
  const onTrackTrend = [
    Math.max(0, displayOnTrack - 4),
    Math.max(0, displayOnTrack - 6),
    Math.max(0, displayOnTrack - 2),
    Math.max(0, displayOnTrack - 3),
    Math.max(0, displayOnTrack - 3),
    displayOnTrack
  ];

  const atRiskTrend = [
    Math.max(0, displayAtRisk - 1),
    Math.max(0, displayAtRisk - 3),
    Math.max(0, displayAtRisk),
    Math.max(0, displayAtRisk - 2),
    Math.max(0, displayAtRisk - 1),
    displayAtRisk
  ];

  const delayedTrend = [
    Math.max(0, displayDelayed + 1),
    Math.max(0, displayDelayed - 1),
    Math.max(0, displayDelayed + 2),
    Math.max(0, displayDelayed),
    Math.max(0, displayDelayed - 1),
    displayDelayed
  ];

  const maxTrendVal = Math.max(...onTrackTrend, ...atRiskTrend, ...delayedTrend, 10);

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
  const delayedPoints = getSvgPoints(delayedTrend);

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
              <span className="header-link">View report</span>
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
                    <TrendingUp size={12} /> 10%
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
                    <TrendingDown size={12} /> 3%
                  </span>
                </div>

                <div className="health-stat-box">
                  <div className="health-stat-left">
                    <div className="health-stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                      <Clock size={16} color="#EF4444" />
                    </div>
                    <div className="health-stat-details">
                      <span className="health-stat-title">Delayed</span>
                      <span className="health-stat-count">{displayDelayed} projects</span>
                    </div>
                  </div>
                  <span className="health-stat-trend" style={{ color: '#EF4444' }}>
                    <TrendingUp size={12} /> 2%
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
                    <path d={getAreaPathString(delayedPoints)} fill="url(#gradient-delayed)" />

                    {/* Line paths */}
                    <path d={getPathString(onTrackPoints)} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                    <path d={getPathString(atRiskPoints)} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                    <path d={getPathString(delayedPoints)} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />

                    {/* Circles on dots */}
                    {onTrackPoints.map((p, i) => (
                      <circle key={`ot-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="#10B981" strokeWidth="2" />
                    ))}
                    {atRiskPoints.map((p, i) => (
                      <circle key={`ar-dot-${i}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
                    ))}
                    {delayedPoints.map((p, i) => (
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
    </div>
  );
}
