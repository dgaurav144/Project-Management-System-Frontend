import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  FolderDot,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import api from '../../services/api';
import { useProject } from '../../context/ProjectContext';
import { useBoard } from '../../context/BoardContext';

export const ActivityDrawer = ({ isOpen, onClose }) => {
  const { activeProject } = useProject();
  const { setSelectedTask, tasks } = useBoard();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const fetchActivities = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const res = await api.get(`/projects/${activeProject._id}/activity?limit=40`);
      setActivities(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch project activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen, activeProject]);

  if (!isOpen) return null;

  const formatDateSafe = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recently';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'COMMENT_ADDED':
      case 'COMMENT_DELETED':
        return <MessageSquare size={14} color="#818cf8" />;
      case 'TASK_STATUS_CHANGED':
        return <ArrowRight size={14} color="#38bdf8" />;
      case 'TASK_CREATED':
      case 'TASK_UPDATED':
        return <CheckCircle2 size={14} color="#34d399" />;
      case 'MEMBER_INVITED':
      case 'MEMBER_ROLE_UPDATED':
      case 'MEMBER_REMOVED':
        return <UserPlus size={14} color="#fbbf24" />;
      case 'PROJECT_CREATED':
      case 'PROJECT_UPDATED':
      case 'PROJECT_STATUS_CHANGED':
        return <Sparkles size={14} color="#c084fc" />;
      default:
        return <History size={14} color="var(--text-muted)" />;
    }
  };

  const handleOpenTask = (taskId) => {
    if (!taskId) return;
    const taskObj = tasks.find((t) => t._id === taskId || t.id === taskId);
    if (taskObj) {
      setSelectedTask(taskObj);
      onClose();
    } else {
      // Fetch directly if not in active board state
      api
        .get(`/tasks/${taskId}`)
        .then((res) => {
          if (res.data?.data?.task) {
            setSelectedTask(res.data.data.task);
            onClose();
          }
        })
        .catch(() => {});
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'COMMENTS') return act.action?.includes('COMMENT');
    if (filterType === 'TASKS') return act.action?.includes('TASK');
    if (filterType === 'MEMBERS') return act.action?.includes('MEMBER');
    if (filterType === 'PROJECT') return act.action?.includes('PROJECT') || act.action?.includes('BOARD');
    return true;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '420px',
          maxWidth: '90%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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
              <History size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Activity Trail</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {activeProject?.name || 'Workspace'} Audit Logs
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchActivities}
              className="btn-icon"
              title="Refresh Activity"
              style={{ padding: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="btn-icon" style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.625rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            background: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          {['ALL', 'TASKS', 'COMMENTS', 'MEMBERS', 'PROJECT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: filterType === tab ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                background: filterType === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: filterType === tab ? '#a5b4fc' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Activities List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {filteredActivities.map((act) => {
            const hasTask = Boolean(act.task?._id || act.task);
            const taskId = act.task?._id || act.task;

            return (
              <div
                key={act._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={
                      act.user?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(act.user?.name || 'User')}`
                    }
                    alt={act.user?.name || 'User'}
                    className="avatar"
                    style={{ width: '28px', height: '28px' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getActionIcon(act.action)}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {act.details}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{formatDateSafe(act.createdAt)}</span>

                    {hasTask && (
                      <button
                        onClick={() => handleOpenTask(taskId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: 'none',
                          color: '#a5b4fc',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                        }}
                      >
                        <span>View Task</span>
                        <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredActivities.length === 0 && !loading && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                padding: '3rem 1rem',
                fontSize: '0.85rem',
              }}
            >
              No activity logs recorded for this category yet.
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading audit logs...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
