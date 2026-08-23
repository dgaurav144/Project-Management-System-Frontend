import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    if (!message) return;

    setToasts((prev) => {
      // 1. Deduplication: If the exact same message is already active, don't create duplicate stack
      const existing = prev.find((t) => t.message === message && t.type === type);
      if (existing) {
        // Reset auto-dismiss timer for the existing toast
        if (timersRef.current[existing.id]) {
          clearTimeout(timersRef.current[existing.id]);
        }
        if (duration > 0) {
          timersRef.current[existing.id] = setTimeout(() => {
            removeToast(existing.id);
          }, duration);
        }
        // Return existing list with a fresh key trigger for animation pulse
        return prev.map((t) =>
          t.id === existing.id ? { ...t, pulse: Date.now() } : t
        );
      }

      const id = Date.now() + Math.random().toString(36).substring(2, 7);

      // Set dismiss timer
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      // 2. Limit to max 2 active toasts to prevent screen flood on spam clicks
      const updated = [...prev, { id, message, type, duration, createdAt: Date.now() }];
      if (updated.length > 2) {
        const oldest = updated[0];
        if (timersRef.current[oldest.id]) {
          clearTimeout(timersRef.current[oldest.id]);
          delete timersRef.current[oldest.id];
        }
        return updated.slice(updated.length - 2);
      }
      return updated;
    });
  }, [removeToast]);

  const success = (msg, duration) => addToast(msg, 'success', duration);
  const error = (msg, duration) => addToast(msg, 'error', duration);
  const warning = (msg, duration) => addToast(msg, 'warning', duration);
  const info = (msg, duration) => addToast(msg, 'info', duration);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info, removeToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          maxWidth: '420px',
          width: 'calc(100% - 3rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = '#0f172a';
          let border = '#1e293b';
          let glow = 'rgba(14, 165, 233, 0.15)';
          let accentColor = '#38bdf8';
          let icon = <Info size={18} color="#38bdf8" />;

          if (toast.type === 'success') {
            border = 'rgba(16, 185, 129, 0.4)';
            glow = 'rgba(16, 185, 129, 0.2)';
            accentColor = '#10b981';
            icon = <CheckCircle2 size={18} color="#10b981" />;
          } else if (toast.type === 'error') {
            border = 'rgba(244, 63, 94, 0.4)';
            glow = 'rgba(244, 63, 94, 0.25)';
            accentColor = '#fb7185';
            icon = <AlertCircle size={18} color="#fb7185" />;
          } else if (toast.type === 'warning') {
            border = 'rgba(245, 158, 11, 0.4)';
            glow = 'rgba(245, 158, 11, 0.2)';
            accentColor = '#f59e0b';
            icon = <AlertTriangle size={18} color="#f59e0b" />;
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '12px',
                padding: '0.875rem 1rem',
                color: '#f8fafc',
                boxShadow: `0 12px 28px -6px rgba(0, 0, 0, 0.6), 0 0 20px ${glow}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                animation: 'slideUpToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                fontSize: '0.875rem',
                fontWeight: 500,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left Accent Strip */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: accentColor,
                  borderRadius: '12px 0 0 12px',
                }}
              />

              <div style={{ flexShrink: 0, marginLeft: '4px' }}>{icon}</div>
              <div style={{ flex: 1, lineHeight: 1.45, wordBreak: 'break-word' }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
