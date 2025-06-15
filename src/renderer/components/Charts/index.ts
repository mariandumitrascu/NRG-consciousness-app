/**
 * Chart components export index
 * Phase 7: Data Visualization & Charts - Comprehensive scientific visualization system
 */

// Core chart components
export { default as CumulativeDeviationChart } from './CumulativeDeviationChart';
export { default as SessionComparisonChart } from './SessionComparisonChart';
export { default as StatisticalDistributionChart } from './StatisticalDistributionChart';
export { default as LiveChart } from './LiveChart';

// Chart types and interfaces
export type {
    CumulativeChartProps,
    SessionComparisonProps,
    StatisticalDistributionProps,
    LiveChartProps,
    ChartPoint,
    ChartTheme,
    SignificanceBand,
    TrendLine,
    ChartExportOptions,
    ChartOptimization,
    DecimationOptions,
    TimeRange,
    ChartOverlay,
    TimeAnnotation
} from './types';

// Theme system
export {
    scientificTheme,
    darkTheme,
    highContrastTheme,
    printTheme,
    colorBlindSafeTheme,
    presentationTheme,
    chartThemes,
    getTheme,
    getSignificanceColor,
    getIntentionColor,
    adaptThemeForChartJs,
    type ThemeName
} from '../../styles/charts/themes';

// Optimization utilities
export {
    chartOptimizer,
    getOptimalDecimationStrategy,
    calculateAggregationInterval,
    estimateMemoryUsage,
    checkPerformanceBudget
} from '../../utils/chart-optimization';

// Chart constants and defaults
export const CHART_CONSTANTS = {
    // Standard RNG parameters
    BITS_PER_TRIAL: 200,
    EXPECTED_MEAN: 100,
    EXPECTED_VARIANCE: 50,
    EXPECTED_STD_DEV: Math.sqrt(50),

    // Significance thresholds
    SIGNIFICANCE_LEVELS: {
        MARGINAL: 0.1,
        SIGNIFICANT: 0.05,
        HIGHLY_SIGNIFICANT: 0.01,
        EXTREMELY_SIGNIFICANT: 0.001
    },

    // Z-score thresholds
    Z_SCORE_THRESHOLDS: {
        MARGINAL: 1.645,      // p < 0.1
        SIGNIFICANT: 1.96,    // p < 0.05
        HIGHLY_SIGNIFICANT: 2.576,  // p < 0.01
        EXTREMELY_SIGNIFICANT: 3.291  // p < 0.001
    },

    // Performance budgets
    PERFORMANCE: {
        MAX_POINTS_INTERACTIVE: 10000,
        MAX_POINTS_DISPLAY: 50000,
        TARGET_FPS: 60,
        WARNING_FPS_THRESHOLD: 30,
        MAX_MEMORY_MB: 50
    },

    // Chart dimensions
    DEFAULT_DIMENSIONS: {
        WIDTH: 800,
        HEIGHT: 400,
        ASPECT_RATIO: 2
    },

    // Animation settings
    ANIMATION: {
        DURATION_FAST: 150,
        DURATION_NORMAL: 300,
        DURATION_SLOW: 600,
        EASING: 'easeInOut'
    }
} as const;

// Utility functions for common chart operations
export const ChartUtils = {
    /**
     * Calculate significance band bounds for given trial count
     */
    calculateSignificanceBounds(trialCount: number) {
        const standardError = Math.sqrt(CHART_CONSTANTS.EXPECTED_VARIANCE * trialCount);

        return {
            marginal: CHART_CONSTANTS.Z_SCORE_THRESHOLDS.MARGINAL * standardError,
            significant: CHART_CONSTANTS.Z_SCORE_THRESHOLDS.SIGNIFICANT * standardError,
            highlySignificant: CHART_CONSTANTS.Z_SCORE_THRESHOLDS.HIGHLY_SIGNIFICANT * standardError,
            extremelySignificant: CHART_CONSTANTS.Z_SCORE_THRESHOLDS.EXTREMELY_SIGNIFICANT * standardError
        };
    },

    /**
     * Determine significance level from p-value
     */
    getSignificanceLevel(pValue: number): 'none' | 'marginal' | 'significant' | 'highly_significant' | 'extremely_significant' {
        if (pValue < CHART_CONSTANTS.SIGNIFICANCE_LEVELS.EXTREMELY_SIGNIFICANT) return 'extremely_significant';
        if (pValue < CHART_CONSTANTS.SIGNIFICANCE_LEVELS.HIGHLY_SIGNIFICANT) return 'highly_significant';
        if (pValue < CHART_CONSTANTS.SIGNIFICANCE_LEVELS.SIGNIFICANT) return 'significant';
        if (pValue < CHART_CONSTANTS.SIGNIFICANCE_LEVELS.MARGINAL) return 'marginal';
        return 'none';
    },

    /**
     * Format time duration for display
     */
    formatDuration(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    },

    /**
     * Format large numbers with appropriate units
     */
    formatLargeNumber(value: number): string {
        if (value >= 1e6) {
            return `${(value / 1e6).toFixed(1)}M`;
        } else if (value >= 1e3) {
            return `${(value / 1e3).toFixed(1)}K`;
        } else {
            return value.toString();
        }
    },

    /**
     * Calculate optimal bin size for histogram
     */
    calculateOptimalBinSize(dataLength: number, valueRange: number = 200): number {
        // Sturges' rule with modifications for RNG data
        const sturgesRule = Math.ceil(Math.log2(dataLength) + 1);
        const maxBins = Math.min(sturgesRule, valueRange / 5); // At least 5 values per bin
        return Math.max(1, Math.floor(valueRange / maxBins));
    },

    /**
     * Generate color palette for multiple series
     */
    generateColorPalette(count: number): string[] {
        const baseColors = [
            '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
            '#db2777', '#0891b2', '#65a30d', '#dc2626', '#0f766e'
        ];

        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }

        const colors: string[] = [...baseColors];
        for (let i = baseColors.length; i < count; i++) {
            const hue = (i * 137.5) % 360; // Golden angle
            colors.push(`hsl(${hue}, 60%, 50%)`);
        }

        return colors;
    }
};

// Hook for chart theme management
export function useChartTheme(themeName: ThemeName = 'scientific') {
    return {
        theme: getTheme(themeName),
        chartJsOptions: adaptThemeForChartJs(getTheme(themeName))
    };
}

// Version information
export const CHART_SYSTEM_VERSION = '1.0.0';
export const CHART_SYSTEM_BUILD_DATE = new Date().toISOString();