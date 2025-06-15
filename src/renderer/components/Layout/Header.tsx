/**
 * Application Header Component
 * Displays app title, current time, and global actions
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/store/AppContext';
import Badge from '@/components/Common/Badge';
import Button from '@/components/Common/Button';
import './Header.css';

export interface HeaderProps {
  /** Header title */
  title: string;

  /** Optional subtitle */
  subtitle?: string;

  /** Actions to display in header */
  actions?: React.ReactNode;

  /** Show system status indicators */
  showStatus?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions,
  showStatus = true
}) => {
  const { state, toggleSidebar } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEngineStatusBadge = () => {
    if (!state.rngEngineStatus) {
      return <Badge variant="neutral" size="small">Unknown</Badge>;
    }

    if (state.rngEngineStatus.isRunning) {
      return (
        <Badge
          variant="success"
          size="small"
          pulse
          icon="●"
        >
          Running
        </Badge>
      );
    }

    return <Badge variant="warning" size="small">Stopped</Badge>;
  };

  const getDatabaseStatusBadge = () => {
    if (!state.databaseStatus) {
      return <Badge variant="neutral" size="small">Unknown</Badge>;
    }

    return state.databaseStatus.connected ? (
      <Badge variant="success" size="small" icon="●">Connected</Badge>
    ) : (
      <Badge variant="error" size="small">Disconnected</Badge>
    );
  };

  const getSystemHealthBadge = () => {
    const { systemHealth } = state;

    switch (systemHealth.overall) {
      case 'healthy':
        return <Badge variant="success" size="small" icon="✓">Healthy</Badge>;
      case 'warning':
        return <Badge variant="warning" size="small" icon="⚠">Warning</Badge>;
      case 'error':
        return <Badge variant="error" size="small" icon="✗">Error</Badge>;
      default:
        return <Badge variant="neutral" size="small">Unknown</Badge>;
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        <Button
          variant="ghost"
          size="medium"
          icon="☰"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="header__menu-button"
        />

        <div className="header__title-section">
          <h1 className="header__title">{title}</h1>
          {subtitle && <p className="header__subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header__center">
        {showStatus && (
          <div className="header__status">
            <div className="header__status-item">
              <span className="header__status-label">RNG:</span>
              {getEngineStatusBadge()}
            </div>

            <div className="header__status-item">
              <span className="header__status-label">DB:</span>
              {getDatabaseStatusBadge()}
            </div>

            <div className="header__status-item">
              <span className="header__status-label">System:</span>
              {getSystemHealthBadge()}
            </div>
          </div>
        )}
      </div>

      <div className="header__right">
        <div className="header__time">
          <div className="header__date">{formatDate(currentTime)}</div>
          <div className="header__clock">{formatTime(currentTime)}</div>
        </div>

        {actions && (
          <div className="header__actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;