import React, { useState } from 'react';
import { IntentionPeriod } from '../../../shared/types';

interface QuickIntentionButtonProps {
    currentPeriod: IntentionPeriod | null;
    onStartPeriod: (intention: 'high' | 'low', notes?: string) => void;
    onEndPeriod: () => void;
}

/**
 * Quick intention button component
 *
 * Features:
 * - Large, easily accessible buttons
 * - "Start High Intention" / "Start Low Intention"
 * - Confirmation dialogs for accidental clicks
 * - Current period status display
 */
export const QuickIntentionButton: React.FC<QuickIntentionButtonProps> = ({
    currentPeriod,
    onStartPeriod,
    onEndPeriod
}) => {
    const [showConfirmation, setShowConfirmation] = useState<{
        type: 'start' | 'end';
        intention?: 'high' | 'low';
    } | null>(null);

    /**
     * Handle button click with confirmation
     */
    const handleButtonClick = (intention?: 'high' | 'low') => {
        if (currentPeriod) {
            // Show end confirmation
            setShowConfirmation({ type: 'end' });
        } else if (intention) {
            // Show start confirmation
            setShowConfirmation({ type: 'start', intention });
        }
    };

    /**
     * Confirm action
     */
    const handleConfirm = () => {
        if (!showConfirmation) return;

        if (showConfirmation.type === 'end') {
            onEndPeriod();
        } else if (showConfirmation.type === 'start' && showConfirmation.intention) {
            onStartPeriod(showConfirmation.intention);
        }

        setShowConfirmation(null);
    };

    /**
     * Cancel action
     */
    const handleCancel = () => {
        setShowConfirmation(null);
    };

    /**
     * Render confirmation dialog
     */
    const renderConfirmationDialog = () => {
        if (!showConfirmation) return null;

        const isEnd = showConfirmation.type === 'end';
        const intention = showConfirmation.intention;

        return (
            <div className="confirmation-overlay">
                <div className="confirmation-dialog">
                    <div className="confirmation-header">
                        <h3>
                            {isEnd ? 'End Intention Period?' : `Start ${intention} Intention?`}
                        </h3>
                    </div>
                    <div className="confirmation-content">
                        {isEnd ? (
                            <p>
                                This will end your current {currentPeriod?.intention} intention period
                                and return to baseline mode.
                            </p>
                        ) : (
                            <p>
                                This will start a new {intention} intention period.
                                The RNG data will be marked with this intention until you stop it.
                            </p>
                        )}
                    </div>
                    <div className="confirmation-actions">
                        <button
                            onClick={handleCancel}
                            className="btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`btn-confirm ${isEnd ? 'end' : intention}`}
                        >
                            {isEnd ? 'End Period' : `Start ${intention} Intention`}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Get button color based on intention
     */
    const getIntentionColor = (intention: 'high' | 'low'): string => {
        return intention === 'high' ? '#2196F3' : '#FF9800';
    };

    /**
     * Render current period status
     */
    const renderCurrentStatus = () => {
        if (!currentPeriod) {
            return (
                <div className="current-status baseline">
                    <div className="status-indicator neutral"></div>
                    <span>Baseline Mode</span>
                </div>
            );
        }

        const duration = Date.now() - currentPeriod.startTime.getTime();
        const durationText = formatDuration(duration);
        const intentionColor = getIntentionColor(currentPeriod.intention);

        return (
            <div className="current-status active">
                <div
                    className="status-indicator"
                    style={{ backgroundColor: intentionColor }}
                ></div>
                <div className="status-details">
                    <span className="status-text">
                        {currentPeriod.intention === 'high' ? 'High' : 'Low'} Intention Active
                    </span>
                    <span className="status-duration">{durationText}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="quick-intention-button">
            {/* Current Status */}
            {renderCurrentStatus()}

            {/* Action Buttons */}
            <div className="button-section">
                {currentPeriod ? (
                    // Show end button when period is active
                    <button
                        onClick={() => handleButtonClick()}
                        className="intention-button end-button"
                    >
                        ⏹ End Intention Period
                    </button>
                ) : (
                    // Show start buttons when no period is active
                    <div className="start-buttons">
                        <button
                            onClick={() => handleButtonClick('high')}
                            className="intention-button high-button"
                        >
                            ▲ Start High Intention
                        </button>
                        <button
                            onClick={() => handleButtonClick('low')}
                            className="intention-button low-button"
                        >
                            ▼ Start Low Intention
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            {renderConfirmationDialog()}

            {/* Styles */}
            <style jsx>{`
                .quick-intention-button {
                    color: white;
                }

                .current-status {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .status-indicator.neutral {
                    background: #9E9E9E;
                }

                .status-details {
                    flex: 1;
                }

                .status-text {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .status-duration {
                    display: block;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .button-section {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .start-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .intention-button {
                    padding: 16px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .high-button {
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                    color: white;
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
                }

                .high-button:hover {
                    background: linear-gradient(135deg, #1976D2, #1565C0);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
                }

                .low-button {
                    background: linear-gradient(135deg, #FF9800, #F57C00);
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
                }

                .low-button:hover {
                    background: linear-gradient(135deg, #F57C00, #EF6C00);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
                }

                .end-button {
                    background: linear-gradient(135deg, #f44336, #D32F2F);
                    color: white;
                    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
                }

                .end-button:hover {
                    background: linear-gradient(135deg, #D32F2F, #C62828);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(244, 67, 54, 0.4);
                }

                .intention-button:active {
                    transform: translateY(0);
                }

                /* Confirmation Dialog */
                .confirmation-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                .confirmation-dialog {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    padding: 24px;
                    max-width: 400px;
                    width: 90%;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                }

                .confirmation-header h3 {
                    margin: 0 0 16px 0;
                    font-size: 20px;
                    font-weight: 600;
                    text-align: center;
                }

                .confirmation-content p {
                    margin: 0 0 24px 0;
                    font-size: 14px;
                    line-height: 1.5;
                    color: rgba(255, 255, 255, 0.9);
                    text-align: center;
                }

                .confirmation-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }

                .btn-cancel,
                .btn-confirm {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 100px;
                }

                .btn-cancel {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }

                .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .btn-confirm {
                    color: white;
                }

                .btn-confirm.high {
                    background: #2196F3;
                }

                .btn-confirm.low {
                    background: #FF9800;
                }

                .btn-confirm.end {
                    background: #f44336;
                }

                .btn-confirm:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                /* Responsive design */
                @media (max-width: 480px) {
                    .start-buttons {
                        gap: 8px;
                    }

                    .intention-button {
                        padding: 14px 20px;
                        font-size: 14px;
                        min-height: 50px;
                    }

                    .confirmation-dialog {
                        padding: 20px;
                    }

                    .confirmation-actions {
                        flex-direction: column;
                    }

                    .btn-cancel,
                    .btn-confirm {
                        width: 100%;
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

export default QuickIntentionButton;