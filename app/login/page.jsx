'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hexagon, User, Shield, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'reportee'
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/owners');
      if (res.ok) {
        const data = await res.json();
        setOwners(data);
        if (data.length > 0) {
          setSelectedOwner(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleRoleSelect = (role) => {
    setActiveTab(role);
    setError('');
    setIsFlipped(true);
  };

  const handleBackToRoles = () => {
    setIsFlipped(false);
    setError('');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (adminUsername === 'admin' && adminPassword === 'admin') {
        const userData = {
          name: 'Admin',
          role: 'admin',
          avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=6366F1&color=ffffff&bold=true'
        };
        localStorage.setItem('project_tracker_user', JSON.stringify(userData));
        router.push('/');
      } else {
        setError('Invalid username or password. (Hint: use admin / admin)');
        setLoading(false);
      }
    }, 600);
  };

  const handleReporteeLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const finalName = customName.trim() || selectedOwner;
    
    if (!finalName) {
      setError('Please select or type a team member name.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const userData = {
        name: finalName,
        role: 'reportee',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=E2E8F0&color=475569&bold=true`
      };
      localStorage.setItem('project_tracker_user', JSON.stringify(userData));
      router.push('/');
    }, 400);
  };

  return (
    <div className="login-page-container">
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>
      
      <div className={`login-card-perspective ${isFlipped ? 'flipped' : ''}`}>
        <div className="login-card-inner">
          
          {/* FRONT SIDE - Role Selection */}
          <div className="login-card-front glass-panel">
            <div className="login-header">
              <div className="login-logo-animated">
                <Hexagon size={36} fill="currentColor" className="logo-icon" />
              </div>
              <h1>Project Tracker</h1>
              <span className="v2-tag">V2</span>
              <p className="login-subtitle">Sign in to manage and track portfolio deliveries</p>
            </div>

            <div className="role-selection-prompt">
              <h2>Select Login Access</h2>
              <p>Choose your access role to proceed to authentication</p>
            </div>
            
            <div className="role-selection-container">
              <button 
                type="button" 
                className="role-select-card admin-card"
                onClick={() => handleRoleSelect('admin')}
              >
                <div className="role-icon-wrapper admin-icon">
                  <Shield size={24} />
                </div>
                <div className="role-info">
                  <h3>Administrator</h3>
                  <p>Create & modify projects, manage schedules</p>
                </div>
                <ArrowRight size={18} className="arrow-icon" />
              </button>
              
              <button 
                type="button" 
                className="role-select-card member-card"
                onClick={() => handleRoleSelect('reportee')}
              >
                <div className="role-icon-wrapper member-icon">
                  <User size={24} />
                </div>
                <div className="role-info">
                  <h3>Team Member</h3>
                  <p>View assignments, update task status & timelines</p>
                </div>
                <ArrowRight size={18} className="arrow-icon" />
              </button>
            </div>
          </div>
          
          {/* BACK SIDE - Login Form */}
          <div className="login-card-back glass-panel">
            <div className="back-header">
              <button type="button" className="back-arrow-btn" onClick={handleBackToRoles} aria-label="Go back">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <div className="back-title-wrapper">
                <h2>{activeTab === 'admin' ? 'Administrator Login' : 'Team Member Login'}</h2>
                <p className="back-subtitle">
                  {activeTab === 'admin' ? 'Verify system credentials' : 'Select or register your name'}
                </p>
              </div>
            </div>

            {error && (
              <div className="login-error-box">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'admin' ? (
              <form onSubmit={handleAdminLogin} className="login-form">
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    placeholder="Enter admin username"
                  />
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      placeholder="Enter admin password"
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In as Admin'}
                  {!loading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReporteeLogin} className="login-form">
                <div className="form-group">
                  <label>Select Your Name</label>
                  <select 
                    value={selectedOwner} 
                    onChange={(e) => {
                      setSelectedOwner(e.target.value);
                      if (e.target.value) setCustomName('');
                    }}
                    disabled={owners.length === 0}
                  >
                    {owners.length === 0 ? (
                      <option value="">No registered members</option>
                    ) : (
                      owners.map(owner => (
                        <option key={owner} value={owner}>{owner}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="divider-text">
                  <span>OR CREATE NEW</span>
                </div>

                <div className="form-group">
                  <label>Enter New Name</label>
                  <input 
                    type="text" 
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Type your name to sign in"
                  />
                </div>

                <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                  {loading ? 'Logging in...' : 'Sign In as Team Member'}
                  {!loading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
                </button>
              </form>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
