import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Search,
  Check,
  Mail,
  ShieldCheck,
  RotateCcw,
  Eye,
  PlusCircle,
  Edit3,
  Move,
  MessageSquare,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useProject, DEFAULT_ROLE_PERMISSIONS } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const PERMISSION_CONFIG = [
  {
    key: 'viewTasks',
    label: 'View Tasks & Boards',
    desc: 'Access Kanban boards and inspect task cards',
    icon: <Eye size={16} color="#0ea5e9" />,
  },
  {
    key: 'createTasks',
    label: 'Create Tasks',
    desc: 'Add new task cards to sprint columns',
    icon: <PlusCircle size={16} color="#10b981" />,
  },
  {
    key: 'editTasks',
    label: 'Edit Task Details',
    desc: 'Change title, description, priority, dates, and assignees',
    icon: <Edit3 size={16} color="#6366f1" />,
  },
  {
    key: 'moveTasks',
    label: 'Move / Drag Tasks',
    desc: 'Reorder tasks and change sprint column status',
    icon: <Move size={16} color="#f59e0b" />,
  },
  {
    key: 'deleteTasks',
    label: 'Delete Tasks',
    desc: 'Permanently remove tasks from boards',
    icon: <Trash2 size={16} color="#f43f5e" />,
  },
  {
    key: 'createComments',
    label: 'Post Comments',
    desc: 'Participate in task comment threads',
    icon: <MessageSquare size={16} color="#8b5cf6" />,
  },
  {
    key: 'manageBoards',
    label: 'Manage Sprint Boards',
    desc: 'Create, rename, and delete sprint boards',
    icon: <Layers size={16} color="#ec4899" />,
  },
  {
    key: 'inviteMembers',
    label: 'Invite Teammates',
    desc: 'Invite new users and assign initial roles',
    icon: <UserPlus size={16} color="#14b8a6" />,
  },
];

export const ProjectMembersModal = () => {
  const {
    activeProject,
    membersModalOpen,
    setMembersModalOpen,
    inviteMember,
    updateMemberRole,
    removeMember,
    getUserRole,
    updateRolePermissions,
    resetRolePermissions,
  } = useProject();
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'permissions'

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  // User search directory
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Permissions Matrix Local State
  const [matrix, setMatrix] = useState(DEFAULT_ROLE_PERMISSIONS);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const currentUserRole = getUserRole();
  const canManageMembers = ['owner', 'admin'].includes(currentUserRole);

  useEffect(() => {
    if (activeProject) {
      setMatrix(activeProject.rolePermissions || DEFAULT_ROLE_PERMISSIONS);
    }
  }, [activeProject, membersModalOpen]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await api.get('/users/search', { params: { query: searchQuery.trim() } });
          setSearchResults(res.data.data.users || []);
        } catch (err) {
          console.error(err);
        } finally {
          setSearching(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && membersModalOpen) {
        setMembersModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [membersModalOpen, setMembersModalOpen]);

  if (!membersModalOpen || !activeProject) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    const result = await inviteMember(inviteEmail.trim(), inviteRole);
    setInviting(false);
    if (result.success) {
      setInviteEmail('');
      setSearchQuery('');
    }
  };

  const handleQuickAddUser = async (targetUser) => {
    setInviting(true);
    await inviteMember(targetUser.email, 'member');
    setInviting(false);
    setSearchQuery('');
  };

  const handleTogglePermission = async (role, permKey) => {
    if (!canManageMembers) return;
    const nextVal = !matrix[role]?.[permKey];
    const newMatrix = {
      ...matrix,
      [role]: {
        ...(matrix[role] || {}),
        [permKey]: nextVal,
      },
    };
    setMatrix(newMatrix);
    setSavingMatrix(true);
    await updateRolePermissions(newMatrix);
    setSavingMatrix(false);
  };

  const handleApplyPreset = async (presetMatrix, label) => {
    if (!canManageMembers) return;
    setMatrix(presetMatrix);
    setSavingMatrix(true);
    await updateRolePermissions(presetMatrix);
    setSavingMatrix(false);
  };

  const handleSaveMatrix = async () => {
    if (!canManageMembers) return;
    setSavingMatrix(true);
    await updateRolePermissions(matrix);
    setSavingMatrix(false);
  };

  const handleResetMatrix = async () => {
    if (!canManageMembers) return;
    setSavingMatrix(true);
    const res = await resetRolePermissions();
    if (res.success) {
      setMatrix(res.permissions);
    }
    setSavingMatrix(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => setMembersModalOpen(false)}>
      <div className="modal-content" style={{ maxWidth: '740px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {activeProject.name} — Workspace Team
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Role-Based Access Control & Granular Permissions
              </p>
            </div>
          </div>
          <button onClick={() => setMembersModalOpen(false)} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 1.5rem',
            gap: '1rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            style={{
              padding: '0.65rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'members' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'members' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Users size={15} />
            Team Members ({activeProject.members?.length || 1})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            style={{
              padding: '0.65rem 0.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'permissions' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'permissions' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <ShieldCheck size={15} />
            Permissions Matrix
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem 1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Invite Form (Admins/Owners only) */}
              {canManageMembers && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <UserPlus size={15} color="var(--primary)" /> Invite Teammate to Project
                  </div>

                  <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                      <input
                        type="email"
                        required
                        placeholder="Enter teammate email (or search below)..."
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          setSearchQuery(e.target.value);
                        }}
                        className="form-input"
                      />
                    </div>

                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="form-select"
                      style={{ width: 'auto', minWidth: '110px' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    <button type="submit" disabled={inviting || !inviteEmail.trim()} className="btn btn-primary">
                      {inviting ? 'Inviting...' : 'Invite'}
                    </button>
                  </form>

                  {/* Auto-suggest registered users dropdown */}
                  {searchResults.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '2px 6px' }}>
                        Quick-Add Registered User:
                      </div>
                      {searchResults.map((u) => (
                        <div
                          key={u._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                              src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                              alt={u.name}
                              className="avatar"
                              style={{ width: '22px', height: '22px' }}
                            />
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickAddUser(u)}
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Current Members List */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Project Team ({activeProject.members?.length || 1})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {activeProject.members?.map((m) => {
                    const memberUser = m.user;
                    const uid = memberUser?._id || memberUser;
                    const isOwner = m.role === 'owner' || activeProject.owner?._id === uid || activeProject.owner === uid;
                    const isSelf = user?.id === uid || user?._id === uid;

                    return (
                      <div
                        key={uid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.625rem 0.875rem',
                          borderRadius: '8px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={memberUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${memberUser?.name || 'User'}`}
                            alt={memberUser?.name}
                            className="avatar"
                            style={{ width: '32px', height: '32px' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span>{memberUser?.name || 'Teammate'}</span>
                              {isSelf && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '1px 5px', borderRadius: '4px' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {memberUser?.email || ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isOwner ? (
                            <span className="badge badge-urgent" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                              Owner
                            </span>
                          ) : canManageMembers && !isSelf ? (
                            <>
                              <select
                                value={m.role}
                                onChange={(e) => updateMemberRole(uid, e.target.value)}
                                className="form-select"
                                style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => removeMember(uid)}
                                className="btn-icon"
                                title="Remove member"
                                style={{ color: '#fb7185' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="badge badge-role" style={{ textTransform: 'capitalize' }}>
                              {m.role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERMISSIONS MATRIX */}
          {activeTab === 'permissions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Granular Workspace Permissions
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Toggle specific privileges for Admin, Member, and Viewer roles in this project.
                  </div>
                </div>

                {canManageMembers && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleResetMatrix}
                      disabled={savingMatrix}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      title="Reset to default permissions"
                    >
                      <RotateCcw size={13} /> Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMatrix}
                      disabled={savingMatrix}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                    >
                      <Check size={14} /> {savingMatrix ? 'Saving...' : 'Save Matrix'}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Presets */}
              {canManageMembers && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quick Presets:</span>
                  <button
                    type="button"
                    disabled={savingMatrix}
                    onClick={() => handleApplyPreset(DEFAULT_ROLE_PERMISSIONS, 'Default Agile')}
                    className="badge"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    ⚡ Default Agile
                  </button>

                  <button
                    type="button"
                    disabled={savingMatrix}
                    onClick={() =>
                      handleApplyPreset(
                        {
                          ...matrix,
                          member: {
                            ...matrix.member,
                            createTasks: false,
                          },
                        },
                        'Member Task Creation Disabled'
                      )
                    }
                    className="badge"
                    style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', cursor: 'pointer' }}
                  >
                    🚫 Block Member Task Creation
                  </button>

                  <button
                    type="button"
                    disabled={savingMatrix}
                    onClick={() =>
                      handleApplyPreset(
                        {
                          ...matrix,
                          member: {
                            ...matrix.member,
                            viewTasks: false,
                          },
                        },
                        'Member Task Viewing Disabled'
                      )
                    }
                    className="badge"
                    style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', cursor: 'pointer' }}
                  >
                    🚫 Hide Tasks from Member
                  </button>

                  <button
                    type="button"
                    disabled={savingMatrix}
                    onClick={() =>
                      handleApplyPreset(
                        {
                          ...matrix,
                          member: {
                            viewTasks: true,
                            createTasks: false,
                            editTasks: false,
                            deleteTasks: false,
                            moveTasks: false,
                            createComments: true,
                            deleteComments: false,
                            manageBoards: false,
                            inviteMembers: false,
                          },
                        },
                        'Read-Only Member'
                      )
                    }
                    className="badge"
                    style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', cursor: 'pointer' }}
                  >
                    🔒 Read-Only Member
                  </button>
                </div>
              )}

              {/* Matrix Table */}
              <div
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'var(--bg-surface)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1fr) 95px 95px 95px',
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border-color)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    alignItems: 'center',
                  }}
                >
                  <div>Capability / Action</div>
                  <div style={{ textAlign: 'center' }}>Admin</div>
                  <div style={{ textAlign: 'center' }}>Member</div>
                  <div style={{ textAlign: 'center' }}>Viewer</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {PERMISSION_CONFIG.map((perm, idx) => {
                    const isAdminChecked = Boolean(matrix.admin?.[perm.key]);
                    const isMemberChecked = Boolean(matrix.member?.[perm.key]);
                    const isViewerChecked = Boolean(matrix.viewer?.[perm.key]);

                    return (
                      <div
                        key={perm.key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(220px, 1fr) 95px 95px 95px',
                          padding: '0.75rem 1rem',
                          borderBottom: idx === PERMISSION_CONFIG.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                          alignItems: 'center',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                        }}
                      >
                        {/* Capability Label & Desc */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {perm.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {perm.label}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {perm.desc}
                            </div>
                          </div>
                        </div>

                        {/* Admin Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission('admin', perm.key)}
                            disabled={!canManageMembers || savingMatrix}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: canManageMembers ? 'pointer' : 'not-allowed',
                              border: isAdminChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                              background: isAdminChecked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                              color: isAdminChecked ? '#10b981' : 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              transition: 'all 0.15s ease',
                            }}
                            title={`Click to ${isAdminChecked ? 'Revoke' : 'Grant'} ${perm.label} for Admin`}
                          >
                            {isAdminChecked ? '✓ ON' : '✕ OFF'}
                          </button>
                        </div>

                        {/* Member Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission('member', perm.key)}
                            disabled={!canManageMembers || savingMatrix}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: canManageMembers ? 'pointer' : 'not-allowed',
                              border: isMemberChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                              background: isMemberChecked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                              color: isMemberChecked ? '#10b981' : 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              transition: 'all 0.15s ease',
                            }}
                            title={`Click to ${isMemberChecked ? 'Revoke' : 'Grant'} ${perm.label} for Member`}
                          >
                            {isMemberChecked ? '✓ ON' : '✕ OFF'}
                          </button>
                        </div>

                        {/* Viewer Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission('viewer', perm.key)}
                            disabled={!canManageMembers || savingMatrix}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: canManageMembers ? 'pointer' : 'not-allowed',
                              border: isViewerChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                              background: isViewerChecked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                              color: isViewerChecked ? '#10b981' : 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              transition: 'all 0.15s ease',
                            }}
                            title={`Click to ${isViewerChecked ? 'Revoke' : 'Grant'} ${perm.label} for Viewer`}
                          >
                            {isViewerChecked ? '✓ ON' : '✕ OFF'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info Note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <Sparkles size={14} color="var(--primary)" />
                <span>
                  <strong>Tip:</strong> Workspace Owners always maintain full root permissions. Revoking a permission (such as "View Tasks" from Member) takes effect immediately for team members across all project boards.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={() => setMembersModalOpen(false)} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersModal;
