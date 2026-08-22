import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Flame, Users, Clock, Tag } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import { useProject } from '../../context/ProjectContext';

export const CreateTaskModal = () => {
  const { createTaskModalOpen, setCreateTaskModalOpen, createTaskDefaultStatus, createTask } = useBoard();
  const { activeProject, hasPermission, getUserRole } = useProject();

  const userRole = getUserRole();
  const canCreate = hasPermission('createTasks');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [tagsInput, setTagsInput] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (createTaskModalOpen) {
      setStatus(createTaskDefaultStatus || 'todo');
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignees([]);
      setTagsInput('');
      setEstimatedHours('');
    }
  }, [createTaskModalOpen, createTaskDefaultStatus]);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && createTaskModalOpen) {
        setCreateTaskModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createTaskModalOpen, setCreateTaskModalOpen]);

  if (!createTaskModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !canCreate) return;

    setSubmitting(true);
    const rawTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#+/, ''))
      .filter(Boolean);
    const tagsArray = Array.from(new Set(rawTags));

    const res = await createTask({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null,
      assignees,
      tags: tagsArray,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
    });

    setSubmitting(false);
    if (res?.success) {
      setTitle('');
      setDescription('');
    }
  };

  const handleToggleAssignee = (userId) => {
    if (assignees.includes(userId)) {
      setAssignees(assignees.filter((id) => id !== userId));
    } else {
      setAssignees([...assignees, userId]);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setCreateTaskModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Create New Task</h3>
          <button onClick={() => setCreateTaskModalOpen(false)} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!canCreate && (
              <div
                style={{
                  padding: '0.625rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                ⚠️ Task creation has been restricted for your role ({userRole}) in this workspace.
              </div>
            )}

            {/* Title */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Task Title <span style={{ color: '#fb7185' }}>*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canCreate}
                placeholder="e.g. Implement OAuth 2.0 Google Login"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                placeholder="Provide task details, acceptance criteria, or background notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
              />
            </div>

            {/* Status & Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="form-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Due Date & Estimated Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Estimated Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 6"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Assignees */}
            {activeProject?.members && activeProject.members.length > 0 && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Assignees</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {activeProject.members.map((m) => {
                    const uid = m.user?._id || m.user;
                    const isSelected = assignees.includes(uid);
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => handleToggleAssignee(uid)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-color)',
                          color: isSelected ? '#a5b4fc' : 'var(--text-secondary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <img
                          src={m.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user?.name || 'User'}`}
                          alt={m.user?.name}
                          className="avatar"
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span>{m.user?.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. backend, security, stripe"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setCreateTaskModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !canCreate}
              className="btn btn-primary"
              title={!canCreate ? 'Task creation is restricted for your role' : 'Create Task'}
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
