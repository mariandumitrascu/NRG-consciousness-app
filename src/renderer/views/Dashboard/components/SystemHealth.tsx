/**
 * System Health Component
 * RNG and database health indicators
 */

import React from 'react';
import { useAppContext } from '@/store/AppContext';
import Card from '@/components/Common/Card';
import Badge from '@/components/Common/Badge';

const SystemHealth: React.FC = () => {
  const { state } = useAppContext();

  const healthChecks = [
    {
      name: 'RNG Engine',
      status: state.rngEngineStatus?.isRunning ? 'healthy' : 'warning',
      details: state.rngEngineStatus ? [
        { label: 'Rate Accuracy', value: `${((state.rngEngineStatus.currentRate / state.rngEngineStatus.targetRate) * 100).toFixed(1)}%` },
        { label: 'Missed Intervals', value: `${state.rngEngineStatus.timingMetrics.missedIntervals}` },
        { label: 'Avg Timing Error', value: `${state.rngEngineStatus.timingMetrics.averageError.toFixed(2)}ms` }
      ] : []
    },
    {
      name: 'Database',
      status: state.databaseStatus?.connected ? 'healthy' : 'error',
      details: state.databaseStatus ? [
        { label: 'Connection', value: state.databaseStatus.connected ? 'Active' : 'Lost' },
        { label: 'Size', value: `${state.databaseStatus.size} MB` },
        { label: 'Last Backup', value: state.databaseStatus.lastBackup?.toLocaleDateString() || 'Never' }
      ] : []
    },
    {
      name: 'Memory Usage',
      status: state.rngEngineStatus && state.rngEngineStatus.memoryUsage.current < 100 ? 'healthy' : 'warning',
      details: state.rngEngineStatus ? [
        { label: 'Current', value: `${state.rngEngineStatus.memoryUsage.current.toFixed(1)} MB` },
        { label: 'Peak', value: `${state.rngEngineStatus.memoryUsage.peak.toFixed(1)} MB` },
        { label: 'Usage', value: `${((state.rngEngineStatus.memoryUsage.current / 256) * 100).toFixed(1)}%` }
      ] : []
    }
  ];

  const getHealthBadge = (status: string) => {
    switch (status) {
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

  const getOverallHealth = () => {
    const { systemHealth } = state;
    return {
      status: systemHealth.overall,
      message: systemHealth.overall === 'healthy' ? 'All systems operational' :
               systemHealth.overall === 'warning' ? 'Some issues detected' :
               'Critical issues present',
      lastCheck: systemHealth.lastCheck
    };
  };

  const overallHealth = getOverallHealth();

  return (
    <Card
      title="System Health"
      subtitle={`Last check: ${overallHealth.lastCheck.toLocaleTimeString()}`}
      actions={getHealthBadge(overallHealth.status)}
      padding="medium"
    >
      <div className="system-health__overview">
        <div className="system-health__status">
          <div className="system-health__status-message">
            {overallHealth.message}
          </div>
        </div>
      </div>

      <div className="system-health__checks">
        {healthChecks.map((check, index) => (
          <div key={index} className="system-health__check">
            <div className="system-health__check-header">
              <h4 className="system-health__check-name">{check.name}</h4>
              {getHealthBadge(check.status)}
            </div>

            {check.details.length > 0 && (
              <div className="system-health__check-details">
                {check.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="system-health__check-detail">
                    <span className="system-health__detail-label">{detail.label}:</span>
                    <span className="system-health__detail-value">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="system-health__actions">
        <button className="system-health__refresh">
          🔄 Refresh Status
        </button>
        <button className="system-health__diagnostics">
          🔍 Run Diagnostics
        </button>
      </div>
    </Card>
  );
};

export default SystemHealth;