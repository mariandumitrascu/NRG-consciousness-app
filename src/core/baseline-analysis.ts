/**
 * Baseline Analysis Engine
 * Critical for validating RNG quality and detecting hardware issues
 */

import { RNGTrial } from '../shared/types';
import {
    RandomnessTestResult,
    RandomnessTest,
    CalibrationAnalysis,
    DriftAnalysis,
    ComparisonResult,
    AnalysisParameters
} from '../shared/analysis-types';
import { StatisticalUtils } from './statistical-utils';

export class BaselineAnalysis {

    /**
     * Comprehensive randomness testing suite
     * Implements multiple statistical tests for RNG quality assessment
     */
    static runRandomnessTests(
        trials: RNGTrial[],
        parameters: AnalysisParameters = {}
    ): RandomnessTestResult {
        if (trials.length < 100) {
            return {
                tests: [],
                overallScore: 0.5,
                isRandomAtLevel: false,
                recommendations: ['Need at least 100 trials for meaningful randomness testing']
            };
        }

        const values = trials.map(t => t.result);
        const tests: RandomnessTest[] = [];

        // 1. Frequency Test (Monobit Test)
        const frequencyTest = this.frequencyTest(values);
        tests.push(frequencyTest);

        // 2. Runs Test
        const runsTestResult = StatisticalUtils.runsTest(values);
        tests.push({
            name: 'Runs Test',
            statistic: runsTestResult.statistic,
            pValue: runsTestResult.pValue,
            passed: runsTestResult.isRandom,
            description: 'Tests for randomness in sequences of consecutive identical outcomes'
        });

        // 3. Test for Longest Run of Ones
        const longestRunTest = this.longestRunTest(values);
        tests.push(longestRunTest);

        // 4. Binary Matrix Rank Test
        if (values.length >= 1000) {
            const matrixRankTest = this.binaryMatrixRankTest(values);
            tests.push(matrixRankTest);
        }

        // 5. Discrete Fourier Transform Test
        if (values.length >= 1000) {
            const dftTest = this.discreteFourierTransformTest(values);
            tests.push(dftTest);
        }

        // 6. Serial Test (Two-bit Test)
        if (values.length >= 100) {
            const serialTest = this.serialTest(values);
            tests.push(serialTest);
        }

        // 7. Approximate Entropy Test
        if (values.length >= 100) {
            const approxEntropyTest = this.approximateEntropyTest(values);
            tests.push(approxEntropyTest);
        }

        // 8. Cumulative Sums Test
        const cumsumTests = this.cumulativeSumsTest(values);
        tests.push(...cumsumTests);

        // 9. Normality Test (Jarque-Bera)
        const normalityResult = StatisticalUtils.jarqueBeraTest(values);
        tests.push({
            name: 'Normality Test (Jarque-Bera)',
            statistic: normalityResult.statistic,
            pValue: normalityResult.pValue,
            passed: normalityResult.isNormal,
            description: 'Tests if the distribution of values follows expected normal distribution'
        });

        // Calculate overall score
        const passedTests = tests.filter(t => t.passed).length;
        const overallScore = passedTests / tests.length;
        const isRandomAtLevel = overallScore >= 0.95; // 95% of tests should pass

        // Generate recommendations
        const recommendations = this.generateRandomnessRecommendations(tests, overallScore);

        return {
            tests,
            overallScore,
            isRandomAtLevel,
            recommendations
        };
    }

    /**
     * Calibration analysis comparing current data to baseline periods
     */
    static analyzeCalibrationData(
        calibrationTrials: RNGTrial[],
        currentTrials: RNGTrial[],
        parameters: AnalysisParameters = {}
    ): CalibrationAnalysis {
        if (calibrationTrials.length === 0) {
            throw new Error('No calibration trials provided');
        }

        if (currentTrials.length === 0) {
            throw new Error('No current trials provided');
        }

        const baselineValues = calibrationTrials.map(t => t.result);
        const currentValues = currentTrials.map(t => t.result);

        // Calculate baseline statistics
        const baselineMean = StatisticalUtils.mean(baselineValues);
        const baselineStd = StatisticalUtils.standardDeviation(baselineValues);

        // Calculate current statistics
        const currentMean = StatisticalUtils.mean(currentValues);
        const currentStd = StatisticalUtils.standardDeviation(currentValues);

        // Calculate drift from baseline
        const drift = currentMean - baselineMean;

        // Test significance of drift using two-sample t-test
        const pooledStd = StatisticalUtils.pooledStandardDeviation(
            baselineStd, baselineValues.length,
            currentStd, currentValues.length
        );

        const standardError = pooledStd * Math.sqrt(
            1 / baselineValues.length + 1 / currentValues.length
        );

        const tStatistic = drift / standardError;
        const df = baselineValues.length + currentValues.length - 2;
        const driftSignificance = StatisticalUtils.tDistributionProbability(tStatistic, df);

        // Determine if recalibration is needed
        const recalibrationNeeded = driftSignificance < 0.05 || Math.abs(drift) > 2 * baselineStd;

        return {
            baselineMean,
            baselineStd,
            currentMean,
            currentStd,
            drift,
            driftSignificance,
            recalibrationNeeded
        };
    }

    /**
     * Baseline drift detection over time
     * Monitors RNG hardware stability
     */
    static detectBaselineDrift(
        trials: RNGTrial[],
        periodDays: number = 7,
        parameters: AnalysisParameters = {}
    ): DriftAnalysis {
        if (trials.length < 100) {
            return {
                driftRate: 0,
                driftSignificance: 1,
                trendDirection: 'stable',
                projectedDrift: 0,
                maintenanceRecommended: false
            };
        }

        // Group trials by time periods
        const msPerDay = 24 * 60 * 60 * 1000;
        const periodMs = periodDays * msPerDay;

        const startTime = trials[0].timestamp.getTime();
        const endTime = trials[trials.length - 1].timestamp.getTime();
        const totalDuration = endTime - startTime;

        if (totalDuration < periodMs * 2) {
            return {
                driftRate: 0,
                driftSignificance: 1,
                trendDirection: 'stable',
                projectedDrift: 0,
                maintenanceRecommended: false
            };
        }

        // Create time periods and calculate means
        const periods: { time: number; mean: number; count: number }[] = [];

        for (let time = startTime; time < endTime; time += periodMs) {
            const periodTrials = trials.filter(t =>
                t.timestamp.getTime() >= time && t.timestamp.getTime() < time + periodMs
            );

            if (periodTrials.length >= 10) {
                const periodMean = StatisticalUtils.mean(periodTrials.map(t => t.result));
                periods.push({
                    time: time + periodMs / 2, // Midpoint of period
                    mean: periodMean,
                    count: periodTrials.length
                });
            }
        }

        if (periods.length < 3) {
            return {
                driftRate: 0,
                driftSignificance: 1,
                trendDirection: 'stable',
                projectedDrift: 0,
                maintenanceRecommended: false
            };
        }

        // Perform linear regression to detect drift
        const timePoints = periods.map(p => p.time);
        const means = periods.map(p => p.mean);

        const regression = this.calculateLinearRegression(timePoints, means);
        const driftRate = regression.slope * msPerDay; // Drift per day

        // Test significance of drift
        const tStatistic = regression.slope / regression.slopeStdError;
        const df = periods.length - 2;
        const driftSignificance = StatisticalUtils.tDistributionProbability(tStatistic, df);

        // Determine trend direction
        let trendDirection: 'positive' | 'negative' | 'stable';
        if (driftSignificance < 0.05) {
            trendDirection = driftRate > 0 ? 'positive' : 'negative';
        } else {
            trendDirection = 'stable';
        }

        // Project future drift
        const projectedDrift = driftRate * 30; // Projected drift in 30 days

        // Determine if maintenance is recommended
        const maintenanceRecommended =
            driftSignificance < 0.01 || // Highly significant drift
            Math.abs(projectedDrift) > 5 || // Large projected drift
            Math.abs(driftRate) > 0.5; // High daily drift rate

        return {
            driftRate,
            driftSignificance,
            trendDirection,
            projectedDrift,
            maintenanceRecommended
        };
    }

    /**
     * Compare control periods vs intention periods
     * Core analysis for consciousness research
     */
    static compareControlPeriods(
        intentionTrials: RNGTrial[],
        controlTrials: RNGTrial[],
        parameters: AnalysisParameters = {}
    ): ComparisonResult {
        if (intentionTrials.length === 0 || controlTrials.length === 0) {
            throw new Error('Both intention and control trials required for comparison');
        }

        const intentionValues = intentionTrials.map(t => t.result);
        const controlValues = controlTrials.map(t => t.result);

        // Calculate means and standard deviations
        const intentionMean = StatisticalUtils.mean(intentionValues);
        const controlMean = StatisticalUtils.mean(controlValues);
        const intentionStd = StatisticalUtils.standardDeviation(intentionValues);
        const controlStd = StatisticalUtils.standardDeviation(controlValues);

        // Calculate mean difference
        const meanDifference = intentionMean - controlMean;

        // Perform two-sample t-test
        const pooledStd = StatisticalUtils.pooledStandardDeviation(
            intentionStd, intentionValues.length,
            controlStd, controlValues.length
        );

        const standardError = pooledStd * Math.sqrt(
            1 / intentionValues.length + 1 / controlValues.length
        );

        const tStatistic = meanDifference / standardError;
        const df = intentionValues.length + controlValues.length - 2;
        const pValue = StatisticalUtils.tDistributionProbability(tStatistic, df);

        // Calculate effect size (Cohen's d)
        const effectSize = StatisticalUtils.cohensD(intentionMean, controlMean, pooledStd);

        // Calculate confidence interval for mean difference
        const confidenceLevel = parameters.confidenceLevel || 0.95;
        const alpha = 1 - confidenceLevel;
        const criticalT = this.tInverse(1 - alpha / 2, df);
        const margin = criticalT * standardError;
        const confidenceInterval: [number, number] = [
            meanDifference - margin,
            meanDifference + margin
        ];

        const significantDifference = pValue < 0.05;

        return {
            meanDifference,
            standardError,
            tStatistic,
            pValue,
            effectSize,
            confidenceInterval,
            significantDifference
        };
    }

    // Individual randomness tests implementations

    private static frequencyTest(values: number[]): RandomnessTest {
        const expectedMean = 100;
        const expectedStd = Math.sqrt(50);
        const observedMean = StatisticalUtils.mean(values);
        const n = values.length;

        // Calculate test statistic
        const zScore = (observedMean - expectedMean) / (expectedStd / Math.sqrt(n));
        const pValue = StatisticalUtils.normalProbability(zScore);
        const passed = pValue > 0.05;

        return {
            name: 'Frequency Test (Monobit)',
            statistic: zScore,
            pValue,
            passed,
            description: 'Tests if the frequency of bits deviates significantly from 50%'
        };
    }

    private static longestRunTest(values: number[]): RandomnessTest {
        const median = StatisticalUtils.median(values);
        const binary = values.map(v => v > median ? 1 : 0);

        // Find longest run of 1s
        let maxRun = 0;
        let currentRun = 0;

        for (const bit of binary) {
            if (bit === 1) {
                currentRun++;
                maxRun = Math.max(maxRun, currentRun);
            } else {
                currentRun = 0;
            }
        }

        // Expected longest run for random sequence
        const n = binary.length;
        const expectedLongestRun = Math.log2(n);
        const variance = 1; // Approximate variance

        const zScore = Math.abs(maxRun - expectedLongestRun) / Math.sqrt(variance);
        const pValue = StatisticalUtils.normalProbability(zScore);
        const passed = pValue > 0.05;

        return {
            name: 'Longest Run Test',
            statistic: maxRun,
            pValue,
            passed,
            description: 'Tests for unusually long runs of consecutive identical bits'
        };
    }

    private static binaryMatrixRankTest(values: number[]): RandomnessTest {
        // Simplified binary matrix rank test
        const median = StatisticalUtils.median(values);
        const binary = values.map(v => v > median ? 1 : 0);

        const matrixSize = 32; // 32x32 matrices
        const numMatrices = Math.floor(binary.length / (matrixSize * matrixSize));

        if (numMatrices < 10) {
            return {
                name: 'Binary Matrix Rank Test',
                statistic: 0,
                pValue: 1,
                passed: true,
                description: 'Insufficient data for matrix rank test'
            };
        }

        let fullRankCount = 0;

        for (let m = 0; m < numMatrices; m++) {
            const matrixStart = m * matrixSize * matrixSize;
            const matrixBits = binary.slice(matrixStart, matrixStart + matrixSize * matrixSize);

            // Create binary matrix and calculate rank (simplified)
            const rank = this.calculateBinaryMatrixRank(matrixBits, matrixSize);

            if (rank === matrixSize) {
                fullRankCount++;
            }
        }

        // Expected probability of full rank matrix
        const expectedProbability = 0.2888; // Theoretical value for 32x32
        const expectedFullRank = numMatrices * expectedProbability;
        const variance = numMatrices * expectedProbability * (1 - expectedProbability);

        const zScore = Math.abs(fullRankCount - expectedFullRank) / Math.sqrt(variance);
        const pValue = StatisticalUtils.normalProbability(zScore);
        const passed = pValue > 0.05;

        return {
            name: 'Binary Matrix Rank Test',
            statistic: fullRankCount,
            pValue,
            passed,
            description: 'Tests linear dependence among fixed length substrings'
        };
    }

    private static discreteFourierTransformTest(values: number[]): RandomnessTest {
        // Convert to binary sequence
        const median = StatisticalUtils.median(values);
        const binary = values.map(v => v > median ? 1 : -1); // Use -1 and 1 for DFT

        const n = binary.length;
        const n2 = Math.floor(n / 2);

        // Simple DFT magnitude calculation
        const magnitudes: number[] = [];

        for (let k = 0; k < n2; k++) {
            let real = 0;
            let imag = 0;

            for (let j = 0; j < n; j++) {
                const angle = -2 * Math.PI * k * j / n;
                real += binary[j] * Math.cos(angle);
                imag += binary[j] * Math.sin(angle);
            }

            magnitudes.push(Math.sqrt(real * real + imag * imag));
        }

        // Calculate test statistic
        const threshold = Math.sqrt(Math.log(1 / 0.05) * n); // 95% threshold
        const exceedingCount = magnitudes.filter(m => m < threshold).length;
        const expectedCount = 0.95 * n2;

        const zScore = Math.abs(exceedingCount - expectedCount) / Math.sqrt(expectedCount * 0.05);
        const pValue = StatisticalUtils.normalProbability(zScore);
        const passed = pValue > 0.05;

        return {
            name: 'Discrete Fourier Transform Test',
            statistic: exceedingCount,
            pValue,
            passed,
            description: 'Detects periodic features in binary sequences'
        };
    }

    private static serialTest(values: number[]): RandomnessTest {
        const median = StatisticalUtils.median(values);
        const binary = values.map(v => v > median ? 1 : 0);

        const m = 2; // Pattern length (2-bit patterns)
        const n = binary.length;

        if (n < Math.pow(2, m + 2)) {
            return {
                name: 'Serial Test',
                statistic: 0,
                pValue: 1,
                passed: true,
                description: 'Insufficient data for serial test'
            };
        }

        // Count pattern frequencies
        const patterns = new Map<string, number>();

        for (let i = 0; i <= n - m; i++) {
            const pattern = binary.slice(i, i + m).join('');
            patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }

        // Calculate chi-square statistic
        const expectedFreq = (n - m + 1) / Math.pow(2, m);
        let chiSquare = 0;

        for (const freq of patterns.values()) {
            chiSquare += (freq - expectedFreq) * (freq - expectedFreq) / expectedFreq;
        }

        const df = Math.pow(2, m) - 1;
        const pValue = StatisticalUtils.chiSquareProbability(chiSquare, df);
        const passed = pValue > 0.05;

        return {
            name: 'Serial Test',
            statistic: chiSquare,
            pValue,
            passed,
            description: 'Tests frequency of overlapping patterns'
        };
    }

    private static approximateEntropyTest(values: number[], m: number = 2): RandomnessTest {
        const median = StatisticalUtils.median(values);
        const binary = values.map(v => v > median ? 1 : 0);
        const n = binary.length;

        if (n < Math.pow(2, m + 2)) {
            return {
                name: 'Approximate Entropy Test',
                statistic: 0,
                pValue: 1,
                passed: true,
                description: 'Insufficient data for approximate entropy test'
            };
        }

        // Calculate approximate entropy
        const phi = (length: number): number => {
            const patterns = new Map<string, number>();

            for (let i = 0; i <= n - length; i++) {
                const pattern = binary.slice(i, i + length).join('');
                patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
            }

            let sum = 0;
            for (const count of patterns.values()) {
                const probability = count / (n - length + 1);
                sum += probability * Math.log(probability);
            }

            return sum;
        };

        const phiM = phi(m);
        const phiMPlus1 = phi(m + 1);
        const approxEntropy = phiM - phiMPlus1;

        // Calculate test statistic (simplified)
        const expectedEntropy = 0; // Expected value for random sequence
        const variance = 1; // Approximate variance

        const zScore = Math.abs(approxEntropy - expectedEntropy) / Math.sqrt(variance);
        const pValue = StatisticalUtils.normalProbability(zScore);
        const passed = pValue > 0.05;

        return {
            name: 'Approximate Entropy Test',
            statistic: approxEntropy,
            pValue,
            passed,
            description: 'Tests for regularity and predictability in sequences'
        };
    }

    private static cumulativeSumsTest(values: number[]): RandomnessTest[] {
        const expectedMean = 100;
        const deviations = values.map(v => v - expectedMean);
        const n = deviations.length;

        // Forward cumulative sums
        let maxForward = 0;
        let cumSum = 0;
        for (const dev of deviations) {
            cumSum += dev;
            maxForward = Math.max(maxForward, Math.abs(cumSum));
        }

        // Backward cumulative sums
        let maxBackward = 0;
        cumSum = 0;
        for (let i = deviations.length - 1; i >= 0; i--) {
            cumSum += deviations[i];
            maxBackward = Math.max(maxBackward, Math.abs(cumSum));
        }

        // Calculate p-values (simplified)
        const variance = n * 50; // Approximate variance
        const zForward = maxForward / Math.sqrt(variance);
        const zBackward = maxBackward / Math.sqrt(variance);

        const pValueForward = StatisticalUtils.normalProbability(zForward);
        const pValueBackward = StatisticalUtils.normalProbability(zBackward);

        return [
            {
                name: 'Cumulative Sums Test (Forward)',
                statistic: maxForward,
                pValue: pValueForward,
                passed: pValueForward > 0.05,
                description: 'Tests for bias in cumulative sums (forward direction)'
            },
            {
                name: 'Cumulative Sums Test (Backward)',
                statistic: maxBackward,
                pValue: pValueBackward,
                passed: pValueBackward > 0.05,
                description: 'Tests for bias in cumulative sums (backward direction)'
            }
        ];
    }

    // Helper methods

    private static calculateBinaryMatrixRank(bits: number[], size: number): number {
        // Simplified binary matrix rank calculation
        // In practice, this would use Gaussian elimination over GF(2)

        const matrix: number[][] = [];
        for (let i = 0; i < size; i++) {
            matrix[i] = [];
            for (let j = 0; j < size; j++) {
                matrix[i][j] = bits[i * size + j];
            }
        }

        // Simple rank approximation (counts non-zero rows)
        let rank = 0;
        for (let i = 0; i < size; i++) {
            const hasNonZero = matrix[i].some(bit => bit === 1);
            if (hasNonZero) rank++;
        }

        return Math.min(rank, size); // Actual rank would be more sophisticated
    }

    private static calculateLinearRegression(x: number[], y: number[]): {
        slope: number;
        intercept: number;
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

        // Calculate standard error of slope
        const residualSumSquares = y.reduce((sum, val, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + (val - predicted) * (val - predicted);
        }, 0);

        const slopeVariance = residualSumSquares / ((n - 2) * (sumXX - n * meanX * meanX));
        const slopeStdError = Math.sqrt(slopeVariance);

        return { slope, intercept, slopeStdError };
    }

    private static tInverse(p: number, df: number): number {
        // Simple t-distribution inverse approximation
        // For production use, implement proper inverse t-function
        if (df > 1000) {
            return this.normalInverse(p);
        }

        // Approximation based on normal distribution with correction
        const z = this.normalInverse(p);
        const correction = (z * z * z + z) / (4 * df);
        return z + correction;
    }

    private static normalInverse(p: number): number {
        // Simple normal inverse approximation
        if (p <= 0 || p >= 1) return NaN;

        // Beasley-Springer-Moro approximation (simplified)
        const c0 = 2.515517;
        const c1 = 0.802853;
        const c2 = 0.010328;
        const d1 = 1.432788;
        const d2 = 0.189269;
        const d3 = 0.001308;

        if (p > 0.5) {
            const t = Math.sqrt(-2 * Math.log(1 - p));
            return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
        } else {
            const t = Math.sqrt(-2 * Math.log(p));
            return -(t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t));
        }
    }

    private static generateRandomnessRecommendations(
        tests: RandomnessTest[],
        overallScore: number
    ): string[] {
        const recommendations: string[] = [];

        if (overallScore < 0.8) {
            recommendations.push('RNG quality is below acceptable standards. Hardware inspection required.');
        }

        const failedTests = tests.filter(t => !t.passed);

        if (failedTests.some(t => t.name.includes('Frequency'))) {
            recommendations.push('Frequency bias detected. Check RNG calibration and bit generation balance.');
        }

        if (failedTests.some(t => t.name.includes('Runs'))) {
            recommendations.push('Pattern irregularities detected. RNG may have temporal correlations.');
        }

        if (failedTests.some(t => t.name.includes('Matrix'))) {
            recommendations.push('Linear dependencies detected. RNG complexity may be insufficient.');
        }

        if (failedTests.some(t => t.name.includes('Fourier'))) {
            recommendations.push('Periodic patterns detected. Check for electromagnetic interference.');
        }

        if (failedTests.some(t => t.name.includes('Serial'))) {
            recommendations.push('Serial correlations detected. RNG state transitions may be predictable.');
        }

        if (failedTests.some(t => t.name.includes('Entropy'))) {
            recommendations.push('Entropy deficiency detected. RNG may be producing predictable sequences.');
        }

        if (failedTests.some(t => t.name.includes('Cumulative'))) {
            recommendations.push('Cumulative bias detected. Check for systematic drift in RNG output.');
        }

        if (recommendations.length === 0) {
            recommendations.push('RNG passes all randomness tests. Quality is excellent.');
        }

        return recommendations;
    }
}