/**
 * Advanced Statistical Analysis Engine
 * Implements PEAR laboratory and Global Consciousness Project methodology
 */

import { RNGTrial } from '../shared/types';
import {
    NetworkVarianceResult,
    DeviceVarianceResult,
    CumulativeResult,
    CumulativePoint,
    ZScoreResult,
    EffectSizeResult,
    ExcursionPeriod,
    StatisticalSignificance,
    EffectSizeInterpretation,
    AnalysisParameters
} from '../shared/analysis-types';
import { StatisticalUtils } from './statistical-utils';

export class AdvancedStatistics {

    /**
     * GCP Network Variance (Squared Stouffer Z) - Primary analysis method
     * This is the core method used by the Global Consciousness Project
     */
    static calculateNetworkVariance(
        trials: RNGTrial[],
        parameters: AnalysisParameters = {}
    ): NetworkVarianceResult {
        if (trials.length === 0) {
            throw new Error('No trials provided for network variance analysis');
        }

        const expectedMean = parameters.expectedMean || 100;
        const expectedStd = parameters.expectedStd || Math.sqrt(50);

        // Calculate deviations from expected mean
        const deviations = trials.map(trial => {
            const deviation = trial.trialValue - expectedMean;
            return {
                timestamp: trial.timestamp,
                deviation,
                normalizedDeviation: deviation / expectedStd
            };
        });

        // Calculate network variance metrics
        const variance = StatisticalUtils.variance(deviations.map(d => d.deviation));
        const normalizedVariance = variance / (expectedStd * expectedStd);

        // Calculate temporal correlation
        const temporalCorrelation = this.calculateTemporalCorrelation(deviations.map(d => d.deviation));

        // Calculate spatial correlation (if location data available)
        const spatialCorrelation = this.calculateSpatialCorrelation(trials, parameters);

        // Calculate coherence metrics
        const coherence = this.calculateCoherence(deviations.map(d => d.deviation));

        // Statistical significance
        const chiSquare = (trials.length - 1) * normalizedVariance;
        const pValue = StatisticalUtils.chiSquareProbability(chiSquare, trials.length - 1);

        return {
            netvar: normalizedVariance,
            degreesOfFreedom: trials.length - 1,
            chisquare: chiSquare,
            probability: pValue,
            significance: pValue < 0.05 ? 'significant' : 'none',
            confidenceInterval: [normalizedVariance - 1.96, normalizedVariance + 1.96],
            expectedNetvar: 1.0,
            standardError: Math.sqrt(2 / trials.length)
        };
    }

    /**
     * Device Variance (Sum of Z²) - Alternative analysis method
     * Treats each device/trial as independent measurement
     */
    static calculateDeviceVariance(
        trials: RNGTrial[],
        parameters: AnalysisParameters = {}
    ): DeviceVarianceResult {
        if (trials.length === 0) {
            throw new Error('No trials provided for device variance analysis');
        }

        const expectedMean = parameters.expectedMean || 100;
        const expectedStd = parameters.expectedStd || Math.sqrt(50);

        // Transform trials to normalized deviations
        const normalizedTrials = trials.map(trial => {
            return (trial.trialValue - expectedMean) / expectedStd;
        });

        // Calculate device-specific metrics
        const deviceMean = StatisticalUtils.mean(normalizedTrials);
        const deviceVariance = StatisticalUtils.variance(normalizedTrials);
        const deviceSkewness = StatisticalUtils.skewness(normalizedTrials);
        const deviceKurtosis = StatisticalUtils.kurtosis(normalizedTrials);

        // Calculate drift over time
        const drift = this.calculateDrift(normalizedTrials);

        // Calculate autocorrelation
        const autocorrelation = this.calculateAutocorrelation(normalizedTrials);

        // Statistical tests
        const kolmogorovSmirnov = this.performKSTest(normalizedTrials);
        const andersonDarling = this.performADTest(normalizedTrials);

        return {
            deviceVariance,
            individualZScores: normalizedTrials, // Use normalized trials as Z-scores
            probability: andersonDarling.pValue, // Use AD test p-value
            significance: andersonDarling.pValue < 0.05 ? 'significant' : 'none',
            degreesOfFreedom: trials.length - 1,
            deviceMean
        };
    }

    /**
     * Cumulative Deviation Tracking - For real-time display and analysis
     * Tracks running cumulative deviation from expected mean
     */
    static calculateCumulativeDeviation(
        trials: RNGTrial[],
        parameters: AnalysisParameters = {}
    ): CumulativeResult {
        if (trials.length === 0) {
            throw new Error('No trials provided for cumulative deviation analysis');
        }

        const expectedMean = parameters.expectedMean || 100;
        const expectedStd = parameters.expectedStd || Math.sqrt(50);

        // Calculate cumulative deviations
        let runningSum = 0;
        let sumOfSquares = 0;
        const points: CumulativePoint[] = [];

        trials.forEach((trial, index) => {
            const deviation = trial.trialValue - expectedMean;
            runningSum += deviation;

            runningSum += trial.trialValue;
            sumOfSquares += trial.trialValue * trial.trialValue;

            const n = index + 1;
            const currentMean = runningSum / n;
            const currentVariance = (sumOfSquares - n * currentMean * currentMean) / (n - 1);
            const currentStd = Math.sqrt(Math.max(0, currentVariance));

            // Calculate Z-score for cumulative deviation
            const expectedCumulativeStd = expectedStd * Math.sqrt(n);
            const zScore = runningSum / expectedCumulativeStd;

            points.push({
                trialIndex: n,
                timestamp: trial.timestamp,
                cumulativeDeviation: runningSum,
                runningMean: currentMean,
                zScore,
                runningVariance: currentVariance,
                index: n
            });
        });

        // Detect excursion periods
        const excursions = this.detectExcursions(points, parameters.minExcursionLength || 100);

        // Calculate final statistics
        const finalDeviation = points[points.length - 1].cumulativeDeviation;
        const finalZScore = points[points.length - 1].zScore;
        const finalPValue = StatisticalUtils.normalProbabilityOneTailed(Math.abs(finalZScore));

        // Calculate maximum excursion
        const maxPositiveExcursion = Math.max(...points.map(p => p.cumulativeDeviation));
        const maxNegativeExcursion = Math.min(...points.map(p => p.cumulativeDeviation));

        return {
            points,
            finalDeviation,
            maxDeviation: maxPositiveExcursion,
            minDeviation: maxNegativeExcursion,
            crossings: 0, // TODO: Calculate actual crossings
            excursions
        };
    }

    /**
     * Z-Score Analysis with confidence intervals
     */
    static calculateZScore(
        trials: RNGTrial[],
        expectedMean: number = 100,
        parameters: AnalysisParameters = {}
    ): ZScoreResult {
        if (trials.length === 0) {
            throw new Error('No trials provided for Z-score analysis');
        }

        const observedMean = StatisticalUtils.mean(trials.map(t => t.trialValue));
        const expectedStd = Math.sqrt(50); // Standard deviation for 200-bit trials
        const standardError = expectedStd / Math.sqrt(trials.length);

        // Calculate Z-score
        const zScore = (observedMean - expectedMean) / standardError;

        // Calculate p-values
        const pValueTwoTailed = StatisticalUtils.normalProbability(zScore);
        const pValueOneTailed = StatisticalUtils.normalProbabilityOneTailed(zScore);

        // Calculate confidence interval
        const confidenceLevel = parameters.confidenceLevel || 0.95;
        const alpha = 1 - confidenceLevel;
        const criticalValue = 1.96; // Use fixed value instead of private method
        const margin = criticalValue * standardError;
        const confidenceInterval: [number, number] = [observedMean - margin, observedMean + margin];

        // Determine significance
        const significance = pValueTwoTailed < 0.05 ? 'significant' : 'none';

        return {
            zScore,
            pValue: pValueTwoTailed,
            pValueOneTailed,
            confidenceInterval,
            standardError,
            effectSize: Math.abs(zScore) * standardError, // Simple effect size calculation
            sampleSize: trials.length,
            significance
        };
    }

    /**
     * Effect Size Calculation - Important for comparing studies
     */
    static calculateEffectSize(
        trials: RNGTrial[],
        expectedMean: number = 100,
        parameters: AnalysisParameters = {}
    ): EffectSizeResult {
        if (trials.length === 0) {
            throw new Error('No trials provided for effect size analysis');
        }

        const observedMean = StatisticalUtils.mean(trials.map(t => t.trialValue));
        const expectedStd = Math.sqrt(50);
        const observedStd = StatisticalUtils.standardDeviation(trials.map(t => t.trialValue));

        // Calculate Cohen's d
        const cohensD = StatisticalUtils.cohensD(observedMean, expectedMean, expectedStd);

        // Calculate Hedges' g (bias-corrected)
        const hedgesG = StatisticalUtils.hedgesG(
            observedMean, expectedMean, expectedStd, trials.length, 1
        );

        // Calculate point-biserial correlation
        const deviations = trials.map(t => t.trialValue - expectedMean);
        const binaryGroups = deviations.map(d => d > 0);
        const pointBiserial = StatisticalUtils.pointBiserialCorrelation(deviations, binaryGroups);

        // Calculate confidence interval for effect size
        const se = Math.sqrt((trials.length + cohensD * cohensD / 2) / (trials.length * (trials.length - 3)));
        const confidenceLevel = parameters.confidenceLevel || 0.95;
        const alpha = 1 - confidenceLevel;
        const criticalValue = 1.96; // Use fixed value instead of private method
        const margin = criticalValue * se;
        const confidenceInterval: [number, number] = [cohensD - margin, cohensD + margin];

        // Interpret effect size
        let interpretation: EffectSizeInterpretation;
        const absD = Math.abs(cohensD);
        if (absD >= 0.8) {
            interpretation = EffectSizeInterpretation.LARGE;
        } else if (absD >= 0.5) {
            interpretation = EffectSizeInterpretation.MEDIUM;
        } else if (absD >= 0.2) {
            interpretation = EffectSizeInterpretation.SMALL;
        } else {
            interpretation = EffectSizeInterpretation.NEGLIGIBLE;
        }

        // Determine practical significance
        const practicalSignificance = absD >= 0.2; // Conventionally, d >= 0.2 is considered meaningful

        return {
            cohensD,
            hedgesG,
            pointBiserial,
            confidenceInterval,
            interpretation,
            practicalSignificance
        };
    }

    /**
     * Detect excursion periods in cumulative deviation data
     */
    private static detectExcursions(
        points: CumulativePoint[],
        minDuration: number = 100
    ): ExcursionPeriod[] {
        const excursions: ExcursionPeriod[] = [];
        const threshold = 2.0; // Z-score threshold for excursion

        let inExcursion = false;
        let excursionStart = 0;
        let excursionSign = 0;
        let maxDeviation = 0;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const absZ = Math.abs(point.zScore);

            if (!inExcursion && absZ > threshold) {
                // Start of excursion
                inExcursion = true;
                excursionStart = i;
                excursionSign = Math.sign(point.zScore);
                maxDeviation = absZ;
            } else if (inExcursion) {
                const currentSign = Math.sign(point.zScore);

                if (currentSign === excursionSign && absZ > Math.abs(maxDeviation)) {
                    maxDeviation = absZ;
                }

                // End excursion if sign changes or drops below threshold
                if (currentSign !== excursionSign || absZ < threshold) {
                    const duration = i - excursionStart;

                    if (duration >= minDuration) {
                        const startPoint = points[excursionStart];
                        const endPoint = points[i - 1];

                        // Calculate significance of this excursion
                        const excursionZ = maxDeviation;
                        const excursionP = StatisticalUtils.normalProbabilityOneTailed(excursionZ);

                        excursions.push({
                            startIndex: excursionStart,
                            endIndex: i - 1,
                            startTime: startPoint.timestamp,
                            endTime: endPoint.timestamp,
                            maxDeviation: maxDeviation * excursionSign,
                            duration: endPoint.timestamp.getTime() - startPoint.timestamp.getTime(),
                            significance: excursionP
                        });
                    }

                    inExcursion = false;

                    // Check if we're starting a new excursion
                    if (absZ > threshold) {
                        inExcursion = true;
                        excursionStart = i;
                        excursionSign = Math.sign(point.zScore);
                        maxDeviation = absZ;
                    }
                }
            }
        }

        // Handle excursion that extends to the end
        if (inExcursion && points.length - excursionStart >= minDuration) {
            const startPoint = points[excursionStart];
            const endPoint = points[points.length - 1];
            const excursionZ = maxDeviation;
            const excursionP = StatisticalUtils.normalProbabilityOneTailed(excursionZ);

            excursions.push({
                startIndex: excursionStart,
                endIndex: points.length - 1,
                startTime: startPoint.timestamp,
                endTime: endPoint.timestamp,
                maxDeviation: maxDeviation * excursionSign,
                duration: endPoint.timestamp.getTime() - startPoint.timestamp.getTime(),
                significance: excursionP
            });
        }

        return excursions;
    }

    /**
     * Chi-square inverse function (approximation)
     */
    private static chiSquareInverse(p: number, df: number): number {
        // Simple approximation for chi-square inverse
        // For production use, consider a more accurate implementation
        if (p <= 0 || p >= 1 || df < 1) return NaN;

        // Wilson-Hilferty transformation
        const h = 2 / (9 * df);
        const zp = this.normalInverseApprox(p); // Use our own implementation

        const chi2 = df * Math.pow(1 - h + zp * Math.sqrt(h), 3);
        return Math.max(0, chi2);
    }

    /**
     * Normal inverse approximation for internal use
     */
    private static normalInverseApprox(p: number): number {
        // Beasley-Springer-Moro algorithm
        const a = [
            0,
            -3.969683028665376e+01,
            2.209460984245205e+02,
            -2.759285104469687e+02,
            1.383577518672690e+02,
            -3.066479806614716e+01,
            2.506628277459239e+00
        ];
        const b = [
            0,
            -5.447609879822406e+01,
            1.615858368580409e+02,
            -1.556989798598866e+02,
            6.680131188771972e+01,
            -1.328068155288572e+01
        ];
        const c = [
            0,
            -7.784894002430293e-03,
            -3.223964580411365e-01,
            -2.400758277161838e+00,
            -2.549732539343734e+00,
            4.374664141464968e+00,
            2.938163982698783e+00
        ];
        const d = [
            0,
            7.784695709041462e-03,
            3.224671290700398e-01,
            2.445134137142996e+00,
            3.754408661907416e+00
        ];

        const split1 = 0.425;
        const split2 = 5.0;
        const const1 = 0.180625;
        const const2 = 1.6;

        let q = p - 0.5;
        let r, x;

        if (Math.abs(q) < split1) {
            r = const1 - q * q;
            const numerator = q * (((((a[6] * r + a[5]) * r + a[4]) * r + a[3]) * r + a[2]) * r + a[1]);
            const denominator = (((((b[5] * r + b[4]) * r + b[3]) * r + b[2]) * r + b[1]) * r + 1);
            x = numerator / denominator;
        } else {
            r = q < 0 ? p : 1 - p;
            r = Math.sqrt(-Math.log(r));

            if (r <= split2) {
                r = r - const2;
                const numerator1 = (((((c[6] * r + c[5]) * r + c[4]) * r + c[3]) * r + c[2]) * r + c[1]);
                const denominator1 = ((((d[4] * r + d[3]) * r + d[2]) * r + d[1]) * r + 1);
                x = numerator1 / denominator1;
            } else {
                r = r - split2;
                const numerator2 = (((((c[6] * r + c[5]) * r + c[4]) * r + c[3]) * r + c[2]) * r + c[1]);
                const denominator2 = ((((d[4] * r + d[3]) * r + d[2]) * r + d[1]) * r + 1);
                x = numerator2 / denominator2;
            }

            if (q < 0) x = -x;
        }

        return x;
    }

    /**
     * Calculate temporal correlation in time-ordered data
     */
    static calculateTemporalCorrelation(deviations: number[]): number {
        if (deviations.length < 2) return 0;

        // Calculate autocorrelation at lag 1
        const mean = StatisticalUtils.mean(deviations);
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < deviations.length - 1; i++) {
            numerator += (deviations[i] - mean) * (deviations[i + 1] - mean);
        }

        for (let i = 0; i < deviations.length; i++) {
            denominator += (deviations[i] - mean) * (deviations[i] - mean);
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Calculate spatial correlation between trials
     */
    static calculateSpatialCorrelation(trials: RNGTrial[], parameters: AnalysisParameters): number {
        const values = trials.map(t => t.trialValue);
        if (values.length < 2) return 0;

        // Simple spatial correlation using adjacent trials
        return this.calculateTemporalCorrelation(values);
    }

    /**
     * Calculate coherence measure
     */
    static calculateCoherence(deviations: number[]): number {
        if (deviations.length === 0) return 0;

        const mean = StatisticalUtils.mean(deviations);
        const variance = StatisticalUtils.variance(deviations);

        // Coherence as inverse of normalized variance
        return variance === 0 ? 1 : 1 / (1 + variance / (mean * mean + 1));
    }

    /**
     * Calculate drift in the data
     */
    static calculateDrift(values: number[]): number {
        if (values.length < 2) return 0;

        // Simple linear trend calculation
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const meanX = StatisticalUtils.mean(x);
        const meanY = StatisticalUtils.mean(values);

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (x[i] - meanX) * (values[i] - meanY);
            denominator += (x[i] - meanX) * (x[i] - meanX);
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Calculate autocorrelation at specified lag
     */
    static calculateAutocorrelation(values: number[], lag: number = 1): number {
        if (values.length <= lag) return 0;

        const mean = StatisticalUtils.mean(values);
        let numerator = 0;
        let denominator = 0;

        for (let i = lag; i < values.length; i++) {
            numerator += (values[i] - mean) * (values[i - lag] - mean);
        }

        for (let i = 0; i < values.length; i++) {
            denominator += (values[i] - mean) * (values[i] - mean);
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Perform Kolmogorov-Smirnov test
     */
    static performKSTest(values: number[]): { statistic: number; pValue: number } {
        if (values.length === 0) return { statistic: 0, pValue: 1 };

        // Simple KS test implementation
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        let maxD = 0;

        for (let i = 0; i < n; i++) {
            const empirical = (i + 1) / n;
            const theoretical = StatisticalUtils.normalCdf(sorted[i]);
            maxD = Math.max(maxD, Math.abs(empirical - theoretical));
        }

        // Approximate p-value calculation
        const sqrtN = Math.sqrt(n);
        const pValue = 2 * Math.exp(-2 * maxD * maxD * n);

        return { statistic: maxD, pValue: Math.min(pValue, 1) };
    }

    /**
     * Perform Anderson-Darling test
     */
    static performADTest(values: number[]): { statistic: number; pValue: number } {
        if (values.length === 0) return { statistic: 0, pValue: 1 };

        // Simplified Anderson-Darling test
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        let ad = 0;

        for (let i = 0; i < n; i++) {
            const p1 = StatisticalUtils.normalCdf(sorted[i]);
            const p2 = StatisticalUtils.normalCdf(sorted[n - 1 - i]);
            ad += (2 * i + 1) * (Math.log(p1) + Math.log(1 - p2));
        }

        ad = -n - ad / n;

        // Approximate p-value
        const pValue = Math.exp(-0.5 * ad);

        return { statistic: ad, pValue: Math.min(pValue, 1) };
    }
}