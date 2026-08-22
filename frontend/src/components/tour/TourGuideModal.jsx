import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  FolderKanban,
  Layers,
  Kanban,
  CheckSquare,
  Filter,
  ShieldCheck,
  Zap,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const TOUR_STEPS = [
  {
    step: 1,
    badge: 'Step 1 of 7',
    title: 'Workspaces & Projects',
    icon: <FolderKanban size={24} color="#6366f1" />,
    color: '#6366f1',
    description:
      'Manage multiple client workspaces and agile projects effortlessly. Switch between active projects from the top navigation bar or create new ones with custom project keys and brand accent colors.',
    features: [
      'Top Navigation dropdown switcher for instant workspace jumping',
      'Unique auto-generated project keys (e.g. PRJ, BANK, SPRINT) for task prefixing',
      'Custom color themes for visual distinction across teams',
    ],
    tip: '💡 Tip: Click the project dropdown in the top bar to switch workspaces or create a new project in seconds.',
  },
  {
    step: 2,
    badge: 'Step 2 of 7',
    title: 'Sprint Boards & Backlog',
    icon: <Layers size={24} color="#0ea5e9" />,
    color: '#0ea5e9',
    description:
      'Each project can have multiple dedicated boards for specific sprints, bug triages, or product backlogs. Boards keep teams focused on their current milestones.',
    features: [
      'Left Sidebar displays all sprint boards with real-time task counters',
      'One-click board creation for new sprints or department queues',
      'Real-time sprint progress bar showing completion rate (%)',
    ],
    tip: '💡 Tip: Use the "+" icon next to "Boards" in the left sidebar to spin up a new sprint board.',
  },
  {
    step: 3,
    badge: 'Step 3 of 7',
    title: 'Kanban Drag & Drop Board',
    icon: <Kanban size={24} color="#10b981" />,
    color: '#10b981',
    description:
      'Experience smooth drag-and-drop workflow across sprint stages: To Do, In Progress, In Review, and Done. Move cards seamlessly and enjoy instant optimistic UI updates.',
    features: [
      'Interactive drag-and-drop between columns with smooth hover physics',
      'Confetti celebration animation when moving a task into "Done"',
      'Quick "+ Add Task" button on every column header',
    ],
    tip: '🎉 Fun fact: Moving any task into the "Done" column triggers a celebratory confetti blast!',
  },
  {
    step: 4,
    badge: 'Step 4 of 7',
    title: 'Deep Task Details & Checklists',
    icon: <CheckSquare size={24} color="#f59e0b" />,
    color: '#f59e0b',
    description:
      'Click any task card to open the rich task inspector. Manage subtask checklists, attach tags, adjust priorities, set due dates, assign teammates, and track estimated hours.',
    features: [
      'Interactive Subtask Checklist with dynamic progress bar calculation',
      'Color-coded priorities: Urgent (Rose), High (Orange), Medium (Blue), Low (Slate)',
      'Due date tracking with automatic "Overdue" and "Today" warning chips',
      'Direct inline title editing and description updates',
    ],
    tip: '💡 Tip: Click directly on any task title inside the modal to edit it inline with real-time saving.',
  },
  {
    step: 5,
    badge: 'Step 5 of 7',
    title: 'Live Search & Multi-Filters',
    icon: <Filter size={24} color="#a855f7" />,
    color: '#a855f7',
    description:
      'Quickly find any task across massive boards using the Filter Bar. Filter simultaneously by text search, priority pill, teammate assignee, due date, or custom sorting.',
    features: [
      'Instant search filtering across title, description, and hashtags',
      'Priority quick-filter pills (Urgent, High, Medium, Low)',
      'Due date presets: Overdue, Today, and This Week',
      'One-click "Clear Filters" button to reset instantly',
    ],
    tip: '💡 Tip: Use the top search input or the Filter Bar below the header to pinpoint any task in milliseconds.',
  },
  {
    step: 6,
    badge: 'Step 6 of 7',
    title: 'Team Collaboration & RBAC Roles',
    icon: <ShieldCheck size={24} color="#06b6d4" />,
    color: '#06b6d4',
    description:
      'Invite teammates by email, manage role-based permissions (Owner, Admin, Member, Viewer), post task comments in real time, and inspect complete audit activity logs.',
    features: [
      'Granular Role-Based Access Control (RBAC) preventing unauthorized changes',
      'Interactive Discussion thread on every task for team chatter',
      'Full Audit Trail drawer logging every creation, move, edit, and deletion',
    ],
    tip: '💡 Tip: Click the "Members" button in the top navbar to invite teammates or adjust access permissions.',
  },
  {
    step: 7,
    badge: 'Step 7 of 7',
    title: 'One-Click Demo User Switcher',
    icon: <Zap size={24} color="#f43f5e" />,
    color: '#f43f5e',
    description:
      'Easily test how different team roles experience the app. Switch instantly between Admin (Alex), Project Owner (Sarah), Full Stack Dev (John), and UI Designer (Emily) without retyping passwords.',
    features: [
      'Click your user avatar in the top right corner',
      'Select any demo persona to immediately switch sessions',
      'Observe how permissions adapt in real time (e.g. Viewers cannot edit tasks)',
    ],
    tip: '🚀 You are all set! Click "Finish Tour" below to start managing projects like a pro.',
  },
];

export const TourGuideModal = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && currentStepIndex < TOUR_STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        setCurrentStepIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content tour-modal-card"
        style={{
          maxWidth: '680px',
          width: '92%',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${currentStep.color} 0%, #818cf8 100%)`,
            transition: 'background 0.3s ease',
          }}
        />

        {/* Header */}
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: `${currentStep.color}22`,
                border: `1px solid ${currentStep.color}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 15px ${currentStep.color}44`,
                transition: 'all 0.3s ease',
              }}
            >
              {currentStep.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: `${currentStep.color}25`,
                    color: currentStep.color,
                    border: `1px solid ${currentStep.color}40`,
                  }}
                >
                  {currentStep.badge}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Interactive Feature Tour
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" title="Close Tour (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div style={{ padding: '0 1.5rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'var(--bg-tertiary)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, #6366f1 0%, ${currentStep.color} 100%)`,
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Tour Body */}
        <div className="modal-body" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {currentStep.description}
          </p>

          {/* Key Features Pill List */}
          <div
            className="tour-capabilities-box"
            style={{
              borderRadius: '10px',
              padding: '0.875rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
              }}
            >
              Key Capabilities
            </div>
            {currentStep.features.map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: `${currentStep.color}25`,
                    color: currentStep.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  <Check size={10} />
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>

          {/* Pro Tip Box */}
          <div
            className="tour-tip-box"
            style={{
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            {currentStep.tip}
          </div>
        </div>

        {/* Modal Footer / Navigation Controls */}
        <div
          className="modal-footer tour-footer"
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                style={{
                  width: currentStepIndex === idx ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: currentStepIndex === idx ? currentStep.color : 'var(--border-color)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s ease',
                }}
                title={`Go to Step ${idx + 1}`}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              Skip Tour
            </button>

            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1.15rem',
                fontSize: '0.8125rem',
                background: isLastStep
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : `linear-gradient(135deg, ${currentStep.color} 0%, #4f46e5 100%)`,
              }}
            >
              {isLastStep ? (
                <>
                  <Check size={15} /> Finish Tour
                </>
              ) : (
                <>
                  Next Step <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourGuideModal;
