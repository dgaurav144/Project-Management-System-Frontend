import React, { useState, useRef, useEffect } from 'react';
import {
  Kanban,
  Plus,
  Users,
  History,
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Sparkles,
  FolderKanban,
  Check,
  User,
  Shield,
  HelpCircle,
  Menu,
  Compass,
  Settings,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useBoard } from '../../context/BoardContext';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const Navbar = ({ onOpenActivity, onToggleMobileSidebar }) => {
  const { user, logout, openAuth, quickLogin } = useAuth();
  const {
    projects,
    activeProject,
    setActiveProject,
    setMembersModalOpen,
    setCreateProjectModalOpen,
    setProjectSettingsModalOpen,
    getUserRole,
    hasPermission,
  } = useProject();
  const { openCreateTask, filters, setFilters, openTour, setActivityDrawerOpen } = useBoard();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  const projectDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    if (next) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  const currentRole = getUserRole();

  const demoAccounts = [
    { name: 'Alex Rivers', email: 'admin@example.com', password: 'password123', role: 'Admin' },
    { name: 'Sarah Connor', email: 'sarah@example.com', password: 'password123', role: 'Owner' },
    { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'Member' },
    { name: 'Emily Chen', email: 'emily@example.com', password: 'password123', role: 'Member' },
  ];

  return (
    <header
      className="glass-panel"
      style={{
        height: '64px',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 50,
      }}
    >
      {/* Brand & Project Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="btn-icon mobile-menu-btn"
          title="Toggle Navigation Menu"
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Kanban size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
                Pulse<span style={{ color: 'var(--primary)' }}>Flow</span>
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  borderRadius: '9999px',
                }}
              >
                PRO
              </span>
            </div>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

        {/* Project Selector Dropdown */}
        {user && (
          <div style={{ position: 'relative' }} ref={projectDropdownRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: activeProject?.color || '#6366f1',
                  boxShadow: `0 0 8px ${activeProject?.color || '#6366f1'}`,
                }}
              />
              <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProject?.name || 'Select Project'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'var(--bg-badge)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {activeProject?.key || 'PRJ'}
              </span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {projectDropdownOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  width: '260px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  animation: 'scaleUp 0.15s ease',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    padding: '0.375rem 0.5rem',
                  }}
                >
                  Projects ({projects.length})
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {projects.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        setActiveProject(p);
                        setProjectDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.625rem',
                        borderRadius: '8px',
                        background: p._id === activeProject?._id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: 'none',
                        color: p._id === activeProject?._id ? '#818cf8' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: p.color || '#6366f1',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                      </div>
                      {p._id === activeProject?._id && <Check size={14} color="#818cf8" />}
                    </button>
                  ))}
                </div>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />

                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    setProjectSettingsModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.625rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  <Settings size={15} /> Project Settings & Lifecycle
                </button>

                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    setCreateProjectModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.625rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Create New Project
                </button>
              </div>
            )}
          </div>
        )}

        {/* Project Status Badge */}
        {activeProject?.status === 'completed' && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle2 size={12} />
            Completed
          </span>
        )}
        {activeProject?.status === 'archived' && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Archive size={12} />
            Archived
          </span>
        )}
      </div>

      {/* Global Quick Actions & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {user ? (
          <>
            {/* Quick Search */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                gap: '0.5rem',
                width: '200px',
              }}
            >
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  width: '100%',
                }}
              />
            </div>

            {/* Create Task Button (Only shown when user has createTasks permission) */}
            {hasPermission('createTasks') && (
              <button
                onClick={() => openCreateTask('todo')}
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8125rem' }}
                title="Create a new task card"
              >
                <Plus size={16} />
                <span>New Task</span>
              </button>
            )}

            {/* Project Members Button */}
            <button
              onClick={() => setMembersModalOpen(true)}
              className="btn btn-secondary"
              title="Project Members & Permissions"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <Users size={16} />
              <span>Members</span>
              <span
                style={{
                  background: 'var(--bg-badge)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '9999px',
                  padding: '0 6px',
                  fontSize: '0.75rem',
                  marginLeft: '2px',
                }}
              >
                {activeProject?.members?.length || 1}
              </span>
            </button>

            {/* Project Settings & Lifecycle Button */}
            <button
              onClick={() => setProjectSettingsModalOpen(true)}
              className="btn btn-secondary"
              title="Project Settings & Lifecycle (Owner / Admin)"
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
            >
              <Settings size={15} />
              <span>Settings</span>
            </button>

            {/* Interactive Tour Guide Button */}
            <button
              onClick={openTour}
              className="btn btn-secondary tour-guide-btn"
              title="Start Interactive Feature Tour"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#a5b4fc',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <Compass size={15} color="#818cf8" className="pulse-glow-icon" />
              <span className="tour-text">Tour Guide</span>
            </button>

            {/* Notifications & Mentions Center */}
            <NotificationCenter />

            {/* Activity Stream Button */}
            <button
              onClick={() => (onOpenActivity ? onOpenActivity() : setActivityDrawerOpen(true))}
              className="btn-icon"
              title="View Project Activity History"
              style={{ border: '1px solid var(--border-color)' }}
            >
              <History size={18} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-icon"
              title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              style={{ border: '1px solid var(--border-color)' }}
            >
              {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* User Profile & Demo Switcher */}
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                  alt={user.name}
                  className="avatar"
                  style={{ width: '34px', height: '34px' }}
                />
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '125%',
                    right: 0,
                    width: '260px',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    padding: '0.75rem',
                    animation: 'scaleUp 0.15s ease',
                    zIndex: 1000,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0.5rem' }}>
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                      className="avatar"
                      style={{ width: '40px', height: '40px' }}
                    />
                    <div style={{ overflow: 'hidden', minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {user.email}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge badge-role">
                          <Shield size={10} /> Role: {currentRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.625rem 0' }} />

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      width: '100%',
                      borderRadius: '8px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      color: '#fb7185',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => openAuth('login')} className="btn btn-secondary">
              Sign In
            </button>
            <button onClick={() => openAuth('register')} className="btn btn-primary">
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
