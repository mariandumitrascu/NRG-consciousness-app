import React, { useState, useEffect } from 'react';
import { SessionModeState } from '../../../shared/types';
import { CumulativeChart } from '../../components/Session/CumulativeChart';
import { StatisticsPanel } from '../../components/Session/StatisticsPanel';
import { ProgressIndicator } from '../../components/Session/ProgressIndicator';
import { SessionControls } from '../../components/Session/SessionControls';

interface RunningSessionProps {
    sessionState: SessionModeState;
    onPause: () => Promise<void>;
    onResume: () => Promise<void>;
    onStop: () => Promise<void>;
    onEmergencyStop: () => Promise<void>;
    canPause: boolean;
    canResume: boolean;
    canStop: boolean;
}

/**
 * Active session interface with real-time data display
 * Minimal, distraction-free layout optimized for concentration
 */
export const RunningSession: React.FC<RunningSessionProps> = ({
    sessionState,
    onPause,
    onResume,
    onStop,
    onEmergencyStop,
    canPause,
    canResume,
    canStop
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Auto-hide controls after 10 seconds of inactivity
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowControls(false);
        }, 10000);

        return () => clearTimeout(timer);
    }, [showControls]);

    /**
     * Handle mouse movement to show controls
     */
    const handleMouseMove = () => {
        setShowControls(true);
    };

    /**
     * Toggle fullscreen mode
     */
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    /**
     * Get intention color for visual feedback
     */
    const getIntentionColor = () => {
        switch (sessionState.currentSession?.intention) {
            case 'high':
                return '#4CAF50';
            case 'low':
                return '#2196F3';
            case 'baseline':
                return '#9E9E9E';
            default:
                return '#9E9E9E';
        }
    };

    /**
     * Get intention direction indicator
     */
    const getIntentionIndicator = () => {
        switch (sessionState.currentSession?.intention) {
            case 'high':
                return { icon: '⬆️', label: 'Focusing High', color: '#4CAF50' };
            case 'low':
                return { icon: '⬇️', label: 'Focusing Low', color: '#2196F3' };
            case 'baseline':
                return { icon: '⚪', label: 'Baseline', color: '#9E9E9E' };
            default:
                return { icon: '⚪', label: 'Unknown', color: '#9E9E9E' };
        }
    };

    const intentionIndicator = getIntentionIndicator();

    return (
        <div
            className={`running-session ${isFullscreen ? 'fullscreen' : ''}`}
            onMouseMove={handleMouseMove}
        >
            {/* Intention Indicator */}
            <div className="intention-indicator">
                <div className="intention-icon" style={{ color: intentionIndicator.color }}>
                    {intentionIndicator.icon}
                </div>
                <span className="intention-label">{intentionIndicator.label}</span>
            </div>

            {/* Main Content Area */}
            <div className="session-content">
                {/* Primary Chart */}
                <div className="chart-container">
                    <CumulativeChart
                        trials={sessionState.realTimeData}
                        intention={sessionState.currentSession?.intention || 'baseline'}
                        height={400}
                        showGrid={true}
                        highlightSignificance={true}
                    />
                </div>

                {/* Statistics and Progress */}
                <div className="stats-grid">
                    <div className="stats-panel">
                        <StatisticsPanel
                            statistics={sessionState.statisticalResults}
                            trialCount={sessionState.realTimeData.length}
                            intention={sessionState.currentSession?.intention || 'baseline'}
                        />
                    </div>

                    <div className="progress-panel">
                        <ProgressIndicator
                            progress={sessionState.progress}
                            sessionStatus={sessionState.sessionStatus}
                        />
                    </div>
                </div>
            </div>

            {/* Session Controls */}
            <div className={`controls-overlay ${showControls ? 'visible' : 'hidden'}`}>
                <SessionControls
                    sessionStatus={sessionState.sessionStatus}
                    onPause={onPause}
                    onResume={onResume}
                    onStop={onStop}
                    onEmergencyStop={onEmergencyStop}
                    canPause={canPause}
                    canResume={canResume}
                    canStop={canStop}
                />

                <button
                    className="fullscreen-btn"
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? '⊞' : '⊡'}
                </button>
            </div>

            {/* Session Status Indicator */}
            <div className="status-indicator">
                <div className={`status-dot ${sessionState.sessionStatus}`}></div>
                <span className="status-text">
                    {sessionState.sessionStatus === 'running' ? 'Active' :
                     sessionState.sessionStatus === 'paused' ? 'Paused' :
                     sessionState.sessionStatus}
                </span>
            </div>

            <style jsx>{`
                .running-session {
                    width: 100%;
                    height: 100vh;
                    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                }

                .running-session.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                }

                .intention-indicator {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px 20px;
                    border-radius: 25px;
                    backdrop-filter: blur(10px);
                    z-index: 10;
                }

                .intention-icon {
                    font-size: 24px;
                }

                .intention-label {
                    font-size: 16px;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                }

                .session-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 60px 20px 20px;
                    gap: 30px;
                }

                .chart-container {
                    width: 100%;
                    max-width: 1200px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    width: 100%;
                    max-width: 1200px;
                }

                .stats-panel,
                .progress-panel {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .controls-overlay {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 15px 25px;
                    border-radius: 50px;
                    backdrop-filter: blur(15px);
                    transition: opacity 0.3s ease;
                    z-index: 10;
                }

                .controls-overlay.visible {
                    opacity: 1;
                }

                .controls-overlay.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                .fullscreen-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }

                .fullscreen-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }

                .status-indicator {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 8px 16px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    z-index: 10;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                .status-dot.running {
                    background: #4CAF50;
                }

                .status-dot.paused {
                    background: #FF9800;
                    animation: none;
                }

                .status-text {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
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
                @media (max-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .session-content {
                        padding: 50px 15px 15px;
                        gap: 20px;
                    }

                    .chart-container {
                        padding: 15px;
                    }
                }

                @media (max-width: 768px) {
                    .intention-indicator,
                    .status-indicator {
                        position: relative;
                        top: auto;
                        left: auto;
                        right: auto;
                        margin: 10px;
                    }

                    .session-content {
                        padding: 20px 10px;
                    }

                    .controls-overlay {
                        position: fixed;
                        bottom: 10px;
                        left: 10px;
                        right: 10px;
                        transform: none;
                        justify-content: center;
                    }
                }

                /* Focus and accessibility */
                .running-session:focus-within .controls-overlay {
                    opacity: 1;
                }

                /* Reduce motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .status-dot {
                        animation: none;
                    }

                    .controls-overlay {
                        transition: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default RunningSession;