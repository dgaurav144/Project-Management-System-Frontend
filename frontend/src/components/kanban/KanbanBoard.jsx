import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useBoard } from '../../context/BoardContext';
import { useProject } from '../../context/ProjectContext';
import { Plus, LayoutGrid, Sparkles, ShieldAlert } from 'lucide-react';

const DEFAULT_COLUMNS = [
  { id: 'col-todo', name: 'To Do', key: 'todo', color: '#64748b' },
  { id: 'col-inprogress', name: 'In Progress', key: 'in-progress', color: '#3b82f6' },
  { id: 'col-review', name: 'In Review', key: 'review', color: '#f59e0b' },
  { id: 'col-done', name: 'Done', key: 'done', color: '#10b981' },
];

export const KanbanBoard = () => {
  const { activeBoard, tasks, loadingTasks, setCreateBoardModalOpen } = useBoard();
  const { activeProject, getUserRole, hasPermission } = useProject();

  const userRole = getUserRole();
  const canManage = ['owner', 'admin'].includes(userRole);
  const canViewTasks = hasPermission('viewTasks');

  if (!canViewTasks) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Task Viewing Restricted
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', fontSize: '0.875rem' }}>
            Your current role (<strong style={{ textTransform: 'capitalize' }}>{userRole}</strong>) does not have permission to view task boards in this workspace. Contact a project owner or admin to update permissions.
          </p>
        </div>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <LayoutGrid size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Kanban Board Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.875rem' }}>
            Create your first sprint or backlog board to start managing tasks and collaborating with your team.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setCreateBoardModalOpen(true)}
            className="btn btn-primary"
            style={{ marginTop: '0.5rem' }}
          >
            <Plus size={18} /> Create Board
          </button>
        )}
      </div>
    );
  }

  const columns = activeBoard.columns && activeBoard.columns.length > 0 ? activeBoard.columns : DEFAULT_COLUMNS;
  const { setProjectSettingsModalOpen } = useProject();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '0.75rem' }}>
      {/* Project Status Banner */}
      {activeProject?.status === 'completed' && (
        <div
          style={{
            margin: '0 1.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#34d399',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🎉</span>
            <span>
              <strong>Project Completed!</strong> All sprint objectives and milestones for this workspace are finished.
            </span>
          </div>
          {canManage && (
            <button
              onClick={() => setProjectSettingsModalOpen(true)}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reopen or Change Status
            </button>
          )}
        </div>
      )}

      {activeProject?.status === 'archived' && (
        <div
          style={{
            margin: '0 1.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fbbf24',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📦</span>
            <span>
              <strong>Project Archived.</strong> This project is stored for historical reference.
            </span>
          </div>
          {canManage && (
            <button
              onClick={() => setProjectSettingsModalOpen(true)}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reactivate Project
            </button>
          )}
        </div>
      )}

      <div className="kanban-container" style={{ flex: 1 }}>
        {columns.map((column) => {
          // Match tasks that belong to this column
          const columnTasks = tasks.filter((t) => {
            if (t.status && column.key) {
              return t.status === column.key;
            }
            if (t.columnId && column.id) {
              return t.columnId === column.id;
            }
            return false;
          });

          return <KanbanColumn key={column.id || column.key} column={column} tasks={columnTasks} />;
        })}
      </div>
    </div>
  );
};
