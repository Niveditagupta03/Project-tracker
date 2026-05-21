'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Hexagon, Search, Plus, Bell, ChevronDown, 
  LayoutDashboard, Folder, Calendar, Users, BarChart2, 
  Sparkles, FileText, AlertCircle, Settings, Gem, Moon, ChevronRight, Clock, X, LogOut
} from 'lucide-react';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [availableOwners, setAvailableOwners] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  
  const [formData, setFormData] = useState({
    title: '', description: '', type: '', owners: [], status: 'Not Started',
    startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: '',
    progress: 0, priority: 'Medium', health: 'On Track'
  });

  useEffect(() => {
    const loggedUser = localStorage.getItem('project_tracker_user');
    if (!loggedUser) {
      if (pathname !== '/login') {
        router.push('/login');
      }
    } else {
      const parsedUser = JSON.parse(loggedUser);
      setCurrentUser(parsedUser);
      if (pathname === '/login') {
        router.push('/');
      }
    }
  }, [pathname]);

  useEffect(() => {
    fetchOwners();
    
    const handleOpenModal = (e) => {
      const loggedUser = localStorage.getItem('project_tracker_user');
      const parsed = loggedUser ? JSON.parse(loggedUser) : null;
      if (!parsed || parsed.role !== 'admin') {
        return; // Only admin can create/edit projects
      }

      const project = e.detail?.project;
      if (project) {
        setFormData({
          id: project.id,
          title: project.title || '',
          description: project.description || '',
          type: project.type || '',
          owners: project.owner ? project.owner.split(', ') : [],
          status: project.status || 'Not Started',
          startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
          endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
          uatDate: project.uatDate ? new Date(project.uatDate).toISOString().split('T')[0] : '',
          prodDate: project.prodDate ? new Date(project.prodDate).toISOString().split('T')[0] : '',
          dependencyWith: project.dependencyWith || '',
          comments: project.comments || '',
          progress: project.progress || 0,
          priority: project.priority || 'Medium',
          health: project.health || 'On Track'
        });
      } else {
        setFormData({
          title: '', description: '', type: '', owners: [], status: 'Not Started',
          startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: '',
          progress: 0, priority: 'Medium', health: 'On Track'
        });
      }
      setShowModal(true);
    };

    const handleOutsideClick = (e) => {
      if (!e.target.closest('.profile-section')) {
        setShowProfileDropdown(false);
      }
    };

    window.addEventListener('open-project-modal', handleOpenModal);
    document.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('open-project-modal', handleOpenModal);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

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

  const openNewModal = () => {
    setFormData({
      title: '', description: '', type: '', owners: [], status: 'Not Started',
      startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: '',
      progress: 0, priority: 'Medium', health: 'On Track'
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOwnerToggle = (ownerName) => {
    setFormData(prev => {
      const current = prev.owners || [];
      if (current.includes(ownerName)) {
        return { ...prev, owners: current.filter(o => o !== ownerName) };
      } else {
        return { ...prev, owners: [...current, ownerName] };
      }
    });
  };

  const handleAddPerson = () => {
    if (newPersonName.trim() && !availableOwners.includes(newPersonName.trim())) {
      setAvailableOwners([...availableOwners, newPersonName.trim()]);
      handleOwnerToggle(newPersonName.trim());
      setNewPersonName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, owner: formData.owners.join(', ') };
      
      let res;
      if (formData.id) {
        res = await fetch(`/api/projects/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        setShowModal(false);
        window.dispatchEvent(new Event('project-updated'));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  if (pathname === '/login') {
    return <div className="login-route-wrapper">{children}</div>;
  }

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      <header className="top-nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', width: '25%' }}>
          <div className="logo-icon">
            <Hexagon size={20} fill="currentColor" />
          </div>
          <span className="nav-title" style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Project Tracker</span>
          <span className="v2-badge" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>V2</span>
        </div>
        
        <div className="nav-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <nav className="header-nav">
            <Link href="/" className={`header-nav-item ${pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
            <Link href="/projects" className={`header-nav-item ${pathname === '/projects' || pathname.startsWith('/project/') ? 'active' : ''}`}>
              <Folder size={15} />
              <span>Projects</span>
            </Link>
            <Link href="/timeline" className={`header-nav-item ${pathname === '/timeline' ? 'active' : ''}`}>
              <Clock size={15} />
              <span>Timeline</span>
            </Link>
          </nav>
        </div>
        
        <div className="nav-right">
          {currentUser?.role === 'admin' && (
            <button className="btn btn-primary" onClick={openNewModal}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              New Project
            </button>
          )}
          
          <button className="icon-btn notification-btn">
            <Bell size={20} />
            <span className="notification-dot">6</span>
          </button>
          
          <div className="profile-section" onClick={() => setShowProfileDropdown(!showProfileDropdown)} style={{ position: 'relative', cursor: 'pointer' }}>
            <div className="avatar">
              <img src={currentUser?.avatarUrl || "https://ui-avatars.com/api/?name=Admin&background=E2E8F0&color=475569"} alt="User" />
            </div>
            <div className="profile-info">
              <span className="profile-name">{currentUser?.name || 'Loading...'}</span>
              <span className="profile-role">
                {currentUser?.role === 'admin' ? 'Super Admin' : 'Team Member'}
              </span>
            </div>
            <ChevronDown size={14} className="chevron" />

            {showProfileDropdown && (
              <div className="profile-dropdown glass-panel" style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                padding: '0.5rem',
                zIndex: 200,
                minWidth: '130px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <button 
                  onClick={() => {
                    localStorage.removeItem('project_tracker_user');
                    router.push('/login');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem 0.75rem',
                    color: '#EF4444',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: '0.35rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#FEF2F2'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
 
      <div className="content-wrapper" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className="main-wrapper">
          {children}
        </div>
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
                <div className="form-group col-span-2">
                  <label>Owners</label>
                  
                  {formData.owners && formData.owners.length > 0 && (
                    <div className="selected-owners-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      {formData.owners.map(owner => (
                        <span key={owner} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#EEF2FF', color: '#4F46E5', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '600', border: '1px solid #C7D2FE' }}>
                          {owner}
                          <button type="button" onClick={() => handleOwnerToggle(owner)} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', color: '#6366F1', cursor: 'pointer' }}>
                            <X size={12} strokeWidth={3} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="checkbox-list" style={{ maxHeight: '120px' }}>
                    {availableOwners.map(owner => (
                      <div key={owner} className="checkbox-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                        <label className="checkbox-item" style={{ margin: 0, flex: 1 }}>
                          <input 
                            type="checkbox" 
                            checked={formData.owners.includes(owner)} 
                            onChange={() => handleOwnerToggle(owner)} 
                          />
                          {owner}
                        </label>
                        <button 
                          type="button" 
                          className="icon-btn" 
                          style={{ padding: '2px', opacity: 0.6 }} 
                          title="Remove from list"
                          onClick={() => {
                            setAvailableOwners(availableOwners.filter(o => o !== owner));
                            if (formData.owners.includes(owner)) {
                              handleOwnerToggle(owner);
                            }
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
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
                  <select name="type" value={formData.type} onChange={handleFormChange}>
                    <option value="">Select Type</option>
                    <option value="BAU">BAU</option>
                    <option value="CR/New Requriment">CR/New Requriment</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="UAT">UAT</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Blocked">Blocked</option>
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

                <div className="form-group">
                  <label>Dependency With</label>
                  <input type="text" name="dependencyWith" value={formData.dependencyWith} onChange={handleFormChange} />
                </div>

                <div className="form-group col-span-2">
                  <label>Comments</label>
                  <textarea name="comments" value={formData.comments} onChange={handleFormChange} rows={2} />
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
