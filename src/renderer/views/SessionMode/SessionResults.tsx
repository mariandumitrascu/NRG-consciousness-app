import React, { useState, useMemo } from 'react';
import { ExperimentSession, RNGTrial } from '../../../shared/types';
import { NetworkVarianceResult } from '../../../shared/analysis-types';
import { CumulativeChart } from '../../components/Session/CumulativeChart';
import { StatisticsPanel } from '../../components/Session/StatisticsPanel';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';

interface SessionResultsProps {
    session: ExperimentSession;
    trials: RNGTrial[];
    statistics: NetworkVarianceResult;
    cumulativeData: Array<{ trial: number; cumulative: number }>;
    onNewSession: () => void;
    onViewHistory: () => void;
}

/**
 * Session Results Display Component
 * Shows comprehensive results after session completion
 */
export const SessionResults: React.FC<SessionResultsProps> = ({
    session,
    trials,
    statistics,
    cumulativeData,
    onNewSession,
    onViewHistory
}) => {
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx'>('json');

    // Calculate session summary metrics
    const sessionSummary = useMemo(() => {
        const duration = session.endTime
            ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
            : 0;

        const averageRate = trials.length / (duration / 60); // trials per hour

        // Effect size interpretation
        const effectSize = Math.abs(statistics.effectSize || 0);
        let effectInterpretation = 'No effect';
        if (effectSize >= 0.8) effectInterpretation = 'Large effect';
        else if (effectSize >= 0.5) effectInterpretation = 'Medium effect';
        else if (effectSize >= 0.2) effectInterpretation = 'Small effect';

        // Significance assessment
        const isSignificant = (statistics.pValue || 1) < 0.05;
        const isHighlySignificant = (statistics.pValue || 1) < 0.01;

        return {
            duration: Math.round(duration * 10) / 10,
            averageRate: Math.round(averageRate * 10) / 10,
            effectInterpretation,
            isSignificant,
            isHighlySignificant
        };
    }, [session, trials, statistics]);

    const handleExport = () => {
        // TODO: Implement actual export functionality
        console.log(`Exporting session data as ${exportFormat}`);
    };

    const getSignificanceBadge = () => {
        if (sessionSummary.isHighlySignificant) {
            return <Badge variant="success">Highly Significant (p &lt; 0.01)</Badge>;
        } else if (sessionSummary.isSignificant) {
            return <Badge variant="warning">Significant (p &lt; 0.05)</Badge>;
        } else {
            return <Badge variant="neutral">Not Significant</Badge>;
        }
    };

    const getIntentionBadge = () => {
        const variant = session.intention === 'high' ? 'primary' :
                      session.intention === 'low' ? 'error' : 'neutral';
        return <Badge variant={variant}>{session.intention.toUpperCase()}</Badge>;
    };

    return (
        <div className="session-results">
            <div className="results-header">
                <h1>Session Results</h1>
                <div className="session-badges">
                    {getIntentionBadge()}
                    {getSignificanceBadge()}
                </div>
            </div>

            <div className="results-grid">
                {/* Session Summary */}
                <Card
                    title="Session Summary"
                    className="summary-card"
                >
                    <div className="summary-metrics">
                        <div className="metric">
                            <span className="metric-label">Duration:</span>
                            <span className="metric-value">{sessionSummary.duration} minutes</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Total Trials:</span>
                            <span className="metric-value">{trials.length.toLocaleString()}</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Average Rate:</span>
                            <span className="metric-value">{sessionSummary.averageRate} trials/hour</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Effect Size:</span>
                            <span className="metric-value">{sessionSummary.effectInterpretation}</span>
                        </div>
                    </div>
                </Card>

                {/* Statistical Results */}
                <Card
                    title="Statistical Analysis"
                    className="statistics-card"
                >
                    <StatisticsPanel
                        statistics={statistics}
                        currentIntention={session.intention}
                        totalTrials={trials.length}
                        showDetails={true}
                    />
                </Card>

                {/* Cumulative Chart */}
                <Card
                    title="Cumulative Deviation"
                    className="chart-card"
                >
                    <CumulativeChart
                        data={cumulativeData}
                        intention={session.intention}
                        totalTrials={session.targetTrials}
                        isCompleted={true}
                    />
                </Card>

                {/* Interpretation */}
                <Card
                    title="Interpretation"
                    className="interpretation-card"
                >
                    <div className="interpretation-content">
                        <h3>Session Outcome</h3>
                        {sessionSummary.isSignificant ? (
                            <p className="significant-result">
                                Your session showed statistically significant results!
                                The RNG data deviated from random chance in a way that
                                aligns with your intention ({session.intention}).
                            </p>
                        ) : (
                            <p className="non-significant-result">
                                Your session did not show statistically significant
                                deviation from random chance. This is normal and expected
                                in consciousness research.
                            </p>
                        )}

                        <h3>Scientific Context</h3>
                        <p>
                            This experiment follows the methodology of the Princeton
                            Engineering Anomalies Research (PEAR) laboratory. Even
                            non-significant results contribute valuable data to the
                            study of consciousness-matter interaction.
                        </p>

                        <h3>Effect Size: {sessionSummary.effectInterpretation}</h3>
                        <p>
                            Effect size (Cohen's d = {(statistics.effectSize || 0).toFixed(4)})
                            measures the practical significance of the observed deviation,
                            independent of statistical significance.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Export Options */}
            <Card title="Export Results" className="export-card">
                <div className="export-controls">
                    <div className="format-selector">
                        <label>Export Format:</label>
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'xlsx')}
                        >
                            <option value="json">JSON (Complete Data)</option>
                            <option value="csv">CSV (Spreadsheet)</option>
                            <option value="xlsx">Excel (Formatted)</option>
                        </select>
                    </div>
                    <Button variant="secondary" onClick={handleExport}>
                        Export Session Data
                    </Button>
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="action-buttons">
                <Button variant="primary" onClick={onNewSession} size="large">
                    Start New Session
                </Button>
                <Button variant="secondary" onClick={onViewHistory} size="large">
                    View Session History
                </Button>
            </div>

            <style>{`
                .session-results {
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .results-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .results-header h1 {
                    color: white;
                    margin-bottom: 15px;
                    font-size: 2.5rem;
                }

                .session-badges {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }

                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .summary-card, .statistics-card, .chart-card, .interpretation-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .summary-metrics {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .metric {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .metric:last-child {
                    border-bottom: none;
                }

                .metric-label {
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 500;
                }

                .metric-value {
                    color: white;
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .interpretation-content h3 {
                    color: #4CAF50;
                    margin: 20px 0 10px 0;
                    font-size: 1.2rem;
                }

                .significant-result {
                    color: #4CAF50;
                    font-weight: 500;
                    background: rgba(76, 175, 80, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #4CAF50;
                }

                .non-significant-result {
                    color: rgba(255, 255, 255, 0.9);
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid rgba(255, 255, 255, 0.3);
                }

                .export-card {
                    margin-bottom: 30px;
                }

                .export-controls {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }

                .format-selector label {
                    color: rgba(255, 255, 255, 0.8);
                    margin-right: 10px;
                }

                .format-selector select {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    padding: 8px 12px;
                    min-width: 180px;
                }

                .action-buttons {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-top: 30px;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .results-grid {
                        grid-template-columns: 1fr;
                    }

                    .export-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .session-badges {
                        flex-direction: column;
                        align-items: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default SessionResults;