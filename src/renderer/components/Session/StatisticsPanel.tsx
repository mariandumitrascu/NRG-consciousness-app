import React from 'react';
import { NetworkVarianceResult } from '../../../shared/analysis-types';
import { IntentionType } from '../../../shared/types';

interface StatisticsPanelProps {
    statistics: NetworkVarianceResult | null;
    trialCount: number;
    intention: IntentionType;
}

/**
 * Real-time statistics panel with live statistical indicators
 * Displays current session statistics with scientific rigor
 */
export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
    statistics,
    trialCount,
    intention
}) => {
    /**
     * Get significance color based on p-value
     */
    const getSignificanceColor = (significance: string) => {
        switch (significance) {
            case 'highly_significant':
                return '#4CAF50';
            case 'significant':
                return '#8BC34A';
            case 'marginal':
                return '#FF9800';
            case 'none':
            default:
                return 'rgba(255, 255, 255, 0.7)';
        }
    };

    /**
     * Format p-value for display
     */
    const formatPValue = (pValue: number) => {
        if (pValue < 0.001) return '< 0.001';
        if (pValue < 0.01) return pValue.toFixed(4);
        return pValue.toFixed(3);
    };

    /**
     * Format Z-score for display
     */
    const formatZScore = (zScore: number) => {
        return Math.abs(zScore).toFixed(3);
    };

    /**
     * Get effect size interpretation
     */
    const getEffectSizeInterpretation = (netvar: number, trialCount: number) => {
        if (trialCount < 100) return 'Insufficient data';

        const effectSize = Math.sqrt(netvar) / Math.sqrt(trialCount);

        if (effectSize < 0.1) return 'Negligible';
        if (effectSize < 0.3) return 'Small';
        if (effectSize < 0.5) return 'Medium';
        return 'Large';
    };

    /**
     * Calculate current mean from network variance
     */
    const getCurrentMean = () => {
        if (!statistics || trialCount === 0) return 100;

        // Estimate mean from network variance (approximation)
        const deviation = Math.sqrt(statistics.netvar) * (statistics.standardError || 1);
        return 100 + deviation;
    };

    const currentMean = getCurrentMean();
    const significanceColor = statistics ? getSignificanceColor(statistics.significance) : 'rgba(255, 255, 255, 0.7)';

    return (
        <div className="statistics-panel">
            <h3 className="panel-title">Live Statistics</h3>

            <div className="stats-grid">
                {/* Trial Count */}
                <div className="stat-item">
                    <div className="stat-label">Trials</div>
                    <div className="stat-value large">{trialCount}</div>
                    <div className="stat-sublabel">
                        {trialCount > 0 ? `${(trialCount / 100 * 100).toFixed(0)}% complete` : 'Starting...'}
                    </div>
                </div>

                {/* Current Mean */}
                <div className="stat-item">
                    <div className="stat-label">Current Mean</div>
                    <div className="stat-value">
                        {currentMean.toFixed(2)}
                    </div>
                    <div className="stat-sublabel">
                        Expected: 100.0
                    </div>
                </div>

                {/* Z-Score */}
                <div className="stat-item">
                    <div className="stat-label">Z-Score</div>
                    <div className="stat-value" style={{ color: significanceColor }}>
                        {statistics ? `±${formatZScore(Math.sqrt(statistics.netvar))}` : '0.000'}
                    </div>
                    <div className="stat-sublabel">
                        {statistics?.netvar ? (Math.sqrt(statistics.netvar) > 0 ? 'Deviation' : 'Baseline') : 'No data'}
                    </div>
                </div>

                {/* P-Value */}
                <div className="stat-item">
                    <div className="stat-label">P-Value</div>
                    <div className="stat-value" style={{ color: significanceColor }}>
                        {statistics ? formatPValue(statistics.probability) : '1.000'}
                    </div>
                    <div className="stat-sublabel">
                        {statistics?.significance ? statistics.significance.replace('_', ' ') : 'none'}
                    </div>
                </div>

                {/* Network Variance */}
                <div className="stat-item">
                    <div className="stat-label">Network Variance</div>
                    <div className="stat-value">
                        {statistics ? statistics.netvar.toFixed(3) : '0.000'}
                    </div>
                    <div className="stat-sublabel">
                        Expected: 1.0
                    </div>
                </div>

                {/* Effect Size */}
                <div className="stat-item">
                    <div className="stat-label">Effect Size</div>
                    <div className="stat-value">
                        {statistics ? getEffectSizeInterpretation(statistics.netvar, trialCount) : 'N/A'}
                    </div>
                    <div className="stat-sublabel">
                        Cohen's interpretation
                    </div>
                </div>
            </div>

            {/* Significance Indicator */}
            {statistics && (
                <div className="significance-indicator">
                    <div
                        className="significance-bar"
                        style={{
                            backgroundColor: significanceColor,
                            width: `${Math.min(100, (1 - statistics.probability) * 100)}%`
                        }}
                    />
                    <div className="significance-label">
                        Statistical Significance: <strong>{statistics.significance.replace('_', ' ')}</strong>
                    </div>
                </div>
            )}

            {/* Intention Alignment */}
            <div className="intention-feedback">
                <div className="feedback-label">Intention Alignment</div>
                <div className="feedback-content">
                    {statistics && trialCount > 10 ? (
                        <div className="alignment-indicator">
                            {intention === 'high' && currentMean > 100 && (
                                <span className="positive-feedback">✓ Moving in intended direction (HIGH)</span>
                            )}
                            {intention === 'low' && currentMean < 100 && (
                                <span className="positive-feedback">✓ Moving in intended direction (LOW)</span>
                            )}
                            {intention === 'baseline' && (
                                <span className="neutral-feedback">○ Baseline monitoring</span>
                            )}
                            {((intention === 'high' && currentMean <= 100) ||
                              (intention === 'low' && currentMean >= 100)) && (
                                <span className="negative-feedback">→ Not yet aligned with intention</span>
                            )}
                        </div>
                    ) : (
                        <span className="insufficient-data">Collecting initial data...</span>
                    )}
                </div>
            </div>

            <style>{`
                .statistics-panel {
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

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .stat-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .stat-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 4px;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 2px;
                }

                .stat-value.large {
                    font-size: 24px;
                    color: #4CAF50;
                }

                .stat-sublabel {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.5);
                    font-weight: 400;
                }

                .significance-indicator {
                    margin-bottom: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    padding: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .significance-bar {
                    height: 4px;
                    border-radius: 2px;
                    margin-bottom: 8px;
                    transition: width 0.3s ease;
                }

                .significance-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    text-align: center;
                }

                .intention-feedback {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    padding: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .feedback-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 8px;
                    font-weight: 500;
                }

                .feedback-content {
                    text-align: center;
                }

                .alignment-indicator {
                    font-size: 14px;
                    font-weight: 500;
                }

                .positive-feedback {
                    color: #4CAF50;
                }

                .negative-feedback {
                    color: #FF9800;
                }

                .neutral-feedback {
                    color: #9E9E9E;
                }

                .insufficient-data {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 12px;
                    font-style: italic;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .stat-value {
                        font-size: 16px;
                    }

                    .stat-value.large {
                        font-size: 20px;
                    }
                }

                /* Animation for updating values */
                .stat-value {
                    transition: color 0.3s ease;
                }

                .significance-bar {
                    transition: all 0.5s ease;
                }
            `}</style>
        </div>
    );
};

export default StatisticsPanel;