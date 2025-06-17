import React, { useState } from 'react';
import { SessionConfig, IntentionType } from '../../../shared/types';
import { IntentionSelector } from '../../components/Session/IntentionSelector';

interface SessionSetupProps {
    onStartSession: (config: SessionConfig) => Promise<void>;
    isLoading: boolean;
}

/**
 * Session setup and configuration component
 * Allows users to configure intention, trial count, and other session parameters
 */
export const SessionSetup: React.FC<SessionSetupProps> = ({ onStartSession, isLoading }) => {
    const [config, setConfig] = useState<SessionConfig>({
        intention: 'high',
        targetTrials: 300,
        notes: '',
        participantId: '',
        meditationDuration: 2,
        fullScreen: false,
        blockNotifications: true
    });

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    /**
     * Validate session configuration
     */
    const validateConfig = (config: SessionConfig): string[] => {
        const errors: string[] = [];

        if (config.targetTrials < 100) {
            errors.push('Target trials must be at least 100');
        }
        if (config.targetTrials > 3000) {
            errors.push('Target trials cannot exceed 3000');
        }
        if (config.meditationDuration < 0 || config.meditationDuration > 10) {
            errors.push('Meditation duration must be between 0-10 minutes');
        }

        return errors;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validateConfig(config);
        setValidationErrors(errors);

        if (errors.length > 0) {
            return;
        }

        try {
            await onStartSession(config);
        } catch (error) {
            setValidationErrors(['Failed to start session. Please try again.']);
        }
    };

    /**
     * Handle intention selection
     */
    const handleIntentionChange = (intention: IntentionType) => {
        setConfig(prev => ({ ...prev, intention }));
    };

    /**
     * Handle trial count change
     */
    const handleTrialCountChange = (value: number) => {
        setConfig(prev => ({ ...prev, targetTrials: value }));
    };

    return (
        <div className="session-setup">
            <div className="setup-container">
                <h1 className="setup-title">Intention-Based Session Setup</h1>
                <p className="setup-description">
                    Configure your consciousness experiment session. Set your intention and session parameters
                    for a controlled scientific exploration of mind-matter interaction.
                </p>

                <form onSubmit={handleSubmit} className="setup-form">
                    {/* Intention Selection */}
                    <div className="form-section">
                        <h3>Select Your Intention</h3>
                        <IntentionSelector
                            selectedIntention={config.intention}
                            onIntentionChange={handleIntentionChange}
                        />
                    </div>

                    {/* Trial Count */}
                    <div className="form-section">
                        <label className="form-label">
                            Target Trial Count
                            <span className="label-info">(Recommended: 300 for statistical power)</span>
                        </label>
                        <div className="trial-count-controls">
                            <input
                                type="range"
                                min="100"
                                max="3000"
                                step="50"
                                value={config.targetTrials}
                                onChange={(e) => handleTrialCountChange(parseInt(e.target.value))}
                                className="trial-slider"
                            />
                            <input
                                type="number"
                                min="100"
                                max="3000"
                                step="50"
                                value={config.targetTrials}
                                onChange={(e) => handleTrialCountChange(parseInt(e.target.value))}
                                className="trial-input"
                            />
                        </div>
                        <div className="trial-info">
                            <span>Estimated Duration: {Math.round(config.targetTrials / 60)} minutes</span>
                        </div>
                    </div>

                    {/* Pre-Session Meditation */}
                    <div className="form-section">
                        <label className="form-label">
                            Pre-Session Meditation (minutes)
                            <span className="label-info">(Optional preparation time)</span>
                        </label>
                        <div className="meditation-controls">
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={config.meditationDuration}
                                onChange={(e) => setConfig(prev => ({ ...prev, meditationDuration: parseInt(e.target.value) }))}
                                className="meditation-slider"
                            />
                            <span className="meditation-value">{config.meditationDuration} min</span>
                        </div>
                    </div>

                    {/* Session Notes */}
                    <div className="form-section">
                        <label className="form-label">
                            Session Notes (Optional)
                            <span className="label-info">Describe your state, environment, or expectations</span>
                        </label>
                        <textarea
                            value={config.notes}
                            onChange={(e) => setConfig(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Enter any relevant notes about this session..."
                            className="notes-textarea"
                            rows={3}
                        />
                    </div>

                    {/* Advanced Options */}
                    <div className="form-section">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="advanced-toggle"
                        >
                            {showAdvanced ? '▼' : '▶'} Advanced Options
                        </button>

                        {showAdvanced && (
                            <div className="advanced-options">
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={config.fullScreen}
                                            onChange={(e) => setConfig(prev => ({ ...prev, fullScreen: e.target.checked }))}
                                        />
                                        Full-screen mode during session
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={config.blockNotifications}
                                            onChange={(e) => setConfig(prev => ({ ...prev, blockNotifications: e.target.checked }))}
                                        />
                                        Block notifications during session
                                    </label>
                                </div>

                                <div className="participant-id">
                                    <label className="form-label">
                                        Participant ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={config.participantId}
                                        onChange={(e) => setConfig(prev => ({ ...prev, participantId: e.target.value }))}
                                        placeholder="Enter participant identifier..."
                                        className="participant-input"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="validation-errors">
                            {validationErrors.map((error, index) => (
                                <div key={index} className="error-message">
                                    ⚠️ {error}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Start Button */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="start-session-btn"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Starting Session...
                                </>
                            ) : (
                                'Start Intention Session'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .session-setup {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .setup-container {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 16px;
                    padding: 40px;
                    color: #333;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(10px);
                }

                .setup-title {
                    font-size: 28px;
                    font-weight: 600;
                    text-align: center;
                    margin-bottom: 10px;
                    color: #2c3e50;
                }

                .setup-description {
                    text-align: center;
                    color: #666;
                    margin-bottom: 40px;
                    line-height: 1.6;
                }

                .setup-form {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .form-section {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .form-section h3 {
                    font-size: 20px;
                    font-weight: 500;
                    color: #2c3e50;
                    margin: 0;
                }

                .form-label {
                    font-weight: 500;
                    color: #2c3e50;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .label-info {
                    font-size: 12px;
                    font-weight: 400;
                    color: #666;
                }

                .trial-count-controls {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }

                .trial-slider {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: #ddd;
                    outline: none;
                    -webkit-appearance: none;
                }

                .trial-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #4CAF50;
                    cursor: pointer;
                }

                .trial-input {
                    width: 80px;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    text-align: center;
                    font-size: 14px;
                }

                .trial-info {
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                }

                .meditation-controls {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .meditation-slider {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: #ddd;
                    outline: none;
                    -webkit-appearance: none;
                }

                .meditation-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #9c27b0;
                    cursor: pointer;
                }

                .meditation-value {
                    font-weight: 500;
                    color: #9c27b0;
                    min-width: 50px;
                }

                .notes-textarea {
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 14px;
                    resize: vertical;
                    min-height: 80px;
                }

                .advanced-toggle {
                    background: none;
                    border: none;
                    color: #4CAF50;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 0;
                }

                .advanced-options {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 10px;
                }

                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    cursor: pointer;
                }

                .participant-id {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .participant-input {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .validation-errors {
                    background: #ffe6e6;
                    border: 1px solid #ffcccc;
                    border-radius: 8px;
                    padding: 15px;
                }

                .error-message {
                    color: #d32f2f;
                    font-size: 14px;
                    margin-bottom: 5px;
                }

                .error-message:last-child {
                    margin-bottom: 0;
                }

                .form-actions {
                    text-align: center;
                    margin-top: 20px;
                }

                .start-session-btn {
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    border: none;
                    padding: 16px 40px;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    min-width: 200px;
                    margin: 0 auto;
                }

                .start-session-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
                }

                .start-session-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .loading-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid transparent;
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .setup-container {
                        padding: 20px;
                        margin: 10px;
                    }

                    .setup-title {
                        font-size: 24px;
                    }

                    .trial-count-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .trial-input {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default SessionSetup;