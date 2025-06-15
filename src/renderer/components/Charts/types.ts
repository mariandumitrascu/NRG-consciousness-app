/**
 * Chart type definitions for RNG consciousness experiment visualization
 * Supporting scientific-grade charts with publication-quality output
 */

import { CumulativePoint, ExperimentSession, StatisticalResult, SignificantEvent } from '../../../shared/types';
import { NetworkVarianceResult, ZScoreResult, EffectSizeResult } from '../../../shared/analysis-types';

// Chart configuration types
export interface ChartTheme {
    colors: {
        primary: string;
        secondary: string;
        positive: string;
        negative: string;
        neutral: string;
        significance: string[];
        intention: {
            high: string;
            low: string;
            baseline: string;
        };
        background: string;
        grid: string;
        text: string;
    };
    fonts: {
        title: FontConfig;
        axis: FontConfig;
        legend: FontConfig;
        annotation: FontConfig;
    };
    spacing: SpacingConfig;
    animations: AnimationConfig;
}

export interface FontConfig {
    family: string;
    size: number;
    weight: 'normal' | 'bold' | 'lighter';
    color: string;
}

export interface SpacingConfig {
    padding: number;
    margin: number;
    legendSpacing: number;
    axisPadding: number;
}

export interface AnimationConfig {
    duration: number;
    easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
    enabled: boolean;
}

// Chart component props
export interface CumulativeChartProps {
    data: CumulativePoint[];
    intention?: 'high' | 'low' | 'baseline';
    showSignificanceBands: boolean;
    showTrendLine: boolean;
    interactive: boolean;
    height: number;
    timeLabels: boolean;
    theme?: ChartTheme;
    onPointClick?: (point: CumulativePoint) => void;
    onRangeSelect?: (range: ChartRange) => void;
}

export interface NetworkVarianceProps {
    networkVariance: number[];
    timestamps: Date[];
    events: MarkedEvent[];
    showExpectedRange: boolean;
    logarithmicScale: boolean;
    theme?: ChartTheme;
}

export interface SessionComparisonProps {
    sessions: ExperimentSession[];
    metric: 'cumulative' | 'zScore' | 'effectSize';
    alignBy: 'time' | 'trialCount';
    showIndividual: boolean;
    showAverage: boolean;
    theme?: ChartTheme;
}

export interface StatisticalDistributionProps {
    trialValues: number[];
    expectedDistribution?: number[];
    showChiSquare: boolean;
    showNormalOverlay: boolean;
    theme?: ChartTheme;
}

export interface TimeSeriesProps {
    timeRange: TimeRange;
    resolution: 'second' | 'minute' | 'hour' | 'day';
    dataType: 'raw' | 'smoothed' | 'deviation';
    overlays: ChartOverlay[];
    annotations: TimeAnnotation[];
    theme?: ChartTheme;
}

export interface HeatmapProps {
    data: HeatmapData;
    colorScale: 'viridis' | 'plasma' | 'inferno' | 'coolwarm';
    showColorbar: boolean;
    interactive: boolean;
    theme?: ChartTheme;
}

export interface EffectSizeChartProps {
    sessions: ExperimentSession[];
    confidenceLevel: number;
    showMetaAnalysis: boolean;
    forestPlot: boolean;
    theme?: ChartTheme;
}

export interface SignificanceChartProps {
    pValues: number[];
    timestamps: Date[];
    correctionMethod: 'none' | 'bonferroni' | 'fdr';
    significanceThreshold: number;
    showRunningSignificance: boolean;
    theme?: ChartTheme;
}

export interface LiveChartProps {
    updateInterval: number;
    bufferSize: number;
    animationSpeed: number;
    pauseOnHover: boolean;
    theme?: ChartTheme;
}

// Chart data types
export interface ChartPoint {
    x: number | Date;
    y: number;
    metadata?: any;
}

export interface ChartRange {
    start: number | Date;
    end: number | Date;
}

export interface MarkedEvent {
    timestamp: Date;
    type: 'significance' | 'milestone' | 'anomaly' | 'intention_change';
    severity: 'low' | 'medium' | 'high';
    label: string;
    color?: string;
}

export interface ChartOverlay {
    type: 'line' | 'band' | 'marker' | 'annotation';
    data: any;
    style: OverlayStyle;
}

export interface OverlayStyle {
    color: string;
    opacity: number;
    lineWidth?: number;
    dashPattern?: number[];
}

export interface TimeAnnotation {
    timestamp: Date;
    text: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    color?: string;
}

export interface TimeRange {
    start: Date;
    end: Date;
    label: string;
    type: 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom';
}

export interface HeatmapData {
    values: number[][];
    xLabels: string[];
    yLabels: string[];
    title?: string;
}

// Export and interaction types
export interface ExportOptions {
    format: 'png' | 'svg' | 'pdf' | 'eps';
    resolution: number;
    includeData: boolean;
    includeStatistics: boolean;
    colorScheme: 'color' | 'grayscale' | 'print';
    width?: number;
    height?: number;
}

export interface DataSelection {
    points: ChartPoint[];
    range: ChartRange;
    statistics?: StatisticalResult;
}

export interface ChartInteraction {
    type: 'click' | 'hover' | 'drag' | 'zoom' | 'pan';
    point?: ChartPoint;
    range?: ChartRange;
    event: MouseEvent | TouchEvent;
}

// Chart optimization types
export interface ChartOptimization {
    maxPoints: number;
    decimationThreshold: number;
    useVirtualization: boolean;
    cacheResults: boolean;
    asyncRendering: boolean;
}

export interface DecimationOptions {
    method: 'subsample' | 'average' | 'minmax' | 'douglas_peucker';
    tolerance: number;
    preserveExtremes: boolean;
}

// Statistical visualization types
export interface SignificanceBand {
    level: number;          // p-value threshold (e.g., 0.05)
    color: string;
    label: string;
    zScore: number;         // corresponding z-score
}

export interface TrendLine {
    slope: number;
    intercept: number;
    correlation: number;
    pValue: number;
    confidence: number;
    points: ChartPoint[];
}

export interface ConfidenceInterval {
    lower: number[];
    upper: number[];
    level: number;
    method: 'bootstrap' | 'analytical' | 'bayesian';
}

// Chart state management
export interface ChartState {
    isLoading: boolean;
    error: string | null;
    lastUpdate: Date;
    dataVersion: number;
    selectedRange: ChartRange | null;
    zoomLevel: number;
    panOffset: { x: number; y: number };
}

// Chart performance metrics
export interface ChartPerformance {
    renderTime: number;
    dataPoints: number;
    memoryUsage: number;
    frameRate: number;
    lastOptimization: Date;
}

// Multi-chart coordination
export interface ChartGroup {
    id: string;
    charts: string[];
    linkedAxes: boolean;
    linkedSelection: boolean;
    syncedZoom: boolean;
}

export interface ChartRegistry {
    charts: Map<string, any>;
    groups: Map<string, ChartGroup>;
    activeGroup: string | null;
}

// Responsive design
export interface ResponsiveConfig {
    breakpoints: {
        mobile: number;
        tablet: number;
        desktop: number;
    };
    layouts: {
        mobile: ChartLayout;
        tablet: ChartLayout;
        desktop: ChartLayout;
    };
}

export interface ChartLayout {
    width: number | string;
    height: number | string;
    showLegend: boolean;
    showTooltips: boolean;
    fontSize: number;
    margin: SpacingConfig;
}

// Chart accessibility
export interface AccessibilityConfig {
    ariaLabel: string;
    ariaDescription: string;
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
    highContrast: boolean;
    colorBlindSafe: boolean;
}

// Chart validation
export interface ChartValidation {
    dataIntegrity: boolean;
    performanceThresholds: boolean;
    accessibilityCompliance: boolean;
    statisticalAccuracy: boolean;
    visualClarity: boolean;
}