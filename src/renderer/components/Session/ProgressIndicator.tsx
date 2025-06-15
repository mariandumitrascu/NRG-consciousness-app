import React from 'react';
import { SessionProgress } from '../../../shared/types';
import { format } from 'date-fns';

interface ProgressIndicatorProps {
    progress: SessionProgress;
    sessionStatus: string;
}

/**
 * Session progress indicator with visual progress bar and timing information
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    progress,
    sessionStatus
}) => {
    /**
     * Format elapsed time as MM:SS
     */
    const formatElapsedTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    /**
     * Format estimated completion time
     */
    const formatEstimatedCompletion = (estimatedCompletion: Date | null) => {
        if (!estimatedCompletion) return 'Calculating...';
        return format(estimatedCompletion, 'HH:mm:ss');
    };

    /**
     * Get progress bar color based on completion percentage
     */
    const getProgressColor = () => {
        if (progress.percentComplete < 25) return '#FF5722';
        if (progress.percentComplete < 50) return '#FF9800';
        if (progress.percentComplete < 75) return '#FFC107';
        return '#4CAF50';
    };

    /**
     * Get generation rate status
     */
    const getRateStatus = () => {
        const targetRate = 1.0; // 1 trial per second
        const efficiency = progress.currentRate / targetRate;

        if (efficiency >= 0.9) return { status: 'excellent', color: '#4CAF50' };
        if (efficiency >= 0.7) return { status: 'good', color: '#8BC34A' };
        if (efficiency >= 0.5) return { status: 'fair', color: '#FF9800' };
        return { status: 'low', color: '#FF5722' };
    };

    const progressColor = getProgressColor();
    const rateStatus = getRateStatus();

    return (
        <div className="progress-indicator">
            <h3 className="panel-title">Session Progress</h3>

            {/* Main Progress Bar */}
            <div className="progress-section">
                <div className="progress-header">
                    <span className="progress-label">Trial Progress</span>
                    <span className="progress-percentage">{progress.percentComplete.toFixed(1)}%</span>
                </div>
                <div className="progress-bar-container">
                    <div
                        className="progress-bar"
                        style={{
                            width: `${progress.percentComplete}%`,
                            backgroundColor: progressColor
                        }}
                    />
                </div>
                <div className="progress-details">
                    <span>{progress.trialsCompleted}</span>
                    <span>of</span>
                    <span>{progress.targetTrials}</span>
                    <span>trials</span>
                </div>
            </div>

            {/* Timing Information */}
            <div className="timing-section">
                <div className="timing-item">
                    <div className="timing-label">Elapsed Time</div>
                    <div className="timing-value">
                        {formatElapsedTime(progress.elapsedTime)}
                    </div>
                </div>

                <div className="timing-item">
                    <div className="timing-label">Est. Completion</div>
                    <div className="timing-value">
                        {formatEstimatedCompletion(progress.estimatedCompletion)}
                    </div>
                </div>

                <div className="timing-item">
                    <div className="timing-label">Generation Rate</div>
                    <div className="timing-value" style={{ color: rateStatus.color }}>
                        {progress.currentRate.toFixed(2)} Hz
                    </div>
                    <div className="timing-sublabel">
                        {rateStatus.status}
                    </div>
                </div>
            </div>

            {/* Session Status */}
            <div className="status-section">
                <div className="status-item">
                    <div className={`status-indicator ${sessionStatus}`}>
                        <div className="status-dot"></div>
                        <span className="status-text">
                            {sessionStatus === 'running' ? 'Active Collection' :
                             sessionStatus === 'paused' ? 'Paused' :
                             sessionStatus === 'meditation' ? 'Meditation Phase' :
                             sessionStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="metrics-section">
                <div className="metrics-grid">
                    <div className="metric-item">
                        <div className="metric-value">
                            {progress.trialsCompleted > 0 ?
                                (progress.elapsedTime / progress.trialsCompleted / 1000).toFixed(2) :
                                '0.00'
                            }s
                        </div>
                        <div className="metric-label">Avg Time/Trial</div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-value">
                            {progress.targetTrials - progress.trialsCompleted}
                        </div>
                        <div className="metric-label">Remaining</div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-value">
                            {progress.estimatedCompletion ?
                                Math.max(0, Math.ceil((progress.estimatedCompletion.getTime() - Date.now()) / 60000)) :
                                '?'
                            }min
                        </div>
                        <div className="metric-label">Time Left</div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .progress-indicator {
                    width: 100%;
                    color: rgba(255, 255, 255, 0.9);
                }

                .panel-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.9);
                }

                .progress-section {
                    margin-bottom: 20px;
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .progress-label {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 500;
                }

                .progress-percentage {
                    font-size: 16px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                }

                .progress-bar-container {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .progress-bar {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s ease, background-color 0.3s ease;
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
                }

                .progress-details {
                    display: flex;
                    justify-content: center;
                    gap: 4px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .timing-section {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .timing-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    padding: 10px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .timing-label {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 4px;
                    font-weight: 500;
                }

                .timing-value {
                    font-size: 16px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                }

                .timing-sublabel {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.5);
                    margin-top: 2px;
                    text-transform: capitalize;
                }

                .status-section {
                    margin-bottom: 20px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 8px 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                .status-indicator.running .status-dot {
                    background: #4CAF50;
                }

                .status-indicator.paused .status-dot {
                    background: #FF9800;
                    animation: none;
                }

                .status-indicator.meditation .status-dot {
                    background: #9C27B0;
                }

                .status-text {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                }

                .metrics-section {
                    margin-top: 15px;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .metric-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    padding: 8px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .metric-value {
                    font-size: 14px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 2px;
                }

                .metric-label {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.7;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .timing-section {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .metrics-grid {
                        grid-template-columns: 1fr;
                        gap: 8px;
                    }

                    .timing-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        text-align: left;
                    }

                    .timing-value {
                        font-size: 14px;
                    }
                }

                /* Animation for progress bar */
                .progress-bar {
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% {
                        box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
                    }
                    100% {
                        box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
                    }
                }

                /* Reduce motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .status-dot {
                        animation: none;
                    }

                    .progress-bar {
                        animation: none;
                        transition: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProgressIndicator;