/**
 * Scientific Card Component
 * Content container with professional styling for research data
 */

import React from 'react';
import './Card.css';

export interface CardProps {
  /** Card title */
  title?: string;

  /** Card subtitle */
  subtitle?: string;

  /** Actions to display in card header */
  actions?: React.ReactNode;

  /** Card visual variant */
  variant?: 'default' | 'highlighted' | 'warning' | 'error' | 'success';

  /** Card padding */
  padding?: 'none' | 'small' | 'medium' | 'large';

  /** Whether card is interactive (clickable) */
  interactive?: boolean;

  /** Click handler for interactive cards */
  onClick?: () => void;

  /** Additional CSS classes */
  className?: string;

  /** Card content */
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  variant = 'default',
  padding = 'medium',
  interactive = false,
  onClick,
  className = '',
  children
}) => {
  const classes = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    interactive && 'card--interactive',
    className
  ].filter(Boolean).join(' ');

  const hasHeader = title || subtitle || actions;

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
    >
      {hasHeader && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="card__actions">
              {actions}
            </div>
          )}
        </div>
      )}

      {children && (
        <div className="card__content">
          {children}
        </div>
      )}
    </div>
  );
};

export default Card;