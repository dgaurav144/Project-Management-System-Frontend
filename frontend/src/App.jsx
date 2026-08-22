import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { BoardProvider, useBoard } from './context/BoardContext';

import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { FilterBar } from './components/boards/FilterBar';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { TaskDetailModal } from './components/kanban/TaskDetailModal';
import { CreateTaskModal } from './components/kanban/CreateTaskModal';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { ProjectMembersModal } from './components/projects/ProjectMembersModal';
import { ProjectSettingsModal } from './components/projects/ProjectSettingsModal';
import { CreateBoardModal } from './components/boards/CreateBoardModal';
import { AuthModal } from './components/auth/AuthModal';
import { ActivityDrawer } from './components/activity/ActivityDrawer';
import { TourGuideModal } from './components/tour/TourGuideModal';

import {
  Kanban,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Compass,
} from 'lucide-react';

const DashboardContent = ({ mobileSidebarOpen, setMobileSidebarOpen }) => {
  const { user, openAuth } = useAuth();
  const { activeProject } = useProject();
  const { activityDrawerOpen, setActivityDrawerOpen, tourOpen, closeTour, openTour } = useBoard();

  // If user is not logged in, show Hero Landing Page
  if (!user) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}
        >
          <Sparkles size={14} color="#818cf8" />
          <span>Full-Stack Project Management & Collaboration Platform</span>
        </div>

        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            maxWidth: '750px',
            marginBottom: '1.25rem',
          }}
        >
          Streamline Sprints, Track Tasks, and Collaborate in{' '}
          <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real-Time
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '580px',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          An agile workspace featuring Kanban drag-and-drop boards, RBAC permissions, audit history, subtask checklists, and JWT authentication.
        </p>

        {/* Call to Actions */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
          <button
            onClick={() => openAuth('register')}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>
          <button
            onClick={() => openAuth('login')}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            <Zap size={18} color="#f59e0b" />
            Sign In to Workspace
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            maxWidth: '900px',
            width: '100%',
          }}
        >
          {[
            { icon: <Kanban size={20} color="#6366f1" />, title: 'Kanban Drag & Drop', desc: 'Fluid reordering across customizable sprint columns' },
            { icon: <ShieldCheck size={20} color="#10b981" />, title: 'Role-Based Access', desc: 'Granular Owner, Admin, Member, & Viewer controls' },
            { icon: <Users size={20} color="#0ea5e9" />, title: 'Team Collaboration', desc: 'Live comment threads, mentions, and member invites' },
            { icon: <CheckCircle2 size={20} color="#f59e0b" />, title: 'Audit Trail', desc: 'Complete activity history and state transition logs' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="main-body">
      <Sidebar
        onOpenActivity={() => setActivityDrawerOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <main className="content-area">
        <FilterBar />
        <KanbanBoard />
      </main>

      <ActivityDrawer
        isOpen={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
      />
      <TourGuideModal
        isOpen={tourOpen}
        onClose={closeTour}
      />
    </div>
  );
};

const MainLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { setActivityDrawerOpen } = useBoard();

  return (
    <div className="app-layout">
      <Navbar
        onOpenActivity={() => setActivityDrawerOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />
      <DashboardContent
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      {/* Global Modals & Overlays */}
      <TaskDetailModal />
      <CreateTaskModal />
      <CreateProjectModal />
      <ProjectMembersModal />
      <ProjectSettingsModal />
      <CreateBoardModal />
      <AuthModal />
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PulseFlow Uncaught UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '2.5rem',
              maxWidth: '500px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fb7185' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              A UI error occurred. Please click below to refresh the workspace.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Refresh Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <BoardProvider>
              <MainLayout />
            </BoardProvider>
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
