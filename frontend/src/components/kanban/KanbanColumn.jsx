import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { useBoard } from '../../context/BoardContext';
import { useProject } from '../../context/ProjectContext';

export const KanbanColumn = ({ column, tasks }) => {
  const { moveTask, openCreateTask } = useBoard();
  const { getUserRole, hasPermission } = useProject();
  const [isDragOver, setIsDragOver] = useState(false);

  const canCreate = hasPermission('createTasks');
  const canMove = hasPermission('moveTasks');

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!canMove) return;
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!canMove) return;

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Calculate new order
    const lastTask = tasks[tasks.length - 1];
    const newOrder = lastTask ? (lastTask.order || 0) + 1000 : 1000;

    moveTask(taskId, column.key, newOrder, column.id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
    >
      {/* Column Header */}
      <div className="column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: column.color || '#64748b',
              boxShadow: `0 0 8px ${column.color || '#64748b'}`,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {column.name}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: '9999px',
              background: 'var(--bg-badge)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {tasks.length}
          </span>
        </div>

        {canCreate && (
          <button
            onClick={() => openCreateTask(column.key)}
            className="btn-icon"
            title={`Add task to ${column.name}`}
            style={{ padding: '4px' }}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Cards Container */}
      <div
        className="column-cards"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ minHeight: '120px' }}
      >
        {tasks.map((task) => (
          <TaskCard key={task._id || task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--border-color)',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              height: '100%',
              minHeight: '140px',
              pointerEvents: 'auto',
            }}
          >
            <span>No tasks in {column.name}</span>
            {canCreate && (
              <button
                onClick={() => openCreateTask(column.key)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <Plus size={12} /> Add Task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
