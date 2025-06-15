/**
 * Scientific Button Component
 * Consistent button styling for research applications
 */

import React, { forwardRef } from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';

  /** Button size */
  size?: 'small' | 'medium' | 'large';

  /** Icon to display (can be emoji or text) */
  icon?: string;

  /** Position of icon relative to text */
  iconPosition?: 'left' | 'right';

  /** Loading state with spinner */
  loading?: boolean;

  /** Full width button */
  fullWidth?: boolean;

  /** Button content */
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    loading && 'btn--loading',
    disabled && 'btn--disabled',
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className="btn__spinner" />
          {children}
        </>
      );
    }

    if (icon && children) {
      return iconPosition === 'left' ? (
        <>
          <span className="btn__icon">{icon}</span>
          <span className="btn__text">{children}</span>
        </>
      ) : (
        <>
          <span className="btn__text">{children}</span>
          <span className="btn__icon">{icon}</span>
        </>
      );
    }

    if (icon && !children) {
      return <span className="btn__icon btn__icon--only">{icon}</span>;
    }

    return <span className="btn__text">{children}</span>;
  };

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;