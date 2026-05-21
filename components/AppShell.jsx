'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Hexagon, PanelLeft, Search, Plus, Bell, ChevronDown, 
  LayoutDashboard, Folder, Calendar, Users, BarChart2, 
  Sparkles, FileText, AlertCircle, Settings, Gem, Moon, ChevronRight, Clock, X
} from 'lucide-react';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [availableOwners, setAvailableOwners] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  
  const [formData, setFormData] = useState({
    title: '', description: '', type: '', owners: [], status: 'Not Started',
    startDate: '', endDate: '', uatDate: '', prodDate: '', dependencyWith: '', comments: '',
    progress: 0, priority: 'Medium', health: 'On Track'
  });

  useEffect(() => {
    fetchOwners();
    
    const handleOpenModal = (e) => {
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

    window.addEventListener('open-project-modal', handleOpenModal);
    return () => window.removeEventListener('open-project-modal', handleOpenModal);
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
            <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link href="/projects" className={`nav-item ${pathname === '/projects' ? 'active' : ''}`}>
              <Folder size={18} />
              <span>Projects</span>
              <ChevronDown size={14} className="nav-chevron" />
            </Link>
            <a href="#" className="nav-item">
              <Clock size={18} />
              <span>Timeline</span>
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
