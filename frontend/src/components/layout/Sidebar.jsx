import {
  Layers,
  Plus,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Users,
  Shield,
  FolderDot,
  BarChart3,
  TrendingUp,
  X,
  Settings,
  Archive,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useBoard } from '../../context/BoardContext';

export const Sidebar = ({ onOpenActivity, mobileOpen, onCloseMobile }) => {
  const { activeProject, setMembersModalOpen, setProjectSettingsModalOpen, getUserRole } = useProject();
  const {
    boards,
    activeBoard,
    setActiveBoard,
    setCreateBoardModalOpen,
    tasks,
  } = useBoard();

  const userRole = getUserRole();
  const canManageBoards = ['owner', 'admin'].includes(userRole);

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSelectBoard = (board) => {
    setActiveBoard(board);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`glass-panel app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-color)',
          padding: '1.25rem 1rem',
          gap: '1.5rem',
          overflowY: 'auto',
          zIndex: 40,
        }}
      >
        {/* Mobile Header with close button */}
        {mobileOpen && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Workspace Menu</span>
            <button onClick={onCloseMobile} className="btn-icon" style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>
        )}
      {/* Project Banner */}
      {activeProject && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: activeProject.color || '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.75rem',
                color: '#fff',
              }}
            >
              {activeProject.key || 'PRJ'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeProject.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background:
                      activeProject.status === 'completed'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : activeProject.status === 'archived'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(14, 165, 233, 0.15)',
                    color:
                      activeProject.status === 'completed'
                        ? '#34d399'
                        : activeProject.status === 'archived'
                        ? '#fbbf24'
                        : '#38bdf8',
                  }}
                >
                  {activeProject.status === 'completed' ? '● Completed' : activeProject.status === 'archived' ? '● Archived' : '● Active'}
                </span>
                {canManageBoards && (
                  <button
                    onClick={() => setProjectSettingsModalOpen(true)}
                    className="btn-icon"
                    title="Project Settings & Lifecycle"
                    style={{ padding: '2px', width: '20px', height: '20px' }}
                  >
                    <Settings size={13} color="var(--text-muted)" />
                  </button>
                )}
              </div>
            </div>
          </div>          {/* Sprint Progress */}
          <div style={{ marginTop: '0.625rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
              <span>Sprint Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{progressPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #10b981)',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>{completedCount} completed</span>
              <span>{totalCount} total tasks</span>
            </div>
          </div>
        </div>
      )}

      {/* Boards Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            padding: '0 0.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Layers size={13} />
            Boards ({boards.length})
          </div>

          {canManageBoards && (
            <button
              onClick={() => setCreateBoardModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px',
              }}
              title="Create New Board"
            >
              <Plus size={15} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {(Array.isArray(boards) ? boards : []).map((board) => {
            const isActive = activeBoard?._id === board._id;
            return (
              <button
                key={board._id}
                onClick={() => {
                  setActiveBoard(board);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.625rem',
                  borderRadius: '8px',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <LayoutGrid size={15} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {board.name}
                  </span>
                </div>
                {board.taskCount !== undefined && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      background: isActive ? 'var(--primary)' : 'var(--bg-badge)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      border: isActive ? 'none' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {board.taskCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Team Members */}
      {activeProject?.members && (
        <div style={{ marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              padding: '0 0.25rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <Users size={13} />
              Team Members
            </div>
            <button
              onClick={() => {
                setMembersModalOpen(true);
                if (onCloseMobile) onCloseMobile();
              }}
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Manage
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeProject.members.slice(0, 4).map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <img
                    src={m.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user?.name || 'User'}`}
                    alt={m.user?.name}
                    className="avatar"
                    style={{ width: '22px', height: '22px' }}
                  />
                  <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.user?.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {m.role}
                </span>
              </div>
            ))}
            {activeProject.members.length > 4 && (
              <button
                onClick={() => {
                  setMembersModalOpen(true);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  padding: '0 0.5rem',
                  cursor: 'pointer',
                }}
              >
                +{activeProject.members.length - 4} more members...
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
    </>
  );
};
