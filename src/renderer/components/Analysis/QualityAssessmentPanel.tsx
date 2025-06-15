import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ChartOptions, ChartData } from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
    QualityMetrics,
    ExperimentSession,
    AnalysisConfig
} from '../../../shared/analysis-types';
import { StatisticalUtils } from '../../../core/statistical-utils';
import './QualityAssessmentPanel.css';

interface QualityAssessmentPanelProps {
    sessions: ExperimentSession[];
    config: AnalysisConfig;
    onConfigChange: (updates: Partial<AnalysisConfig>) => void;
}

interface QualityState {
    activeView: QualityView;
    selectedMetric: QualityMetricType;
    timeframe: QualityTimeframe;
    thresholds: QualityThresholds;
    isLoading: boolean;
    qualityData: QualityAssessmentData | null;
    anomalies: DataAnomaly[];
    recommendations: QualityRecommendation[];
}

interface QualityAssessmentData {
    overallScore: number;
    dimensionScores: QualityDimension[];
    temporalTrends: QualityTrend[];
    sessionQuality: SessionQuality[];
    comparativeAnalysis: ComparativeQuality;
    alerts: QualityAlert[];
}

interface QualityDimension {
    name: string;
    score: number;
    weight: number;
    components: QualityComponent[];
    trend: 'improving' | 'stable' | 'declining';
    details: string;
}

interface QualityComponent {
    name: string;
    value: number;
    expected: number;
    status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
    impact: 'high' | 'medium' | 'low';
}

interface QualityTrend {
    timestamp: number;
    overallScore: number;
    dimensionScores: Record<string, number>;
    sessionId: string;
}

interface SessionQuality {
    sessionId: string;
    startTime: number;
    overallScore: number;
    issues: QualityIssue[];
    strengths: string[];
    duration: number;
    trialCount: number;
    participantId?: string;
}

interface QualityIssue {
    type: 'data' | 'timing' | 'consistency' | 'completeness' | 'accuracy';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    affectedTrials?: number;
}

interface ComparativeQuality {
    benchmarkComparison: BenchmarkComparison;
    peerComparison: PeerComparison;
    historicalComparison: HistoricalComparison;
}

interface BenchmarkComparison {
    currentScore: number;
    benchmarkScore: number;
    percentile: number;
    status: 'above' | 'at' | 'below';
}

interface PeerComparison {
    currentScore: number;
    peerAverage: number;
    peerMedian: number;
    ranking: number;
    totalPeers: number;
}

interface HistoricalComparison {
    currentScore: number;
    historicalAverage: number;
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
}

interface QualityAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
    recommendations: string[];
}

interface DataAnomaly {
    sessionId: string;
    timestamp: number;
    type: 'outlier' | 'drift' | 'missing' | 'invalid' | 'inconsistent';
    severity: number;
    description: string;
    affectedMetrics: string[];
}

interface QualityRecommendation {
    category: 'data_collection' | 'session_design' | 'analysis_method' | 'equipment' | 'environment';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImprovement: number;
    implementationEffort: 'low' | 'medium' | 'high';
    timeline: string;
}

interface QualityThresholds {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
}

type QualityView = 'overview' | 'dimensions' | 'trends' | 'sessions' | 'anomalies' | 'recommendations';
type QualityMetricType = 'overall' | 'completeness' | 'consistency' | 'accuracy' | 'timeliness' | 'validity';
type QualityTimeframe = 'last_24h' | 'last_week' | 'last_month' | 'last_quarter' | 'all_time';

export const QualityAssessmentPanel: React.FC<QualityAssessmentPanelProps> = ({
    sessions,
    config,
    onConfigChange
}) => {
    const [state, setState] = useState<QualityState>({
        activeView: 'overview',
        selectedMetric: 'overall',
        timeframe: 'last_week',
        thresholds: {
            excellent: 0.9,
            good: 0.75,
            acceptable: 0.6,
            poor: 0.4
        },
        isLoading: false,
        qualityData: null,
        anomalies: [],
        recommendations: []
    });

    const filteredSessions = useMemo(() => {
        const now = Date.now();
        const timeframes = {
            last_24h: 24 * 60 * 60 * 1000,
            last_week: 7 * 24 * 60 * 60 * 1000,
            last_month: 30 * 24 * 60 * 60 * 1000,
            last_quarter: 90 * 24 * 60 * 60 * 1000,
            all_time: Infinity
        };

        const cutoff = now - timeframes[state.timeframe];
        return sessions.filter(session => session.startTime >= cutoff);
    }, [sessions, state.timeframe]);

    useEffect(() => {
        assessQuality();
    }, [filteredSessions, state.thresholds]);

    const assessQuality = async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const qualityData = await performQualityAssessment(filteredSessions, state.thresholds);
            const anomalies = await detectAnomalies(filteredSessions);
            const recommendations = await generateRecommendations(qualityData, anomalies);

            setState(prev => ({
                ...prev,
                qualityData,
                anomalies,
                recommendations,
                isLoading: false
            }));
        } catch (error) {
            console.error('Error assessing quality:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleViewChange = (view: QualityView) => {
        setState(prev => ({ ...prev, activeView: view }));
    };

    const handleMetricChange = (metric: QualityMetricType) => {
        setState(prev => ({ ...prev, selectedMetric: metric }));
    };

    const handleTimeframeChange = (timeframe: QualityTimeframe) => {
        setState(prev => ({ ...prev, timeframe }));
    };

    const handleThresholdChange = (thresholds: Partial<QualityThresholds>) => {
        setState(prev => ({
            ...prev,
            thresholds: { ...prev.thresholds, ...thresholds }
        }));
    };

    const renderControls = () => (
        <div className="quality-controls">
            <div className="control-group">
                <label>Metric:</label>
                <select
                    value={state.selectedMetric}
                    onChange={(e) => handleMetricChange(e.target.value as QualityMetricType)}
                >
                    <option value="overall">Overall Quality</option>
                    <option value="completeness">Completeness</option>
                    <option value="consistency">Consistency</option>
                    <option value="accuracy">Accuracy</option>
                    <option value="timeliness">Timeliness</option>
                    <option value="validity">Validity</option>
                </select>
            </div>

            <div className="control-group">
                <label>Timeframe:</label>
                <select
                    value={state.timeframe}
                    onChange={(e) => handleTimeframeChange(e.target.value as QualityTimeframe)}
                >
                    <option value="last_24h">Last 24 Hours</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_quarter">Last Quarter</option>
                    <option value="all_time">All Time</option>
                </select>
            </div>

            <div className="control-group">
                <label>Excellence Threshold:</label>
                <input
                    type="range"
                    min="0.8"
                    max="1.0"
                    step="0.01"
                    value={state.thresholds.excellent}
                    onChange={(e) => handleThresholdChange({ excellent: parseFloat(e.target.value) })}
                />
                <span>{(state.thresholds.excellent * 100).toFixed(0)}%</span>
            </div>
        </div>
    );

    const renderTabNavigation = () => (
        <div className="quality-tabs">
            {(['overview', 'dimensions', 'trends', 'sessions', 'anomalies', 'recommendations'] as QualityView[]).map(tab => (
                <button
                    key={tab}
                    className={`tab ${state.activeView === tab ? 'active' : ''}`}
                    onClick={() => handleViewChange(tab)}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
        </div>
    );

    const renderOverview = () => {
        if (!state.qualityData) return <div>No quality data available</div>;

        const { overallScore, dimensionScores, alerts, comparativeAnalysis } = state.qualityData;

        return (
            <div className="quality-overview">
                <div className="overview-header">
                    <div className="overall-score-card">
                        <h3>Overall Quality Score</h3>
                        <div className={`score-display ${getScoreClass(overallScore, state.thresholds)}`}>
                            {(overallScore * 100).toFixed(1)}%
                        </div>
                        <div className="score-indicator">
                            <div
                                className="score-bar"
                                style={{ width: `${overallScore * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="quality-summary">
                        <div className="summary-item">
                            <span className="label">Sessions Analyzed:</span>
                            <span className="value">{filteredSessions.length}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Active Alerts:</span>
                            <span className={`value ${alerts.filter(a => a.actionRequired).length > 0 ? 'warning' : ''}`}>
                                {alerts.filter(a => a.actionRequired).length}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Anomalies Detected:</span>
                            <span className={`value ${state.anomalies.length > 0 ? 'warning' : ''}`}>
                                {state.anomalies.length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="dimensions-overview">
                    <h4>Quality Dimensions</h4>
                    <div className="dimension-cards">
                        {dimensionScores.map((dimension, index) => (
                            <div key={index} className="dimension-card">
                                <div className="dimension-header">
                                    <h5>{dimension.name}</h5>
                                    <span className={`trend-indicator ${dimension.trend}`}>
                                        {dimension.trend === 'improving' ? '↗' :
                                         dimension.trend === 'declining' ? '↘' : '→'}
                                    </span>
                                </div>
                                <div className={`dimension-score ${getScoreClass(dimension.score, state.thresholds)}`}>
                                    {(dimension.score * 100).toFixed(1)}%
                                </div>
                                <div className="dimension-details">
                                    {dimension.details}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overview-charts">
                    <div className="chart-container">
                        <h4>Quality Dimensions Radar</h4>
                        <Radar data={prepareDimensionsRadarChart(dimensionScores)} options={getRadarOptions()} />
                    </div>

                    <div className="chart-container">
                        <h4>Quality Distribution</h4>
                        <Doughnut data={prepareQualityDistributionChart(state.qualityData)} options={getDoughnutOptions()} />
                    </div>
                </div>

                {alerts.length > 0 && (
                    <div className="alerts-section">
                        <h4>Active Alerts</h4>
                        <div className="alerts-list">
                            {alerts.slice(0, 3).map((alert, index) => (
                                <div key={index} className={`alert-card ${alert.type} ${alert.severity}`}>
                                    <div className="alert-header">
                                        <span className="alert-title">{alert.title}</span>
                                        <span className="alert-severity">{alert.severity}</span>
                                    </div>
                                    <div className="alert-message">{alert.message}</div>
                                    {alert.actionRequired && (
                                        <div className="alert-action">Action Required</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDimensions = () => {
        if (!state.qualityData) return <div>No quality data available</div>;

        const { dimensionScores } = state.qualityData;

        return (
            <div className="quality-dimensions">
                <div className="dimensions-list">
                    {dimensionScores.map((dimension, index) => (
                        <div key={index} className="dimension-detail-card">
                            <div className="dimension-detail-header">
                                <h4>{dimension.name}</h4>
                                <div className={`dimension-score-large ${getScoreClass(dimension.score, state.thresholds)}`}>
                                    {(dimension.score * 100).toFixed(1)}%
                                </div>
                            </div>

                            <div className="dimension-description">
                                {dimension.details}
                            </div>

                            <div className="components-list">
                                <h5>Components</h5>
                                {dimension.components.map((component, compIndex) => (
                                    <div key={compIndex} className="component-item">
                                        <div className="component-header">
                                            <span className="component-name">{component.name}</span>
                                            <span className={`component-status ${component.status}`}>
                                                {component.status}
                                            </span>
                                        </div>
                                        <div className="component-metrics">
                                            <div>Value: {component.value.toFixed(3)}</div>
                                            <div>Expected: {component.expected.toFixed(3)}</div>
                                            <div>Impact: {component.impact}</div>
                                        </div>
                                        <div className="component-bar">
                                            <div
                                                className={`component-progress ${component.status}`}
                                                style={{ width: `${Math.min(component.value / component.expected * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTrends = () => {
        if (!state.qualityData) return <div>No quality data available</div>;

        const { temporalTrends } = state.qualityData;

        return (
            <div className="quality-trends">
                <div className="trends-chart">
                    <h4>Quality Trends Over Time</h4>
                    <Line data={prepareTrendsChart(temporalTrends)} options={getLineOptions('Quality Score Over Time')} />
                </div>

                <div className="trend-analysis">
                    <h4>Trend Analysis</h4>
                    <div className="trend-cards">
                        {state.qualityData.dimensionScores.map((dimension, index) => (
                            <div key={index} className="trend-card">
                                <h5>{dimension.name}</h5>
                                <div className={`trend-direction ${dimension.trend}`}>
                                    {dimension.trend === 'improving' ?
                                        '📈 Improving' :
                                        dimension.trend === 'declining' ?
                                        '📉 Declining' :
                                        '📊 Stable'
                                    }
                                </div>
                                <div className="trend-details">
                                    Current: {(dimension.score * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderSessions = () => {
        if (!state.qualityData) return <div>No quality data available</div>;

        const { sessionQuality } = state.qualityData;

        return (
            <div className="quality-sessions">
                <div className="sessions-header">
                    <h4>Session Quality Analysis</h4>
                    <div className="sessions-summary">
                        <div>Total Sessions: {sessionQuality.length}</div>
                        <div>Average Score: {(sessionQuality.reduce((sum, s) => sum + s.overallScore, 0) / sessionQuality.length * 100).toFixed(1)}%</div>
                    </div>
                </div>

                <div className="sessions-list">
                    {sessionQuality.map((session, index) => (
                        <div key={index} className="session-quality-card">
                            <div className="session-header">
                                <div className="session-info">
                                    <h5>Session {index + 1}</h5>
                                    <div className="session-meta">
                                        {new Date(session.startTime).toLocaleString()} •
                                        {session.trialCount} trials •
                                        {Math.round(session.duration / 60000)} min
                                    </div>
                                </div>
                                <div className={`session-score ${getScoreClass(session.overallScore, state.thresholds)}`}>
                                    {(session.overallScore * 100).toFixed(1)}%
                                </div>
                            </div>

                            {session.issues.length > 0 && (
                                <div className="session-issues">
                                    <h6>Issues Identified</h6>
                                    {session.issues.map((issue, issueIndex) => (
                                        <div key={issueIndex} className={`issue-item ${issue.severity}`}>
                                            <div className="issue-header">
                                                <span className="issue-type">{issue.type}</span>
                                                <span className="issue-severity">{issue.severity}</span>
                                            </div>
                                            <div className="issue-description">{issue.description}</div>
                                            <div className="issue-recommendation">{issue.recommendation}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {session.strengths.length > 0 && (
                                <div className="session-strengths">
                                    <h6>Strengths</h6>
                                    <ul>
                                        {session.strengths.map((strength, strengthIndex) => (
                                            <li key={strengthIndex}>{strength}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAnomalies = () => {
        return (
            <div className="quality-anomalies">
                <div className="anomalies-header">
                    <h4>Data Anomalies</h4>
                    <div className="anomalies-summary">
                        <div>Total Anomalies: {state.anomalies.length}</div>
                        <div>High Severity: {state.anomalies.filter(a => a.severity > 0.7).length}</div>
                    </div>
                </div>

                <div className="anomalies-list">
                    {state.anomalies.map((anomaly, index) => (
                        <div key={index} className={`anomaly-card ${getSeverityClass(anomaly.severity)}`}>
                            <div className="anomaly-header">
                                <div className="anomaly-type">{anomaly.type}</div>
                                <div className="anomaly-severity">
                                    Severity: {(anomaly.severity * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div className="anomaly-description">{anomaly.description}</div>
                            <div className="anomaly-details">
                                <div>Time: {new Date(anomaly.timestamp).toLocaleString()}</div>
                                <div>Affected Metrics: {anomaly.affectedMetrics.join(', ')}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {state.anomalies.length === 0 && (
                    <div className="no-anomalies">
                        <div className="no-anomalies-icon">✅</div>
                        <div>No anomalies detected in the selected timeframe</div>
                    </div>
                )}
            </div>
        );
    };

    const renderRecommendations = () => {
        return (
            <div className="quality-recommendations">
                <div className="recommendations-header">
                    <h4>Quality Improvement Recommendations</h4>
                    <div className="recommendations-summary">
                        <div>Total Recommendations: {state.recommendations.length}</div>
                        <div>High Priority: {state.recommendations.filter(r => r.priority === 'high').length}</div>
                    </div>
                </div>

                <div className="recommendations-list">
                    {state.recommendations.map((recommendation, index) => (
                        <div key={index} className={`recommendation-card priority-${recommendation.priority}`}>
                            <div className="recommendation-header">
                                <div className="recommendation-title">{recommendation.title}</div>
                                <div className="recommendation-meta">
                                    <span className={`priority-badge ${recommendation.priority}`}>
                                        {recommendation.priority} priority
                                    </span>
                                    <span className="category-badge">
                                        {recommendation.category.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="recommendation-description">
                                {recommendation.description}
                            </div>

                            <div className="recommendation-metrics">
                                <div className="metric-item">
                                    <span className="metric-label">Expected Improvement:</span>
                                    <span className="metric-value">+{(recommendation.expectedImprovement * 100).toFixed(1)}%</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Implementation Effort:</span>
                                    <span className={`metric-value effort-${recommendation.implementationEffort}`}>
                                        {recommendation.implementationEffort}
                                    </span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Timeline:</span>
                                    <span className="metric-value">{recommendation.timeline}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (state.isLoading) {
            return <div className="loading">Assessing data quality...</div>;
        }

        switch (state.activeView) {
            case 'overview':
                return renderOverview();
            case 'dimensions':
                return renderDimensions();
            case 'trends':
                return renderTrends();
            case 'sessions':
                return renderSessions();
            case 'anomalies':
                return renderAnomalies();
            case 'recommendations':
                return renderRecommendations();
            default:
                return renderOverview();
        }
    };

    return (
        <div className="quality-assessment-panel">
            <div className="quality-header">
                <h2>Quality Assessment</h2>
                {renderControls()}
            </div>

            {renderTabNavigation()}

            <div className="quality-content">
                {renderContent()}
            </div>
        </div>
    );
};

// Helper functions
const performQualityAssessment = async (
    sessions: ExperimentSession[],
    thresholds: QualityThresholds
): Promise<QualityAssessmentData> => {
    // Mock quality assessment - in real implementation, this would use advanced algorithms

    const dimensionScores: QualityDimension[] = [
        {
            name: 'Completeness',
            score: 0.85 + Math.random() * 0.1,
            weight: 0.25,
            trend: Math.random() > 0.5 ? 'improving' : 'stable',
            details: 'Measures data completeness and missing value rates',
            components: [
                {
                    name: 'Data Coverage',
                    value: 0.92,
                    expected: 0.95,
                    status: 'good',
                    impact: 'high'
                },
                {
                    name: 'Missing Values',
                    value: 0.02,
                    expected: 0.01,
                    status: 'acceptable',
                    impact: 'medium'
                }
            ]
        },
        {
            name: 'Consistency',
            score: 0.78 + Math.random() * 0.15,
            weight: 0.2,
            trend: Math.random() > 0.3 ? 'stable' : 'declining',
            details: 'Evaluates data consistency across sessions and time',
            components: [
                {
                    name: 'Temporal Consistency',
                    value: 0.88,
                    expected: 0.9,
                    status: 'good',
                    impact: 'high'
                },
                {
                    name: 'Format Consistency',
                    value: 0.95,
                    expected: 0.98,
                    status: 'good',
                    impact: 'medium'
                }
            ]
        },
        {
            name: 'Accuracy',
            score: 0.82 + Math.random() * 0.12,
            weight: 0.3,
            trend: Math.random() > 0.4 ? 'improving' : 'stable',
            details: 'Assesses data accuracy and precision',
            components: [
                {
                    name: 'Measurement Precision',
                    value: 0.91,
                    expected: 0.95,
                    status: 'good',
                    impact: 'high'
                },
                {
                    name: 'Calibration Drift',
                    value: 0.03,
                    expected: 0.02,
                    status: 'acceptable',
                    impact: 'medium'
                }
            ]
        },
        {
            name: 'Timeliness',
            score: 0.9 + Math.random() * 0.08,
            weight: 0.15,
            trend: 'stable',
            details: 'Measures data collection timing and synchronization',
            components: [
                {
                    name: 'Collection Timing',
                    value: 0.96,
                    expected: 0.95,
                    status: 'excellent',
                    impact: 'medium'
                },
                {
                    name: 'Synchronization',
                    value: 0.94,
                    expected: 0.93,
                    status: 'excellent',
                    impact: 'low'
                }
            ]
        },
        {
            name: 'Validity',
            score: 0.75 + Math.random() * 0.2,
            weight: 0.1,
            trend: Math.random() > 0.6 ? 'improving' : 'stable',
            details: 'Validates data against expected ranges and patterns',
            components: [
                {
                    name: 'Range Validation',
                    value: 0.89,
                    expected: 0.9,
                    status: 'good',
                    impact: 'high'
                },
                {
                    name: 'Pattern Validation',
                    value: 0.86,
                    expected: 0.85,
                    status: 'excellent',
                    impact: 'medium'
                }
            ]
        }
    ];

    const overallScore = dimensionScores.reduce((sum, dim) => sum + dim.score * dim.weight, 0);

    const temporalTrends: QualityTrend[] = sessions.map((session, index) => ({
        timestamp: session.startTime,
        overallScore: overallScore + (Math.random() - 0.5) * 0.1,
        dimensionScores: {
            completeness: dimensionScores[0].score + (Math.random() - 0.5) * 0.05,
            consistency: dimensionScores[1].score + (Math.random() - 0.5) * 0.05,
            accuracy: dimensionScores[2].score + (Math.random() - 0.5) * 0.05,
            timeliness: dimensionScores[3].score + (Math.random() - 0.5) * 0.05,
            validity: dimensionScores[4].score + (Math.random() - 0.5) * 0.05
        },
        sessionId: session.id
    }));

    const sessionQuality: SessionQuality[] = sessions.map((session, index) => {
        const sessionScore = overallScore + (Math.random() - 0.5) * 0.2;
        const issues: QualityIssue[] = [];
        const strengths: string[] = [];

        // Generate random issues and strengths
        if (Math.random() < 0.3) {
            issues.push({
                type: 'consistency',
                severity: Math.random() > 0.7 ? 'high' : 'medium',
                description: 'Detected temporal inconsistencies in data collection',
                recommendation: 'Review timing calibration settings',
                affectedTrials: Math.floor(Math.random() * 100)
            });
        }

        if (sessionScore > thresholds.good) {
            strengths.push('High data completeness', 'Consistent measurement precision');
        }

        return {
            sessionId: session.id,
            startTime: session.startTime,
            overallScore: sessionScore,
            issues,
            strengths,
            duration: session.duration || 0,
            trialCount: session.actualTrials || 0
        };
    });

    const alerts: QualityAlert[] = [
        {
            id: '1',
            type: 'warning',
            title: 'Consistency Threshold Exceeded',
            message: 'Data consistency has dropped below acceptable levels in recent sessions',
            timestamp: Date.now(),
            severity: 'medium',
            actionRequired: true,
            recommendations: ['Review calibration settings', 'Check environmental conditions']
        }
    ];

    const comparativeAnalysis: ComparativeQuality = {
        benchmarkComparison: {
            currentScore: overallScore,
            benchmarkScore: 0.8,
            percentile: 75,
            status: overallScore > 0.8 ? 'above' : 'below'
        },
        peerComparison: {
            currentScore: overallScore,
            peerAverage: 0.78,
            peerMedian: 0.82,
            ranking: 12,
            totalPeers: 50
        },
        historicalComparison: {
            currentScore: overallScore,
            historicalAverage: overallScore - 0.05,
            trend: 'improving',
            changePercent: 5.2
        }
    };

    return {
        overallScore,
        dimensionScores,
        temporalTrends,
        sessionQuality,
        comparativeAnalysis,
        alerts
    };
};

const detectAnomalies = async (sessions: ExperimentSession[]): Promise<DataAnomaly[]> => {
    // Mock anomaly detection
    return Array.from({ length: Math.floor(Math.random() * 3) }, (_, index) => ({
        sessionId: sessions[Math.floor(Math.random() * sessions.length)]?.id || 'unknown',
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        type: ['outlier', 'drift', 'missing', 'invalid', 'inconsistent'][Math.floor(Math.random() * 5)] as any,
        severity: Math.random(),
        description: 'Unusual pattern detected in data stream',
        affectedMetrics: ['timing', 'precision', 'consistency']
    }));
};

const generateRecommendations = async (
    qualityData: QualityAssessmentData,
    anomalies: DataAnomaly[]
): Promise<QualityRecommendation[]> => {
    // Mock recommendation generation
    return [
        {
            category: 'data_collection',
            priority: 'high',
            title: 'Improve Data Collection Timing',
            description: 'Implement more precise timing mechanisms to reduce temporal inconsistencies',
            expectedImprovement: 0.08,
            implementationEffort: 'medium',
            timeline: '2-3 weeks'
        },
        {
            category: 'equipment',
            priority: 'medium',
            title: 'Calibrate Measurement Instruments',
            description: 'Regular calibration schedule to maintain measurement accuracy',
            expectedImprovement: 0.05,
            implementationEffort: 'low',
            timeline: '1 week'
        }
    ];
};

const getScoreClass = (score: number, thresholds: QualityThresholds): string => {
    if (score >= thresholds.excellent) return 'excellent';
    if (score >= thresholds.good) return 'good';
    if (score >= thresholds.acceptable) return 'acceptable';
    if (score >= thresholds.poor) return 'poor';
    return 'critical';
};

const getSeverityClass = (severity: number): string => {
    if (severity >= 0.8) return 'critical';
    if (severity >= 0.6) return 'high';
    if (severity >= 0.4) return 'medium';
    return 'low';
};

// Chart preparation functions
const prepareDimensionsRadarChart = (dimensions: QualityDimension[]): ChartData<'radar'> => {
    return {
        labels: dimensions.map(d => d.name),
        datasets: [{
            label: 'Quality Scores',
            data: dimensions.map(d => d.score * 100),
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            borderColor: 'rgba(0, 123, 255, 1)',
            pointBackgroundColor: 'rgba(0, 123, 255, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(0, 123, 255, 1)'
        }]
    };
};

const prepareQualityDistributionChart = (qualityData: QualityAssessmentData): ChartData<'doughnut'> => {
    const sessionCounts = {
        excellent: 0,
        good: 0,
        acceptable: 0,
        poor: 0,
        critical: 0
    };

    qualityData.sessionQuality.forEach(session => {
        if (session.overallScore >= 0.9) sessionCounts.excellent++;
        else if (session.overallScore >= 0.75) sessionCounts.good++;
        else if (session.overallScore >= 0.6) sessionCounts.acceptable++;
        else if (session.overallScore >= 0.4) sessionCounts.poor++;
        else sessionCounts.critical++;
    });

    return {
        labels: ['Excellent', 'Good', 'Acceptable', 'Poor', 'Critical'],
        datasets: [{
            data: Object.values(sessionCounts),
            backgroundColor: [
                '#28a745',
                '#17a2b8',
                '#ffc107',
                '#fd7e14',
                '#dc3545'
            ],
            borderWidth: 2
        }]
    };
};

const prepareTrendsChart = (trends: QualityTrend[]): ChartData<'line'> => {
    return {
        datasets: [{
            label: 'Overall Quality',
            data: trends.map(t => ({ x: t.timestamp, y: t.overallScore * 100 })),
            borderColor: '#007bff',
            backgroundColor: '#007bff20',
            fill: false,
            tension: 0.1
        }]
    };
};

const getRadarOptions = (): ChartOptions<'radar'> => ({
    responsive: true,
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        r: {
            beginAtZero: true,
            max: 100,
            ticks: {
                stepSize: 20
            }
        }
    }
});

const getDoughnutOptions = (): ChartOptions<'doughnut'> => ({
    responsive: true,
    plugins: {
        legend: {
            position: 'bottom'
        }
    }
});

const getLineOptions = (title: string): ChartOptions<'line'> => ({
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: title
        }
    },
    scales: {
        x: {
            type: 'time',
            time: {
                displayFormats: {
                    hour: 'MMM dd HH:mm'
                }
            }
        },
        y: {
            beginAtZero: true,
            max: 100,
            title: {
                display: true,
                text: 'Quality Score (%)'
            }
        }
    }
});

export default QualityAssessmentPanel;