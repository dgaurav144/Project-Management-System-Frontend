import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  ArrowRight,
  UserPlus,
  Sparkles,
  ExternalLink,
  AtSign,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from '../../utils/dateUtils';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import { useToast } from '../../context/ToastContext';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const { setSelectedTask, tasks } = useBoard();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds for new mentions/notifications
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
      toast.info('Notifications cleared');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    setIsOpen(false);

    if (notification.task) {
      const taskId = notification.task._id || notification.task;
      const found = tasks.find((t) => t._id === taskId || t.id === taskId);
      if (found) {
        setSelectedTask(found);
      } else {
        try {
          const res = await api.get(`/tasks/${taskId}`);
          if (res.data?.data?.task) {
            setSelectedTask(res.data.data.task);
          }
        } catch {}
      }
    }
  };

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

  const getNotifIcon = (type) => {
    switch (type) {
      case 'MENTION':
        return <AtSign size={14} color="#818cf8" />;
      case 'COMMENT':
        return <MessageSquare size={14} color="#38bdf8" />;
      case 'TASK_ASSIGNED':
        return <Check size={14} color="#34d399" />;
      default:
        return <Bell size={14} color="var(--primary)" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="btn-icon"
        title="Notifications & Mentions"
        style={{
          position: 'relative',
          border: '1px solid var(--border-color)',
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '125%',
            right: 0,
            width: '360px',
            maxHeight: '480px',
            borderRadius: '14px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            animation: 'scaleUp 0.15s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.875rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px 4px',
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark Read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                  title="Clear all"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleOpenNotification(n)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={
                      n.sender?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.sender?.name || 'User')}`
                    }
                    alt={n.sender?.name}
                    className="avatar"
                    style={{ width: '28px', height: '28px' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-3px',
                      right: '-3px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getNotifIcon(n.type)}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: n.isRead ? 500 : 700,
                        color: n.isRead ? 'var(--text-primary)' : '#a5b4fc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#6366f1',
                          flexShrink: 0,
                          marginLeft: '4px',
                        }}
                      />
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      margin: 0,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {n.message}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{formatDateSafe(n.createdAt)}</span>
                    {n.task && (
                      <span
                        style={{
                          color: '#38bdf8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: 500,
                        }}
                      >
                        View <ArrowRight size={10} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && !loading && (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.8125rem',
                }}
              >
                <Bell size={24} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                <span>You're all caught up! No new notifications.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
