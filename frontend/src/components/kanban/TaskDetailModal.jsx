import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Users,
  Flame,
  CheckSquare,
  MessageSquare,
  History,
  Trash2,
  Send,
  Clock,
  Tag,
  Plus,
  Edit2,
  Check,
  AtSign,
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import api, { getErrorMessage } from '../../services/api';
import { useBoard } from '../../context/BoardContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const TaskDetailModal = () => {
  const { selectedTask, setSelectedTask, updateTask, deleteTask } = useBoard();
  const { activeProject, getUserRole, hasPermission } = useProject();
  const { user } = useAuth();
  const toast = useToast();

  // Tab & Title Edit States
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'comments' | 'activity'
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [loggedHours, setLoggedHours] = useState(0);

  // Comments State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  // Activity History State
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const userRole = getUserRole();
  const canEdit = hasPermission('editTasks');
  const canDelete = hasPermission('deleteTasks');
  const canComment = hasPermission('createComments');
  const canMove = hasPermission('moveTasks');

  const fetchComments = async (taskId) => {
    if (!taskId) return;
    try {
      setLoadingComments(true);
      const res = await api.get(`/comments/task/${taskId}`);
      setComments(res.data.data.comments || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchActivities = async (taskId) => {
    if (!taskId) return;
    try {
      setLoadingActivities(true);
      const res = await api.get(`/tasks/${taskId}/activity`);
      setActivities(res.data.data.activities || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title || '');
      setDescription(selectedTask.description || '');
      setStatus(selectedTask.status || 'todo');
      setPriority(selectedTask.priority || 'medium');
      setDueDate(selectedTask.dueDate ? selectedTask.dueDate.substring(0, 10) : '');
      setAssignees(selectedTask.assignees?.map((a) => a._id || a) || []);
      setSubtasks(selectedTask.subtasks || []);
      setTags(selectedTask.tags || []);
      setEstimatedHours(selectedTask.estimatedHours || 0);
      setLoggedHours(selectedTask.loggedHours || 0);
      setNewComment('');
      setSelectedMentions([]);
      setShowMentionDropdown(false);
      fetchComments(selectedTask._id);
      fetchActivities(selectedTask._id);
    }
  }, [selectedTask]);

  // Global ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTask && !isEditingTitle) {
        setSelectedTask(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask, isEditingTitle, setSelectedTask]);

  // Early return ONLY after all Hooks are registered
  if (!selectedTask) return null;

  const formatDateSafe = (dateVal) => {
    if (!dateVal) return 'Just now';
    try {
      const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
      if (isNaN(d.getTime())) return 'Just now';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const handleSaveField = async (fields) => {
    if (!canEdit) return;
    await updateTask(selectedTask._id, fields);
    fetchActivities(selectedTask._id);
  };

  const handleSaveTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('Task title cannot be empty');
      setTitle(selectedTask.title || '');
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    handleSaveField({ title: trimmed });
  };

  const handleLogHour = async (amount = 1) => {
    if (!canEdit) return;
    const newLogged = Math.max(0, (loggedHours || 0) + amount);
    setLoggedHours(newLogged);
    await handleSaveField({ loggedHours: newLogged });
  };

  const handleCommentInputChange = (e) => {
    const val = e.target.value;
    setNewComment(val);

    const words = val.split(/\s/);
    const lastWord = words[words.length - 1];
    if (lastWord && lastWord.startsWith('@')) {
      setMentionQuery(lastWord.substring(1).toLowerCase());
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMention = (member) => {
    const memberName = member.user?.name || 'User';
    const memberId = member.user?._id || member.user;

    const words = newComment.split(/\s/);
    if (words.length > 0 && words[words.length - 1].startsWith('@')) {
      words[words.length - 1] = `@${memberName}`;
    } else {
      words.push(`@${memberName}`);
    }

    setNewComment(words.join(' ') + ' ');
    if (!selectedMentions.includes(memberId)) {
      setSelectedMentions([...selectedMentions, memberId]);
    }
    setShowMentionDropdown(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      const res = await api.post(`/comments/task/${selectedTask._id}`, {
        content: newComment.trim(),
        mentions: selectedMentions,
      });
      setComments((prev) => [...prev, res.data.data.comment]);
      setNewComment('');
      setSelectedMentions([]);
      setShowMentionDropdown(false);
      toast.success('Comment posted');
      fetchActivities(selectedTask._id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post comment'));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete comment'));
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    if (!canEdit) return;
    const updated = subtasks.map((s) => (s._id === subtaskId ? { ...s, completed: !s.completed } : s));
    setSubtasks(updated);
    await handleSaveField({ subtasks: updated });
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !canEdit) return;
    const updated = [...subtasks, { title: newSubtaskTitle.trim(), completed: false }];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    await handleSaveField({ subtasks: updated });
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!canEdit) return;
    const updated = subtasks.filter((s) => s._id !== subtaskId);
    setSubtasks(updated);
    await handleSaveField({ subtasks: updated });
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const cleanTag = newTag.trim().toLowerCase().replace(/^#+/, '');
    if (!cleanTag || tags.includes(cleanTag) || !canEdit) return;
    const updated = [...tags, cleanTag];
    setTags(updated);
    setNewTag('');
    handleSaveField({ tags: updated });
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!canEdit) return;
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    handleSaveField({ tags: updated });
  };

  const handleToggleAssignee = (userId) => {
    if (!canEdit) return;
    let updated;
    if (assignees.includes(userId)) {
      updated = assignees.filter((id) => id !== userId);
    } else {
      updated = [...assignees, userId];
    }
    setAssignees(updated);
    handleSaveField({ assignees: updated });
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(selectedTask._id);
      setSelectedTask(null);
    }
  };

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={() => setSelectedTask(null)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem' }}>
          <div style={{ flex: 1, marginRight: '1rem' }}>
            {isEditingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="form-input"
                  style={{ fontSize: '1.25rem', fontWeight: 700, padding: '0.35rem 0.6rem' }}
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="btn-icon" title="Save Title">
                  <Check size={18} color="var(--primary)" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  onClick={() => canEdit && setIsEditingTitle(true)}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    cursor: canEdit ? 'pointer' : 'default',
                    lineHeight: 1.3,
                  }}
                  title={canEdit ? 'Click to edit task title' : undefined}
                >
                  {selectedTask.title}
                </h2>
                {canEdit && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="btn-icon"
                    style={{ padding: '2px' }}
                    title="Edit title"
                  >
                    <Edit2 size={14} color="var(--text-muted)" />
                  </button>
                )}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Created {formatDateSafe(selectedTask.createdAt)}</span>
              {selectedTask.creator && <span>• by {selectedTask.creator.name || 'Author'}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {canDelete && (
              <button
                onClick={handleDelete}
                className="btn-icon"
                style={{ color: '#fb7185' }}
                title="Delete Task"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={() => setSelectedTask(null)} className="btn-icon">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1.5rem', gap: '1.5rem' }}>
          {[
            { key: 'details', label: 'Details', icon: <CheckSquare size={16} /> },
            { key: 'comments', label: `Comments (${comments.length})`, icon: <MessageSquare size={16} /> },
            { key: 'activity', label: 'History', icon: <History size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 0.25rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Description & Subtasks & Tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Description */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description</label>
                  <textarea
                    rows={4}
                    placeholder={canEdit ? 'Add more context, acceptance criteria, or technical details...' : 'No description provided.'}
                    value={description}
                    disabled={!canEdit}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => handleSaveField({ description })}
                    className="form-textarea"
                  />
                </div>

                {/* Subtask Checklist */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Subtasks ({completedSubtasks}/{subtasks.length})
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {subtaskPercent}%
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: `${subtaskPercent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Checklist Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {subtasks.map((s) => (
                      <div
                        key={s._id || s.title}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: canEdit ? 'pointer' : 'default', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={s.completed}
                            disabled={!canEdit}
                            onChange={() => handleToggleSubtask(s._id)}
                            style={{ width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                          />
                          <span style={{ fontSize: '0.85rem', textDecoration: s.completed ? 'line-through' : 'none', color: s.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                            {s.title}
                          </span>
                        </label>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteSubtask(s._id)}
                            className="btn-icon"
                            style={{ padding: '2px', color: 'var(--text-muted)' }}
                            title="Delete subtask"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Subtask Input */}
                  {canEdit && (
                    <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Add subtask item..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        className="form-input"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8125rem' }}
                      />
                      <button type="submit" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }}>
                        <Plus size={14} /> Add
                      </button>
                    </form>
                  )}
                </div>

                {/* Tags List */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tags & Labels</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: canEdit ? '0.5rem' : 0 }}>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#a5b4fc',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        #{tag}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            style={{ background: 'transparent', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0 }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                    {tags.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No tags added</span>}
                  </div>

                  {canEdit && (
                    <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="New tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="form-input"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8125rem' }}
                      />
                      <button type="submit" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }}>
                        <Plus size={14} /> Tag
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column: Status, Priority, Due Date, Assignees, Time Tracking */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.125rem',
                  padding: '1.25rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Status Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setStatus(newStatus);
                      const colMap = {
                        todo: 'col-todo',
                        'in-progress': 'col-inprogress',
                        review: 'col-review',
                        done: 'col-done',
                      };
                      handleSaveField({
                        status: newStatus,
                        columnId: colMap[newStatus] || `col-${newStatus}`,
                      });
                    }}
                    className="form-select"
                    disabled={!canEdit}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      handleSaveField({ priority: e.target.value });
                    }}
                    className="form-select"
                    disabled={!canEdit}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Due Date Picker */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      handleSaveField({ dueDate: e.target.value || null });
                    }}
                    className="form-input"
                    disabled={!canEdit}
                  />
                </div>

                {/* Assignees Selector */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Assignees</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {activeProject?.members?.map((m) => {
                      const uid = m.user?._id || m.user;
                      const isAssigned = assignees.includes(uid);
                      return (
                        <button
                          key={uid}
                          type="button"
                          onClick={() => handleToggleAssignee(uid)}
                          disabled={!canEdit}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            background: isAssigned ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: isAssigned ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                            color: isAssigned ? '#a5b4fc' : 'var(--text-secondary)',
                            cursor: canEdit ? 'pointer' : 'default',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                              src={m.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.user?.name || 'User')}`}
                              alt={m.user?.name}
                              className="avatar"
                              style={{ width: '20px', height: '20px' }}
                            />
                            <span>{m.user?.name}</span>
                          </div>
                          {isAssigned && <Check size={13} color="#818cf8" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Tracking & Estimates */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Time Tracking
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {loggedHours}h / {estimatedHours || 0}h
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: `${estimatedHours > 0 ? Math.min(100, (loggedHours / estimatedHours) * 100) : loggedHours > 0 ? 100 : 0}%`,
                        height: '100%',
                        background: loggedHours > (estimatedHours || 0) && estimatedHours > 0 ? '#f43f5e' : '#10b981',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {canEdit && (
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleLogHour(0.5)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', flex: 1 }}
                      >
                        +0.5h
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogHour(1)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', flex: 1 }}
                      >
                        +1h
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogHour(2)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', flex: 1 }}
                      >
                        +2h
                      </button>
                      {loggedHours > 0 && (
                        <button
                          type="button"
                          onClick={() => handleLogHour(-1)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.725rem', color: '#fb7185' }}
                          title="Subtract 1 hour"
                        >
                          -1h
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {comments.map((comment) => {
                  const isOwner = comment.user?._id === user?.id || comment.user === user?.id || user?.role === 'admin';
                  return (
                    <div
                      key={comment._id}
                      style={{
                        padding: '0.875rem',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img
                            src={comment.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.user?.name || 'User')}`}
                            alt={comment.user?.name}
                            className="avatar"
                            style={{ width: '24px', height: '24px' }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comment.user?.name || 'Teammate'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {formatDateSafe(comment.createdAt)}
                          </span>
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            title="Delete Comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Comment text with mention highlights */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>
                        {comment.content.split(/(@[a-zA-Z0-9_\s]+?(?=\s[a-z0-9]|\s$|$|[,.!?]))/gi).map((part, idx) => {
                          if (part.startsWith('@')) {
                            return (
                              <span
                                key={idx}
                                style={{
                                  background: 'rgba(99, 102, 241, 0.2)',
                                  color: '#a5b4fc',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  fontSize: '0.825rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  margin: '0 2px',
                                }}
                              >
                                <AtSign size={11} />
                                {part.replace('@', '').trim()}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </p>

                      {/* Tagged members preview */}
                      {comment.mentions && comment.mentions.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Tagged:</span>
                          {comment.mentions.map((m) => {
                            const mObj = typeof m === 'object' ? m : { _id: m, name: 'User' };
                            return (
                              <span
                                key={mObj._id}
                                style={{
                                  fontSize: '0.6875rem',
                                  color: '#818cf8',
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                @{mObj.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {comments.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                    No comments yet. Mention teammates with @ to start collaborating!
                  </div>
                )}
              </div>

              {/* Add Comment Input & @ Mention Dropdown */}
              {user && canComment ? (
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  {/* Mention Autocomplete Dropdown */}
                  {showMentionDropdown && activeProject?.members && (
                    <div
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        bottom: '105%',
                        left: 0,
                        width: '240px',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        borderRadius: '10px',
                        padding: '0.375rem',
                        boxShadow: 'var(--shadow-xl)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        zIndex: 50,
                      }}
                    >
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.25rem 0.5rem', textTransform: 'uppercase' }}>
                        Mention Teammate
                      </div>
                      {activeProject.members
                        .filter((m) => {
                          const name = (m.user?.name || '').toLowerCase();
                          return !mentionQuery || name.includes(mentionQuery);
                        })
                        .map((m) => (
                          <button
                            key={m.user?._id || m.user}
                            type="button"
                            onClick={() => handleSelectMention(m)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.375rem 0.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <img
                              src={m.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.user?.name || 'User')}`}
                              alt={m.user?.name}
                              className="avatar"
                              style={{ width: '20px', height: '20px' }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.user?.name}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Write a comment... (Type @ to mention teammates)"
                        value={newComment}
                        onChange={handleCommentInputChange}
                        className="form-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowMentionDropdown(!showMentionDropdown)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: showMentionDropdown ? '#818cf8' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Mention a teammate (@)"
                      >
                        <AtSign size={16} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                  Commenting is restricted for your role in this workspace.
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {activities.map((act) => (
                <div
                  key={act._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <img
                    src={act.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(act.user?.name || 'User')}`}
                    alt={act.user?.name}
                    className="avatar"
                    style={{ width: '24px', height: '24px', marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {act.details}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDateSafe(act.createdAt)}
                    </div>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                  No activity history recorded for this task.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
