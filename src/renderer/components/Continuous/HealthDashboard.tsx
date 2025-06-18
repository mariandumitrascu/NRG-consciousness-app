import React from 'react';
import { HealthStatus } from '../../../shared/types';

interface HealthDashboardProps {
  health: HealthStatus;
  onRefresh?: () => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  health,
  onRefresh
}) => {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error' | 'inactive'): string => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'inactive': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error' | 'inactive'): string => {
    switch (status) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      case 'inactive': return '○';
      default: return '○';
    }
  };

  const getOverallStatusLabel = (status: 'healthy' | 'warning' | 'error'): string => {
    switch (status) {
      case 'healthy': return 'All Systems Operational';
      case 'warning': return 'Minor Issues Detected';
      case 'error': return 'Critical Issues Detected';
      default: return 'Status Unknown';
    }
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h3>System Health</h3>
          <div className="last-check">
            Last check: {health.lastCheck ? health.lastCheck.toLocaleTimeString() : 'Never'}
          </div>
        </div>
        {onRefresh && (
          <button
            className="refresh-button"
            onClick={onRefresh}
          >
            ⟳
          </button>
        )}
      </div>

      <div className="overall-status">
        <div className={`status-indicator ${health.overall}`}>
          <div className="status-icon">{getStatusIcon(health.overall)}</div>
        </div>
        <div className="status-text">
          <div className="status-label">{getOverallStatusLabel(health.overall)}</div>
          <div className="uptime">Uptime: {formatUptime(health.uptime)}</div>
        </div>
      </div>

      <div className="components-status">
        <h4>Components</h4>
        <div className="components-grid">
          <div className="component-item">
            <div className="component-header">
              <span className="component-name">Data Collector</span>
              <div
                className="component-status"
                style={{ color: getStatusColor(health.components.collector) }}
              >
                {getStatusIcon(health.components.collector)} {health.components.collector}
              </div>
            </div>
            <div className="component-description">
              Manages continuous RNG data collection at 1 Hz
            </div>
          </div>

          <div className="component-item">
            <div className="component-header">
              <span className="component-name">Background Analyzer</span>
              <div
                className="component-status"
                style={{ color: getStatusColor(health.components.analyzer) }}
              >
                {getStatusIcon(health.components.analyzer)} {health.components.analyzer}
              </div>
            </div>
            <div className="component-description">
              Performs statistical analysis and anomaly detection
            </div>
          </div>

          <div className="component-item">
            <div className="component-header">
              <span className="component-name">Database</span>
              <div
                className="component-status"
                style={{ color: getStatusColor(health.components.database) }}
              >
                {getStatusIcon(health.components.database)} {health.components.database}
              </div>
            </div>
            <div className="component-description">
              Stores trial data and analysis results
            </div>
          </div>
        </div>
      </div>

      <div className="system-metrics">
        <h4>Performance Metrics</h4>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-label">Memory Usage</div>
            <div className="metric-value">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(health.memoryUsage?.current ?? 0, 100)}%`,
                    backgroundColor: (health.memoryUsage?.current ?? 0) > 80 ? '#ef4444' :
                                   (health.memoryUsage?.current ?? 0) > 60 ? '#f59e0b' : '#10b981'
                  }}
                ></div>
              </div>
              <span className="metric-text">{(health.memoryUsage?.current ?? 0).toFixed(1)}%</span>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">CPU Usage</div>
            <div className="metric-value">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(health.cpuUsage, 100)}%`,
                    backgroundColor: health.cpuUsage > 80 ? '#ef4444' :
                                   health.cpuUsage > 60 ? '#f59e0b' : '#10b981'
                  }}
                ></div>
              </div>
              <span className="metric-text">{health.cpuUsage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="health-summary">
        <div className="summary-item">
          <span className="summary-label">Total Uptime</span>
          <span className="summary-value">{formatUptime(health.uptime)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Last Health Check</span>
          <span className="summary-value">{health.lastCheck ? health.lastCheck.toLocaleString() : 'Never'}</span>
        </div>
      </div>

      <style>{`
        .health-dashboard {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .header-content h3 {
          margin: 0 0 4px 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
        }

        .last-check {
          color: #94a3b8;
          font-size: 12px;
          font-family: Monaco, Consolas, 'Courier New', monospace;
        }

        .refresh-button {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .refresh-button:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.5);
          transform: rotate(180deg);
        }

        .overall-status {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .status-indicator {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }

        .status-indicator.healthy {
          background: rgba(16, 185, 129, 0.2);
          border: 2px solid #10b981;
          color: #10b981;
        }

        .status-indicator.warning {
          background: rgba(245, 158, 11, 0.2);
          border: 2px solid #f59e0b;
          color: #f59e0b;
        }

        .status-indicator.error {
          background: rgba(239, 68, 68, 0.2);
          border: 2px solid #ef4444;
          color: #ef4444;
        }

        .status-text {
          flex: 1;
        }

        .status-label {
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .uptime {
          color: #94a3b8;
          font-size: 14px;
          font-family: Monaco, Consolas, 'Courier New', monospace;
        }

        .components-status {
          margin-bottom: 20px;
        }

        .components-status h4 {
          margin: 0 0 12px 0;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
        }

        .components-grid {
          display: grid;
          gap: 12px;
        }

        .component-item {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 12px;
        }

        .component-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .component-name {
          color: #ffffff;
          font-weight: 500;
        }

        .component-status {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .component-description {
          color: #94a3b8;
          font-size: 12px;
        }

        .system-metrics {
          margin-bottom: 20px;
        }

        .system-metrics h4 {
          margin: 0 0 12px 0;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
        }

        .metrics-grid {
          display: grid;
          gap: 12px;
        }

        .metric-item {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 12px;
        }

        .metric-label {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .metric-value {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .metric-text {
          color: #94a3b8;
          font-size: 12px;
          font-family: Monaco, Consolas, 'Courier New', monospace;
          min-width: 40px;
          text-align: right;
        }

        .health-summary {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          padding: 12px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .summary-item:last-child {
          margin-bottom: 0;
        }

        .summary-label {
          color: #94a3b8;
          font-size: 13px;
        }

        .summary-value {
          color: #ffffff;
          font-size: 13px;
          font-family: Monaco, Consolas, 'Courier New', monospace;
        }

        @media (min-width: 768px) {
          .components-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }

          .metrics-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};