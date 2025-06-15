import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ChartOptions, ChartData } from 'chart.js';
import { Bar, Scatter, Line } from 'react-chartjs-2';
import {
    MetaAnalysisProps,
    EffectSizeData,
    MetaAnalysisResult,
    ForestPlotData,
    ExperimentSession,
    AnalysisConfig
} from '../../../shared/analysis-types';
import { BayesianAnalyzer, MetaAnalyzer } from '../../../core/advanced-research-stats';
import { StatisticalUtils } from '../../../core/statistical-utils';
import './MetaAnalysisPanel.css';

interface MetaAnalysisPanelProps {
    sessions: ExperimentSession[];
    config: AnalysisConfig;
    onConfigChange: (updates: Partial<AnalysisConfig>) => void;
}

interface MetaState {
    activeView: MetaView;
    selectedEffect: EffectType;
    analysisMethod: AnalysisMethod;
    groupingCriteria: GroupingCriteria;
    confidenceLevel: number;
    isLoading: boolean;
    metaResults: MetaAnalysisResult | null;
    forestPlotData: ForestPlotData | null;
    heterogeneityTest: HeterogeneityTest | null;
    subgroupAnalysis: SubgroupAnalysis | null;
    publicationBias: PublicationBiasTest | null;
}

interface HeterogeneityTest {
    qStatistic: number;
    pValue: number;
    i2: number;
    tau2: number;
    interpretation: 'low' | 'moderate' | 'substantial' | 'considerable';
}

interface SubgroupAnalysis {
    groups: SubgroupResult[];
    betweenGroupHeterogeneity: number;
    withinGroupHeterogeneity: number;
    pValue: number;
}

interface SubgroupResult {
    name: string;
    count: number;
    effectSize: number;
    standardError: number;
    confidenceInterval: [number, number];
    weight: number;
    pValue: number;
}

interface PublicationBiasTest {
    eggerTest: {
        intercept: number;
        pValue: number;
        significant: boolean;
    };
    funnelAsymmetry: number;
    funnelData: Array<{ effectSize: number; standardError: number; weight: number }>;
    trimFillAnalysis: {
        missingStudies: number;
        adjustedEffect: number;
        adjustedCI: [number, number];
    };
}

type MetaView = 'overview' | 'forest' | 'heterogeneity' | 'subgroup' | 'bias' | 'sensitivity';
type EffectType = 'deviation' | 'zScore' | 'cohenD' | 'hedgeG' | 'glassD';
type AnalysisMethod = 'fixed' | 'random' | 'bayesian';
type GroupingCriteria = 'intention' | 'participant' | 'date' | 'duration' | 'trialCount';

export const MetaAnalysisPanel: React.FC<MetaAnalysisPanelProps> = ({
    sessions,
    config,
    onConfigChange
}) => {
    const [state, setState] = useState<MetaState>({
        activeView: 'overview',
        selectedEffect: 'deviation',
        analysisMethod: 'random',
        groupingCriteria: 'intention',
        confidenceLevel: 0.95,
        isLoading: false,
        metaResults: null,
        forestPlotData: null,
        heterogeneityTest: null,
        subgroupAnalysis: null,
        publicationBias: null
    });

    const effectSizeData = useMemo(() => {
        return generateEffectSizeData(sessions, state.selectedEffect);
    }, [sessions, state.selectedEffect]);

    useEffect(() => {
        performMetaAnalysis();
    }, [effectSizeData, state.analysisMethod, state.confidenceLevel, state.groupingCriteria]);

    const performMetaAnalysis = async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const metaAnalyzer = new MetaAnalyzer();

            // Perform meta-analysis
            const metaResults = await metaAnalyzer.performMetaAnalysis(
                effectSizeData,
                state.analysisMethod,
                state.confidenceLevel
            );

            // Generate forest plot data
            const forestPlotData = generateForestPlotData(effectSizeData, metaResults);

            // Test for heterogeneity
            const heterogeneityTest = calculateHeterogeneity(effectSizeData);

            // Perform subgroup analysis
            const subgroupAnalysis = performSubgroupAnalysis(
                effectSizeData,
                state.groupingCriteria
            );

            // Test for publication bias
            const publicationBias = testPublicationBias(effectSizeData);

            setState(prev => ({
                ...prev,
                metaResults,
                forestPlotData,
                heterogeneityTest,
                subgroupAnalysis,
                publicationBias,
                isLoading: false
            }));
        } catch (error) {
            console.error('Error performing meta-analysis:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleViewChange = (view: MetaView) => {
        setState(prev => ({ ...prev, activeView: view }));
    };

    const handleEffectChange = (effect: EffectType) => {
        setState(prev => ({ ...prev, selectedEffect: effect }));
    };

    const handleMethodChange = (method: AnalysisMethod) => {
        setState(prev => ({ ...prev, analysisMethod: method }));
    };

    const handleGroupingChange = (criteria: GroupingCriteria) => {
        setState(prev => ({ ...prev, groupingCriteria: criteria }));
    };

    const renderControls = () => (
        <div className="meta-controls">
            <div className="control-group">
                <label>Effect Size:</label>
                <select
                    value={state.selectedEffect}
                    onChange={(e) => handleEffectChange(e.target.value as EffectType)}
                >
                    <option value="deviation">Cumulative Deviation</option>
                    <option value="zScore">Z-Score</option>
                    <option value="cohenD">Cohen's d</option>
                    <option value="hedgeG">Hedge's g</option>
                    <option value="glassD">Glass's Δ</option>
                </select>
            </div>

            <div className="control-group">
                <label>Analysis Method:</label>
                <select
                    value={state.analysisMethod}
                    onChange={(e) => handleMethodChange(e.target.value as AnalysisMethod)}
                >
                    <option value="fixed">Fixed Effects</option>
                    <option value="random">Random Effects</option>
                    <option value="bayesian">Bayesian</option>
                </select>
            </div>

            <div className="control-group">
                <label>Grouping:</label>
                <select
                    value={state.groupingCriteria}
                    onChange={(e) => handleGroupingChange(e.target.value as GroupingCriteria)}
                >
                    <option value="intention">By Intention</option>
                    <option value="participant">By Participant</option>
                    <option value="date">By Date</option>
                    <option value="duration">By Duration</option>
                    <option value="trialCount">By Trial Count</option>
                </select>
            </div>

            <div className="control-group">
                <label>Confidence Level:</label>
                <select
                    value={state.confidenceLevel}
                    onChange={(e) => setState(prev => ({ ...prev, confidenceLevel: parseFloat(e.target.value) }))}
                >
                    <option value={0.90}>90%</option>
                    <option value={0.95}>95%</option>
                    <option value={0.99}>99%</option>
                </select>
            </div>
        </div>
    );

    const renderTabNavigation = () => (
        <div className="meta-tabs">
            {(['overview', 'forest', 'heterogeneity', 'subgroup', 'bias', 'sensitivity'] as MetaView[]).map(tab => (
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
        if (!state.metaResults) return <div>No analysis results available</div>;

        const { overallEffect, confidenceInterval, pValue, studyCount } = state.metaResults;

        return (
            <div className="meta-overview">
                <div className="overview-summary">
                    <div className="summary-card">
                        <h3>Overall Effect Size</h3>
                        <div className="metric-value">
                            {overallEffect.toFixed(4)}
                        </div>
                        <div className="metric-details">
                            <div>95% CI: [{confidenceInterval[0].toFixed(4)}, {confidenceInterval[1].toFixed(4)}]</div>
                            <div>p = {pValue.toFixed(4)}</div>
                            <div className={`significance ${pValue < 0.05 ? 'significant' : 'non-significant'}`}>
                                {pValue < 0.05 ? 'Significant' : 'Non-significant'}
                            </div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <h3>Studies Included</h3>
                        <div className="metric-value">{studyCount}</div>
                    </div>

                    <div className="summary-card">
                        <h3>Analysis Method</h3>
                        <div className="metric-value">{state.analysisMethod}</div>
                    </div>

                    {state.heterogeneityTest && (
                        <div className="summary-card">
                            <h3>Heterogeneity (I²)</h3>
                            <div className="metric-value">{state.heterogeneityTest.i2.toFixed(1)}%</div>
                            <div className="metric-details">
                                <div className={`heterogeneity ${state.heterogeneityTest.interpretation}`}>
                                    {state.heterogeneityTest.interpretation}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="overview-charts">
                    <div className="chart-container">
                        <h4>Effect Size Distribution</h4>
                        <Bar data={prepareDistributionChart(effectSizeData)} options={getChartOptions('Effect Size Distribution')} />
                    </div>
                </div>
            </div>
        );
    };

    const renderForestPlot = () => {
        if (!state.forestPlotData) return <div>No forest plot data available</div>;

        return (
            <div className="meta-forest">
                <div className="forest-header">
                    <h3>Forest Plot</h3>
                    <div className="forest-legend">
                        <div className="legend-item">
                            <div className="legend-square individual"></div>
                            <span>Individual Studies</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-diamond overall"></div>
                            <span>Overall Effect</span>
                        </div>
                    </div>
                </div>

                <div className="forest-plot">
                    <Scatter data={prepareForestPlotChart(state.forestPlotData)} options={getForestPlotOptions()} />
                </div>

                <div className="forest-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Study</th>
                                <th>N</th>
                                <th>Effect Size</th>
                                <th>95% CI</th>
                                <th>Weight</th>
                                <th>p-value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.forestPlotData.studies.map((study, index) => (
                                <tr key={index}>
                                    <td>{study.name}</td>
                                    <td>{study.sampleSize}</td>
                                    <td>{study.effectSize.toFixed(4)}</td>
                                    <td>[{study.confidenceInterval[0].toFixed(4)}, {study.confidenceInterval[1].toFixed(4)}]</td>
                                    <td>{(study.weight * 100).toFixed(1)}%</td>
                                    <td>{study.pValue.toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderHeterogeneity = () => {
        if (!state.heterogeneityTest) return <div>No heterogeneity analysis available</div>;

        const { qStatistic, pValue, i2, tau2, interpretation } = state.heterogeneityTest;

        return (
            <div className="meta-heterogeneity">
                <div className="heterogeneity-metrics">
                    <div className="metric-card">
                        <h3>Q Statistic</h3>
                        <div className="metric-value">{qStatistic.toFixed(3)}</div>
                        <div className="metric-details">p = {pValue.toFixed(4)}</div>
                    </div>

                    <div className="metric-card">
                        <h3>I² Statistic</h3>
                        <div className="metric-value">{i2.toFixed(1)}%</div>
                        <div className={`metric-details heterogeneity-level ${interpretation}`}>
                            {interpretation} heterogeneity
                        </div>
                    </div>

                    <div className="metric-card">
                        <h3>Tau² (τ²)</h3>
                        <div className="metric-value">{tau2.toFixed(4)}</div>
                        <div className="metric-details">Between-study variance</div>
                    </div>

                    <div className="metric-card">
                        <h3>Interpretation</h3>
                        <div className={`interpretation-badge ${interpretation}`}>
                            {getHeterogeneityInterpretation(i2)}
                        </div>
                    </div>
                </div>

                <div className="heterogeneity-explanation">
                    <h4>Understanding Heterogeneity</h4>
                    <div className="explanation-content">
                        <p>
                            <strong>I² = {i2.toFixed(1)}%</strong> indicates {interpretation} heterogeneity between studies.
                        </p>
                        <ul>
                            <li><strong>0-40%:</strong> Low heterogeneity - studies are fairly consistent</li>
                            <li><strong>30-60%:</strong> Moderate heterogeneity - some inconsistency</li>
                            <li><strong>50-90%:</strong> Substantial heterogeneity - considerable inconsistency</li>
                            <li><strong>75-100%:</strong> Considerable heterogeneity - high inconsistency</li>
                        </ul>
                        {i2 > 50 && (
                            <div className="recommendation">
                                <strong>Recommendation:</strong> Consider subgroup analysis or random effects model
                                due to substantial heterogeneity.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSubgroupAnalysis = () => {
        if (!state.subgroupAnalysis) return <div>No subgroup analysis available</div>;

        return (
            <div className="meta-subgroup">
                <div className="subgroup-summary">
                    <div className="metric-card">
                        <h3>Between-Group Heterogeneity</h3>
                        <div className="metric-value">{state.subgroupAnalysis.betweenGroupHeterogeneity.toFixed(3)}</div>
                    </div>

                    <div className="metric-card">
                        <h3>Within-Group Heterogeneity</h3>
                        <div className="metric-value">{state.subgroupAnalysis.withinGroupHeterogeneity.toFixed(3)}</div>
                    </div>

                    <div className="metric-card">
                        <h3>Subgroup Difference</h3>
                        <div className="metric-value">p = {state.subgroupAnalysis.pValue.toFixed(4)}</div>
                        <div className={`significance ${state.subgroupAnalysis.pValue < 0.05 ? 'significant' : 'non-significant'}`}>
                            {state.subgroupAnalysis.pValue < 0.05 ? 'Significant' : 'Non-significant'}
                        </div>
                    </div>
                </div>

                <div className="subgroup-results">
                    <h4>Subgroup Results</h4>
                    <div className="subgroup-cards">
                        {state.subgroupAnalysis.groups.map((group, index) => (
                            <div key={index} className="subgroup-card">
                                <div className="subgroup-header">
                                    <h5>{group.name}</h5>
                                    <span className="study-count">{group.count} studies</span>
                                </div>
                                <div className="subgroup-metrics">
                                    <div>Effect Size: {group.effectSize.toFixed(4)}</div>
                                    <div>95% CI: [{group.confidenceInterval[0].toFixed(4)}, {group.confidenceInterval[1].toFixed(4)}]</div>
                                    <div>Weight: {(group.weight * 100).toFixed(1)}%</div>
                                    <div>p-value: {group.pValue.toFixed(4)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="subgroup-chart">
                    <Bar data={prepareSubgroupChart(state.subgroupAnalysis)} options={getChartOptions('Subgroup Analysis')} />
                </div>
            </div>
        );
    };

    const renderPublicationBias = () => {
        if (!state.publicationBias) return <div>No publication bias analysis available</div>;

        const { eggerTest, funnelAsymmetry, trimFillAnalysis } = state.publicationBias;

        return (
            <div className="meta-bias">
                <div className="bias-tests">
                    <div className="metric-card">
                        <h3>Egger's Test</h3>
                        <div className="metric-value">
                            Intercept: {eggerTest.intercept.toFixed(4)}
                        </div>
                        <div className="metric-details">
                            <div>p = {eggerTest.pValue.toFixed(4)}</div>
                            <div className={`significance ${eggerTest.significant ? 'significant' : 'non-significant'}`}>
                                {eggerTest.significant ? 'Bias detected' : 'No bias detected'}
                            </div>
                        </div>
                    </div>

                    <div className="metric-card">
                        <h3>Funnel Asymmetry</h3>
                        <div className="metric-value">{Math.abs(funnelAsymmetry).toFixed(4)}</div>
                        <div className="metric-details">
                            <div className={`asymmetry ${Math.abs(funnelAsymmetry) > 0.1 ? 'high' : 'low'}`}>
                                {Math.abs(funnelAsymmetry) > 0.1 ? 'High asymmetry' : 'Low asymmetry'}
                            </div>
                        </div>
                    </div>

                    <div className="metric-card">
                        <h3>Trim & Fill</h3>
                        <div className="metric-value">
                            {trimFillAnalysis.missingStudies} missing studies
                        </div>
                        <div className="metric-details">
                            <div>Adjusted effect: {trimFillAnalysis.adjustedEffect.toFixed(4)}</div>
                            <div>Adjusted 95% CI: [{trimFillAnalysis.adjustedCI[0].toFixed(4)}, {trimFillAnalysis.adjustedCI[1].toFixed(4)}]</div>
                        </div>
                    </div>
                </div>

                <div className="funnel-plot">
                    <h4>Funnel Plot</h4>
                    <Scatter data={prepareFunnelPlotChart(state.publicationBias)} options={getFunnelPlotOptions()} />
                </div>

                <div className="bias-interpretation">
                    <h4>Publication Bias Assessment</h4>
                    <div className="interpretation-content">
                        {eggerTest.significant ? (
                            <div className="warning">
                                <strong>Warning:</strong> Egger's test suggests potential publication bias.
                                Consider the adjusted estimates from trim-and-fill analysis.
                            </div>
                        ) : (
                            <div className="info">
                                <strong>Good:</strong> No strong evidence of publication bias detected.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSensitivityAnalysis = () => {
        return (
            <div className="meta-sensitivity">
                <div className="sensitivity-options">
                    <h3>Sensitivity Analysis Options</h3>
                    <div className="option-cards">
                        <div className="option-card">
                            <h4>Leave-One-Out Analysis</h4>
                            <p>Examine how removing each study affects the overall result</p>
                            <button onClick={() => performLeaveOneOutAnalysis()}>
                                Run Analysis
                            </button>
                        </div>

                        <div className="option-card">
                            <h4>Quality-Based Analysis</h4>
                            <p>Analyze only high-quality studies</p>
                            <button onClick={() => performQualityBasedAnalysis()}>
                                Run Analysis
                            </button>
                        </div>

                        <div className="option-card">
                            <h4>Outlier Removal</h4>
                            <p>Remove statistical outliers and re-analyze</p>
                            <button onClick={() => performOutlierAnalysis()}>
                                Run Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (state.isLoading) {
            return <div className="loading">Performing meta-analysis...</div>;
        }

        switch (state.activeView) {
            case 'overview':
                return renderOverview();
            case 'forest':
                return renderForestPlot();
            case 'heterogeneity':
                return renderHeterogeneity();
            case 'subgroup':
                return renderSubgroupAnalysis();
            case 'bias':
                return renderPublicationBias();
            case 'sensitivity':
                return renderSensitivityAnalysis();
            default:
                return renderOverview();
        }
    };

    // Placeholder functions for sensitivity analysis
    const performLeaveOneOutAnalysis = () => {
        console.log('Leave-one-out analysis would be implemented here');
    };

    const performQualityBasedAnalysis = () => {
        console.log('Quality-based analysis would be implemented here');
    };

    const performOutlierAnalysis = () => {
        console.log('Outlier analysis would be implemented here');
    };

    return (
        <div className="meta-analysis-panel">
            <div className="meta-header">
                <h2>Meta-Analysis</h2>
                {renderControls()}
            </div>

            {renderTabNavigation()}

            <div className="meta-content">
                {renderContent()}
            </div>
        </div>
    );
};

// Helper functions
const generateEffectSizeData = (sessions: ExperimentSession[], effectType: EffectType): EffectSizeData[] => {
    return sessions.map((session, index) => {
        // Mock effect size calculation - in real implementation, this would calculate actual effect sizes
        const baseEffect = Math.sin(index * 0.1) * 0.5 + (Math.random() - 0.5) * 0.3;
        const standardError = 0.05 + Math.random() * 0.1;
        const weight = 1 / (standardError * standardError);

        return {
            studyId: session.id,
            studyName: `Session ${index + 1}`,
            effectSize: baseEffect,
            standardError,
            confidenceInterval: [baseEffect - 1.96 * standardError, baseEffect + 1.96 * standardError],
            sampleSize: session.actualTrials || 1000,
            weight,
            pValue: Math.random() * 0.1,
            metadata: {
                intention: session.intention,
                duration: session.duration || 0,
                date: session.startTime
            }
        };
    });
};

const generateForestPlotData = (effectSizes: EffectSizeData[], metaResults: MetaAnalysisResult): ForestPlotData => {
    return {
        studies: effectSizes.map(es => ({
            name: es.studyName,
            effectSize: es.effectSize,
            confidenceInterval: es.confidenceInterval,
            weight: es.weight / effectSizes.reduce((sum, e) => sum + e.weight, 0),
            sampleSize: es.sampleSize,
            pValue: es.pValue
        })),
        overallEffect: {
            effectSize: metaResults.overallEffect,
            confidenceInterval: metaResults.confidenceInterval,
            weight: 1.0
        }
    };
};

const calculateHeterogeneity = (effectSizes: EffectSizeData[]): HeterogeneityTest => {
    // Mock heterogeneity calculation
    const qStatistic = 5 + Math.random() * 15;
    const pValue = Math.random() * 0.5;
    const i2 = Math.random() * 100;
    const tau2 = Math.random() * 0.1;

    const interpretation = i2 < 25 ? 'low' :
                         i2 < 50 ? 'moderate' :
                         i2 < 75 ? 'substantial' : 'considerable';

    return {
        qStatistic,
        pValue,
        i2,
        tau2,
        interpretation
    };
};

const performSubgroupAnalysis = (effectSizes: EffectSizeData[], criteria: GroupingCriteria): SubgroupAnalysis => {
    // Mock subgroup analysis
    const groups: SubgroupResult[] = [
        {
            name: 'Group A',
            count: Math.floor(effectSizes.length / 2),
            effectSize: Math.random() * 0.5,
            standardError: 0.05 + Math.random() * 0.05,
            confidenceInterval: [0, 0],
            weight: 0.5,
            pValue: Math.random() * 0.1
        },
        {
            name: 'Group B',
            count: Math.ceil(effectSizes.length / 2),
            effectSize: Math.random() * 0.5,
            standardError: 0.05 + Math.random() * 0.05,
            confidenceInterval: [0, 0],
            weight: 0.5,
            pValue: Math.random() * 0.1
        }
    ];

    // Calculate confidence intervals
    groups.forEach(group => {
        group.confidenceInterval = [
            group.effectSize - 1.96 * group.standardError,
            group.effectSize + 1.96 * group.standardError
        ];
    });

    return {
        groups,
        betweenGroupHeterogeneity: Math.random() * 5,
        withinGroupHeterogeneity: Math.random() * 10,
        pValue: Math.random() * 0.2
    };
};

const testPublicationBias = (effectSizes: EffectSizeData[]): PublicationBiasTest => {
    // Mock publication bias test
    const eggerIntercept = (Math.random() - 0.5) * 2;
    const eggerPValue = Math.random() * 0.2;

    return {
        eggerTest: {
            intercept: eggerIntercept,
            pValue: eggerPValue,
            significant: eggerPValue < 0.05
        },
        funnelAsymmetry: Math.random() * 0.3,
        funnelData: effectSizes.map(es => ({
            effectSize: es.effectSize,
            standardError: es.standardError,
            weight: es.weight
        })),
        trimFillAnalysis: {
            missingStudies: Math.floor(Math.random() * 3),
            adjustedEffect: Math.random() * 0.3,
            adjustedCI: [Math.random() * 0.1, Math.random() * 0.1 + 0.2]
        }
    };
};

const getHeterogeneityInterpretation = (i2: number): string => {
    if (i2 < 25) return 'Studies are fairly consistent';
    if (i2 < 50) return 'Some inconsistency between studies';
    if (i2 < 75) return 'Considerable inconsistency';
    return 'High inconsistency - interpret with caution';
};

// Chart preparation functions
const prepareDistributionChart = (effectSizes: EffectSizeData[]): ChartData<'bar'> => {
    const bins = 10;
    const minEffect = Math.min(...effectSizes.map(es => es.effectSize));
    const maxEffect = Math.max(...effectSizes.map(es => es.effectSize));
    const binWidth = (maxEffect - minEffect) / bins;

    const histogram = Array(bins).fill(0);
    const labels = Array(bins).fill(0).map((_, i) =>
        (minEffect + i * binWidth).toFixed(3)
    );

    effectSizes.forEach(es => {
        const binIndex = Math.min(Math.floor((es.effectSize - minEffect) / binWidth), bins - 1);
        histogram[binIndex]++;
    });

    return {
        labels,
        datasets: [{
            label: 'Effect Size Distribution',
            data: histogram,
            backgroundColor: '#007bff80',
            borderColor: '#007bff',
            borderWidth: 1
        }]
    };
};

const prepareForestPlotChart = (forestData: ForestPlotData): ChartData<'scatter'> => {
    const datasets = [
        {
            label: 'Studies',
            data: forestData.studies.map((study, index) => ({
                x: study.effectSize,
                y: index
            })),
            backgroundColor: '#007bff',
            borderColor: '#007bff',
            pointRadius: 6
        },
        {
            label: 'Overall Effect',
            data: [{
                x: forestData.overallEffect.effectSize,
                y: forestData.studies.length
            }],
            backgroundColor: '#dc3545',
            borderColor: '#dc3545',
            pointRadius: 10,
            pointStyle: 'rectRot'
        }
    ];

    return { datasets };
};

const prepareSubgroupChart = (subgroupAnalysis: SubgroupAnalysis): ChartData<'bar'> => {
    return {
        labels: subgroupAnalysis.groups.map(g => g.name),
        datasets: [{
            label: 'Effect Size',
            data: subgroupAnalysis.groups.map(g => g.effectSize),
            backgroundColor: '#28a74580',
            borderColor: '#28a745',
            borderWidth: 1
        }]
    };
};

const prepareFunnelPlotChart = (publicationBias: PublicationBiasTest): ChartData<'scatter'> => {
    return {
        datasets: [{
            label: 'Studies',
            data: publicationBias.funnelData.map(d => ({
                x: d.effectSize,
                y: 1 / d.standardError
            })),
            backgroundColor: '#007bff',
            borderColor: '#007bff'
        }]
    };
};

const getChartOptions = (title: string): ChartOptions<any> => ({
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: title
        },
        legend: {
            display: true,
            position: 'top'
        }
    }
});

const getForestPlotOptions = (): ChartOptions<'scatter'> => ({
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: 'Forest Plot'
        }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Effect Size'
            }
        },
        y: {
            title: {
                display: true,
                text: 'Study'
            },
            type: 'linear'
        }
    }
});

const getFunnelPlotOptions = (): ChartOptions<'scatter'> => ({
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: 'Funnel Plot'
        }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Effect Size'
            }
        },
        y: {
            title: {
                display: true,
                text: '1 / Standard Error'
            }
        }
    }
});

export default MetaAnalysisPanel;