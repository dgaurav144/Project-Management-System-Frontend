export const parseDate = (val) => {
  if (!val) return null;
  try {
    const d = typeof val === 'string' ? new Date(val) : val;
    return isNaN(d?.getTime?.()) ? null : d;
  } catch {
    return null;
  }
};

export const parseISO = parseDate;

export const formatDate = (val, pattern = 'MMM d') => {
  const d = parseDate(val);
  if (!d) return '';
  try {
    if (pattern === 'MMM d, yyyy' || pattern === 'PPP') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (pattern === 'MMM d') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const format = formatDate;

export const isToday = (val) => {
  const d = parseDate(val);
  if (!d) return false;
  try {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
};

export const isPast = (val) => {
  const d = parseDate(val);
  if (!d) return false;
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    return target.getTime() < now.getTime();
  } catch {
    return false;
  }
};

export const formatDistanceToNow = (val, options = {}) => {
  const d = parseDate(val);
  if (!d) return 'Just now';
  try {
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears}y ago`;
  } catch {
    return 'Just now';
  }
};
