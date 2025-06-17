import React, { useState } from 'react';

interface SessionControlsProps {
    sessionStatus: string;
    onPause: () => Promise<void>;
    onResume: () => Promise<void>;
    onStop: () => Promise<void>;
    onEmergencyStop: () => Promise<void>;
    canPause: boolean;
    canResume: boolean;
    canStop: boolean;
}

/**
 * Session control buttons for managing active sessions
 * Provides pause, resume, stop, and emergency stop functionality
 */
export const SessionControls: React.FC<SessionControlsProps> = ({
    sessionStatus,
    onPause,
    onResume,
    onStop,
    onEmergencyStop,
    canPause,
    canResume,
    canStop
}) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [showConfirmStop, setShowConfirmStop] = useState(false);
    const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

    /**
     * Handle pause action
     */
    const handlePause = async () => {
        if (!canPause) return;

        setIsLoading('pause');
        try {
            await onPause();
        } catch (error) {
            console.error('Failed to pause session:', error);
        } finally {
            setIsLoading(null);
        }
    };

    /**
     * Handle resume action
     */
    const handleResume = async () => {
        if (!canResume) return;

        setIsLoading('resume');
        try {
            await onResume();
        } catch (error) {
            console.error('Failed to resume session:', error);
        } finally {
            setIsLoading(null);
        }
    };

    /**
     * Handle stop action with confirmation
     */
    const handleStop = async () => {
        if (!canStop) return;

        if (!showConfirmStop) {
            setShowConfirmStop(true);
            return;
        }

        setIsLoading('stop');
        try {
            await onStop();
        } catch (error) {
            console.error('Failed to stop session:', error);
        } finally {
            setIsLoading(null);
            setShowConfirmStop(false);
        }
    };

    /**
     * Handle emergency stop with confirmation
     */
    const handleEmergencyStop = async () => {
        if (!showEmergencyConfirm) {
            setShowEmergencyConfirm(true);
            return;
        }

        setIsLoading('emergency');
        try {
            await onEmergencyStop();
        } catch (error) {
            console.error('Failed to emergency stop session:', error);
        } finally {
            setIsLoading(null);
            setShowEmergencyConfirm(false);
        }
    };

    /**
     * Cancel confirmation dialogs
     */
    const cancelConfirmations = () => {
        setShowConfirmStop(false);
        setShowEmergencyConfirm(false);
    };

    return (
        <div className="session-controls">
            {/* Main Control Buttons */}
            {!showConfirmStop && !showEmergencyConfirm && (
                <div className="control-buttons">
                    {/* Pause/Resume Button */}
                    {sessionStatus === 'running' && canPause && (
                        <button
                            className="control-btn pause-btn"
                            onClick={handlePause}
                            disabled={isLoading === 'pause'}
                            title="Pause session"
                        >
                            {isLoading === 'pause' ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <span className="btn-icon">⏸️</span>
                                    <span className="btn-text">Pause</span>
                                </>
                            )}
                        </button>
                    )}

                    {sessionStatus === 'paused' && canResume && (
                        <button
                            className="control-btn resume-btn"
                            onClick={handleResume}
                            disabled={isLoading === 'resume'}
                            title="Resume session"
                        >
                            {isLoading === 'resume' ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <span className="btn-icon">▶️</span>
                                    <span className="btn-text">Resume</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Stop Button */}
                    {canStop && (
                        <button
                            className="control-btn stop-btn"
                            onClick={handleStop}
                            disabled={isLoading === 'stop'}
                            title="Stop session normally"
                        >
                            {isLoading === 'stop' ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <span className="btn-icon">⏹️</span>
                                    <span className="btn-text">Stop</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Emergency Stop Button */}
                    <button
                        className="control-btn emergency-btn"
                        onClick={handleEmergencyStop}
                        disabled={isLoading === 'emergency'}
                        title="Emergency stop - immediate termination"
                    >
                        {isLoading === 'emergency' ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            <>
                                <span className="btn-icon">🛑</span>
                                <span className="btn-text">Emergency</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Stop Confirmation */}
            {showConfirmStop && (
                <div className="confirmation-dialog">
                    <div className="confirmation-content">
                        <div className="confirmation-title">Stop Session?</div>
                        <div className="confirmation-message">
                            This will end the current session and save all collected data.
                        </div>
                        <div className="confirmation-buttons">
                            <button
                                className="confirm-btn stop-confirm"
                                onClick={handleStop}
                                disabled={isLoading === 'stop'}
                            >
                                {isLoading === 'stop' ? 'Stopping...' : 'Yes, Stop'}
                            </button>
                            <button
                                className="confirm-btn cancel-btn"
                                onClick={cancelConfirmations}
                                disabled={isLoading === 'stop'}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Emergency Stop Confirmation */}
            {showEmergencyConfirm && (
                <div className="confirmation-dialog emergency-dialog">
                    <div className="confirmation-content">
                        <div className="confirmation-title">Emergency Stop?</div>
                        <div className="confirmation-message">
                            ⚠️ This will immediately terminate the session.
                            <br />Use only if the session is unresponsive.
                        </div>
                        <div className="confirmation-buttons">
                            <button
                                className="confirm-btn emergency-confirm"
                                onClick={handleEmergencyStop}
                                disabled={isLoading === 'emergency'}
                            >
                                {isLoading === 'emergency' ? 'Stopping...' : 'Emergency Stop'}
                            </button>
                            <button
                                className="confirm-btn cancel-btn"
                                onClick={cancelConfirmations}
                                disabled={isLoading === 'emergency'}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .session-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .control-buttons {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .control-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    min-width: 80px;
                    justify-content: center;
                }

                .control-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .pause-btn {
                    background: rgba(255, 152, 0, 0.2);
                    color: #FF9800;
                }

                .pause-btn:hover:not(:disabled) {
                    background: rgba(255, 152, 0, 0.3);
                    transform: translateY(-1px);
                }

                .resume-btn {
                    background: rgba(76, 175, 80, 0.2);
                    color: #4CAF50;
                }

                .resume-btn:hover:not(:disabled) {
                    background: rgba(76, 175, 80, 0.3);
                    transform: translateY(-1px);
                }

                .stop-btn {
                    background: rgba(244, 67, 54, 0.2);
                    color: #F44336;
                }

                .stop-btn:hover:not(:disabled) {
                    background: rgba(244, 67, 54, 0.3);
                    transform: translateY(-1px);
                }

                .emergency-btn {
                    background: rgba(136, 14, 79, 0.2);
                    color: #880E4F;
                }

                .emergency-btn:hover:not(:disabled) {
                    background: rgba(136, 14, 79, 0.3);
                    transform: translateY(-1px);
                }

                .btn-icon {
                    font-size: 16px;
                }

                .btn-text {
                    font-size: 12px;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .confirmation-dialog {
                    background: rgba(0, 0, 0, 0.9);
                    border-radius: 12px;
                    padding: 20px;
                    max-width: 300px;
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .emergency-dialog {
                    border-color: rgba(136, 14, 79, 0.5);
                    background: rgba(136, 14, 79, 0.1);
                }

                .confirmation-content {
                    text-align: center;
                }

                .confirmation-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: rgba(255, 255, 255, 0.9);
                }

                .confirmation-message {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 16px;
                    line-height: 1.4;
                }

                .confirmation-buttons {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }

                .confirm-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 70px;
                }

                .stop-confirm {
                    background: #F44336;
                    color: white;
                }

                .stop-confirm:hover:not(:disabled) {
                    background: #d32f2f;
                }

                .emergency-confirm {
                    background: #880E4F;
                    color: white;
                }

                .emergency-confirm:hover:not(:disabled) {
                    background: #6a0b37;
                }

                .cancel-btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .cancel-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.2);
                }

                .confirm-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .control-buttons {
                        gap: 8px;
                    }

                    .control-btn {
                        padding: 8px 12px;
                        min-width: 60px;
                    }

                    .btn-text {
                        display: none;
                    }

                    .btn-icon {
                        font-size: 18px;
                    }

                    .confirmation-dialog {
                        max-width: 250px;
                        padding: 15px;
                    }
                }

                /* Accessibility */
                .control-btn:focus {
                    outline: 2px solid rgba(255, 255, 255, 0.5);
                    outline-offset: 2px;
                }

                .confirm-btn:focus {
                    outline: 2px solid rgba(255, 255, 255, 0.5);
                    outline-offset: 2px;
                }

                /* Reduce motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .control-btn {
                        transition: none;
                    }

                    .loading-spinner {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default SessionControls;