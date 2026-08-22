import React from 'react';
import {
  Filter,
  Flame,
  Clock,
  User,
  ArrowUpDown,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import { useProject } from '../../context/ProjectContext';

export const FilterBar = () => {
  const { filters, setFilters, clearFilters, tasks } = useBoard();
  const { activeProject } = useProject();

  const priorities = [
    { label: 'All', value: '' },
    { label: 'Urgent', value: 'urgent', color: '#f43f5e' },
    { label: 'High', value: 'high', color: '#f97316' },
    { label: 'Medium', value: 'medium', color: '#3b82f6' },
    { label: 'Low', value: 'low', color: '#64748b' },
  ];

  const dueDates = [
    { label: 'All Dates', value: '' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
  ];

  const activeFilterCount = [
    Boolean(filters.search),
    Boolean(filters.priority),
    Boolean(filters.assignee),
    Boolean(filters.dueDateFilter),
    filters.sortBy !== 'order',
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: 'var(--filterbar-bg)',
      }}
    >
      {/* Priority Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Flame size={14} /> Priority:
        </span>
        {priorities.map((p) => {
          const isSelected = filters.priority === p.value;
          return (
            <button
              key={p.label}
              onClick={() => setFilters((prev) => ({ ...prev, priority: p.value }))}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                border: isSelected ? `1px solid ${p.color || 'var(--primary)'}` : '1px solid var(--border-color)',
                background: isSelected ? (p.color ? `${p.color}25` : 'var(--primary-light)') : 'transparent',
                color: isSelected ? (p.color || 'var(--primary)') : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Dropdown Filters (Assignee, Due Date, Sort) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        {/* Assignee Filter */}
        {activeProject?.members && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={13} color="var(--text-muted)" />
            <select
              value={filters.assignee}
              onChange={(e) => setFilters((prev) => ({ ...prev, assignee: e.target.value }))}
              className="form-select"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                width: 'auto',
                height: '30px',
              }}
            >
              <option value="">All Assignees</option>
              {activeProject.members.map((m) => (
                <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                  {m.user?.name || 'User'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Due Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={13} color="var(--text-muted)" />
          <select
            value={filters.dueDateFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, dueDateFilter: e.target.value }))}
            className="form-select"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              width: 'auto',
              height: '30px',
            }}
          >
            {dueDates.map((d) => (
              <option key={d.label} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowUpDown size={13} color="var(--text-muted)" />
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
            className="form-select"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              width: 'auto',
              height: '30px',
            }}
          >
            <option value="order">Custom Order</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created Date</option>
          </select>
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              height: '30px',
              color: '#fb7185',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.08)',
            }}
            title="Reset all search and filter conditions"
          >
            <RotateCcw size={12} /> Clear ({activeFilterCount})
          </button>
        )}
      </div>
    </div>
  );
};
