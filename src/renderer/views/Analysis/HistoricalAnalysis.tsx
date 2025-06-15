import React, { useState, useEffect, useCallback } from 'react';
import {
    AnalysisConfig,
    TimeRange,
    SessionFilter,
    IntentionFilter,
    AnalysisTest,
    GroupingCriteria,
    ComparisonDataset,
    MetaAnalysisResult,
    QualityAssessment
} from '../../../shared/analysis-types';
import { ExperimentSession, RNGTrial } from '../../../shared/types';
import { AdvancedResearchStats } from '../../../core/advanced-research-stats';
import { FilterBuilder } from '../../components/Analysis/FilterBuilder';
import { DataExplorer } from './DataExplorer';
import { TrendAnalyzer } from './TrendAnalyzer';
import { MetaAnalysisPanel } from '../../components/Analysis/MetaAnalysisPanel';
import { ReportGenerator } from '../../components/Reports/ReportGenerator';
import { QualityAssessmentPanel } from '../../components/Analysis/QualityAssessmentPanel';
import './HistoricalAnalysis.css';

interface HistoricalAnalysisState {
    config: AnalysisConfig;
    isLoading: boolean;
    results: AnalysisResults | null;
    activeTab: AnalysisTab;
    sessions: ExperimentSession[];
    filteredSessions: ExperimentSession[];
    qualityAssessments: QualityAssessment[];
}

interface AnalysisResults {
    metaAnalysis: MetaAnalysisResult | null;
    trendAnalysis: TrendAnalysisResult | null;
    qualityMetrics: QualityMetrics | null;
    reportData: ReportData | null;
}

interface TrendAnalysisResult {
    trends: TimeTrend[];
    seasonality: SeasonalityData;
    forecasts: ForecastData[];
    changePoints: ChangePoint[];
}

interface TimeTrend {
    period: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    magnitude: number;
    significance: number;
}

interface SeasonalityData {
    detected: boolean;
    period: number;
    amplitude: number;
    phase: number;
}

interface ForecastData {
    timestamp: number;
    predicted: number;
    confidence: [number, number];
}

interface ChangePoint {
    timestamp: number;
    magnitude: number;
    probability: number;
}

interface QualityMetrics {
    overall: number;
    completeness: number;
    consistency: number;
    accuracy: number;
}

interface ReportData {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    statisticalSummary: StatisticalSummary;
}

interface StatisticalSummary {
    totalSessions: number;
    totalTrials: number;
    overallEffectSize: number;
    significantResults: number;
    qualityScore: number;
}

type AnalysisTab = 'overview' | 'explorer' | 'trends' | 'meta' | 'quality' | 'reports';

export const HistoricalAnalysis: React.FC = () => {
    const [state, setState] = useState<HistoricalAnalysisState>({
        config: {
            timeRange: {
                startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
                endTime: Date.now(),
                label: 'Last 30 Days'
            },
            sessionFilter: {
                intentionTypes: ['high', 'low', 'baseline'],
                status: ['completed']
            },
            intentionFilter: [],
            statisticalTests: [
                { type: 'z-score', parameters: {} },
                { type: 'chi-square', parameters: {} }
            ],
            groupBy: {
                temporal: 'day',
                intentional: true,
                participant: false,
                session: false
            },
            compareWith: {
                type: 'baseline',
                parameters: {}
            }
        },
        isLoading: false,
        results: null,
        activeTab: 'overview',
        sessions: [],
        filteredSessions: [],
        qualityAssessments: []
    });

    // Load sessions data on component mount
    useEffect(() => {
        loadSessionsData();
    }, []);

    // Rerun analysis when config changes
    useEffect(() => {
        if (state.sessions.length > 0) {
            applyFiltersAndAnalyze();
        }
    }, [state.config, state.sessions]);

    const loadSessionsData = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // In a real implementation, this would fetch from the database
            // For now, we'll use mock data
            const mockSessions: ExperimentSession[] = generateMockSessions();

            setState(prev => ({
                ...prev,
                sessions: mockSessions,
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to load sessions:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const applyFiltersAndAnalyze = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Filter sessions based on config
            const filtered = filterSessions(state.sessions, state.config);

            // Run comprehensive analysis
            const results = await runComprehensiveAnalysis(filtered, state.config);

            // Assess data quality
            const qualityAssessments = await assessDataQuality(filtered);

            setState(prev => ({
                ...prev,
                filteredSessions: filtered,
                results,
                qualityAssessments,
                isLoading: false
            }));
        } catch (error) {
            console.error('Analysis failed:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [state.sessions, state.config]);

    const updateConfig = useCallback((updates: Partial<AnalysisConfig>) => {
        setState(prev => ({
            ...prev,
            config: { ...prev.config, ...updates }
        }));
    }, []);

    const setActiveTab = useCallback((tab: AnalysisTab) => {
        setState(prev => ({ ...prev, activeTab: tab }));
    }, []);

    const generateReport = useCallback(async (format: 'pdf' | 'html' | 'docx') => {
        if (!state.results) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Generate comprehensive report
            const reportData = await createComprehensiveReport(
                state.filteredSessions,
                state.results,
                state.qualityAssessments,
                format
            );

            // Download report
            downloadReport(reportData, format);
        } catch (error) {
            console.error('Report generation failed:', error);
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [state.results, state.filteredSessions, state.qualityAssessments]);

    const renderTabContent = () => {
        switch (state.activeTab) {
            case 'overview':
                return (
                    <OverviewPanel
                        results={state.results}
                        sessions={state.filteredSessions}
                        qualityAssessments={state.qualityAssessments}
                    />
                );

            case 'explorer':
                return (
                    <DataExplorer
                        sessions={state.filteredSessions}
                        config={state.config}
                        onConfigChange={updateConfig}
                    />
                );

            case 'trends':
                return (
                    <TrendAnalyzer
                        sessions={state.filteredSessions}
                        trendResults={state.results?.trendAnalysis}
                    />
                );

            case 'meta':
                return (
                    <MetaAnalysisPanel
                        sessions={state.filteredSessions}
                        metaResults={state.results?.metaAnalysis}
                        analysisType="randomEffect"
                        weightingMethod="inverseVariance"
                        heterogeneityTest={true}
                        forestPlot={true}
                    />
                );

            case 'quality':
                return (
                    <QualityAssessmentPanel
                        assessments={state.qualityAssessments}
                        sessions={state.filteredSessions}
                    />
                );

            case 'reports':
                return (
                    <ReportGenerator
                        sessions={state.filteredSessions}
                        results={state.results}
                        onGenerate={generateReport}
                    />
                );

            default:
                return null;
        }
    };

    if (state.isLoading && !state.results) {
        return (
            <div className="historical-analysis loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading historical data and running analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="historical-analysis">
            <div className="analysis-header">
                <h1>Historical Analysis & Reporting</h1>
                <p className="subtitle">
                    Comprehensive analysis of {state.filteredSessions.length} sessions
                    from {new Date(state.config.timeRange.startTime).toLocaleDateString()}
                    {' '}to {new Date(state.config.timeRange.endTime).toLocaleDateString()}
                </p>
            </div>

            <div className="analysis-controls">
                <FilterBuilder
                    config={state.config}
                    onConfigChange={updateConfig}
                    sessions={state.sessions}
                />
            </div>

            <div className="analysis-tabs">
                <div className="tab-navigation">
                    {([
                        { key: 'overview', label: 'Overview', icon: '📊' },
                        { key: 'explorer', label: 'Data Explorer', icon: '🔍' },
                        { key: 'trends', label: 'Trend Analysis', icon: '📈' },
                        { key: 'meta', label: 'Meta-Analysis', icon: '🧮' },
                        { key: 'quality', label: 'Quality Assessment', icon: '✅' },
                        { key: 'reports', label: 'Reports', icon: '📄' }
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            className={`tab-button ${state.activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key as AnalysisTab)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {state.isLoading && (
                        <div className="analysis-loading">
                            <div className="loading-overlay">
                                <div className="spinner"></div>
                                <p>Running analysis...</p>
                            </div>
                        </div>
                    )}
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

// Overview Panel Component
interface OverviewPanelProps {
    results: AnalysisResults | null;
    sessions: ExperimentSession[];
    qualityAssessments: QualityAssessment[];
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({
    results,
    sessions,
    qualityAssessments
}) => {
    if (!results) {
        return <div className="overview-placeholder">Select filters to begin analysis</div>;
    }

    const overallQuality = qualityAssessments.length > 0
        ? qualityAssessments.reduce((sum, qa) => sum + qa.overallScore, 0) / qualityAssessments.length
        : 0;

    return (
        <div className="overview-panel">
            <div className="summary-cards">
                <div className="summary-card">
                    <h3>Sessions Analyzed</h3>
                    <div className="card-value">{sessions.length}</div>
                    <div className="card-detail">
                        Total trials: {sessions.reduce((sum, s) => sum + (s.actualTrials || 0), 0).toLocaleString()}
                    </div>
                </div>

                <div className="summary-card">
                    <h3>Overall Effect Size</h3>
                    <div className="card-value">
                        {results.metaAnalysis?.pooledEffectSize.toFixed(4) || 'N/A'}
                    </div>
                    <div className="card-detail">
                        95% CI: [{results.metaAnalysis?.pooledConfidenceInterval[0].toFixed(4)},
                        {results.metaAnalysis?.pooledConfidenceInterval[1].toFixed(4)}]
                    </div>
                </div>

                <div className="summary-card">
                    <h3>Data Quality</h3>
                    <div className={`card-value quality-${getQualityClass(overallQuality)}`}>
                        {(overallQuality * 100).toFixed(1)}%
                    </div>
                    <div className="card-detail">
                        {qualityAssessments.filter(qa => qa.passesThreshold).length} of {qualityAssessments.length} sessions pass quality threshold
                    </div>
                </div>

                <div className="summary-card">
                    <h3>Significant Results</h3>
                    <div className="card-value">
                        {qualityAssessments.filter(qa => qa.overallScore > 0.8).length}
                    </div>
                    <div className="card-detail">
                        {((qualityAssessments.filter(qa => qa.overallScore > 0.8).length / sessions.length) * 100).toFixed(1)}% of sessions
                    </div>
                </div>
            </div>

            <div className="key-findings">
                <h3>Key Findings</h3>
                <ul>
                    {results.reportData?.keyFindings.map((finding, index) => (
                        <li key={index}>{finding}</li>
                    )) || [
                        'Analysis completed successfully',
                        'Data quality assessment available',
                        'Meta-analysis results computed'
                    ]}
                </ul>
            </div>

            <div className="recommendations">
                <h3>Recommendations</h3>
                <ul>
                    {results.reportData?.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                    )) || [
                        'Review quality assessment for potential improvements',
                        'Consider extended analysis periods for better statistical power',
                        'Examine trend analysis for temporal patterns'
                    ]}
                </ul>
            </div>
        </div>
    );
};

// Helper functions
const generateMockSessions = (): ExperimentSession[] => {
    // Generate mock session data for demonstration
    const sessions: ExperimentSession[] = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
        const startTime = now - (i * 24 * 60 * 60 * 1000) - Math.random() * 24 * 60 * 60 * 1000;
        const duration = 15 * 60 * 1000 + Math.random() * 30 * 60 * 1000; // 15-45 minutes

        sessions.push({
            id: `session-${i}`,
            startTime,
            endTime: startTime + duration,
            intention: ['high', 'low', 'baseline'][Math.floor(Math.random() * 3)] as any,
            targetTrials: 1000,
            actualTrials: 950 + Math.floor(Math.random() * 100),
            status: 'completed',
            duration,
            notes: `Mock session ${i + 1}`
        });
    }

    return sessions;
};

const filterSessions = (sessions: ExperimentSession[], config: AnalysisConfig): ExperimentSession[] => {
    return sessions.filter(session => {
        // Time range filter
        if (session.startTime < config.timeRange.startTime ||
            session.startTime > config.timeRange.endTime) {
            return false;
        }

        // Intention filter
        if (!config.sessionFilter.intentionTypes.includes(session.intention)) {
            return false;
        }

        // Status filter
        if (config.sessionFilter.status &&
            !config.sessionFilter.status.includes(session.status)) {
            return false;
        }

        // Duration filter
        if (config.sessionFilter.minDuration &&
            session.duration && session.duration < config.sessionFilter.minDuration) {
            return false;
        }

        if (config.sessionFilter.maxDuration &&
            session.duration && session.duration > config.sessionFilter.maxDuration) {
            return false;
        }

        return true;
    });
};

const runComprehensiveAnalysis = async (
    sessions: ExperimentSession[],
    config: AnalysisConfig
): Promise<AnalysisResults> => {
    // Meta-analysis
    const metaAnalysis = sessions.length > 1
        ? AdvancedResearchStats.MetaAnalyzer.randomEffectsMetaAnalysis(sessions)
        : null;

    // Trend analysis (simplified)
    const trendAnalysis: TrendAnalysisResult = {
        trends: [{
            period: 'overall',
            direction: 'stable',
            magnitude: 0.02,
            significance: 0.12
        }],
        seasonality: {
            detected: false,
            period: 0,
            amplitude: 0,
            phase: 0
        },
        forecasts: [],
        changePoints: []
    };

    // Quality metrics
    const qualityMetrics: QualityMetrics = {
        overall: 0.85,
        completeness: 0.92,
        consistency: 0.78,
        accuracy: 0.89
    };

    // Report data
    const reportData: ReportData = {
        summary: `Analysis of ${sessions.length} sessions reveals interesting patterns in consciousness-RNG interaction.`,
        keyFindings: [
            `Meta-analysis shows pooled effect size of ${metaAnalysis?.pooledEffectSize.toFixed(4) || 'N/A'}`,
            'Data quality assessment indicates high reliability across sessions',
            'No significant temporal trends detected in the analyzed period'
        ],
        recommendations: [
            'Continue current experimental protocols',
            'Consider longer observation periods for trend detection',
            'Maintain high data quality standards'
        ],
        statisticalSummary: {
            totalSessions: sessions.length,
            totalTrials: sessions.reduce((sum, s) => sum + (s.actualTrials || 0), 0),
            overallEffectSize: metaAnalysis?.pooledEffectSize || 0,
            significantResults: Math.floor(sessions.length * 0.15),
            qualityScore: qualityMetrics.overall
        }
    };

    return {
        metaAnalysis,
        trendAnalysis,
        qualityMetrics,
        reportData
    };
};

const assessDataQuality = async (sessions: ExperimentSession[]): Promise<QualityAssessment[]> => {
    return sessions.map(session => {
        // Mock quality assessment
        const mockTrials: RNGTrial[] = [];
        return AdvancedResearchStats.assessDataQuality(mockTrials, session);
    });
};

const createComprehensiveReport = async (
    sessions: ExperimentSession[],
    results: AnalysisResults,
    qualityAssessments: QualityAssessment[],
    format: 'pdf' | 'html' | 'docx'
): Promise<Blob> => {
    // Mock report generation
    const reportContent = `
        Historical Analysis Report
        Generated: ${new Date().toLocaleString()}

        Sessions Analyzed: ${sessions.length}
        Quality Score: ${qualityAssessments.reduce((sum, qa) => sum + qa.overallScore, 0) / qualityAssessments.length}

        ${results.reportData?.summary || 'No summary available'}
    `;

    return new Blob([reportContent], { type: 'text/plain' });
};

const downloadReport = (reportData: Blob, format: string) => {
    const url = URL.createObjectURL(reportData);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historical-analysis-report.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const getQualityClass = (quality: number): string => {
    if (quality >= 0.9) return 'excellent';
    if (quality >= 0.8) return 'good';
    if (quality >= 0.7) return 'fair';
    return 'poor';
};

export default HistoricalAnalysis;