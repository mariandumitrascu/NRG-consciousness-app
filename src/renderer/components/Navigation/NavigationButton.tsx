/**
 * Navigation Button Component
 * Individual navigation item with active states and tooltips
 */

import React from 'react';
import Badge from '@/components/Common/Badge';
import './NavigationButton.css';

export interface NavigationButtonProps {
  /** Button icon (emoji or text) */
  icon: string;

  /** Button label */
  label: string;

  /** Optional description for tooltip */
  description?: string;

  /** Whether button is active */
  isActive?: boolean;

  /** Whether navigation is collapsed */
  isCollapsed?: boolean;

  /** Optional badge to display */
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
    pulse?: boolean;
  };

  /** Click handler */
  onClick: () => void;

  /** Disabled state */
  disabled?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  icon,
  label,
  description,
  isActive = false,
  isCollapsed = false,
  badge,
  onClick,
  disabled = false
}) => {
  const classes = [
    'nav-button',
    isActive && 'nav-button--active',
    isCollapsed && 'nav-button--collapsed',
    disabled && 'nav-button--disabled'
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const getTooltipText = () => {
    if (isCollapsed) {
      return description ? `${label}: ${description}` : label;
    }
    return description || '';
  };

  return (
    <button
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      title={getTooltipText()}
      aria-label={label}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div className="nav-button__content">
        <span className="nav-button__icon">{icon}</span>

        {!isCollapsed && (
          <div className="nav-button__text">
            <span className="nav-button__label">{label}</span>
            {description && (
              <span className="nav-button__description">{description}</span>
            )}
          </div>
        )}

        {badge && (
          <div className="nav-button__badge">
            <Badge
              variant={badge.variant}
              size="small"
              pulse={badge.pulse}
            >
              {badge.text}
            </Badge>
          </div>
        )}
      </div>

      {isActive && <div className="nav-button__indicator" />}
    </button>
  );
};

export default NavigationButton;