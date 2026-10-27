import React from 'react';

export default function Badge({ children, variant = 'neutral', icon: Icon, showDot = true }) {
  let badgeClass = 'badge badge-neutral';

  switch (variant?.toLowerCase()) {
    case 'success':
    case 'paid':
      badgeClass = 'badge badge-success';
      break;
    case 'warning':
    case 'partial':
      badgeClass = 'badge badge-warning';
      break;
    case 'danger':
    case 'unpaid':
    case 'low-stock':
      badgeClass = 'badge badge-danger';
      break;
    case 'primary':
      badgeClass = 'badge badge-primary';
      break;
    default:
      badgeClass = 'badge badge-neutral';
  }

  return (
    <span className={badgeClass}>
      {showDot && <span className="badge-dot" />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
