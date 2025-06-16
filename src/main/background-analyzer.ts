/**
 * Background Analysis Engine
 *
 * Provides continuous statistical monitoring with:
 * - Automatic anomaly detection
 * - Intention period correlation analysis
 * - Daily statistical summaries
 * - Trend identification
 * - Alert generation for significant events
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from '../database';
import { StatisticalAnalyzer } from '../core/statistics';
import {
    DailyReport,
    SignificantEvent,
    CorrelationResult,
    IntentionPeriodAnalysis,
    TimeRange,
    RNGTrial,
    IntentionPeriod
} from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Automatic analysis for continuous monitoring
 */
export class BackgroundAnalyzer extends EventEmitter {
    private analysisInterval: NodeJS.Timeout | null = null;
    private database: DatabaseManager;
    private statisticalAnalyzer: StatisticalAnalyzer;
    private lastAnalysisTime: Date = new Date();
    private significantEvents: SignificantEvent[] = [];
    private isRunning: boolean = false;

    constructor(database: DatabaseManager, statisticalAnalyzer: StatisticalAnalyzer) {
        super();
        this.database = database;
        this.statisticalAnalyzer = statisticalAnalyzer;
    }

    /**
     * Start periodic analysis
     */
    startPeriodicAnalysis(intervalMinutes: number = 5): void {
        if (this.isRunning) {
            console.warn('Background analysis already running');
            return;
        }

        console.log(`Starting background analysis (${intervalMinutes}min intervals)`);
        this.isRunning = true;
        this.lastAnalysisTime = new Date();

        this.analysisInterval = setInterval(async () => {
            try {
                await this.performAnalysis();
            } catch (error) {
                console.error('Background analysis error:', error);
                this.emit('analysisError', error);
            }
        }, intervalMinutes * 60 * 1000);

        this.emit('analysisStarted');
    }

    /**
     * Stop periodic analysis
     */
    stopPeriodicAnalysis(): void {
        if (!this.isRunning) return;

        console.log('Stopping background analysis');
        this.isRunning = false;

        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }

        this.emit('analysisStopped');
    }

    /**
     * Perform complete analysis cycle
     */
    private async performAnalysis(): Promise<void> {
        const now = new Date();
        console.log(`Performing background analysis at ${now.toISOString()}`);

        // Analyze recent data
        const recentAnalysis = await this.analyzeRecentData();

        // Detect significant periods
        const significantPeriods = await this.detectSignificantPeriods();

        // Correlate with intentions
        const correlations = await this.correlateWithIntentions();

        // Update last analysis time
        this.lastAnalysisTime = now;

        // Emit analysis results
        this.emit('analysisComplete', {
            timestamp: now,
            recentAnalysis,
            significantPeriods,
            correlations
        });
    }

    /**
     * Analyze recent data for anomalies
     */
    async analyzeRecentData(): Promise<{
        anomalies: SignificantEvent[];
        trends: any;
        statistics: any;
    }> {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (60 * 60 * 1000)); // Last hour

        try {
            // Get recent trials
            const trials = await this.database.trials.getByDateRange(startTime, endTime);

            if (trials.length === 0) {
                return { anomalies: [], trends: null, statistics: null };
            }

            // Calculate statistics
            const statistics = await this.statisticalAnalyzer.analyzeTrials(trials);

            // Detect anomalies
            const anomalies = await this.detectAnomalies(trials, statistics);

            // Analyze trends
            const trends = this.analyzeTrends(trials);

            return { anomalies, trends, statistics };

        } catch (error) {
            console.error('Error analyzing recent data:', error);
            return { anomalies: [], trends: null, statistics: null };
        }
    }

    /**
     * Detect significant periods in data
     */
    async detectSignificantPeriods(): Promise<SignificantEvent[]> {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000)); // Last 24 hours

        try {
            const trials = await this.database.trials.getByDateRange(startTime, endTime);
            const significantPeriods: SignificantEvent[] = [];

            // Use sliding window to detect significant periods
            const windowSize = 100; // 100 trials per window
            const stepSize = 50;    // 50 trial steps

            for (let i = 0; i < trials.length - windowSize; i += stepSize) {
                const windowTrials = trials.slice(i, i + windowSize);
                const statistics = await this.statisticalAnalyzer.analyzeTrials(windowTrials);

                // Check for significance
                if (Math.abs(statistics.zScore) > 2.0) { // 2-sigma threshold
                    const event: SignificantEvent = {
                        id: uuidv4(),
                        timestamp: new Date(),
                        type: 'deviation_spike',
                        severity: Math.abs(statistics.zScore) > 3.0 ? 'high' : 'medium',
                        description: `Significant deviation detected: Z-score ${statistics.zScore.toFixed(3)}`,
                        significance: {
                            zScore: statistics.zScore,
                            pValue: statistics.pValue
                        },
                        dataRange: {
                            startTime: windowTrials[0].timestamp,
                            endTime: windowTrials[windowTrials.length - 1].timestamp,
                            trialCount: windowTrials.length
                        },
                        notified: false
                    };

                    significantPeriods.push(event);
                }
            }

            // Store significant events
            for (const event of significantPeriods) {
                this.significantEvents.push(event);
                this.emit('significantEvent', event);
            }

            return significantPeriods;

        } catch (error) {
            console.error('Error detecting significant periods:', error);
            return [];
        }
    }

    /**
     * Correlate data with intention periods
     */
    async correlateWithIntentions(): Promise<CorrelationResult[]> {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (7 * 24 * 60 * 60 * 1000)); // Last week

        try {
            const trials = await this.database.trials.getByDateRange(startTime, endTime);
            const intentionPeriods = await this.database.intentionPeriods.getByDateRange(startTime, endTime);

            const correlations: CorrelationResult[] = [];

            // Analyze intention effectiveness
            const highIntentionTrials = trials.filter((t: RNGTrial) => t.intention === 'high');
            const lowIntentionTrials = trials.filter((t: RNGTrial) => t.intention === 'low');
            const baselineTrials = trials.filter((t: RNGTrial) => t.intention === null);

            if (highIntentionTrials.length > 0 && baselineTrials.length > 0) {
                const highStats = await this.statisticalAnalyzer.analyzeTrials(highIntentionTrials);
                const baselineStats = await this.statisticalAnalyzer.analyzeTrials(baselineTrials);

                const effectSize = (highStats.mean - baselineStats.mean) / baselineStats.standardDeviation;

                correlations.push({
                    type: 'intention_type',
                    correlation: effectSize,
                    significance: highStats.pValue,
                    description: `High intention effect: ${effectSize > 0 ? 'positive' : 'negative'} effect size of ${Math.abs(effectSize).toFixed(3)}`,
                    data: {
                        labels: ['Baseline', 'High Intention'],
                        values: [baselineStats.mean, highStats.mean]
                    }
                });
            }

            if (lowIntentionTrials.length > 0 && baselineTrials.length > 0) {
                const lowStats = await this.statisticalAnalyzer.analyzeTrials(lowIntentionTrials);
                const baselineStats = await this.statisticalAnalyzer.analyzeTrials(baselineTrials);

                const effectSize = (lowStats.mean - baselineStats.mean) / baselineStats.standardDeviation;

                correlations.push({
                    type: 'intention_type',
                    correlation: effectSize,
                    significance: lowStats.pValue,
                    description: `Low intention effect: ${effectSize < 0 ? 'negative' : 'positive'} effect size of ${Math.abs(effectSize).toFixed(3)}`,
                    data: {
                        labels: ['Baseline', 'Low Intention'],
                        values: [baselineStats.mean, lowStats.mean]
                    }
                });
            }

            // Time-of-day correlation
            const hourlyCorrelation = await this.analyzeTimeOfDayCorrelation(trials);
            if (hourlyCorrelation) {
                correlations.push(hourlyCorrelation);
            }

            return correlations;

        } catch (error) {
            console.error('Error correlating with intentions:', error);
            return [];
        }
    }

    /**
     * Generate daily report
     */
    async generateDailyReport(date: Date = new Date()): Promise<DailyReport> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        try {
            // Get day's data
            const trials = await this.database.trials.getByDateRange(startOfDay, endOfDay);
            const intentionPeriods = await this.database.intentionPeriods.getByDateRange(startOfDay, endOfDay);

            // Overall statistics
            const statistics = await this.statisticalAnalyzer.analyzeTrials(trials);

            // Analyze intention periods
            const intentionAnalysis = await this.analyzeIntentionPeriods(intentionPeriods, trials);

            // Get significant events for this day
            const dayEvents = this.significantEvents.filter(event =>
                event.timestamp >= startOfDay && event.timestamp < endOfDay
            );

            // Analyze trends
            const hourlyPatterns = await this.calculateHourlyPatterns(trials);
            const trends = {
                hourlyPatterns,
                deviationTrend: this.analyzeDeviationTrend(trials),
                effectStrength: this.assessEffectStrength(intentionAnalysis)
            };

            // Quality metrics
            const qualityMetrics = {
                dataCompleteness: this.calculateDataCompleteness(trials, startOfDay, endOfDay),
                timingAccuracy: this.calculateTimingAccuracy(trials),
                anomalies: this.countAnomalies(trials)
            };

            const report: DailyReport = {
                date: startOfDay,
                totalTrials: trials.length,
                intentionPeriods: intentionPeriods.length,
                statistics,
                intentionAnalysis,
                significantEvents: dayEvents,
                trends,
                qualityMetrics
            };

            this.emit('dailyReport', report);
            return report;

        } catch (error) {
            console.error('Error generating daily report:', error);
            throw error;
        }
    }

    /**
     * Detect anomalies in trial data
     */
    private async detectAnomalies(trials: RNGTrial[], statistics: any): Promise<SignificantEvent[]> {
        const anomalies: SignificantEvent[] = [];

        // Check for statistical significance
        if (Math.abs(statistics.zScore) > 2.5) {
            anomalies.push({
                id: uuidv4(),
                timestamp: new Date(),
                type: 'deviation_spike',
                severity: Math.abs(statistics.zScore) > 3.0 ? 'high' : 'medium',
                description: `Significant deviation: Z-score ${statistics.zScore.toFixed(3)}`,
                significance: {
                    zScore: statistics.zScore,
                    pValue: statistics.pValue
                },
                dataRange: {
                    startTime: trials[0].timestamp,
                    endTime: trials[trials.length - 1].timestamp,
                    trialCount: trials.length
                },
                notified: false
            });
        }

        // Check for trend changes
        const trendChange = this.detectTrendChange(trials);
        if (trendChange) {
            anomalies.push(trendChange);
        }

        return anomalies;
    }

    /**
     * Analyze trends in trial data
     */
    private analyzeTrends(trials: RNGTrial[]): any {
        if (trials.length < 10) return null;

        const values = trials.map(t => t.trialValue);
        const timePoints = trials.map(t => t.timestamp.getTime());

        // Calculate linear regression
        const n = values.length;
        const sumX = timePoints.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = timePoints.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return {
            slope,
            intercept,
            direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
            strength: Math.abs(slope)
        };
    }

    /**
     * Analyze time-of-day correlation
     */
    private async analyzeTimeOfDayCorrelation(trials: RNGTrial[]): Promise<CorrelationResult | null> {
        if (trials.length < 24) return null;

        const hourlyData = new Array(24).fill(0).map(() => ({ trials: [], sum: 0, count: 0 }));

        // Group trials by hour
        trials.forEach(trial => {
            const hour = trial.timestamp.getHours();
            hourlyData[hour].trials.push(trial);
            hourlyData[hour].sum += trial.trialValue;
            hourlyData[hour].count++;
        });

        // Calculate hourly averages
        const hourlyAverages = hourlyData.map(data =>
            data.count > 0 ? data.sum / data.count : 100
        );

        // Calculate correlation with expected sine wave (circadian rhythm)
        const expectedPattern = Array.from({ length: 24 }, (_, i) =>
            100 + Math.sin((i - 6) * Math.PI / 12) * 2 // Peak at noon, trough at midnight
        );

        const correlation = this.calculateCorrelation(hourlyAverages, expectedPattern);

        if (Math.abs(correlation) > 0.3) { // Meaningful correlation threshold
            return {
                type: 'time_of_day',
                correlation,
                significance: 0.05, // TODO: Calculate proper significance
                description: `Time-of-day correlation: ${correlation > 0 ? 'positive' : 'negative'} (${Math.abs(correlation).toFixed(3)})`,
                data: {
                    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                    values: hourlyAverages
                }
            };
        }

        return null;
    }

    /**
     * Analyze intention periods
     */
    private async analyzeIntentionPeriods(
        periods: IntentionPeriod[],
        allTrials: RNGTrial[]
    ): Promise<DailyReport['intentionAnalysis']> {
        const highPeriods: IntentionPeriodAnalysis[] = [];
        const lowPeriods: IntentionPeriodAnalysis[] = [];

        for (const period of periods) {
            const periodTrials = allTrials.filter(trial =>
                trial.timestamp >= period.startTime &&
                (period.endTime ? trial.timestamp <= period.endTime : true)
            );

            if (periodTrials.length === 0) continue;

            const statistics = await this.statisticalAnalyzer.analyzeTrials(periodTrials);

            const analysis: IntentionPeriodAnalysis = {
                period,
                trialCount: periodTrials.length,
                statistics,
                baselineComparison: {
                    zScoreChange: statistics.zScore,
                    effectSize: (statistics.mean - 100) / statistics.standardDeviation,
                    significance: statistics.pValue
                },
                successRating: this.calculateSuccessRating(period.intention, statistics),
                quality: this.assessPeriodQuality(periodTrials, statistics)
            };

            if (period.intention === 'high') {
                highPeriods.push(analysis);
            } else {
                lowPeriods.push(analysis);
            }
        }

        // Calculate overall effectiveness
        const effectiveness = this.calculateOverallEffectiveness(highPeriods, lowPeriods);

        return {
            highPeriods,
            lowPeriods,
            effectiveness
        };
    }

    /**
     * Calculate hourly patterns
     */
    private async calculateHourlyPatterns(trials: RNGTrial[]): Promise<number[]> {
        const hourlyData = new Array(24).fill(0).map(() => ({ sum: 0, count: 0 }));

        trials.forEach(trial => {
            const hour = trial.timestamp.getHours();
            hourlyData[hour].sum += trial.trialValue;
            hourlyData[hour].count++;
        });

        return hourlyData.map(data => data.count > 0 ? data.sum / data.count : 100);
    }

    /**
     * Helper methods
     */
    private calculateCorrelation(x: number[], y: number[]): number {
        if (x.length !== y.length) return 0;

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private calculateSuccessRating(intention: 'high' | 'low', statistics: any): number {
        const expectedDirection = intention === 'high' ? 1 : -1;
        const actualDirection = statistics.mean > 100 ? 1 : -1;
        const agreement = expectedDirection === actualDirection ? 1 : 0;
        const strength = Math.abs(statistics.zScore) / 3.0; // Normalized to 3-sigma

        return agreement * Math.min(strength, 1.0);
    }

    private assessPeriodQuality(trials: RNGTrial[], statistics: any): 'excellent' | 'good' | 'fair' | 'poor' {
        const trialCount = trials.length;
        const significance = Math.abs(statistics.zScore);

        if (trialCount >= 100 && significance > 2.0) return 'excellent';
        if (trialCount >= 50 && significance > 1.5) return 'good';
        if (trialCount >= 20 && significance > 1.0) return 'fair';
        return 'poor';
    }

    private calculateOverallEffectiveness(
        highPeriods: IntentionPeriodAnalysis[],
        lowPeriods: IntentionPeriodAnalysis[]
    ): number {
        let totalEffect = 0;
        let totalPeriods = 0;

        highPeriods.forEach(period => {
            totalEffect += period.successRating;
            totalPeriods++;
        });

        lowPeriods.forEach(period => {
            totalEffect += period.successRating;
            totalPeriods++;
        });

        return totalPeriods > 0 ? totalEffect / totalPeriods : 0;
    }

    private analyzeDeviationTrend(trials: RNGTrial[]): 'increasing' | 'decreasing' | 'stable' {
        if (trials.length < 10) return 'stable';

        const deviations = trials.map(t => Math.abs(t.trialValue - 100));
        const firstHalf = deviations.slice(0, Math.floor(deviations.length / 2));
        const secondHalf = deviations.slice(Math.floor(deviations.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const difference = secondAvg - firstAvg;

        if (Math.abs(difference) < 0.5) return 'stable';
        return difference > 0 ? 'increasing' : 'decreasing';
    }

    private assessEffectStrength(intentionAnalysis: DailyReport['intentionAnalysis']): 'weak' | 'moderate' | 'strong' {
        const effectiveness = intentionAnalysis.effectiveness;

        if (effectiveness > 0.7) return 'strong';
        if (effectiveness > 0.4) return 'moderate';
        return 'weak';
    }

    private calculateDataCompleteness(trials: RNGTrial[], startTime: Date, endTime: Date): number {
        const expectedTrials = (endTime.getTime() - startTime.getTime()) / 1000; // 1 trial per second
        return Math.min(trials.length / expectedTrials, 1.0);
    }

    private calculateTimingAccuracy(trials: RNGTrial[]): number {
        if (trials.length < 2) return 0;

        let totalError = 0;
        for (let i = 1; i < trials.length; i++) {
            const actualInterval = trials[i].timestamp.getTime() - trials[i - 1].timestamp.getTime();
            const expectedInterval = 1000; // 1 second
            totalError += Math.abs(actualInterval - expectedInterval);
        }

        return totalError / (trials.length - 1);
    }

    private countAnomalies(trials: RNGTrial[]): number {
        let anomalies = 0;
        trials.forEach(trial => {
            if (trial.trialValue < 50 || trial.trialValue > 150) {
                anomalies++;
            }
        });
        return anomalies;
    }

    private detectTrendChange(trials: RNGTrial[]): SignificantEvent | null {
        // Simple trend change detection
        // This could be more sophisticated with proper changepoint detection
        return null;
    }

    /**
     * Get recent significant events
     */
    getRecentSignificantEvents(hours: number = 24): SignificantEvent[] {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.significantEvents.filter(event => event.timestamp >= cutoff);
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.stopPeriodicAnalysis();
        this.removeAllListeners();
        this.significantEvents = [];
    }
}