import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  CheckCircle2,
  Archive,
  Play,
  Trash2,
  AlertTriangle,
  Shield,
  Palette,
  Layers,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ProjectSettingsModal = () => {
  const {
    activeProject,
    projectSettingsModalOpen,
    setProjectSettingsModalOpen,
    updateProject,
    deleteProject,
    getUserRole,
  } = useProject();
  const { user } = useAuth();
  const toast = useToast();

  const userRole = getUserRole();
  const canManage = ['owner', 'admin'].includes(userRole) || user?.role === 'admin';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (activeProject && projectSettingsModalOpen) {
      setName(activeProject.name || '');
      setDescription(activeProject.description || '');
      setColor(activeProject.color || '#6366f1');
      setStatus(activeProject.status || 'active');
      setShowDeleteConfirm(false);
    }
  }, [activeProject, projectSettingsModalOpen]);

  if (!projectSettingsModalOpen || !activeProject) return null;

  const colorPresets = [
    '#6366f1', // Indigo
    '#0ea5e9', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#14b8a6', // Teal
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage) {
      toast.error('Only Project Owners and Admins can update project settings.');
      return;
    }

    if (!name.trim()) {
      toast.error('Project name cannot be empty');
      return;
    }

    setSaving(true);
    const res = await updateProject(activeProject._id, {
      name: name.trim(),
      description: description.trim(),
      color,
      status,
    });

    setSaving(false);
    if (res?.success) {
      if (status === 'completed' && activeProject.status !== 'completed') {
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#10b981', '#6366f1', '#38bdf8', '#fbbf24'],
          });
        } catch {}
      }
      setProjectSettingsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage) {
      toast.error('Only Project Owners and Admins have permission to delete this project.');
      return;
    }

    setDeleting(true);
    const res = await deleteProject(activeProject._id);
    setDeleting(false);
    if (res?.success) {
      setProjectSettingsModalOpen(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setProjectSettingsModalOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '90%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Project Settings</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage workspace status, permissions, and lifecycle
              </p>
            </div>
          </div>
          <button onClick={() => setProjectSettingsModalOpen(false)} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {!canManage && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(245, 158, 11, 0.1)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              fontSize: '0.8rem',
              color: '#fbbf24',
            }}
          >
            <Shield size={16} />
            <span>
              You are viewing as <strong>{userRole.toUpperCase()}</strong>. Only Project Owners and
              Admins can change settings or delete this project.
            </span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div
            className="modal-body"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}
          >
            {/* Project Status Lifecycle Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                Project Lifecycle & Status
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {/* Active */}
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setStatus('active')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '10px',
                    border:
                      status === 'active'
                        ? '2px solid #0ea5e9'
                        : '1px solid var(--border-color)',
                    background:
                      status === 'active'
                        ? 'rgba(14, 165, 233, 0.12)'
                        : 'var(--bg-surface)',
                    color: status === 'active' ? '#38bdf8' : 'var(--text-secondary)',
                    cursor: canManage ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Play size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Active</span>
                  <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>In development</span>
                </button>

                {/* Completed */}
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setStatus('completed')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '10px',
                    border:
                      status === 'completed'
                        ? '2px solid #10b981'
                        : '1px solid var(--border-color)',
                    background:
                      status === 'completed'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'var(--bg-surface)',
                    color: status === 'completed' ? '#34d399' : 'var(--text-secondary)',
                    cursor: canManage ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Completed</span>
                  <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Goals reached 🎉</span>
                </button>

                {/* Archived */}
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setStatus('archived')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '10px',
                    border:
                      status === 'archived'
                        ? '2px solid #f59e0b'
                        : '1px solid var(--border-color)',
                    background:
                      status === 'archived'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'var(--bg-surface)',
                    color: status === 'archived' ? '#fbbf24' : 'var(--text-secondary)',
                    cursor: canManage ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Archive size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Archived</span>
                  <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Read-only history</span>
                </button>
              </div>
            </div>

            {/* Project Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Project Name</label>
              <input
                type="text"
                required
                disabled={!canManage}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Project Description */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                disabled={!canManage}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the mission of this project?"
                className="form-textarea"
              />
            </div>

            {/* Theme Color Picker */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Palette size={14} />
                <span>Project Theme Accent</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={!canManage}
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: c,
                      border: color === c ? '3px solid #fff' : '2px solid transparent',
                      outline: color === c ? `2px solid ${c}` : 'none',
                      cursor: canManage ? 'pointer' : 'not-allowed',
                      transition: 'transform 0.15s ease',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Danger Zone (Delete Project) */}
            {canManage && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#f87171', fontWeight: 600 }}>
                      Danger Zone
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Permanently delete this project, boards, tasks, comments, and logs.
                    </p>
                  </div>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete Project</span>
                    </button>
                  ) : null}
                </div>

                {showDeleteConfirm && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#fca5a5', marginBottom: '0.625rem' }}>
                      ⚠️ Are you absolutely sure? This action is irreversible and all project data will be lost.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete Project'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ padding: '1rem 1.25rem' }}>
            <button
              type="button"
              onClick={() => setProjectSettingsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            {canManage && (
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Sparkles size={16} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
