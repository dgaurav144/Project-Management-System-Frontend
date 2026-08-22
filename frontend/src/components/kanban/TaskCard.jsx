import React from 'react';
import {
  Calendar,
  MessageSquare,
  CheckSquare,
  Flame,
  AlertCircle,
  Clock,
  Tag,
  GripVertical,
} from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { useBoard } from '../../context/BoardContext';
import { useProject } from '../../context/ProjectContext';

export const TaskCard = ({ task }) => {
  const { setSelectedTask } = useBoard();
  const { hasPermission } = useProject();

  const [isDragging, setIsDragging] = React.useState(false);
  const canMove = hasPermission('moveTasks');

  const handleDragStart = (e) => {
    const taskIdStr = (task._id || task.id)?.toString();
    e.dataTransfer.setData('text/plain', taskIdStr);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      setIsDragging(true);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.querySelectorAll('.task-card.dragging').forEach((el) => el.classList.remove('dragging'));
  };

  // Due date formatting and status
  let dueDateText = null;
  let isOverdue = false;
  if (task.dueDate) {
    try {
      const parsed = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
      if (isToday(parsed)) {
        dueDateText = 'Today';
      } else {
        dueDateText = format(parsed, 'MMM d');
      }
      isOverdue = isPast(parsed) && !isToday(parsed) && task.status !== 'done';
    } catch {
      dueDateText = 'Invalid date';
    }
  }

  // Priority color config
  const priorityBadges = {
    urgent: { label: 'Urgent', class: 'badge-urgent' },
    high: { label: 'High', class: 'badge-high' },
    medium: { label: 'Med', class: 'badge-medium' },
    low: { label: 'Low', class: 'badge-low' },
  };
  const pBadge = priorityBadges[task.priority] || priorityBadges.medium;

  // Subtask progress calculation
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed)?.length || 0;

  return (
    <div
      draggable={canMove}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (!isDragging) {
          setSelectedTask(task);
        }
      }}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      style={{
        cursor: canMove ? 'grab' : 'pointer',
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {/* Priority & Tags Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          <span className={`badge ${pBadge.class}`}>{pBadge.label}</span>

          {task.tags?.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'var(--bg-badge)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 600,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {canMove && <GripVertical size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />}
      </div>

      {/* Task Title */}
      <h4
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.35,
          marginBottom: task.description ? '0.35rem' : '0.6rem',
        }}
      >
        {task.title}
      </h4>

      {/* Brief description snippet */}
      {task.description && (
        <p
          style={{
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
          }}
        >
          {task.description}
        </p>
      )}

      {/* Subtasks Progress Bar (if task has subtasks) */}
      {totalSubtasks > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckSquare size={11} /> Subtasks
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                height: '100%',
                background: completedSubtasks === totalSubtasks ? '#10b981' : '#6366f1',
                borderRadius: '9999px',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer Row: Due Date, Comments, and Assignee Avatars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Due date chip */}
          {dueDateText && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: isOverdue ? '#e11d48' : 'var(--text-secondary)',
                background: isOverdue ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-badge)',
                border: isOverdue ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid var(--border-subtle)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
              <span>{dueDateText}</span>
            </div>
          )}

          {/* Comments count */}
          {task.commentCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
            >
              <MessageSquare size={12} />
              <span>{task.commentCount}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatars Stack */}
        <div className="avatar-group">
          {task.assignees?.slice(0, 3).map((assignee, idx) => (
            <img
              key={idx}
              src={assignee.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`}
              alt={assignee.name}
              title={assignee.name}
              className="avatar"
              style={{ width: '22px', height: '22px' }}
            />
          ))}
          {task.assignees?.length > 3 && (
            <div
              className="avatar"
              style={{ width: '22px', height: '22px', fontSize: '0.65rem', background: 'var(--bg-tertiary)' }}
            >
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
