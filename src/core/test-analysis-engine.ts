/**
 * Test file for Advanced Statistical Analysis Engine
 * Demonstrates capabilities with sample data
 */

import { RNGTrial } from '../shared/types';
import { AdvancedStatistics } from './advanced-statistics';
import { RealtimeAnalysis } from './realtime-analysis';
import { BaselineAnalysis } from './baseline-analysis';
import { RunningStats, IntentionPeriod } from '../shared/analysis-types';

export class AnalysisEngineDemo {

    /**
     * Generate realistic test data for demonstration
     */
    static generateTestData(): {
        randomTrials: RNGTrial[];
        biasedTrials: RNGTrial[];
        controlTrials: RNGTrial[];
        intentionTrials: RNGTrial[];
    } {
        const now = new Date();

        // Generate random trials (should show no significant effects)
        const randomTrials: RNGTrial[] = [];
        for (let i = 0; i < 1000; i++) {
            // Normal distribution around 100 with std 7.07 (sqrt(50))
            const result = this.generateNormalRandom(100, 7.07);
            randomTrials.push({
                id: `random_${i}`,
                sessionId: 'test_session_random',
                timestamp: new Date(now.getTime() - (1000 - i) * 5), // 5ms intervals
                result: Math.round(Math.max(0, Math.min(200, result))), // Clamp to valid range
                metadata: {}
            });
        }

        // Generate slightly biased trials (small positive bias)
        const biasedTrials: RNGTrial[] = [];
        for (let i = 0; i < 1000; i++) {
            const result = this.generateNormalRandom(102, 7.07); // 2-point bias
            biasedTrials.push({
                id: `biased_${i}`,
                sessionId: 'test_session_biased',
                timestamp: new Date(now.getTime() - (1000 - i) * 5),
                result: Math.round(Math.max(0, Math.min(200, result))),
                metadata: {}
            });
        }

        // Generate control period trials
        const controlTrials: RNGTrial[] = [];
        for (let i = 0; i < 500; i++) {
            const result = this.generateNormalRandom(100, 7.07);
            controlTrials.push({
                id: `control_${i}`,
                sessionId: 'test_session_control',
                timestamp: new Date(now.getTime() - (500 - i) * 5),
                result: Math.round(Math.max(0, Math.min(200, result))),
                metadata: { period: 'control' }
            });
        }

        // Generate intention period trials (small positive intention effect)
        const intentionTrials: RNGTrial[] = [];
        for (let i = 0; i < 500; i++) {
            const result = this.generateNormalRandom(101.5, 7.07); // Small effect
            intentionTrials.push({
                id: `intention_${i}`,
                sessionId: 'test_session_intention',
                timestamp: new Date(now.getTime() - (500 - i) * 5),
                result: Math.round(Math.max(0, Math.min(200, result))),
                metadata: { period: 'intention' }
            });
        }

        return { randomTrials, biasedTrials, controlTrials, intentionTrials };
    }

    /**
     * Generate normally distributed random numbers using Box-Muller transform
     */
    private static generateNormalRandom(mean: number, stdDev: number): number {
        const u = Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return mean + stdDev * z;
    }

    /**
     * Demonstrate comprehensive statistical analysis
     */
    static async runStatisticalDemo(): Promise<void> {
        console.log('=== ADVANCED STATISTICAL ANALYSIS ENGINE DEMO ===\n');

        const testData = this.generateTestData();

        // 1. Network Variance Analysis (GCP Primary Method)
        console.log('1. NETWORK VARIANCE ANALYSIS (GCP Method)');
        console.log('==========================================');

        try {
            const randomNetvar = AdvancedStatistics.calculateNetworkVariance(testData.randomTrials);
            console.log('Random Data Analysis:');
            console.log(`  Network Variance: ${randomNetvar.netvar.toFixed(2)}`);
            console.log(`  Expected: ${randomNetvar.expectedNetvar.toFixed(2)}`);
            console.log(`  Chi-square: ${randomNetvar.chisquare.toFixed(2)}`);
            console.log(`  P-value: ${randomNetvar.probability.toFixed(6)}`);
            console.log(`  Significance: ${randomNetvar.significance}`);
            console.log(`  Confidence Interval: [${randomNetvar.confidenceInterval[0].toFixed(2)}, ${randomNetvar.confidenceInterval[1].toFixed(2)}]`);

            const biasedNetvar = AdvancedStatistics.calculateNetworkVariance(testData.biasedTrials);
            console.log('\nBiased Data Analysis:');
            console.log(`  Network Variance: ${biasedNetvar.netvar.toFixed(2)}`);
            console.log(`  Expected: ${biasedNetvar.expectedNetvar.toFixed(2)}`);
            console.log(`  Chi-square: ${biasedNetvar.chisquare.toFixed(2)}`);
            console.log(`  P-value: ${biasedNetvar.probability.toFixed(6)}`);
            console.log(`  Significance: ${biasedNetvar.significance}`);

        } catch (error) {
            console.error('Error in Network Variance Analysis:', error);
        }

        // 2. Cumulative Deviation Analysis
        console.log('\n\n2. CUMULATIVE DEVIATION ANALYSIS');
        console.log('=================================');

        try {
            const randomCumDev = AdvancedStatistics.calculateCumulativeDeviation(testData.randomTrials);
            console.log('Random Data:');
            console.log(`  Final Deviation: ${randomCumDev.finalDeviation.toFixed(2)}`);
            console.log(`  Max Deviation: ${randomCumDev.maxDeviation.toFixed(2)}`);
            console.log(`  Min Deviation: ${randomCumDev.minDeviation.toFixed(2)}`);
            console.log(`  Zero Crossings: ${randomCumDev.crossings}`);
            console.log(`  Excursion Periods: ${randomCumDev.excursions.length}`);

            if (randomCumDev.excursions.length > 0) {
                const firstExcursion = randomCumDev.excursions[0];
                console.log(`  First Excursion: ${firstExcursion.maxDeviation.toFixed(2)} (p=${firstExcursion.significance.toFixed(4)})`);
            }

            const biasedCumDev = AdvancedStatistics.calculateCumulativeDeviation(testData.biasedTrials);
            console.log('\nBiased Data:');
            console.log(`  Final Deviation: ${biasedCumDev.finalDeviation.toFixed(2)}`);
            console.log(`  Max Deviation: ${biasedCumDev.maxDeviation.toFixed(2)}`);
            console.log(`  Excursion Periods: ${biasedCumDev.excursions.length}`);

        } catch (error) {
            console.error('Error in Cumulative Deviation Analysis:', error);
        }

        // 3. Z-Score Analysis
        console.log('\n\n3. Z-SCORE ANALYSIS');
        console.log('===================');

        try {
            const randomZScore = AdvancedStatistics.calculateZScore(testData.randomTrials);
            console.log('Random Data:');
            console.log(`  Z-Score: ${randomZScore.zScore.toFixed(4)}`);
            console.log(`  P-value (2-tailed): ${randomZScore.pValue.toFixed(6)}`);
            console.log(`  P-value (1-tailed): ${randomZScore.pValueOneTailed.toFixed(6)}`);
            console.log(`  Effect Size: ${randomZScore.effectSize.toFixed(4)}`);
            console.log(`  Sample Size: ${randomZScore.sampleSize}`);
            console.log(`  Significance: ${randomZScore.significance}`);

            const biasedZScore = AdvancedStatistics.calculateZScore(testData.biasedTrials);
            console.log('\nBiased Data:');
            console.log(`  Z-Score: ${biasedZScore.zScore.toFixed(4)}`);
            console.log(`  P-value (2-tailed): ${biasedZScore.pValue.toFixed(6)}`);
            console.log(`  Effect Size: ${biasedZScore.effectSize.toFixed(4)}`);
            console.log(`  Significance: ${biasedZScore.significance}`);

        } catch (error) {
            console.error('Error in Z-Score Analysis:', error);
        }

        // 4. Effect Size Analysis
        console.log('\n\n4. EFFECT SIZE ANALYSIS');
        console.log('=======================');

        try {
            const biasedEffect = AdvancedStatistics.calculateEffectSize(testData.biasedTrials);
            console.log('Biased Data Effect Size:');
            console.log(`  Cohen's d: ${biasedEffect.cohensD.toFixed(4)}`);
            console.log(`  Hedges' g: ${biasedEffect.hedgesG.toFixed(4)}`);
            console.log(`  Point-biserial r: ${biasedEffect.pointBiserial.toFixed(4)}`);
            console.log(`  Interpretation: ${biasedEffect.interpretation}`);
            console.log(`  Practical Significance: ${biasedEffect.practicalSignificance}`);
            console.log(`  Confidence Interval: [${biasedEffect.confidenceInterval[0].toFixed(4)}, ${biasedEffect.confidenceInterval[1].toFixed(4)}]`);

        } catch (error) {
            console.error('Error in Effect Size Analysis:', error);
        }

        // 5. Real-time Analysis Demo
        console.log('\n\n5. REAL-TIME ANALYSIS DEMO');
        console.log('==========================');

        try {
            // Simulate real-time statistics updates
            let runningStats: RunningStats = {
                count: 0,
                sum: 0,
                sumOfSquares: 0,
                mean: 0,
                variance: 0,
                standardDeviation: 0,
                cumulativeDeviation: 0,
                lastUpdated: new Date(),
                minValue: Infinity,
                maxValue: -Infinity
            };

            // Process first 10 trials to show incremental updates
            for (let i = 0; i < 10; i++) {
                runningStats = RealtimeAnalysis.updateRunningStats(testData.biasedTrials[i], runningStats);
            }

            console.log('Running Statistics (after 10 trials):');
            console.log(`  Count: ${runningStats.count}`);
            console.log(`  Mean: ${runningStats.mean.toFixed(3)}`);
            console.log(`  Std Dev: ${runningStats.standardDeviation.toFixed(3)}`);
            console.log(`  Cumulative Deviation: ${runningStats.cumulativeDeviation.toFixed(3)}`);

            // Current significance assessment
            const currentSignificance = RealtimeAnalysis.getCurrentSignificance(testData.biasedTrials.slice(0, 100));
            console.log('\nCurrent Significance (100 trials):');
            console.log(`  P-value: ${currentSignificance.pValue.toFixed(6)}`);
            console.log(`  Effect Size: ${currentSignificance.effectSize.toFixed(4)}`);
            console.log(`  Interpretation: ${currentSignificance.interpretation}`);
            console.log(`  Observed Power: ${currentSignificance.powerAnalysis.observedPower.toFixed(3)}`);
            console.log(`  Required Sample Size (80% power): ${currentSignificance.powerAnalysis.requiredSampleSize}`);

            // Trend detection
            const trendResult = RealtimeAnalysis.detectTrend(testData.biasedTrials, 50);
            console.log('\nTrend Analysis:');
            console.log(`  Trend Direction: ${trendResult.trendDirection}`);
            console.log(`  Slope: ${trendResult.slope.toFixed(6)}`);
            console.log(`  Slope Significance: ${trendResult.slopeSignificance.toFixed(6)}`);
            console.log(`  Correlation: ${trendResult.correlation.toFixed(4)}`);
            console.log(`  Change Points: ${trendResult.changePoints.length}`);

        } catch (error) {
            console.error('Error in Real-time Analysis:', error);
        }

        // 6. Quality Assessment
        console.log('\n\n6. DATA QUALITY ASSESSMENT');
        console.log('===========================');

        try {
            const randomQuality = RealtimeAnalysis.assessDataQuality(testData.randomTrials);
            console.log('Random Data Quality:');
            console.log(`  Randomness Score: ${randomQuality.randomnessScore.toFixed(3)}`);
            console.log(`  Bias Detected: ${randomQuality.biasDetected}`);
            console.log(`  Pattern Issues: ${randomQuality.patterns.length}`);
            console.log(`  Data Integrity Issues: ${randomQuality.dataIntegrity.duplicates} duplicates, ${randomQuality.dataIntegrity.temporalGaps.length} gaps`);
            console.log(`  Recommendations: ${randomQuality.recommendations.length}`);
            if (randomQuality.recommendations.length > 0) {
                console.log(`  - ${randomQuality.recommendations[0]}`);
            }

            const biasedQuality = RealtimeAnalysis.assessDataQuality(testData.biasedTrials);
            console.log('\nBiased Data Quality:');
            console.log(`  Randomness Score: ${biasedQuality.randomnessScore.toFixed(3)}`);
            console.log(`  Bias Detected: ${biasedQuality.biasDetected}`);
            console.log(`  Pattern Issues: ${biasedQuality.patterns.length}`);

        } catch (error) {
            console.error('Error in Quality Assessment:', error);
        }

        // 7. Baseline Analysis
        console.log('\n\n7. BASELINE ANALYSIS');
        console.log('====================');

        try {
            // Randomness testing
            const randomnessTest = BaselineAnalysis.runRandomnessTests(testData.randomTrials);
            console.log('Randomness Test Results:');
            console.log(`  Overall Score: ${randomnessTest.overallScore.toFixed(3)}`);
            console.log(`  Random at 95% level: ${randomnessTest.isRandomAtLevel}`);
            console.log(`  Tests Run: ${randomnessTest.tests.length}`);
            console.log(`  Tests Passed: ${randomnessTest.tests.filter(t => t.passed).length}`);

            // Show a few test results
            if (randomnessTest.tests.length > 0) {
                const frequencyTest = randomnessTest.tests.find(t => t.name.includes('Frequency'));
                if (frequencyTest) {
                    console.log(`  ${frequencyTest.name}: p=${frequencyTest.pValue.toFixed(4)}, passed=${frequencyTest.passed}`);
                }

                const runsTest = randomnessTest.tests.find(t => t.name.includes('Runs'));
                if (runsTest) {
                    console.log(`  ${runsTest.name}: p=${runsTest.pValue.toFixed(4)}, passed=${runsTest.passed}`);
                }
            }

            // Calibration analysis
            const calibrationAnalysis = BaselineAnalysis.analyzeCalibrationData(
                testData.randomTrials.slice(0, 500), // Baseline
                testData.biasedTrials.slice(0, 500)  // Current
            );
            console.log('\nCalibration Analysis:');
            console.log(`  Baseline Mean: ${calibrationAnalysis.baselineMean.toFixed(3)}`);
            console.log(`  Current Mean: ${calibrationAnalysis.currentMean.toFixed(3)}`);
            console.log(`  Drift: ${calibrationAnalysis.drift.toFixed(3)}`);
            console.log(`  Drift Significance: ${calibrationAnalysis.driftSignificance.toFixed(6)}`);
            console.log(`  Recalibration Needed: ${calibrationAnalysis.recalibrationNeeded}`);

            // Control vs Intention comparison
            const comparison = BaselineAnalysis.compareControlPeriods(
                testData.intentionTrials,
                testData.controlTrials
            );
            console.log('\nControl vs Intention Comparison:');
            console.log(`  Mean Difference: ${comparison.meanDifference.toFixed(4)}`);
            console.log(`  T-statistic: ${comparison.tStatistic.toFixed(4)}`);
            console.log(`  P-value: ${comparison.pValue.toFixed(6)}`);
            console.log(`  Effect Size (Cohen's d): ${comparison.effectSize.toFixed(4)}`);
            console.log(`  Significant Difference: ${comparison.significantDifference}`);
            console.log(`  95% Confidence Interval: [${comparison.confidenceInterval[0].toFixed(4)}, ${comparison.confidenceInterval[1].toFixed(4)}]`);

        } catch (error) {
            console.error('Error in Baseline Analysis:', error);
        }

        console.log('\n=== ANALYSIS COMPLETE ===');
        console.log('The statistical analysis engine successfully demonstrates:');
        console.log('• GCP Network Variance methodology');
        console.log('• Real-time cumulative deviation tracking');
        console.log('• Comprehensive effect size calculations');
        console.log('• Live data quality monitoring');
        console.log('• NIST randomness test suite');
        console.log('• Consciousness research protocols');
        console.log('\nAll calculations follow published PEAR and GCP methodologies.');
    }

    /**
     * Demonstrate time series analysis capabilities
     */
    static demonstrateTimeSeriesAnalysis(): void {
        console.log('\n8. TIME SERIES ANALYSIS PREVIEW');
        console.log('================================');

        const testData = this.generateTestData();

        // Show cumulative deviation time series data structure
        const cumulativePoints = RealtimeAnalysis.getCumulativeDeviationSeries(testData.biasedTrials, 100);

        console.log('Cumulative Deviation Time Series (sample points):');
        console.log('Index | Timestamp | Cum Dev | Z-Score | Running Mean');
        console.log('------|-----------|---------|---------|-------------');

        for (let i = 0; i < Math.min(5, cumulativePoints.length); i++) {
            const point = cumulativePoints[i];
            const timeStr = point.timestamp.toISOString().substr(11, 12);
            console.log(`${point.trialIndex.toString().padStart(5)} | ${timeStr} | ${point.cumulativeDeviation.toFixed(3).padStart(7)} | ${point.zScore.toFixed(3).padStart(7)} | ${point.runningMean.toFixed(3).padStart(11)}`);
        }

        if (cumulativePoints.length > 5) {
            console.log('... (showing first 5 of ' + cumulativePoints.length + ' points)');
        }
    }
}

// Export function to run the demo
export function runAnalysisEngineDemo(): Promise<void> {
    console.log('Starting Advanced Statistical Analysis Engine Demo...\n');

    return AnalysisEngineDemo.runStatisticalDemo()
        .then(() => {
            AnalysisEngineDemo.demonstrateTimeSeriesAnalysis();
            console.log('\nDemo completed successfully!');
        })
        .catch((error) => {
            console.error('Demo failed:', error);
            throw error;
        });
}