/**
 * Scientific Badge Component
 * Status indicators and labels for research data
 */

import React from 'react';
import './Badge.css';

export interface BadgeProps {
  /** Badge visual variant */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

  /** Badge size */
  size?: 'small' | 'medium' | 'large';

  /** Pulse animation for live indicators */
  pulse?: boolean;

  /** Icon to display (can be emoji or text) */
  icon?: string;

  /** Additional CSS classes */
  className?: string;

  /** Badge content */
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'medium',
  pulse = false,
  icon,
  className = '',
  children
}) => {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    pulse && 'badge--pulse',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {icon && <span className="badge__icon">{icon}</span>}
      <span className="badge__text">{children}</span>
    </span>
  );
};

export default Badge;