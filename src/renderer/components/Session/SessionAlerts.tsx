import React from 'react';
import { SessionAlert } from '../../../shared/types';
import Button from '../Common/Button';
import Badge from '../Common/Badge';

interface SessionAlertsProps {
    alerts: SessionAlert[];
    onDismiss: (alertId: string) => void;
}

/**
 * Session Alerts Component
 * Displays system alerts and notifications during sessions
 */
export const SessionAlerts: React.FC<SessionAlertsProps> = ({
    alerts,
    onDismiss
}) => {
    if (alerts.length === 0) {
        return null;
    }

    const getAlertIcon = (type: SessionAlert['type']): string => {
        switch (type) {
            case 'significance': return '📊';
            case 'milestone': return '🎯';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return 'ℹ️';
        }
    };

    const getAlertVariant = (type: SessionAlert['type']): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' => {
        switch (type) {
            case 'significance': return 'success';
            case 'milestone': return 'primary';
            case 'warning': return 'warning';
            case 'error': return 'error';
            case 'info': return 'info';
            default: return 'neutral';
        }
    };

    const formatAlertTime = (timestamp: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);

        if (diffSeconds < 60) {
            return 'Just now';
        } else if (diffSeconds < 3600) {
            const minutes = Math.floor(diffSeconds / 60);
            return `${minutes}m ago`;
        } else {
            return timestamp.toLocaleTimeString();
        }
    };

    return (
        <div className="session-alerts">
            {alerts.map((alert) => (
                <div key={alert.id} className={`alert alert--${alert.type}`}>
                    <div className="alert__content">
                        <div className="alert__header">
                            <div className="alert__icon">
                                {getAlertIcon(alert.type)}
                            </div>
                            <div className="alert__title">
                                {alert.title}
                            </div>
                            <div className="alert__badge">
                                <Badge variant={getAlertVariant(alert.type)} size="small">
                                    {alert.type.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="alert__time">
                                {formatAlertTime(alert.timestamp)}
                            </div>
                        </div>

                        <div className="alert__message">
                            {alert.message}
                        </div>

                        {alert.details && (
                            <div className="alert__details">
                                {Object.entries(alert.details).map(([key, value]) => (
                                    <div key={key} className="alert__detail">
                                        <span className="alert__detail-key">{key}:</span>
                                        <span className="alert__detail-value">
                                            {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="alert__actions">
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={() => onDismiss(alert.id)}
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            ))}

            <style jsx>{`
                .session-alerts {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .alert {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    animation: slideIn 0.3s ease-out;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                }

                .alert--significance {
                    border-left: 4px solid #4CAF50;
                    background: rgba(76, 175, 80, 0.1);
                }

                .alert--milestone {
                    border-left: 4px solid #2563eb;
                    background: rgba(37, 99, 235, 0.1);
                }

                .alert--warning {
                    border-left: 4px solid #f59e0b;
                    background: rgba(245, 158, 11, 0.1);
                }

                .alert--error {
                    border-left: 4px solid #dc2626;
                    background: rgba(220, 38, 38, 0.1);
                }

                .alert--info {
                    border-left: 4px solid #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                }

                .alert__content {
                    flex: 1;
                    color: #1f2937;
                }

                .alert__header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .alert__icon {
                    font-size: 1.2rem;
                }

                .alert__title {
                    font-weight: 600;
                    font-size: 0.95rem;
                    flex: 1;
                }

                .alert__time {
                    font-size: 0.75rem;
                    color: #6b7280;
                    white-space: nowrap;
                }

                .alert__message {
                    font-size: 0.875rem;
                    line-height: 1.4;
                    color: #374151;
                    margin-bottom: 8px;
                }

                .alert__details {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 6px;
                    padding: 8px;
                    font-size: 0.8rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .alert__detail {
                    display: flex;
                    gap: 4px;
                }

                .alert__detail-key {
                    font-weight: 500;
                    color: #6b7280;
                }

                .alert__detail-value {
                    font-family: Monaco, Consolas, 'Courier New', monospace;
                    color: #1f2937;
                }

                .alert__actions {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .session-alerts {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }

                    .alert {
                        padding: 12px;
                    }

                    .alert__header {
                        flex-wrap: wrap;
                        gap: 6px;
                    }

                    .alert__time {
                        order: 3;
                        width: 100%;
                        margin-top: 4px;
                    }
                }

                /* High contrast mode */
                @media (prefers-contrast: high) {
                    .alert {
                        background: white;
                        border: 2px solid #000;
                    }

                    .alert__message,
                    .alert__detail-value {
                        color: #000;
                    }
                }

                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .alert {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default SessionAlerts;