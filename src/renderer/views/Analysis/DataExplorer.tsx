import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { AnalysisConfig } from '../../../shared/analysis-types';
import { ExperimentSession, RNGTrial } from '../../../shared/types';
import { StatisticalUtils } from '../../../core/statistical-utils';
import './DataExplorer.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

interface DataExplorerProps {
    sessions: ExperimentSession[];
    config: AnalysisConfig;
    onConfigChange: (updates: Partial<AnalysisConfig>) => void;
}

interface ExplorerState {
    activeView: ExplorerView;
    selectedSessions: string[];
    groupingMethod: GroupingMethod;
    chartType: ChartType;
    aggregationMethod: AggregationMethod;
    isLoading: boolean;
    explorationData: ExplorationData | null;
}

interface ExplorationData {
    timeSeries: TimeSeriesPoint[];
    distribution: DistributionPoint[];
    correlations: CorrelationMatrix;
    sessionSummary: SessionSummary[];
}

interface TimeSeriesPoint {
    timestamp: number;
    value: number;
    sessionId: string;
    intention: string;
    confidence?: [number, number];
}

interface DistributionPoint {
    bin: number;
    count: number;
    density: number;
}

interface CorrelationMatrix {
    variables: string[];
    matrix: number[][];
    significance: number[][];
}

interface SessionSummary {
    sessionId: string;
    startTime: number;
    intention: string;
    duration: number;
    trialCount: number;
    mean: number;
    std: number;
    effectSize: number;
    pValue: number;
}

type ExplorerView = 'timeSeries' | 'distribution' | 'correlation' | 'sessionComparison';
type GroupingMethod = 'none' | 'intention' | 'date' | 'session' | 'participant';
type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';
type AggregationMethod = 'mean' | 'median' | 'sum' | 'count' | 'std';

export const DataExplorer: React.FC<DataExplorerProps> = ({
    sessions,
    config,
    onConfigChange
}) => {
    const [state, setState] = useState<ExplorerState>({
        activeView: 'timeSeries',
        selectedSessions: [],
        groupingMethod: 'intention',
        chartType: 'line',
        aggregationMethod: 'mean',
        isLoading: false,
        explorationData: null
    });

    // Compute exploration data when sessions or settings change
    useEffect(() => {
        if (sessions.length > 0) {
            computeExplorationData();
        }
    }, [sessions, state.groupingMethod, state.aggregationMethod]);

    const computeExplorationData = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const data = await generateExplorationData(sessions, state.groupingMethod, state.aggregationMethod);
            setState(prev => ({
                ...prev,
                explorationData: data,
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to compute exploration data:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [sessions, state.groupingMethod, state.aggregationMethod]);

    const updateView = useCallback((view: ExplorerView) => {
        setState(prev => ({ ...prev, activeView: view }));
    }, []);

    const updateChartType = useCallback((chartType: ChartType) => {
        setState(prev => ({ ...prev, chartType }));
    }, []);

    const updateGrouping = useCallback((groupingMethod: GroupingMethod) => {
        setState(prev => ({ ...prev, groupingMethod }));
    }, []);

    const updateAggregation = useCallback((aggregationMethod: AggregationMethod) => {
        setState(prev => ({ ...prev, aggregationMethod }));
    }, []);

    const toggleSessionSelection = useCallback((sessionId: string) => {
        setState(prev => ({
            ...prev,
            selectedSessions: prev.selectedSessions.includes(sessionId)
                ? prev.selectedSessions.filter(id => id !== sessionId)
                : [...prev.selectedSessions, sessionId]
        }));
    }, []);

    // Chart data preparation
    const chartData = useMemo(() => {
        if (!state.explorationData) return null;

        switch (state.activeView) {
            case 'timeSeries':
                return prepareTimeSeriesChart(
                    state.explorationData.timeSeries,
                    state.chartType,
                    state.groupingMethod
                );
            case 'distribution':
                return prepareDistributionChart(
                    state.explorationData.distribution,
                    state.chartType
                );
            case 'correlation':
                return prepareCorrelationChart(
                    state.explorationData.correlations
                );
            case 'sessionComparison':
                return prepareSessionComparisonChart(
                    state.explorationData.sessionSummary,
                    state.chartType,
                    state.selectedSessions
                );
            default:
                return null;
        }
    }, [state.explorationData, state.activeView, state.chartType, state.groupingMethod, state.selectedSessions]);

    const renderControls = () => (
        <div className="explorer-controls">
            <div className="control-group">
                <label>View</label>
                <div className="button-group">
                    {([
                        { key: 'timeSeries', label: 'Time Series', icon: '📈' },
                        { key: 'distribution', label: 'Distribution', icon: '📊' },
                        { key: 'correlation', label: 'Correlations', icon: '🔗' },
                        { key: 'sessionComparison', label: 'Sessions', icon: '🔍' }
                    ] as const).map(view => (
                        <button
                            key={view.key}
                            className={`control-button ${state.activeView === view.key ? 'active' : ''}`}
                            onClick={() => updateView(view.key as ExplorerView)}
                        >
                            <span className="button-icon">{view.icon}</span>
                            <span className="button-label">{view.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="control-group">
                <label>Chart Type</label>
                <select
                    value={state.chartType}
                    onChange={(e) => updateChartType(e.target.value as ChartType)}
                    className="control-select"
                >
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="scatter">Scatter Plot</option>
                    {state.activeView === 'correlation' && <option value="heatmap">Heatmap</option>}
                </select>
            </div>

            <div className="control-group">
                <label>Group By</label>
                <select
                    value={state.groupingMethod}
                    onChange={(e) => updateGrouping(e.target.value as GroupingMethod)}
                    className="control-select"
                >
                    <option value="none">No Grouping</option>
                    <option value="intention">Intention Type</option>
                    <option value="date">Date</option>
                    <option value="session">Session</option>
                    <option value="participant">Participant</option>
                </select>
            </div>

            <div className="control-group">
                <label>Aggregation</label>
                <select
                    value={state.aggregationMethod}
                    onChange={(e) => updateAggregation(e.target.value as AggregationMethod)}
                    className="control-select"
                >
                    <option value="mean">Mean</option>
                    <option value="median">Median</option>
                    <option value="sum">Sum</option>
                    <option value="count">Count</option>
                    <option value="std">Standard Deviation</option>
                </select>
            </div>
        </div>
    );

    const renderChart = () => {
        if (state.isLoading) {
            return (
                <div className="chart-loading">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Analyzing data...</p>
                    </div>
                </div>
            );
        }

        if (!chartData) {
            return (
                <div className="chart-placeholder">
                    <p>No data available for the selected view</p>
                </div>
            );
        }

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                    text: getChartTitle()
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const label = context.dataset.label || '';
                            return `${label}: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: state.activeView === 'timeSeries' ? {
                x: {
                    type: 'time' as const,
                    time: {
                        displayFormats: {
                            hour: 'MMM dd HH:mm',
                            day: 'MMM dd',
                            week: 'MMM dd',
                            month: 'MMM yyyy'
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            } : undefined
        };

        switch (state.chartType) {
            case 'line':
                return <Line data={chartData} options={chartOptions} />;
            case 'bar':
                return <Bar data={chartData} options={chartOptions} />;
            case 'scatter':
                return <Scatter data={chartData} options={chartOptions} />;
            default:
                return <Line data={chartData} options={chartOptions} />;
        }
    };

    const renderSessionList = () => {
        if (state.activeView !== 'sessionComparison') return null;

        return (
            <div className="session-list">
                <h4>Sessions</h4>
                <div className="session-items">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className={`session-item ${state.selectedSessions.includes(session.id) ? 'selected' : ''}`}
                            onClick={() => toggleSessionSelection(session.id)}
                        >
                            <div className="session-info">
                                <div className="session-title">
                                    {new Date(session.startTime).toLocaleString()}
                                </div>
                                <div className="session-details">
                                    {session.intention} • {session.actualTrials} trials
                                </div>
                            </div>
                            <div className="session-stats">
                                {state.explorationData?.sessionSummary
                                    .find(s => s.sessionId === session.id)?.effectSize.toFixed(3) || 'N/A'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderStatistics = () => {
        if (!state.explorationData) return null;

        const stats = computeViewStatistics(state.explorationData, state.activeView);

        return (
            <div className="exploration-stats">
                <h4>Statistics</h4>
                <div className="stat-grid">
                    {Object.entries(stats).map(([key, value]) => (
                        <div key={key} className="stat-item">
                            <div className="stat-label">{formatStatLabel(key)}</div>
                            <div className="stat-value">{formatStatValue(value)}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const getChartTitle = () => {
        const titles = {
            timeSeries: 'Time Series Analysis',
            distribution: 'Distribution Analysis',
            correlation: 'Correlation Analysis',
            sessionComparison: 'Session Comparison'
        };
        return titles[state.activeView];
    };

    return (
        <div className="data-explorer">
            <div className="explorer-header">
                <h2>Data Explorer</h2>
                <p className="explorer-subtitle">
                    Interactive analysis of {sessions.length} sessions
                </p>
            </div>

            {renderControls()}

            <div className="explorer-content">
                <div className="chart-container">
                    {renderChart()}
                </div>

                <div className="explorer-sidebar">
                    {renderStatistics()}
                    {renderSessionList()}
                </div>
            </div>
        </div>
    );
};

// Helper functions
const generateExplorationData = async (
    sessions: ExperimentSession[],
    groupingMethod: GroupingMethod,
    aggregationMethod: AggregationMethod
): Promise<ExplorationData> => {
    // Generate mock exploration data
    const timeSeries: TimeSeriesPoint[] = [];
    const distribution: DistributionPoint[] = [];
    const sessionSummary: SessionSummary[] = [];

    // Time series data
    sessions.forEach(session => {
        const numPoints = 20; // Sample points per session
        for (let i = 0; i < numPoints; i++) {
            const timestamp = session.startTime + (i * (session.duration || 1000000) / numPoints);
            const baseValue = session.intention === 'high' ? 101 :
                            session.intention === 'low' ? 99 : 100;
            const noise = (Math.random() - 0.5) * 4;

            timeSeries.push({
                timestamp,
                value: baseValue + noise,
                sessionId: session.id,
                intention: session.intention,
                confidence: [baseValue + noise - 2, baseValue + noise + 2]
            });
        }
    });

    // Distribution data
    for (let bin = 50; bin <= 150; bin += 2) {
        const count = Math.exp(-Math.pow(bin - 100, 2) / 400) * 100 + Math.random() * 10;
        distribution.push({
            bin,
            count: Math.round(count),
            density: count / 1000
        });
    }

    // Session summary
    sessions.forEach(session => {
        const mean = 100 + (Math.random() - 0.5) * 4;
        const std = 7 + Math.random() * 3;
        const effectSize = (mean - 100) / std;
        const pValue = Math.random() * 0.1;

        sessionSummary.push({
            sessionId: session.id,
            startTime: session.startTime,
            intention: session.intention,
            duration: session.duration || 0,
            trialCount: session.actualTrials || 0,
            mean,
            std,
            effectSize,
            pValue
        });
    });

    // Correlation matrix
    const variables = ['Mean', 'Std Dev', 'Duration', 'Trial Count', 'Effect Size'];
    const matrix = variables.map(() => variables.map(() => (Math.random() - 0.5) * 2));
    const significance = variables.map(() => variables.map(() => Math.random()));

    return {
        timeSeries,
        distribution,
        correlations: { variables, matrix, significance },
        sessionSummary
    };
};

const prepareTimeSeriesChart = (
    data: TimeSeriesPoint[],
    chartType: ChartType,
    groupingMethod: GroupingMethod
) => {
    const grouped = groupingMethod === 'intention' ?
        groupBy(data, 'intention') : { 'All Data': data };

    const datasets = Object.entries(grouped).map(([group, points], index) => {
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8'];
        const color = colors[index % colors.length];

        return {
            label: group,
            data: points.map(p => ({ x: p.timestamp, y: p.value })),
            borderColor: color,
            backgroundColor: color + '20',
            fill: false,
            tension: 0.1
        };
    });

    return { datasets };
};

const prepareDistributionChart = (data: DistributionPoint[], chartType: ChartType) => {
    return {
        labels: data.map(d => d.bin.toString()),
        datasets: [{
            label: 'Frequency',
            data: data.map(d => d.count),
            backgroundColor: '#007bff80',
            borderColor: '#007bff',
            borderWidth: 1
        }]
    };
};

const prepareCorrelationChart = (correlations: CorrelationMatrix) => {
    // For now, return a simple representation
    // In a real implementation, this would be a proper heatmap
    const flatData = correlations.matrix.flat();
    return {
        labels: correlations.variables,
        datasets: [{
            label: 'Correlation',
            data: flatData,
            backgroundColor: '#007bff80',
            borderColor: '#007bff',
            borderWidth: 1
        }]
    };
};

const prepareSessionComparisonChart = (
    data: SessionSummary[],
    chartType: ChartType,
    selectedSessions: string[]
) => {
    const filteredData = selectedSessions.length > 0 ?
        data.filter(d => selectedSessions.includes(d.sessionId)) : data;

    return {
        labels: filteredData.map(d => new Date(d.startTime).toLocaleDateString()),
        datasets: [{
            label: 'Effect Size',
            data: filteredData.map(d => d.effectSize),
            backgroundColor: '#007bff80',
            borderColor: '#007bff',
            borderWidth: 1
        }]
    };
};

const computeViewStatistics = (data: ExplorationData, view: ExplorerView) => {
    switch (view) {
        case 'timeSeries':
            const values = data.timeSeries.map(p => p.value);
            return {
                count: values.length,
                mean: StatisticalUtils.mean(values),
                std: StatisticalUtils.standardDeviation(values),
                min: Math.min(...values),
                max: Math.max(...values)
            };
        case 'distribution':
            return {
                bins: data.distribution.length,
                totalCount: data.distribution.reduce((sum, d) => sum + d.count, 0),
                peak: Math.max(...data.distribution.map(d => d.count)),
                mode: data.distribution.find(d => d.count === Math.max(...data.distribution.map(d => d.count)))?.bin || 0
            };
        case 'sessionComparison':
            const effectSizes = data.sessionSummary.map(s => s.effectSize);
            return {
                sessions: data.sessionSummary.length,
                meanEffect: StatisticalUtils.mean(effectSizes),
                stdEffect: StatisticalUtils.standardDeviation(effectSizes),
                significant: data.sessionSummary.filter(s => s.pValue < 0.05).length
            };
        default:
            return {};
    }
};

const formatStatLabel = (key: string): string => {
    const labels: Record<string, string> = {
        count: 'Data Points',
        mean: 'Mean',
        std: 'Std Dev',
        min: 'Minimum',
        max: 'Maximum',
        bins: 'Bins',
        totalCount: 'Total Count',
        peak: 'Peak Count',
        mode: 'Mode',
        sessions: 'Sessions',
        meanEffect: 'Mean Effect',
        stdEffect: 'Effect Std',
        significant: 'Significant'
    };
    return labels[key] || key;
};

const formatStatValue = (value: any): string => {
    if (typeof value === 'number') {
        return value % 1 === 0 ? value.toString() : value.toFixed(3);
    }
    return value.toString();
};

const groupBy = <T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
        const group = item[key]?.toString() || 'Unknown';
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};

export default DataExplorer;