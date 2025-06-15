/**
 * Main Navigation Component
 * Primary navigation for RNG Consciousness Research Application
 */

import React from 'react';
import { useAppContext, AppView } from '@/store/AppContext';
import NavigationButton from './NavigationButton';
import Badge from '@/components/Common/Badge';
import './MainNavigation.css';

export interface NavigationItem {
  id: AppView;
  label: string;
  icon: string;
  description?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
    pulse?: boolean;
  };
}

const MainNavigation: React.FC = () => {
  const { state, navigateTo } = useAppContext();

  // Define navigation items based on research workflow
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'System overview and quick stats'
    },
    {
      id: 'session-mode',
      label: 'Session Experiments',
      icon: '🎯',
      description: 'Focused intention experiments',
      badge: state.currentSession ? {
        text: 'Active',
        variant: 'success',
        pulse: true
      } : undefined
    },
    {
      id: 'continuous-mode',
      label: 'Continuous Monitoring',
      icon: '📈',
      description: 'Real-time consciousness monitoring',
      badge: state.currentIntentionPeriod ? {
        text: 'Monitoring',
        variant: 'primary',
        pulse: true
      } : undefined
    },
    {
      id: 'analysis',
      label: 'Data Analysis',
      icon: '🔬',
      description: 'Statistical analysis and reports'
    },
    {
      id: 'calibration',
      label: 'Calibration',
      icon: '⚙️',
      description: 'RNG baseline calibration'
    },
    {
      id: 'history',
      label: 'History',
      icon: '📋',
      description: 'Past experiments and results'
    }
  ];

  const handleNavigation = (view: AppView) => {
    navigateTo(view);
  };

  const getTrialCountBadge = () => {
    if (state.trialCount > 0) {
      return (
        <Badge
          variant="info"
          size="small"
          className="navigation__trial-count"
        >
          {state.trialCount.toLocaleString()} trials
        </Badge>
      );
    }
    return null;
  };

  const getSessionStatusInfo = () => {
    if (state.currentSession) {
      return (
        <div className="navigation__session-info">
          <div className="navigation__session-title">Current Session</div>
          <div className="navigation__session-details">
            <Badge variant="success" size="small" pulse>
              {state.currentSession.intention?.toUpperCase() || 'BASELINE'}
            </Badge>
            <span className="navigation__session-trials">
              {state.trialCount}/{state.currentSession.targetTrials}
            </span>
          </div>
        </div>
      );
    }

    if (state.currentIntentionPeriod) {
      return (
        <div className="navigation__session-info">
          <div className="navigation__session-title">Monitoring Period</div>
          <div className="navigation__session-details">
            <Badge variant="primary" size="small" pulse>
              {state.currentIntentionPeriod.intention.toUpperCase()}
            </Badge>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <nav className={`navigation ${state.sidebarCollapsed ? 'navigation--collapsed' : ''}`}>
      <div className="navigation__header">
        <div className="navigation__logo">
          <span className="navigation__logo-icon">🧠</span>
          {!state.sidebarCollapsed && (
            <span className="navigation__logo-text">RNG Research</span>
          )}
        </div>

        {!state.sidebarCollapsed && getTrialCountBadge()}
      </div>

      <div className="navigation__items">
        {navigationItems.map((item) => (
          <NavigationButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            description={item.description}
            isActive={state.currentView === item.id}
            isCollapsed={state.sidebarCollapsed}
            badge={item.badge}
            onClick={() => handleNavigation(item.id)}
          />
        ))}
      </div>

      {!state.sidebarCollapsed && (
        <div className="navigation__footer">
          {getSessionStatusInfo()}

          <div className="navigation__system-status">
            <div className="navigation__status-title">System Status</div>
            <div className="navigation__status-items">
              <div className="navigation__status-item">
                <span>RNG Engine:</span>
                <Badge
                  variant={state.rngEngineStatus?.isRunning ? 'success' : 'warning'}
                  size="small"
                  pulse={state.rngEngineStatus?.isRunning}
                >
                  {state.rngEngineStatus?.isRunning ? 'Running' : 'Stopped'}
                </Badge>
              </div>

              <div className="navigation__status-item">
                <span>Database:</span>
                <Badge
                  variant={state.databaseStatus?.connected ? 'success' : 'error'}
                  size="small"
                >
                  {state.databaseStatus?.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MainNavigation;