/**
 * Dashboard View Component
 * Main overview screen showing system status and quick stats
 */

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/store/AppContext';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Badge from '@/components/Common/Badge';
import StatusCard from './components/StatusCard';
import QuickStats from './components/QuickStats';
import RecentActivity from './components/RecentActivity';
import SystemHealth from './components/SystemHealth';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { state, navigateTo, updateEngineStatus, updateDatabaseStatus } = useAppContext();
  const [dashboardStats, setDashboardStats] = useState({
    todayTrials: 0,
    recentSessions: 0,
    systemUptime: '00:00:00',
    dataQuality: 'Good'
  });

  // Mock real-time updates for demo purposes
  useEffect(() => {
    const updateStats = () => {
      setDashboardStats(prev => ({
        ...prev,
        todayTrials: Math.floor(Math.random() * 1000) + 500,
        recentSessions: Math.floor(Math.random() * 10) + 5,
        systemUptime: new Date().toLocaleTimeString('en-US', { hour12: false })
      }));
    };

    // Update stats immediately and then every 30 seconds
    updateStats();
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, []);

  // Mock system status updates
  useEffect(() => {
    const updateSystemStatus = () => {
      // Mock RNG engine status
      updateEngineStatus({
        isRunning: Math.random() > 0.2, // 80% chance of running
        currentRate: 1.0 + (Math.random() - 0.5) * 0.1, // ±5% variation
        targetRate: 1.0,
        totalTrials: dashboardStats.todayTrials,
        lastTrialTime: new Date(),
        startTime: new Date(Date.now() - Math.random() * 3600000), // Random start time in last hour
        timingMetrics: {
          averageError: Math.random() * 2,
          maximumError: Math.random() * 10,
          missedIntervals: Math.floor(Math.random() * 5)
        },
        memoryUsage: {
          current: Math.random() * 50 + 20,
          peak: Math.random() * 30 + 50
        }
      });

      // Mock database status
      updateDatabaseStatus({
        connected: Math.random() > 0.1, // 90% chance of connected
        version: '3.45.2',
        size: Math.floor(Math.random() * 100) + 50, // 50-150 MB
        lastBackup: new Date(Date.now() - Math.random() * 86400000) // Random backup in last 24h
      });
    };

    updateSystemStatus();
    const interval = setInterval(updateSystemStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [updateEngineStatus, updateDatabaseStatus, dashboardStats.todayTrials]);

  const handleStartSession = () => {
    navigateTo('session-mode');
  };

  const handleStartMonitoring = () => {
    navigateTo('continuous-mode');
  };

  const handleRunCalibration = () => {
    navigateTo('calibration');
  };

  const handleViewAnalysis = () => {
    navigateTo('analysis');
  };

  const getSystemStatusSummary = () => {
    const { systemHealth } = state;
    return {
      variant: systemHealth.overall === 'healthy' ? 'success' :
               systemHealth.overall === 'warning' ? 'warning' : 'error',
      message: systemHealth.overall === 'healthy' ? 'All systems operational' :
               systemHealth.overall === 'warning' ? 'Minor issues detected' :
               'Critical issues require attention'
    };
  };

  const getCurrentActivity = () => {
    if (state.currentSession) {
      return {
        type: 'Session Active',
        description: `${state.currentSession.intention?.toUpperCase()} intention experiment`,
        progress: state.trialCount / state.currentSession.targetTrials,
        badge: { variant: 'success' as const, pulse: true }
      };
    }

    if (state.currentIntentionPeriod) {
      return {
        type: 'Monitoring Active',
        description: `${state.currentIntentionPeriod.intention.toUpperCase()} intention period`,
        progress: null,
        badge: { variant: 'primary' as const, pulse: true }
      };
    }

    return {
      type: 'System Ready',
      description: 'Ready to begin experiments',
      progress: null,
      badge: { variant: 'neutral' as const, pulse: false }
    };
  };

  const systemStatus = getSystemStatusSummary();
  const currentActivity = getCurrentActivity();

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="dashboard__title-section">
          <h1 className="dashboard__title">Research Dashboard</h1>
          <p className="dashboard__subtitle">
            RNG Consciousness Experiment Control Center
          </p>
        </div>

        <div className="dashboard__status-summary">
          <Badge
            variant={systemStatus.variant}
            size="medium"
            pulse={systemStatus.variant !== 'success'}
            icon={systemStatus.variant === 'healthy' ? '✓' :
                  systemStatus.variant === 'warning' ? '⚠' : '✗'}
          >
            {systemStatus.message}
          </Badge>
        </div>
      </div>

      <div className="dashboard__content">
        {/* Current Activity Card */}
        <Card
          title="Current Activity"
          variant={currentActivity.badge.variant === 'success' ? 'highlighted' : 'default'}
          className="dashboard__activity-card"
        >
          <div className="dashboard__activity">
            <div className="dashboard__activity-info">
              <Badge
                variant={currentActivity.badge.variant}
                pulse={currentActivity.badge.pulse}
                size="medium"
              >
                {currentActivity.type}
              </Badge>
              <p className="dashboard__activity-description">
                {currentActivity.description}
              </p>
              {currentActivity.progress !== null && (
                <div className="dashboard__progress">
                  <div className="dashboard__progress-bar">
                    <div
                      className="dashboard__progress-fill"
                      style={{ width: `${(currentActivity.progress * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <span className="dashboard__progress-text">
                    {(currentActivity.progress * 100).toFixed(1)}% Complete
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" className="dashboard__actions-card">
          <div className="dashboard__actions">
            <Button
              variant="primary"
              size="large"
              icon="🎯"
              onClick={handleStartSession}
              disabled={!!state.currentSession}
            >
              Start Session Experiment
            </Button>

            <Button
              variant="secondary"
              size="large"
              icon="📈"
              onClick={handleStartMonitoring}
              disabled={!!state.currentIntentionPeriod}
            >
              Begin Continuous Monitoring
            </Button>

            <Button
              variant="ghost"
              size="large"
              icon="⚙️"
              onClick={handleRunCalibration}
            >
              Run Calibration
            </Button>

            <Button
              variant="ghost"
              size="large"
              icon="🔬"
              onClick={handleViewAnalysis}
            >
              View Analysis
            </Button>
          </div>
        </Card>

        {/* System Status Grid */}
        <div className="dashboard__status-grid">
          <StatusCard
            title="RNG Engine"
            status={state.rngEngineStatus?.isRunning ? 'running' : 'stopped'}
            value={state.rngEngineStatus?.isRunning ? 'Running' : 'Stopped'}
            details={state.rngEngineStatus ? {
              'Rate': `${state.rngEngineStatus.currentRate.toFixed(3)} Hz`,
              'Total Trials': state.rngEngineStatus.totalTrials.toLocaleString(),
              'Memory': `${state.rngEngineStatus.memoryUsage.current.toFixed(1)} MB`
            } : {}}
          />

          <StatusCard
            title="Database"
            status={state.databaseStatus?.connected ? 'connected' : 'disconnected'}
            value={state.databaseStatus?.connected ? 'Connected' : 'Disconnected'}
            details={state.databaseStatus ? {
              'Version': state.databaseStatus.version,
              'Size': `${state.databaseStatus.size} MB`,
              'Last Backup': state.databaseStatus.lastBackup?.toLocaleDateString() || 'Never'
            } : {}}
          />

          <StatusCard
            title="Today's Activity"
            status="info"
            value={dashboardStats.todayTrials.toLocaleString()}
            subtitle="Trials Generated"
            details={{
              'Sessions': `${dashboardStats.recentSessions}`,
              'Data Quality': dashboardStats.dataQuality,
              'Uptime': dashboardStats.systemUptime
            }}
          />
        </div>

        {/* Statistics and System Health */}
        <div className="dashboard__bottom-section">
          <QuickStats />
          <SystemHealth />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;