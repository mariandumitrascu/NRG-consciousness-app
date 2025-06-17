import React, { useState, useEffect } from 'react';
import { HealthStatus, SignificantEvent } from '../../../shared/types';

interface MonitorDashboardProps {
    isCollecting: boolean;
    currentRate: number;        // Trials per second
    todayCount: number;        // Trials collected today
    currentDeviation: number;  // Running deviation
    systemHealth: HealthStatus;
    significantEvents: SignificantEvent[];
}

/**
 * Live monitoring dashboard component
 *
 * Displays real-time metrics and system status:
 * - Collection rate and count
 * - Current deviation
 * - System health indicators
 * - Recent significant events
 */
export const MonitorDashboard: React.FC<MonitorDashboardProps> = ({
    isCollecting,
    currentRate,
    todayCount,
    currentDeviation,
    systemHealth,
    significantEvents
}) => {
    const [timeDisplay, setTimeDisplay] = useState<string>('');

    /**
     * Update time display
     */
    useEffect(() => {
        const updateTime = () => {
            setTimeDisplay(new Date().toLocaleTimeString());
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    /**
     * Get status color based on health
     */
    const getStatusColor = (status: 'healthy' | 'warning' | 'error'): string => {
        switch (status) {
            case 'healthy': return '#4CAF50';
            case 'warning': return '#FF9800';
            case 'error': return '#f44336';
            default: return '#9E9E9E';
        }
    };

    /**
     * Format number with commas
     */
    const formatNumber = (num: number): string => {
        return num.toLocaleString();
    };

    /**
     * Get rate status
     */
    const getRateStatus = (): { status: string; color: string } => {
        if (!isCollecting) {
            return { status: 'Stopped', color: '#9E9E9E' };
        }

        if (currentRate >= 0.95) {
            return { status: 'Excellent', color: '#4CAF50' };
        } else if (currentRate >= 0.8) {
            return { status: 'Good', color: '#8BC34A' };
        } else if (currentRate >= 0.5) {
            return { status: 'Fair', color: '#FF9800' };
        } else {
            return { status: 'Poor', color: '#f44336' };
        }
    };

    const rateStatus = getRateStatus();

    /**
     * Get recent significant events (last 5)
     */
    const recentEvents = significantEvents
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

    return (
        <div className="monitor-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h2>Live Monitor</h2>
                <div className="current-time">{timeDisplay}</div>
            </div>

            {/* Main Metrics */}
            <div className="metrics-grid">
                {/* Collection Rate */}
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Collection Rate</span>
                        <div
                            className="metric-status"
                            style={{ color: rateStatus.color }}
                        >
                            {rateStatus.status}
                        </div>
                    </div>
                    <div className="metric-value">
                        {currentRate.toFixed(3)} <span className="metric-unit">trials/sec</span>
                    </div>
                    <div className="metric-target">
                        Target: 1.000 trials/sec
                    </div>
                </div>

                {/* Today's Count */}
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Today's Trials</span>
                    </div>
                    <div className="metric-value">
                        {formatNumber(todayCount)}
                    </div>
                    <div className="metric-target">
                        Expected: {formatNumber(Math.floor(Date.now() / 1000) % 86400)} for 24hrs
                    </div>
                </div>

                {/* Current Deviation */}
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">Current Deviation</span>
                    </div>
                    <div className="metric-value">
                        {currentDeviation >= 0 ? '+' : ''}{currentDeviation.toFixed(3)}
                    </div>
                    <div className="metric-target">
                        Expected: ~0.000
                    </div>
                </div>

                {/* System Health */}
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">System Health</span>
                        <div
                            className="health-indicator"
                            style={{ backgroundColor: getStatusColor(systemHealth.status) }}
                        ></div>
                    </div>
                    <div className="metric-value health-status">
                        {systemHealth.status.toUpperCase()}
                    </div>
                    <div className="metric-target">
                        Uptime: {formatUptime(systemHealth.uptime)}
                    </div>
                </div>
            </div>

            {/* Detailed Health Metrics */}
            <div className="health-details">
                <h3>System Details</h3>
                <div className="health-metrics">
                    <div className="health-metric">
                        <span className="health-label">RNG Status</span>
                        <div
                            className="health-value"
                            style={{ color: getStatusColor(systemHealth.rngStatus) }}
                        >
                            {systemHealth.rngStatus}
                        </div>
                    </div>

                    <div className="health-metric">
                        <span className="health-label">Database</span>
                        <div
                            className="health-value"
                            style={{ color: getStatusColor(systemHealth.databaseStatus) }}
                        >
                            {systemHealth.databaseStatus}
                        </div>
                    </div>

                    <div className="health-metric">
                        <span className="health-label">Memory</span>
                        <div className="health-value">
                            {systemHealth.memoryUsage.current.toFixed(1)} MB
                            <span className="health-subvalue">
                                / {systemHealth.memoryUsage.peak.toFixed(1)} MB peak
                            </span>
                        </div>
                    </div>

                    <div className="health-metric">
                        <span className="health-label">Data Rate</span>
                        <div
                            className="health-value"
                            style={{ color: getStatusColor(systemHealth.dataRate.status) }}
                        >
                            {((systemHealth.dataRate.current / systemHealth.dataRate.expected) * 100).toFixed(1)}%
                        </div>
                    </div>

                    <div className="health-metric">
                        <span className="health-label">Missed Trials</span>
                        <div className="health-value">
                            {systemHealth.missedTrials}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Events */}
            <div className="events-section">
                <h3>Recent Events</h3>
                {recentEvents.length === 0 ? (
                    <div className="no-events">No significant events recorded</div>
                ) : (
                    <div className="events-list">
                        {recentEvents.map((event) => (
                            <div key={event.id} className={`event-item ${event.severity}`}>
                                <div className="event-header">
                                    <span className="event-type">{event.type.replace('_', ' ')}</span>
                                    <span className="event-time">
                                        {formatEventTime(event.timestamp)}
                                    </span>
                                </div>
                                <div className="event-description">
                                    {event.description}
                                </div>
                                {event.significance && (
                                    <div className="event-significance">
                                        Z-score: {event.significance.zScore.toFixed(3)},
                                        p-value: {event.significance.pValue.toFixed(6)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Styles */}
            <style jsx>{`
                .monitor-dashboard {
                    color: white;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .dashboard-header h2 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 500;
                }

                .current-time {
                    font-family: Monaco, Consolas, 'Courier New', monospace;
                    font-size: 18px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .metric-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .metric-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .metric-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .metric-status {
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .health-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .metric-value {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 5px;
                }

                .metric-value.health-status {
                    font-size: 18px;
                }

                .metric-unit {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: normal;
                }

                .metric-target {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .health-details {
                    margin-bottom: 25px;
                }

                .health-details h3 {
                    margin: 0 0 15px 0;
                    font-size: 16px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                }

                .health-metrics {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                }

                .health-metric {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .health-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .health-value {
                    font-size: 12px;
                    font-weight: 600;
                    text-align: right;
                }

                .health-subvalue {
                    display: block;
                    font-size: 10px;
                    font-weight: normal;
                    color: rgba(255, 255, 255, 0.5);
                }

                .events-section h3 {
                    margin: 0 0 15px 0;
                    font-size: 16px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                }

                .no-events {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-style: italic;
                    padding: 20px;
                }

                .events-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .event-item {
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 3px solid;
                    background: rgba(255, 255, 255, 0.05);
                }

                .event-item.low {
                    border-left-color: #4CAF50;
                }

                .event-item.medium {
                    border-left-color: #FF9800;
                }

                .event-item.high {
                    border-left-color: #f44336;
                }

                .event-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }

                .event-type {
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: capitalize;
                }

                .event-time {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .event-description {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 4px;
                }

                .event-significance {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.6);
                    font-family: Monaco, Consolas, 'Courier New', monospace;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .metrics-grid {
                        grid-template-columns: 1fr;
                    }

                    .health-metrics {
                        grid-template-columns: 1fr;
                    }

                    .dashboard-header {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
};

/**
 * Format uptime in milliseconds to human readable string
 */
function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Format event timestamp relative to now
 */
function formatEventTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ago`;
    } else if (hours > 0) {
        return `${hours}h ago`;
    } else if (minutes > 0) {
        return `${minutes}m ago`;
    } else {
        return 'Just now';
    }
}

export default MonitorDashboard;