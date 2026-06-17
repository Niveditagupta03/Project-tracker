'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hexagon, User, Shield, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'reportee'
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Team Member Form State
  const [memberMode, setMemberMode] = useState('login'); // 'login' or 'register'
  const [memberUsername, setMemberUsername] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);

  // Registration Form State
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setSuccessMessage('');
    setIsFlipped(true);
  };

  const handleBackToRoles = () => {
    setIsFlipped(false);
    setError('');
    setSuccessMessage('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('project_tracker_user', JSON.stringify(data));
        sessionStorage.setItem('show_login_welcome', 'true');
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: memberUsername, password: memberPassword })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('project_tracker_user', JSON.stringify(data));
        sessionStorage.setItem('show_login_welcome', 'true');
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    const finalName = customName.trim();
    if (!finalName) {
      setError('Please enter a display name.');
      return;
    }

    if (!registerUsername.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (!registerPassword) {
      setError('Please enter a password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          username: registerUsername,
          password: registerPassword,
          role: 'reportee'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Account created successfully! Log in below.');
        setMemberUsername(registerUsername); // prefill username
        setMemberMode('login'); // switch to login tab
        // Clear registration fields
        setRegisterUsername('');
        setRegisterPassword('');
        setCustomName('');
        // Refresh owners list in case a new name was registered
        fetchOwners();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>

      {/* Animated background marquee text */}
      <div className="login-bg-marquee" aria-hidden="true">
        <div className="marquee-row">
          <div className="marquee-track marquee-ltr" style={{animationDuration: '30s'}}>
            <span className="marquee-content">Project Tracker &nbsp;&bull;&nbsp; Milestone Management &nbsp;&bull;&nbsp; Team Bandwidth &nbsp;&bull;&nbsp; Delivery Timelines &nbsp;&bull;&nbsp; Status Reporting &nbsp;&bull;&nbsp; Portfolio Overview &nbsp;&bull;&nbsp; Resource Planning &nbsp;&bull;&nbsp; Risk Tracking &nbsp;&nbsp;&nbsp;</span>
            <span className="marquee-content">Project Tracker &nbsp;&bull;&nbsp; Milestone Management &nbsp;&bull;&nbsp; Team Bandwidth &nbsp;&bull;&nbsp; Delivery Timelines &nbsp;&bull;&nbsp; Status Reporting &nbsp;&bull;&nbsp; Portfolio Overview &nbsp;&bull;&nbsp; Resource Planning &nbsp;&bull;&nbsp; Risk Tracking &nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>
        <div className="marquee-row">
          <div className="marquee-track marquee-rtl" style={{animationDuration: '40s'}}>
            <span className="marquee-content">Sprint Planning &nbsp;&bull;&nbsp; Gantt Charts &nbsp;&bull;&nbsp; Progress Metrics &nbsp;&bull;&nbsp; Admin Controls &nbsp;&bull;&nbsp; Deadline Alerts &nbsp;&bull;&nbsp; Workload Balance &nbsp;&bull;&nbsp; Project Health &nbsp;&bull;&nbsp; Task Dependencies &nbsp;&nbsp;&nbsp;</span>
            <span className="marquee-content">Sprint Planning &nbsp;&bull;&nbsp; Gantt Charts &nbsp;&bull;&nbsp; Progress Metrics &nbsp;&bull;&nbsp; Admin Controls &nbsp;&bull;&nbsp; Deadline Alerts &nbsp;&bull;&nbsp; Workload Balance &nbsp;&bull;&nbsp; Project Health &nbsp;&bull;&nbsp; Task Dependencies &nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>
        <div className="marquee-row">
          <div className="marquee-track marquee-ltr" style={{animationDuration: '35s'}}>
            <span className="marquee-content">Real-time Updates &nbsp;&bull;&nbsp; Role-based Access &nbsp;&bull;&nbsp; Data Insights &nbsp;&bull;&nbsp; Export Reports &nbsp;&bull;&nbsp; Notification Center &nbsp;&bull;&nbsp; Project Assignments &nbsp;&bull;&nbsp; Timeline View &nbsp;&bull;&nbsp; Team Directory &nbsp;&nbsp;&nbsp;</span>
            <span className="marquee-content">Real-time Updates &nbsp;&bull;&nbsp; Role-based Access &nbsp;&bull;&nbsp; Data Insights &nbsp;&bull;&nbsp; Export Reports &nbsp;&bull;&nbsp; Notification Center &nbsp;&bull;&nbsp; Project Assignments &nbsp;&bull;&nbsp; Timeline View &nbsp;&bull;&nbsp; Team Directory &nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>
        <div className="marquee-row">
          <div className="marquee-track marquee-rtl" style={{animationDuration: '45s'}}>
            <span className="marquee-content">Bandwidth Utilization &nbsp;&bull;&nbsp; Completion Rates &nbsp;&bull;&nbsp; Stakeholder Reports &nbsp;&bull;&nbsp; Project Milestones &nbsp;&bull;&nbsp; Owner Assignments &nbsp;&bull;&nbsp; Schedule Tracking &nbsp;&bull;&nbsp; Collaboration Hub &nbsp;&bull;&nbsp; Smart Filters &nbsp;&nbsp;&nbsp;</span>
            <span className="marquee-content">Bandwidth Utilization &nbsp;&bull;&nbsp; Completion Rates &nbsp;&bull;&nbsp; Stakeholder Reports &nbsp;&bull;&nbsp; Project Milestones &nbsp;&bull;&nbsp; Owner Assignments &nbsp;&bull;&nbsp; Schedule Tracking &nbsp;&bull;&nbsp; Collaboration Hub &nbsp;&bull;&nbsp; Smart Filters &nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>
      </div>

      
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
          
          {/* BACK SIDE - Login / Register Form */}
          <div className="login-card-back glass-panel">
            <div className="back-header">
              <button type="button" className="back-arrow-btn" onClick={handleBackToRoles} aria-label="Go back">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <div className="back-title-wrapper">
                <h2>{activeTab === 'admin' ? 'Administrator Login' : 'Team Member Space'}</h2>
                <p className="back-subtitle">
                  {activeTab === 'admin' 
                    ? 'Verify system credentials' 
                    : memberMode === 'login' 
                      ? 'Sign in to access your dashboard' 
                      : 'Create a new team member account'}
                </p>
              </div>
            </div>

            {error && (
              <div className="login-error-box">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="login-error-box" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="auth-sub-tabs">
                  <button 
                    type="button"
                    className={`auth-sub-tab ${memberMode === 'login' ? 'active' : ''}`}
                    onClick={() => {
                      setMemberMode('login');
                      setError('');
                      setSuccessMessage('');
                    }}
                  >
                    Log In
                  </button>
                  <button 
                    type="button"
                    className={`auth-sub-tab ${memberMode === 'register' ? 'active' : ''}`}
                    onClick={() => {
                      setMemberMode('register');
                      setError('');
                      setSuccessMessage('');
                    }}
                  >
                    Register
                  </button>
                </div>

                {memberMode === 'login' ? (
                  <form onSubmit={handleMemberLogin} className="login-form">
                    <div className="form-group">
                      <label>Username</label>
                      <input 
                        type="text" 
                        value={memberUsername}
                        onChange={(e) => setMemberUsername(e.target.value)}
                        required
                        placeholder="Enter your username"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Password</label>
                      <div className="password-input-wrapper">
                        <input 
                          type={showMemberPassword ? 'text' : 'password'} 
                          value={memberPassword}
                          onChange={(e) => setMemberPassword(e.target.value)}
                          required
                          placeholder="Enter your password"
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowMemberPassword(!showMemberPassword)}
                        >
                          {showMemberPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                      {loading ? 'Logging in...' : 'Sign In as Team Member'}
                      {!loading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleMemberRegister} className="login-form compact">
                    <div className="form-group">
                      <label>Display Name</label>
                      <input 
                        type="text" 
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Enter your display name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Username</label>
                      <input 
                        type="text" 
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                        placeholder="Choose a username"
                      />
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <div className="password-input-wrapper">
                        <input 
                          type={showRegisterPassword ? 'text' : 'password'} 
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          placeholder="Choose a password"
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                      {!loading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}