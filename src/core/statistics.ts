/**
 * Statistical analysis functions for RNG consciousness experiments
 * Implements PEAR laboratory methodology and Global Consciousness Project approaches
 */

import { RNGTrial, StatisticalResult } from '../shared/types';
import { getHighPrecisionTimestamp } from './time-manager';

// Mathematical constants
const EXPECTED_MEAN_200_BITS = 100; // Expected mean for 200-bit trials
const EXPECTED_VARIANCE_200_BITS = 50; // Expected variance for 200-bit trials (n*p*(1-p) = 200*0.5*0.5)
const EXPECTED_STD_DEV_200_BITS = Math.sqrt(EXPECTED_VARIANCE_200_BITS); // ~7.071

/**
 * Calculate basic statistical measures for a set of RNG trials
 */
export function calculateBasicStats(trials: RNGTrial[]): {
    trialCount: number;
    mean: number;
    variance: number;
    standardDeviation: number;
    sum: number;
    min: number;
    max: number;
} {
    if (trials.length === 0) {
        return {
            trialCount: 0,
            mean: 0,
            variance: 0,
            standardDeviation: 0,
            sum: 0,
            min: 0,
            max: 0
        };
    }

    const values = trials.map(trial => trial.trialValue);
    const n = values.length;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    // Calculate sample variance (using n-1 denominator for sample variance)
    const variance = n > 1
        ? values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1)
        : 0;

    const standardDeviation = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
        trialCount: n,
        mean,
        variance,
        standardDeviation,
        sum,
        min,
        max
    };
}

/**
 * Calculate Z-score for sample mean compared to expected mean
 * Z = (sample_mean - expected_mean) / (expected_std_dev / sqrt(n))
 */
export function calculateZScore(trials: RNGTrial[]): number {
    if (trials.length === 0) return 0;

    const basicStats = calculateBasicStats(trials);
    const n = basicStats.trialCount;
    const sampleMean = basicStats.mean;

    // Standard error of the mean for expected distribution
    const standardError = EXPECTED_STD_DEV_200_BITS / Math.sqrt(n);

    // Z-score calculation
    const zScore = (sampleMean - EXPECTED_MEAN_200_BITS) / standardError;

    return zScore;
}

/**
 * Calculate two-tailed p-value from z-score
 */
export function calculatePValue(zScore: number): number {
    // Using standard normal distribution approximation
    // This is a simplified implementation - in production, you might want to use a more precise method

    const absZ = Math.abs(zScore);

    // Approximation for standard normal CDF
    // Based on Abramowitz and Stegun approximation
    const t = 1 / (1 + 0.2316419 * absZ);
    const d = 0.3989423 * Math.exp(-absZ * absZ / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    // Two-tailed p-value
    return 2 * prob;
}

/**
 * Calculate cumulative deviation from expected mean
 * Used for real-time visualization of RNG data trends
 */
export function calculateCumulativeDeviation(trials: RNGTrial[]): number[] {
    if (trials.length === 0) return [];

    const cumulativeDeviation: number[] = [];
    let runningSum = 0;

    for (let i = 0; i < trials.length; i++) {
        runningSum += trials[i].trialValue;
        const expectedSum = (i + 1) * EXPECTED_MEAN_200_BITS;
        const deviation = runningSum - expectedSum;
        cumulativeDeviation.push(deviation);
    }

    return cumulativeDeviation;
}

/**
 * Calculate Network Variance using Global Consciousness Project methodology
 * This implements the "Squared Stouffer Z" method used by GCP
 */
export function calculateNetworkVariance(trials: RNGTrial[]): {
    networkVariance: number;
    stoufferZ: number;
    expectedVariance: number;
} {
    if (trials.length === 0) {
        return {
            networkVariance: 0,
            stoufferZ: 0,
            expectedVariance: 0
        };
    }

    const n = trials.length;
    const values = trials.map(trial => trial.trialValue);

    // Calculate variance of the sample
    const basicStats = calculateBasicStats(trials);
    const observedVariance = basicStats.variance;

    // Expected variance for truly random 200-bit trials
    const expectedVariance = EXPECTED_VARIANCE_200_BITS;

    // Network variance calculation (simplified GCP approach)
    // In the full GCP implementation, this would involve multiple nodes
    const networkVariance = observedVariance / expectedVariance;

    // Stouffer Z calculation for variance
    // This is a simplified version - the full GCP method is more complex
    const varianceZ = (observedVariance - expectedVariance) / Math.sqrt(2 * expectedVariance * expectedVariance / n);
    const stoufferZ = varianceZ / Math.sqrt(1); // Single "node" in this case

    return {
        networkVariance,
        stoufferZ,
        expectedVariance
    };
}

/**
 * Run comprehensive statistical analysis
 */
export function calculateStatisticalResult(trials: RNGTrial[]): StatisticalResult {
    if (trials.length === 0) {
        const now = getHighPrecisionTimestamp();
        return {
            trialCount: 0,
            mean: 0,
            expectedMean: EXPECTED_MEAN_200_BITS,
            variance: 0,
            standardDeviation: 0,
            zScore: 0,
            pValue: 1.0,
            cumulativeDeviation: [],
            calculatedAt: now,
            dataRange: {
                startTime: now,
                endTime: now
            }
        };
    }

    const basicStats = calculateBasicStats(trials);
    const zScore = calculateZScore(trials);
    const pValue = calculatePValue(zScore);
    const cumulativeDeviation = calculateCumulativeDeviation(trials);
    const networkVariance = calculateNetworkVariance(trials);

    // Data range
    const timestamps = trials.map(trial => trial.timestamp);
    const startTime = new Date(Math.min(...timestamps.map(t => t.getTime())));
    const endTime = new Date(Math.max(...timestamps.map(t => t.getTime())));

    return {
        trialCount: basicStats.trialCount,
        mean: basicStats.mean,
        expectedMean: EXPECTED_MEAN_200_BITS,
        variance: basicStats.variance,
        standardDeviation: basicStats.standardDeviation,
        zScore,
        pValue,
        cumulativeDeviation,
        networkVariance: networkVariance.networkVariance,
        stoufferZ: networkVariance.stoufferZ,
        calculatedAt: getHighPrecisionTimestamp(),
        dataRange: {
            startTime,
            endTime
        }
    };
}

/**
 * Test if data matches expected random distribution using Chi-square test
 */
export function runChiSquareTest(trials: RNGTrial[]): {
    chiSquare: number;
    degreesOfFreedom: number;
    pValue: number;
    passed: boolean;
} {
    if (trials.length === 0) {
        return {
            chiSquare: 0,
            degreesOfFreedom: 0,
            pValue: 1,
            passed: true
        };
    }

    // Bin the data (e.g., 0-40, 41-80, 81-120, 121-160, 161-200)
    const binCount = 5;
    const binSize = 200 / binCount;
    const observedFreq = new Array(binCount).fill(0);

    trials.forEach(trial => {
        const binIndex = Math.min(Math.floor(trial.trialValue / binSize), binCount - 1);
        observedFreq[binIndex]++;
    });

    // Expected frequency for each bin (assuming uniform distribution)
    const expectedFreq = trials.length / binCount;

    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 0; i < binCount; i++) {
        const diff = observedFreq[i] - expectedFreq;
        chiSquare += (diff * diff) / expectedFreq;
    }

    const degreesOfFreedom = binCount - 1;

    // Simplified p-value calculation (would need proper chi-square distribution in production)
    const pValue = chiSquare > 9.488 ? 0.05 : 0.5; // Very simplified
    const passed = pValue > 0.05;

    return {
        chiSquare,
        degreesOfFreedom,
        pValue,
        passed
    };
}

/**
 * Runs test for randomness (consecutive runs of values above/below median)
 */
export function runRunsTest(trials: RNGTrial[]): {
    runsObserved: number;
    runsExpected: number;
    zScore: number;
    pValue: number;
    passed: boolean;
} {
    if (trials.length < 2) {
        return {
            runsObserved: 0,
            runsExpected: 0,
            zScore: 0,
            pValue: 1,
            passed: true
        };
    }

    const values = trials.map(trial => trial.trialValue);
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

    // Convert to binary sequence (above/below median)
    const binary = values.map(val => val > median);

    // Count runs
    let runsObserved = 1;
    for (let i = 1; i < binary.length; i++) {
        if (binary[i] !== binary[i - 1]) {
            runsObserved++;
        }
    }

    // Count values above and below median
    const n1 = binary.filter(b => b).length;
    const n2 = binary.filter(b => !b).length;
    const n = n1 + n2;

    // Expected runs and variance
    const runsExpected = (2 * n1 * n2) / n + 1;
    const runsVariance = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));

    // Z-score for runs test
    const zScore = (runsObserved - runsExpected) / Math.sqrt(runsVariance);
    const pValue = calculatePValue(zScore);
    const passed = pValue > 0.05;

    return {
        runsObserved,
        runsExpected,
        zScore,
        pValue,
        passed
    };
}

/**
 * Calculate autocorrelation at lag 1
 * Tests for independence between consecutive trials
 */
export function calculateAutocorrelation(trials: RNGTrial[], lag: number = 1): {
    autocorrelation: number;
    isSignificant: boolean;
} {
    if (trials.length <= lag) {
        return {
            autocorrelation: 0,
            isSignificant: false
        };
    }

    const values = trials.map(trial => trial.trialValue);
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;

    // Calculate numerator and denominator for autocorrelation
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
        numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
        denominator += Math.pow(values[i] - mean, 2);
    }

    const autocorrelation = denominator > 0 ? numerator / denominator : 0;

    // Test for significance (simplified)
    const threshold = 2 / Math.sqrt(n); // Approximate 95% confidence interval
    const isSignificant = Math.abs(autocorrelation) > threshold;

    return {
        autocorrelation,
        isSignificant
    };
}

/**
 * Calculate moving statistics for real-time monitoring
 */
export function calculateMovingStats(trials: RNGTrial[], windowSize: number): {
    means: number[];
    zScores: number[];
    timestamps: Date[];
} {
    const means: number[] = [];
    const zScores: number[] = [];
    const timestamps: Date[] = [];

    if (trials.length < windowSize) {
        return { means, zScores, timestamps };
    }

    for (let i = windowSize - 1; i < trials.length; i++) {
        const windowTrials = trials.slice(i - windowSize + 1, i + 1);
        const windowStats = calculateBasicStats(windowTrials);
        const windowZScore = calculateZScore(windowTrials);

        means.push(windowStats.mean);
        zScores.push(windowZScore);
        timestamps.push(trials[i].timestamp);
    }

    return { means, zScores, timestamps };
}

/**
 * Detect anomalies in trial data
 */
export function detectAnomalies(trials: RNGTrial[], threshold: number = 3): {
    anomalies: Array<{
        trial: RNGTrial;
        zScore: number;
        type: 'outlier' | 'timing' | 'sequence';
    }>;
    anomalyRate: number;
} {
    const anomalies: Array<{
        trial: RNGTrial;
        zScore: number;
        type: 'outlier' | 'timing' | 'sequence';
    }> = [];

    if (trials.length < 2) {
        return { anomalies, anomalyRate: 0 };
    }

    const basicStats = calculateBasicStats(trials);
    const mean = basicStats.mean;
    const stdDev = basicStats.standardDeviation;

    for (let i = 0; i < trials.length; i++) {
        const trial = trials[i];

        // Check for statistical outliers
        if (stdDev > 0) {
            const zScore = (trial.trialValue - mean) / stdDev;
            if (Math.abs(zScore) > threshold) {
                anomalies.push({
                    trial,
                    zScore,
                    type: 'outlier'
                });
            }
        }

        // Check for timing anomalies (if not first trial)
        if (i > 0) {
            const timeDiff = trial.timestamp.getTime() - trials[i - 1].timestamp.getTime();
            const expectedInterval = 1000; // 1 second
            const timingError = Math.abs(timeDiff - expectedInterval);

            if (timingError > 100) { // More than 100ms off
                anomalies.push({
                    trial,
                    zScore: timingError / 100, // Normalized timing error
                    type: 'timing'
                });
            }
        }
    }

    const anomalyRate = anomalies.length / trials.length;

    return { anomalies, anomalyRate };
}

/**
 * Generate comprehensive baseline analysis report
 */
export function runBaselineTest(trials: RNGTrial[]): {
    passed: boolean;
    issues: string[];
    chiSquareTest: ReturnType<typeof runChiSquareTest>;
    runsTest: ReturnType<typeof runRunsTest>;
    autocorrelationTest: ReturnType<typeof calculateAutocorrelation>;
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
} {
    const issues: string[] = [];

    const chiSquareTest = runChiSquareTest(trials);
    const runsTest = runRunsTest(trials);
    const autocorrelationTest = calculateAutocorrelation(trials);

    if (!chiSquareTest.passed) {
        issues.push('Chi-square test failed - distribution may not be uniform');
    }

    if (!runsTest.passed) {
        issues.push('Runs test failed - data may show sequential patterns');
    }

    if (autocorrelationTest.isSignificant) {
        issues.push('Significant autocorrelation detected - trials may not be independent');
    }

    const basicStats = calculateBasicStats(trials);
    const meanDeviation = Math.abs(basicStats.mean - EXPECTED_MEAN_200_BITS);

    if (meanDeviation > 2) {
        issues.push(`Mean significantly deviates from expected (${basicStats.mean.toFixed(2)} vs ${EXPECTED_MEAN_200_BITS})`);
    }

    // Overall quality assessment
    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    const passedTests = [chiSquareTest.passed, runsTest.passed, !autocorrelationTest.isSignificant].filter(Boolean).length;

    if (passedTests === 3 && meanDeviation < 1) {
        overallQuality = 'excellent';
    } else if (passedTests >= 2 && meanDeviation < 2) {
        overallQuality = 'good';
    } else if (passedTests >= 1) {
        overallQuality = 'fair';
    } else {
        overallQuality = 'poor';
    }

    const passed = issues.length === 0;

    return {
        passed,
        issues,
        chiSquareTest,
        runsTest,
        autocorrelationTest,
        overallQuality
    };
}