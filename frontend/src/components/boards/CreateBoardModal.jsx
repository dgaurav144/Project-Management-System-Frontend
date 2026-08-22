import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';

export const CreateBoardModal = () => {
  const { createBoardModalOpen, setCreateBoardModalOpen, createBoard } = useBoard();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (createBoardModalOpen) {
      setName('');
      setDescription('');
    }
  }, [createBoardModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && createBoardModalOpen) {
        setCreateBoardModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createBoardModalOpen, setCreateBoardModalOpen]);

  if (!createBoardModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    await createBoard({
      name: name.trim(),
      description: description.trim(),
    });
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => setCreateBoardModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Layers size={18} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Create New Board</h3>
          </div>
          <button onClick={() => setCreateBoardModalOpen(false)} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Board Name <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sprint 43, Bug Triage, Backlog"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                placeholder="What is this board for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setCreateBoardModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn btn-primary"
            >
              {submitting ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
