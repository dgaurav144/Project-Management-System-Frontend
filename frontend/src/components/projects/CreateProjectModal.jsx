import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Sparkles } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

export const CreateProjectModal = () => {
  const { createProjectModalOpen, setCreateProjectModalOpen, createProject } = useProject();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (createProjectModalOpen) {
      setName('');
      setKey('');
      setDescription('');
      setColor('#6366f1');
    }
  }, [createProjectModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && createProjectModalOpen) {
        setCreateProjectModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createProjectModalOpen, setCreateProjectModalOpen]);

  if (!createProjectModalOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!key || key === name.substring(0, 4).toUpperCase()) {
      setKey(val.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    await createProject({
      name: name.trim(),
      key: key.trim().toUpperCase() || 'PRJ',
      description: description.trim(),
      color,
    });
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => setCreateProjectModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <FolderKanban size={18} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Create New Project</h3>
          </div>
          <button onClick={() => setCreateProjectModalOpen(false)} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Project Name <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Next-Gen Mobile Banking"
                value={name}
                onChange={handleNameChange}
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Project Key (Prefix for tasks) <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. BANK"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                placeholder="What is this project about? Objectives, targets..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
              />
            </div>

            {/* Color Accent Picker */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Project Theme Color</label>
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '3px solid #fff' : '2px solid transparent',
                      boxShadow: color === c ? `0 0 10px ${c}` : 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setCreateProjectModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn btn-primary"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
