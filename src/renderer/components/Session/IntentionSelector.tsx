import React from 'react';
import { IntentionType } from '../../../shared/types';

interface IntentionSelectorProps {
    selectedIntention: IntentionType;
    onIntentionChange: (intention: IntentionType) => void;
    disabled?: boolean;
}

/**
 * Intention selector component with clear descriptions
 * Follows PEAR laboratory methodology for intention-based experiments
 */
export const IntentionSelector: React.FC<IntentionSelectorProps> = ({
    selectedIntention,
    onIntentionChange,
    disabled = false
}) => {
    const intentions = [
        {
            value: 'high' as IntentionType,
            label: 'High Intention',
            description: 'Focus on increasing the trial values above the expected mean (100)',
            color: '#4CAF50',
            icon: '⬆️',
            guidance: 'Visualize or intend for higher numbers. Focus on "more" or "up".'
        },
        {
            value: 'low' as IntentionType,
            label: 'Low Intention',
            description: 'Focus on decreasing the trial values below the expected mean (100)',
            color: '#2196F3',
            icon: '⬇️',
            guidance: 'Visualize or intend for lower numbers. Focus on "less" or "down".'
        },
        {
            value: 'baseline' as IntentionType,
            label: 'Baseline/Control',
            description: 'No specific intention. Maintain neutral, relaxed awareness',
            color: '#9E9E9E',
            icon: '⚪',
            guidance: 'Remain neutral and relaxed. Observe without trying to influence.'
        }
    ];

    return (
        <div className="intention-selector">
            <div className="intention-grid">
                {intentions.map((intention) => (
                    <div
                        key={intention.value}
                        className={`intention-card ${selectedIntention === intention.value ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && onIntentionChange(intention.value)}
                    >
                        <div className="intention-header">
                            <div className="intention-icon" style={{ backgroundColor: intention.color }}>
                                {intention.icon}
                            </div>
                            <h4 className="intention-label">{intention.label}</h4>
                        </div>

                        <p className="intention-description">
                            {intention.description}
                        </p>

                        <div className="intention-guidance">
                            <strong>Guidance:</strong> {intention.guidance}
                        </div>

                        {selectedIntention === intention.value && (
                            <div className="selection-indicator">
                                <div className="check-mark">✓</div>
                                <span>Selected</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Methodological Notes */}
            <div className="methodology-note">
                <h5>Scientific Methodology</h5>
                <p>
                    This follows the PEAR (Princeton Engineering Anomalies Research) laboratory protocol for
                    consciousness-based experiments. Each intention represents a different experimental condition
                    for testing potential mind-matter interaction effects.
                </p>
            </div>

            <style>{`
                .intention-selector {
                    width: 100%;
                }

                .intention-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .intention-card {
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .intention-card:hover:not(.disabled) {
                    border-color: #4CAF50;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                }

                .intention-card.selected {
                    border-color: #4CAF50;
                    background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
                }

                .intention-card.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .intention-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .intention-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    color: white;
                    font-weight: bold;
                }

                .intention-label {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 0;
                }

                .intention-description {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                    margin-bottom: 15px;
                }

                .intention-guidance {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 13px;
                    color: #555;
                    border-left: 3px solid #4CAF50;
                }

                .intention-guidance strong {
                    color: #2c3e50;
                }

                .selection-indicator {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    background: #4CAF50;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .check-mark {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: white;
                    color: #4CAF50;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                }

                .methodology-note {
                    background: #f0f8ff;
                    border: 1px solid #e1f5fe;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }

                .methodology-note h5 {
                    color: #1565c0;
                    margin: 0 0 10px 0;
                    font-size: 16px;
                    font-weight: 600;
                }

                .methodology-note p {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .intention-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .intention-card {
                        padding: 15px;
                    }

                    .intention-header {
                        gap: 10px;
                    }

                    .intention-icon {
                        width: 35px;
                        height: 35px;
                        font-size: 18px;
                    }

                    .intention-label {
                        font-size: 16px;
                    }

                    .methodology-note {
                        padding: 15px;
                    }
                }

                /* Accessibility */
                .intention-card:focus {
                    outline: 2px solid #4CAF50;
                    outline-offset: 2px;
                }

                @media (prefers-reduced-motion: reduce) {
                    .intention-card {
                        transition: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default IntentionSelector;