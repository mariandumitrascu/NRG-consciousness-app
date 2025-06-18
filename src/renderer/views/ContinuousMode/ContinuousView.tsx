import React, { useState, useEffect } from 'react';
import {
    ContinuousStatus,
    IntentionPeriod,
    TimeRange,
    SignificantEvent
} from '../../../shared/types';
import { useContinuousManager } from '../../hooks/useContinuousManager';
import { MonitorDashboard } from './MonitorDashboard';
import { ContinuousTimeline } from './ContinuousTimeline';
import { IntentionPeriodControls } from '../../components/Continuous/IntentionPeriodControls';
import { HealthDashboard } from '../../components/Continuous/HealthDashboard';
import { QuickIntentionButton } from '../../components/Continuous/QuickIntentionButton';

/**
 * Main continuous monitoring interface
 *
 * Features:
 * - Real-time activity indicator
 * - Current intention period management
 * - Today's trial count and statistics
 * - System health dashboard
 * - Quick intention period controls
 * - Interactive timeline visualization
 */
export const ContinuousView: React.FC = () => {
    const {
        status,
        isCollecting,
        startCollection,
        stopCollection,
        startIntentionPeriod,
        endIntentionPeriod,
        updateIntentionNotes,
        getTimelineData,
        getSignificantEvents,
        error
    } = useContinuousManager();

    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
        label: 'Last 24 Hours',
        type: 'day'
    });

    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [significantEvents, setSignificantEvents] = useState<SignificantEvent[]>([]);
    const [showTimeline, setShowTimeline] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Load timeline data when time range changes
     */
    useEffect(() => {
        const loadTimelineData = async () => {
            try {
                const data = await getTimelineData(selectedTimeRange);
                setTimelineData(data);

                const events = await getSignificantEvents(selectedTimeRange);
                setSignificantEvents(events);
            } catch (error) {
                console.error('Error loading timeline data:', error);
            }
        };

        loadTimelineData();

        // Refresh timeline data every 30 seconds
        const interval = setInterval(loadTimelineData, 30000);
        return () => clearInterval(interval);
    }, [selectedTimeRange, getTimelineData, getSignificantEvents]);

    /**
     * Set loading to false when status is available
     */
    useEffect(() => {
        if (status !== null) {
            setIsLoading(false);
        }
    }, [status]);

    /**
     * Handle starting a new intention period
     */
    const handleStartIntention = async (intention: 'high' | 'low', notes?: string) => {
        try {
            await startIntentionPeriod(intention, notes || '');
        } catch (error) {
            console.error('Error starting intention period:', error);
        }
    };

    /**
     * Handle ending current intention period
     */
    const handleEndIntention = async () => {
        try {
            await endIntentionPeriod();
        } catch (error) {
            console.error('Error ending intention period:', error);
        }
    };

    /**
     * Handle updating intention notes
     */
    const handleUpdateNotes = async (notes: string) => {
        try {
            await updateIntentionNotes(notes);
        } catch (error) {
            console.error('Error updating intention notes:', error);
        }
    };

    /**
     * Handle collection toggle
     */
    const handleToggleCollection = async () => {
        try {
            if (isCollecting) {
                await stopCollection();
            } else {
                await startCollection();
            }
        } catch (error) {
            console.error('Error toggling collection:', error);
        }
    };

    /**
     * Handle time range selection
     */
    const handleTimeRangeChange = (range: TimeRange) => {
        setSelectedTimeRange(range);
    };

    /**
     * Render collection status indicator
     */
    const renderCollectionStatus = () => {
        const statusColor = isCollecting ? '#4CAF50' : '#f44336';
        const statusText = isCollecting ? 'COLLECTING' : 'STOPPED';
        const pulseClass = isCollecting ? 'pulse' : '';

        return (
            <div className="collection-status">
                <div className={`status-indicator ${pulseClass}`} style={{ backgroundColor: statusColor }}>
                    <div className="status-dot"></div>
                </div>
                <div className="status-text">
                    <span className="status-label">{statusText}</span>
                    {isCollecting && status && (
                        <span className="status-details">
                            {status.currentRate.toFixed(2)} trials/sec • {status.totalTrials} total trials
                        </span>
                    )}
                </div>
            </div>
        );
    };

    /**
     * Render current intention period info
     */
    const renderCurrentIntention = () => {
        const currentPeriod = status?.currentIntentionPeriod;

        if (!currentPeriod) {
            return (
                <div className="intention-status neutral">
                    <span className="intention-label">Baseline Mode</span>
                    <span className="intention-description">No active intention period</span>
                </div>
            );
        }

        const duration = currentPeriod.startTime ? Date.now() - currentPeriod.startTime.getTime() : 0;
        const durationText = formatDuration(duration);
        const intentionColor = currentPeriod.intention === 'high' ? '#2196F3' : '#FF9800';

        return (
            <div className="intention-status active" style={{ borderLeftColor: intentionColor }}>
                <span className="intention-label">
                    {currentPeriod.intention === 'high' ? 'High' : 'Low'} Intention Active
                </span>
                <span className="intention-duration">Duration: {durationText}</span>
                {currentPeriod.notes && (
                    <span className="intention-notes">"{currentPeriod.notes}"</span>
                )}
            </div>
        );
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="continuous-view">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Loading continuous monitoring...</div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="continuous-view">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">
                        <h2>Unable to Load Continuous Monitoring</h2>
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>
                            Reload Application
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show message if status is still null (shouldn't happen after loading)
    if (!status) {
        return (
            <div className="continuous-view">
                <div className="error-container">
                    <div className="error-icon">🔄</div>
                    <div className="error-text">
                        <h2>Waiting for System Status</h2>
                        <p>Please wait while the continuous monitoring system initializes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="continuous-view">
            {/* Header */}
            <div className="continuous-header">
                <div className="header-left">
                    <h1>Continuous Monitoring</h1>
                    <div className="header-subtitle">24/7 RNG Data Collection & Analysis</div>
                </div>
                <div className="header-right">
                    <button
                        onClick={handleToggleCollection}
                        className={`collection-toggle ${isCollecting ? 'stop' : 'start'}`}
                    >
                        {isCollecting ? '⏹ Stop Collection' : '▶ Start Collection'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="continuous-content">
                {/* Left Panel - Controls & Status */}
                <div className="left-panel">
                    {/* Collection Status */}
                    <div className="status-section">
                        <h2>System Status</h2>
                        {renderCollectionStatus()}
                        {renderCurrentIntention()}
                    </div>

                    {/* Quick Intention Controls */}
                    <div className="controls-section">
                        <h2>Intention Controls</h2>
                        <QuickIntentionButton
                            currentPeriod={status?.currentIntentionPeriod || null}
                            onStartPeriod={handleStartIntention}
                            onEndPeriod={handleEndIntention}
                        />
                    </div>

                    {/* Advanced Intention Controls */}
                    <div className="advanced-controls-section">
                        <IntentionPeriodControls
                            currentPeriod={status?.currentIntentionPeriod || null}
                            onStartPeriod={handleStartIntention}
                            onEndPeriod={handleEndIntention}
                            onUpdateNotes={handleUpdateNotes}
                        />
                    </div>

                    {/* System Health */}
                    <div className="health-section">
                        <h2>System Health</h2>
                        {status?.systemHealth && (
                            <HealthDashboard health={status.systemHealth} />
                        )}
                    </div>
                </div>

                {/* Right Panel - Timeline & Analysis */}
                <div className="right-panel">
                    {/* Monitor Dashboard */}
                    <div className="monitor-section">
                        {status && (
                            <MonitorDashboard
                                isCollecting={isCollecting}
                                currentRate={status.currentRate}
                                todayCount={status.todayStats?.trialsCollected || 0}
                                currentDeviation={0} // TODO: Calculate current deviation
                                systemHealth={status.systemHealth}
                                significantEvents={significantEvents}
                            />
                        )}
                    </div>

                    {/* Timeline Toggle */}
                    <div className="timeline-controls">
                        <button
                            onClick={() => setShowTimeline(!showTimeline)}
                            className="timeline-toggle"
                        >
                            {showTimeline ? '📈 Hide Timeline' : '📊 Show Timeline'}
                        </button>
                    </div>

                    {/* Timeline Visualization */}
                    {showTimeline && (
                        <div className="timeline-section">
                            <ContinuousTimeline
                                timeRange={selectedTimeRange}
                                data={timelineData}
                                intentionPeriods={status?.currentIntentionPeriod ? [status.currentIntentionPeriod] : []}
                                significantEvents={significantEvents}
                                onTimeRangeChange={handleTimeRangeChange}
                                onPeriodSelect={(period) => {
                                    console.log('Selected period:', period);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Styles */}
            <style>{`
                .continuous-view {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
                }

                .continuous-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 30px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }

                .header-left h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 300;
                }

                .header-subtitle {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    margin-top: 4px;
                }

                .collection-toggle {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .collection-toggle.start {
                    background: #4CAF50;
                    color: white;
                }

                .collection-toggle.stop {
                    background: #f44336;
                    color: white;
                }

                .collection-toggle:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                .continuous-content {
                    display: flex;
                    height: calc(100vh - 120px);
                    padding: 20px;
                    gap: 20px;
                }

                .left-panel {
                    width: 350px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .right-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .status-section,
                .controls-section,
                .advanced-controls-section,
                .health-section,
                .monitor-section,
                .timeline-section {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .status-section h2,
                .controls-section h2,
                .advanced-controls-section h2,
                .health-section h2 {
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                }

                .collection-status {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .status-indicator {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .status-indicator.pulse {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                }

                .status-dot {
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                }

                .status-text {
                    flex: 1;
                }

                .status-label {
                    display: block;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .status-details {
                    display: block;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .intention-status {
                    padding: 15px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-left: 4px solid transparent;
                }

                .intention-status.neutral {
                    border-left-color: #9E9E9E;
                }

                .intention-status.active {
                    border-left-color: #2196F3;
                }

                .intention-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 6px;
                }

                .intention-duration,
                .intention-description {
                    display: block;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 4px;
                }

                .intention-notes {
                    display: block;
                    font-size: 12px;
                    font-style: italic;
                    color: rgba(255, 255, 255, 0.6);
                    margin-top: 8px;
                }

                .timeline-controls {
                    display: flex;
                    justify-content: center;
                    padding: 10px 0;
                }

                .timeline-toggle {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .timeline-toggle:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .timeline-section {
                    flex: 1;
                    min-height: 400px;
                }

                .loading-container,
                .error-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                    padding: 40px;
                    color: white;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .loading-text {
                    font-size: 18px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .error-container {
                    color: #ffcdd2;
                }

                .error-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }

                .error-text h2 {
                    margin: 0 0 15px 0;
                    font-size: 24px;
                    font-weight: 500;
                }

                .error-text p {
                    margin: 0 0 25px 0;
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.7);
                    max-width: 500px;
                }

                .error-text button {
                    padding: 12px 24px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .error-text button:hover {
                    background: #d32f2f;
                    transform: translateY(-2px);
                }

                /* Responsive design */
                @media (max-width: 1200px) {
                    .continuous-content {
                        flex-direction: column;
                    }

                    .left-panel {
                        width: 100%;
                        flex-direction: row;
                        overflow-x: auto;
                        gap: 15px;
                    }

                    .left-panel > div {
                        min-width: 300px;
                        flex-shrink: 0;
                    }
                }

                @media (max-width: 768px) {
                    .continuous-header {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .left-panel {
                        flex-direction: column;
                    }

                    .left-panel > div {
                        min-width: auto;
                    }
                }
            `}</style>
        </div>
    );
};

/**
 * Format duration in milliseconds to human readable string
 */
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

export default ContinuousView;