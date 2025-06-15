/**
 * Real-Time Analysis Engine
 * Provides live session monitoring with incremental statistics updates
 */

import { RNGTrial } from '../shared/types';
import {
    RunningStats,
    SignificanceResult,
    TrendResult,
    QualityAssessment,
    CumulativePoint,
    ChangePoint,
    PatternDetection,
    DataIntegrityCheck,
    TemporalGap,
    OutlierDetection,
    PowerAnalysis,
    AnalysisParameters
} from '../shared/analysis-types';
import { StatisticalUtils } from './statistical-utils';

export class RealtimeAnalysis {

    /**
     * Update running statistics with new trial data
     * Optimized for real-time performance with O(1) updates
     */
    static updateRunningStats(newTrial: RNGTrial, currentStats: RunningStats): RunningStats {
        const expectedMean = 100;
        const newCount = currentStats.count + 1;
        const newSum = currentStats.sum + newTrial.trialValue;
        const newSumOfSquares = currentStats.sumOfSquares + (newTrial.trialValue * newTrial.trialValue);

        // Update running mean using online algorithm
        const newMean = newSum / newCount;

        // Update running variance using Welford's online algorithm
        const delta = newTrial.result - currentStats.mean;
        const delta2 = newTrial.result - newMean;
        const newVariance = newCount > 1 ?
            ((currentStats.count - 1) * currentStats.variance + delta * delta2) / (newCount - 1) : 0;

        const newStandardDeviation = Math.sqrt(newVariance);

        // Update cumulative deviation
        const deviation = newTrial.result - expectedMean;
        const newCumulativeDeviation = currentStats.cumulativeDeviation + deviation;

        // Update min/max values
        const newMinValue = Math.min(currentStats.minValue, newTrial.result);
        const newMaxValue = Math.max(currentStats.maxValue, newTrial.result);

        return {
            count: newCount,
            sum: newSum,
            sumOfSquares: newSumOfSquares,
            mean: newMean,
            variance: newVariance,
            standardDeviation: newStandardDeviation,
            cumulativeDeviation: newCumulativeDeviation,
            lastUpdated: newTrial.timestamp,
            minValue: newMinValue,
            maxValue: newMaxValue
        };
    }

    /**
     * Get cumulative deviation series optimized for real-time plotting
     * Returns only recent points to maintain performance
     */
    static getCumulativeDeviationSeries(
        trials: RNGTrial[],
        maxPoints: number = 1000
    ): CumulativePoint[] {
        if (trials.length === 0) return [];

        const expectedMean = 100;
        const points: CumulativePoint[] = [];

        // If we have more trials than maxPoints, sample evenly
        const step = trials.length > maxPoints ? Math.floor(trials.length / maxPoints) : 1;
        const startIndex = trials.length > maxPoints ? trials.length - maxPoints * step : 0;

        let cumulativeDeviation = 0;
        let runningSum = 0;
        let sumOfSquares = 0;

        // Calculate initial cumulative values if we're starting from middle
        if (startIndex > 0) {
            for (let i = 0; i < startIndex; i++) {
                const deviation = trials[i].result - expectedMean;
                cumulativeDeviation += deviation;
                runningSum += trials[i].result;
                sumOfSquares += trials[i].result * trials[i].result;
            }
        }

        // Generate points for visualization
        for (let i = startIndex; i < trials.length; i += step) {
            const trial = trials[i];
            const deviation = trial.result - expectedMean;

            cumulativeDeviation += deviation;
            runningSum += trial.result;
            sumOfSquares += trial.result * trial.result;

            const n = i + 1;
            const runningMean = runningSum / n;
            const runningVariance = n > 1 ? (sumOfSquares - n * runningMean * runningMean) / (n - 1) : 0;

            // Calculate Z-score for cumulative deviation
            const expectedCumStd = Math.sqrt(50 * n);
            const zScore = cumulativeDeviation / expectedCumStd;

            points.push({
                trialIndex: i,
                timestamp: trial.timestamp,
                cumulativeDeviation,
                runningMean,
                zScore,
                runningVariance
            });
        }

        return points;
    }

    /**
     * Real-time significance assessment
     * Provides immediate feedback on current statistical state
     */
    static getCurrentSignificance(
        trials: RNGTrial[],
        parameters: AnalysisParameters = {}
    ): SignificanceResult {
        if (trials.length === 0) {
            throw new Error('No trials provided for significance calculation');
        }

        const expectedMean = 100;
        const expectedStd = Math.sqrt(50);
        const observedMean = StatisticalUtils.mean(trials.map(t => t.result));
        const standardError = expectedStd / Math.sqrt(trials.length);

        // Calculate Z-score
        const zScore = (observedMean - expectedMean) / standardError;
        const pValue = StatisticalUtils.normalProbability(zScore);

        // Calculate effect size
        const effectSize = (observedMean - expectedMean) / expectedStd;

        // Determine interpretation
        let interpretation: 'random' | 'marginally_significant' | 'significant' | 'highly_significant';
        if (pValue < 0.001) {
            interpretation = 'highly_significant';
        } else if (pValue < 0.05) {
            interpretation = 'significant';
        } else if (pValue < 0.1) {
            interpretation = 'marginally_significant';
        } else {
            interpretation = 'random';
        }

        // Power analysis
        const powerAnalysis = this.calculatePowerAnalysis(effectSize, trials.length);

        return {
            pValue,
            zScore,
            effectSize,
            confidenceLevel: parameters.confidenceLevel || 0.95,
            interpretation,
            sampleSize: trials.length,
            powerAnalysis
        };
    }

    /**
     * Trend detection using moving window analysis
     * Detects if effect is increasing, decreasing, or stable
     */
    static detectTrend(
        trials: RNGTrial[],
        windowSize: number = 100
    ): TrendResult {
        if (trials.length < windowSize * 2) {
            return {
                slope: 0,
                slopeSignificance: 1,
                correlation: 0,
                trendDirection: 'stable',
                changePoints: []
            };
        }

        const expectedMean = 100;

        // Calculate moving averages
        const windowMeans: number[] = [];
        const timePoints: number[] = [];

        for (let i = windowSize; i <= trials.length; i += Math.floor(windowSize / 4)) {
            const windowTrials = trials.slice(i - windowSize, i);
            const windowMean = StatisticalUtils.mean(windowTrials.map(t => t.result));
            const avgTime = StatisticalUtils.mean(windowTrials.map(t => t.timestamp.getTime()));

            windowMeans.push(windowMean - expectedMean); // Deviation from expected
            timePoints.push(avgTime);
        }

        if (windowMeans.length < 3) {
            return {
                slope: 0,
                slopeSignificance: 1,
                correlation: 0,
                trendDirection: 'stable',
                changePoints: []
            };
        }

        // Calculate linear regression
        const regression = this.calculateLinearRegression(timePoints, windowMeans);
        const slope = regression.slope;
        const correlation = regression.correlation;
        const slopeStdError = regression.slopeStdError;

        // Test slope significance
        const tStatistic = slope / slopeStdError;
        const df = windowMeans.length - 2;
        const slopeSignificance = StatisticalUtils.tDistributionProbability(tStatistic, df);

        // Determine trend direction
        let trendDirection: 'increasing' | 'decreasing' | 'stable';
        if (slopeSignificance < 0.05) {
            trendDirection = slope > 0 ? 'increasing' : 'decreasing';
        } else {
            trendDirection = 'stable';
        }

        // Detect change points using CUSUM algorithm
        const changePoints = this.detectChangePoints(windowMeans, timePoints);

        return {
            slope,
            slopeSignificance,
            correlation,
            trendDirection,
            changePoints
        };
    }

    /**
     * Live session quality assessment
     * Monitors data quality in real-time
     */
    static assessDataQuality(trials: RNGTrial[]): QualityAssessment {
        if (trials.length === 0) {
            return {
                randomnessScore: 1,
                biasDetected: false,
                patterns: [],
                dataIntegrity: {
                    missingData: 0,
                    duplicates: 0,
                    temporalGaps: [],
                    outliers: { count: 0, indices: [], method: 'zscore', threshold: 3 }
                },
                recommendations: ['Collect more data for quality assessment']
            };
        }

        const results = trials.map(t => t.result);
        const timestamps = trials.map(t => t.timestamp);

        // Randomness assessment
        const randomnessScore = this.calculateRandomnessScore(results);

        // Bias detection
        const expectedMean = 100;
        const observedMean = StatisticalUtils.mean(results);
        const standardError = Math.sqrt(50) / Math.sqrt(trials.length);
        const biasZ = Math.abs(observedMean - expectedMean) / standardError;
        const biasDetected = biasZ > 2.0; // 95% confidence threshold

        // Pattern detection
        const patterns = this.detectPatterns(results);

        // Data integrity checks
        const dataIntegrity = this.checkDataIntegrity(trials);

        // Generate recommendations
        const recommendations = this.generateQualityRecommendations(
            randomnessScore, biasDetected, patterns, dataIntegrity
        );

        return {
            randomnessScore,
            biasDetected,
            patterns,
            dataIntegrity,
            recommendations
        };
    }

    // Helper methods

    private static calculatePowerAnalysis(effectSize: number, n: number): PowerAnalysis {
        const alpha = 0.05;
        const observedPower = StatisticalUtils.powerAnalysis(effectSize, n, alpha);
        const requiredSampleSize = StatisticalUtils.requiredSampleSize(effectSize, 0.8, alpha);
        const minimumDetectableEffect = StatisticalUtils.minimumDetectableEffect(n, 0.8, alpha);

        return {
            observedPower,
            requiredSampleSize,
            minimumDetectableEffect
        };
    }

    private static calculateLinearRegression(x: number[], y: number[]): {
        slope: number;
        intercept: number;
        correlation: number;
        slopeStdError: number;
    } {
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);

        const meanX = sumX / n;
        const meanY = sumY / n;

        const slope = (sumXY - n * meanX * meanY) / (sumXX - n * meanX * meanX);
        const intercept = meanY - slope * meanX;

        // Calculate correlation coefficient
        const correlation = (n * sumXY - sumX * sumY) /
            Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        // Calculate standard error of slope
        const residualSumSquares = y.reduce((sum, val, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + (val - predicted) * (val - predicted);
        }, 0);

        const slopeVariance = residualSumSquares / ((n - 2) * (sumXX - n * meanX * meanX));
        const slopeStdError = Math.sqrt(slopeVariance);

        return { slope, intercept, correlation, slopeStdError };
    }

    private static detectChangePoints(values: number[], timePoints: number[]): ChangePoint[] {
        const changePoints: ChangePoint[] = [];

        if (values.length < 10) return changePoints;

        // Simple CUSUM change point detection
        const mean = StatisticalUtils.mean(values);
        const std = StatisticalUtils.standardDeviation(values);
        const threshold = 2 * std;

        let cumSum = 0;
        let maxCumSum = 0;
        let minCumSum = 0;
        let changePointIndex = -1;

        for (let i = 0; i < values.length; i++) {
            cumSum += values[i] - mean;

            if (cumSum > maxCumSum) {
                maxCumSum = cumSum;
            }
            if (cumSum < minCumSum) {
                minCumSum = cumSum;
                changePointIndex = i;
            }

            // Detect significant change
            if (Math.abs(cumSum) > threshold && changePointIndex !== -1) {
                const magnitude = Math.abs(cumSum) / std;
                const confidence = Math.min(0.99, magnitude / 5); // Rough confidence estimate

                changePoints.push({
                    index: changePointIndex,
                    timestamp: new Date(timePoints[changePointIndex]),
                    confidence,
                    magnitudeChange: magnitude
                });

                // Reset for next change point
                cumSum = 0;
                maxCumSum = 0;
                minCumSum = 0;
                changePointIndex = -1;
            }
        }

        return changePoints;
    }

    private static calculateRandomnessScore(values: number[]): number {
        if (values.length < 10) return 1;

        // Combine multiple randomness tests
        const runsTest = StatisticalUtils.runsTest(values);
        const normalityTest = StatisticalUtils.jarqueBeraTest(values);

        // Additional tests
        const autocorrelation = this.calculateAutocorrelation(values, 1);
        const frequencyBias = this.testFrequencyBias(values);

        // Combine scores (weighted average)
        const runsScore = runsTest.isRandom ? 1 : Math.max(0, 1 - runsTest.pValue);
        const normalityScore = normalityTest.isNormal ? 1 : Math.max(0, 1 - normalityTest.pValue);
        const autocorrScore = Math.max(0, 1 - Math.abs(autocorrelation) * 2);
        const frequencyScore = frequencyBias > 0.05 ? 1 : Math.max(0, frequencyBias / 0.05);

        return (runsScore + normalityScore + autocorrScore + frequencyScore) / 4;
    }

    private static calculateAutocorrelation(values: number[], lag: number): number {
        if (values.length <= lag) return 0;

        const mean = StatisticalUtils.mean(values);
        const variance = StatisticalUtils.variance(values);

        if (variance === 0) return 0;

        let autocovariance = 0;
        const n = values.length - lag;

        for (let i = 0; i < n; i++) {
            autocovariance += (values[i] - mean) * (values[i + lag] - mean);
        }

        return (autocovariance / n) / variance;
    }

    private static testFrequencyBias(values: number[]): number {
        // Test for bias in bit frequency (should be close to 50% for fair RNG)
        const expectedMean = 100; // For 200-bit trials
        const observedMean = StatisticalUtils.mean(values);
        const expectedStd = Math.sqrt(50);

        const z = Math.abs(observedMean - expectedMean) / expectedStd;
        return StatisticalUtils.normalProbability(z);
    }

    private static detectPatterns(values: number[]): PatternDetection[] {
        const patterns: PatternDetection[] = [];

        if (values.length < 20) return patterns;

        // Test for runs
        const runsTest = StatisticalUtils.runsTest(values);
        if (!runsTest.isRandom) {
            patterns.push({
                type: 'runs',
                severity: runsTest.pValue < 0.01 ? 'high' : runsTest.pValue < 0.05 ? 'medium' : 'low',
                description: 'Non-random sequence patterns detected',
                pValue: runsTest.pValue
            });
        }

        // Test for autocorrelation
        const autocorr = Math.abs(this.calculateAutocorrelation(values, 1));
        if (autocorr > 0.1) {
            patterns.push({
                type: 'autocorrelation',
                severity: autocorr > 0.3 ? 'high' : autocorr > 0.2 ? 'medium' : 'low',
                description: `Serial correlation detected (r = ${autocorr.toFixed(3)})`,
                pValue: Math.max(0.001, 1 - autocorr * 2) // Rough p-value estimate
            });
        }

        // Test for frequency bias
        const freqBias = this.testFrequencyBias(values);
        if (freqBias < 0.05) {
            patterns.push({
                type: 'frequency_bias',
                severity: freqBias < 0.001 ? 'high' : freqBias < 0.01 ? 'medium' : 'low',
                description: 'Significant bias in average bit frequency',
                pValue: freqBias
            });
        }

        return patterns;
    }

    private static checkDataIntegrity(trials: RNGTrial[]): DataIntegrityCheck {
        // Detect temporal gaps
        const temporalGaps = this.detectTemporalGaps(trials);

        // Detect duplicates
        const duplicates = this.countDuplicates(trials);

        // Detect outliers
        const outliers = this.detectOutliers(trials.map(t => t.result));

        return {
            missingData: 0, // Would need expected trial count to calculate
            duplicates,
            temporalGaps,
            outliers
        };
    }

    private static detectTemporalGaps(trials: RNGTrial[]): TemporalGap[] {
        const gaps: TemporalGap[] = [];
        const expectedIntervalMs = 5; // 200 Hz = 5ms between trials
        const gapThreshold = expectedIntervalMs * 10; // 10x normal interval

        for (let i = 1; i < trials.length; i++) {
            const interval = trials[i].timestamp.getTime() - trials[i - 1].timestamp.getTime();

            if (interval > gapThreshold) {
                const expectedTrials = Math.floor(interval / expectedIntervalMs);

                gaps.push({
                    startTime: trials[i - 1].timestamp,
                    endTime: trials[i].timestamp,
                    duration: interval,
                    expectedTrials,
                    actualTrials: 1
                });
            }
        }

        return gaps;
    }

    private static countDuplicates(trials: RNGTrial[]): number {
        const seen = new Set<string>();
        let duplicates = 0;

        for (const trial of trials) {
            const key = `${trial.result}-${trial.timestamp.getTime()}`;
            if (seen.has(key)) {
                duplicates++;
            } else {
                seen.add(key);
            }
        }

        return duplicates;
    }

    private static detectOutliers(values: number[]): OutlierDetection {
        if (values.length < 10) {
            return { count: 0, indices: [], method: 'zscore', threshold: 3 };
        }

        const mean = StatisticalUtils.mean(values);
        const std = StatisticalUtils.standardDeviation(values);
        const threshold = 3; // 3-sigma rule

        const outlierIndices: number[] = [];

        for (let i = 0; i < values.length; i++) {
            const zScore = Math.abs(values[i] - mean) / std;
            if (zScore > threshold) {
                outlierIndices.push(i);
            }
        }

        return {
            count: outlierIndices.length,
            indices: outlierIndices,
            method: 'zscore',
            threshold
        };
    }

    private static generateQualityRecommendations(
        randomnessScore: number,
        biasDetected: boolean,
        patterns: PatternDetection[],
        dataIntegrity: DataIntegrityCheck
    ): string[] {
        const recommendations: string[] = [];

        if (randomnessScore < 0.8) {
            recommendations.push('Random number generator quality is below optimal. Consider RNG calibration.');
        }

        if (biasDetected) {
            recommendations.push('Significant bias detected in RNG output. Hardware inspection recommended.');
        }

        if (patterns.some(p => p.severity === 'high')) {
            recommendations.push('Strong patterns detected in data. RNG may need replacement or recalibration.');
        }

        if (dataIntegrity.temporalGaps.length > 0) {
            recommendations.push('Data collection gaps detected. Check system timing and hardware connections.');
        }

        if (dataIntegrity.outliers.count > dataIntegrity.outliers.indices.length * 0.05) {
            recommendations.push('Excessive outliers detected. Verify RNG hardware stability.');
        }

        if (recommendations.length === 0) {
            recommendations.push('Data quality is excellent. No issues detected.');
        }

        return recommendations;
    }
}