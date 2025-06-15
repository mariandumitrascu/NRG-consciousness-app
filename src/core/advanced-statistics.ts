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
            throw new Error('No trials provided for network variance calculation');
        }

        const expectedMean = 100; // Expected mean for 200-bit trials
        const expectedVariance = 50; // Expected variance for 200-bit trials (n*p*(1-p))
        const expectedStd = Math.sqrt(expectedVariance);

        // Calculate individual Z-scores for each trial
        const zScores = trials.map(trial => {
            const deviation = trial.result - expectedMean;
            return deviation / expectedStd;
        });

        // Network variance is the sum of squared Z-scores
        const netvar = zScores.reduce((sum, z) => sum + z * z, 0);
        const degreesOfFreedom = trials.length;
        const expectedNetvar = degreesOfFreedom; // E[χ²] = df
        const standardError = Math.sqrt(2 * degreesOfFreedom); // SE[χ²] = √(2*df)

        // Calculate chi-square statistic (netvar follows chi-square distribution)
        const chisquare = netvar;
        const probability = StatisticalUtils.chiSquareProbability(chisquare, degreesOfFreedom);

        // Determine significance level
        let significance: StatisticalSignificance;
        if (probability < 0.001) {
            significance = StatisticalSignificance.HIGHLY_SIGNIFICANT;
        } else if (probability < 0.01) {
            significance = StatisticalSignificance.SIGNIFICANT;
        } else if (probability < 0.05) {
            significance = StatisticalSignificance.SIGNIFICANT;
        } else if (probability < 0.1) {
            significance = StatisticalSignificance.MARGINAL;
        } else {
            significance = StatisticalSignificance.NONE;
        }

        // Calculate confidence interval for network variance
        const confidenceLevel = parameters.confidenceLevel || 0.95;
        const alpha = 1 - confidenceLevel;
        const chiLower = this.chiSquareInverse(alpha / 2, degreesOfFreedom);
        const chiUpper = this.chiSquareInverse(1 - alpha / 2, degreesOfFreedom);

        return {
            netvar,
            degreesOfFreedom,
            chisquare,
            probability,
            significance,
            confidenceInterval: [chiLower, chiUpper],
            expectedNetvar,
            standardError
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
            throw new Error('No trials provided for device variance calculation');
        }

        const expectedMean = 100;
        const expectedStd = Math.sqrt(50);

        // Calculate individual Z-scores
        const individualZScores = trials.map(trial => {
            return (trial.result - expectedMean) / expectedStd;
        });

        // Device variance is sum of squared Z-scores
        const deviceVariance = individualZScores.reduce((sum, z) => sum + z * z, 0);
        const degreesOfFreedom = trials.length;

        // Calculate probability using chi-square distribution
        const probability = StatisticalUtils.chiSquareProbability(deviceVariance, degreesOfFreedom);

        // Determine significance
        let significance: StatisticalSignificance;
        if (probability < 0.001) {
            significance = StatisticalSignificance.HIGHLY_SIGNIFICANT;
        } else if (probability < 0.05) {
            significance = StatisticalSignificance.SIGNIFICANT;
        } else if (probability < 0.1) {
            significance = StatisticalSignificance.MARGINAL;
        } else {
            significance = StatisticalSignificance.NONE;
        }

        return {
            deviceVariance,
            individualZScores,
            probability,
            significance,
            degreesOfFreedom
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
            return {
                points: [],
                finalDeviation: 0,
                maxDeviation: 0,
                minDeviation: 0,
                crossings: 0,
                excursions: []
            };
        }

        const expectedMean = 100;
        const points: CumulativePoint[] = [];
        let cumulativeDeviation = 0;
        let runningSum = 0;
        let sumOfSquares = 0;
        let maxDeviation = 0;
        let minDeviation = 0;
        let crossings = 0;
        let lastSign = 0;

        // Calculate cumulative statistics for each trial
        for (let i = 0; i < trials.length; i++) {
            const trial = trials[i];
            const deviation = trial.result - expectedMean;

            cumulativeDeviation += deviation;
            runningSum += trial.result;
            sumOfSquares += trial.result * trial.result;

            const n = i + 1;
            const runningMean = runningSum / n;
            const runningVariance = (sumOfSquares - n * runningMean * runningMean) / (n - 1);
            const runningStd = Math.sqrt(Math.max(0, runningVariance));

            // Calculate Z-score for cumulative deviation
            const expectedCumStd = Math.sqrt(50 * n); // Standard error for cumulative sum
            const zScore = cumulativeDeviation / expectedCumStd;

            points.push({
                trialIndex: i,
                timestamp: trial.timestamp,
                cumulativeDeviation,
                runningMean,
                zScore,
                runningVariance: runningVariance || 0
            });

            // Track extremes
            if (cumulativeDeviation > maxDeviation) {
                maxDeviation = cumulativeDeviation;
            }
            if (cumulativeDeviation < minDeviation) {
                minDeviation = cumulativeDeviation;
            }

            // Count zero crossings
            const currentSign = Math.sign(cumulativeDeviation);
            if (i > 0 && currentSign !== 0 && lastSign !== 0 && currentSign !== lastSign) {
                crossings++;
            }
            lastSign = currentSign;
        }

        // Detect excursion periods (sustained deviations)
        const excursions = this.detectExcursions(points, parameters.windowSize || 100);

        return {
            points,
            finalDeviation: cumulativeDeviation,
            maxDeviation,
            minDeviation,
            crossings,
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
            throw new Error('No trials provided for Z-score calculation');
        }

        const observedMean = StatisticalUtils.mean(trials.map(t => t.result));
        const expectedStd = Math.sqrt(50); // Standard deviation for 200-bit trials
        const standardError = expectedStd / Math.sqrt(trials.length);

        // Calculate Z-score
        const zScore = (observedMean - expectedMean) / standardError;

        // Calculate p-values
        const pValue = StatisticalUtils.normalProbability(zScore);
        const pValueOneTailed = StatisticalUtils.normalProbabilityOneTailed(zScore);

        // Calculate confidence interval for the mean
        const confidenceLevel = parameters.confidenceLevel || 0.95;
        const confidenceInterval = StatisticalUtils.calculateConfidenceInterval(
            observedMean, expectedStd, trials.length, confidenceLevel
        );

        // Calculate effect size (Cohen's d)
        const effectSize = (observedMean - expectedMean) / expectedStd;

        // Determine significance
        let significance: StatisticalSignificance;
        if (pValue < 0.001) {
            significance = StatisticalSignificance.HIGHLY_SIGNIFICANT;
        } else if (pValue < 0.05) {
            significance = StatisticalSignificance.SIGNIFICANT;
        } else if (pValue < 0.1) {
            significance = StatisticalSignificance.MARGINAL;
        } else {
            significance = StatisticalSignificance.NONE;
        }

        return {
            zScore,
            pValue,
            pValueOneTailed,
            confidenceInterval,
            standardError,
            effectSize,
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
            throw new Error('No trials provided for effect size calculation');
        }

        const observedMean = StatisticalUtils.mean(trials.map(t => t.result));
        const expectedStd = Math.sqrt(50);
        const observedStd = StatisticalUtils.standardDeviation(trials.map(t => t.result));

        // Calculate Cohen's d
        const cohensD = StatisticalUtils.cohensD(observedMean, expectedMean, expectedStd);

        // Calculate Hedges' g (bias-corrected)
        const hedgesG = StatisticalUtils.hedgesG(
            observedMean, expectedMean, expectedStd, trials.length, 1
        );

        // Calculate point-biserial correlation
        const deviations = trials.map(t => t.result - expectedMean);
        const binaryGroups = deviations.map(d => d > 0);
        const pointBiserial = StatisticalUtils.pointBiserialCorrelation(deviations, binaryGroups);

        // Calculate confidence interval for effect size
        const se = Math.sqrt((trials.length + cohensD * cohensD / 2) / (trials.length * (trials.length - 3)));
        const confidenceLevel = parameters.confidenceLevel || 0.95;
        const alpha = 1 - confidenceLevel;
        const criticalValue = StatisticalUtils.normalInverse ?
            StatisticalUtils.normalInverse(1 - alpha / 2) : 1.96;
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
        const zp = StatisticalUtils.normalInverse ?
            StatisticalUtils.normalInverse(p) :
            this.normalInverseApprox(p);

        const chi2 = df * Math.pow(1 - h + zp * Math.sqrt(h), 3);
        return Math.max(0, chi2);
    }

    /**
     * Normal inverse approximation for internal use
     */
    private static normalInverseApprox(p: number): number {
        // Beasley-Springer-Moro algorithm
        const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
        const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

        const split1 = 0.425;
        const split2 = 5.0;
        const const1 = 0.180625;
        const const2 = 1.6;

        let q = p - 0.5;
        let r, x;

        if (Math.abs(q) < split1) {
            r = const1 - q * q;
            x = q * (((((a[7] * r + a[6]) * r + a[5]) * r + a[4]) * r + a[3]) * r + a[2]) * r + a[1]) /
                (((((b[6] * r + b[5]) * r + b[4]) * r + b[3]) * r + b[2]) * r + b[1]) * r + 1);
        } else {
            r = q < 0 ? p : 1 - p;
            r = Math.sqrt(-Math.log(r));

            if (r <= split2) {
                r = r - const2;
                x = (((((c[7] * r + c[6]) * r + c[5]) * r + c[4]) * r + c[3]) * r + c[2]) * r + c[1]) /
                    ((((d[4] * r + d[3]) * r + d[2]) * r + d[1]) * r + 1);
            } else {
                r = r - split2;
                x = (((((c[7] * r + c[6]) * r + c[5]) * r + c[4]) * r + c[3]) * r + c[2]) * r + c[1]) /
                    ((((d[4] * r + d[3]) * r + d[2]) * r + d[1]) * r + 1);
            }

            if (q < 0) x = -x;
        }

        return x;
    }
}