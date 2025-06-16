import { EventEmitter } from 'events';
import { RNGEngine } from '../../core/rng-engine';
import { RandomnessValidator, RandomnessTestSuite } from './RandomnessValidator';
import { BaselineEstimator } from './BaselineEstimator';
import { DatabaseManager } from '../../database/DatabaseManager';

export interface CalibrationResult {
    id: string;
    timestamp: Date;
    trials: number;
    duration: number;
    rngHealth: number;
    passRate: number;
    testResults: RandomnessTestSuite;
    baseline: {
        mean: number;
        variance: number;
        standardDeviation: number;
    };
    quality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'failed';
    recommendations: string[];
}

export interface ExtendedCalibrationResult extends CalibrationResult {
    longTermDrift: number;
    periodicPatterns: number[];
    environmentalCorrelations: Map<string, number>;
    degradationIndicators: string[];
    nextCalibrationDue: Date;
}

export interface HardwareHealthReport {
    timestamp: Date;
    overallHealth: number;
    rngPerformance: number;
    timingAccuracy: number;
    dataIntegrity: number;
    systemResources: {
        cpu: number;
        memory: number;
        disk: number;
    };
    environmentalFactors: {
        temperature: number;
        humidity: number;
        electromagnetic: number;
    };
    recommendations: string[];
}

export type CalibrationInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export class CalibrationManager extends EventEmitter {
    private rngEngine: RNGEngine;
    private randomnessValidator: RandomnessValidator;
    private baselineEstimator: BaselineEstimator;
    private database: DatabaseManager;
    private isCalibrating: boolean = false;
    private lastCalibration: Date | null = null;
    private scheduledCalibrations: Map<CalibrationInterval, NodeJS.Timeout> = new Map();

    constructor() {
        super();
        this.rngEngine = new RNGEngine({
            // algorithm: 'isaac', // Note: algorithm property needs to be added to RNGConfig
            // entropyBits: 256 // Note: entropyBits property needs to be added to RNGConfig
        });
        this.randomnessValidator = new RandomnessValidator();
        this.baselineEstimator = new BaselineEstimator();
        this.database = new DatabaseManager();

        this.initializeCalibrationTables();
    }

    private async initializeCalibrationTables(): Promise<void> {
        const db = this.database.getDatabase();

        // Calibration results table
        db.exec(`
      CREATE TABLE IF NOT EXISTS calibration_results (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        trials INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        rng_health REAL NOT NULL,
        pass_rate REAL NOT NULL,
        baseline_mean REAL NOT NULL,
        baseline_variance REAL NOT NULL,
        baseline_std_dev REAL NOT NULL,
        quality TEXT NOT NULL,
        test_results TEXT NOT NULL,
        recommendations TEXT NOT NULL
      )
    `);

        // Hardware health reports table
        db.exec(`
      CREATE TABLE IF NOT EXISTS hardware_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        overall_health REAL NOT NULL,
        rng_performance REAL NOT NULL,
        timing_accuracy REAL NOT NULL,
        data_integrity REAL NOT NULL,
        cpu_usage REAL NOT NULL,
        memory_usage REAL NOT NULL,
        disk_usage REAL NOT NULL,
        environmental_data TEXT,
        recommendations TEXT
      )
    `);

        // Calibration schedule table
        db.exec(`
      CREATE TABLE IF NOT EXISTS calibration_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        interval_type TEXT NOT NULL,
        last_run INTEGER,
        next_due INTEGER NOT NULL,
        enabled BOOLEAN DEFAULT 1
      )
    `);
    }

    async runStandardCalibration(trials: number = 100000): Promise<CalibrationResult> {
        if (this.isCalibrating) {
            throw new Error('Calibration already in progress');
        }

        this.isCalibrating = true;
        this.emit('calibrationStarted', { type: 'standard', trials });

        try {
            const startTime = Date.now();
            const calibrationId = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Generate calibration data
            this.emit('calibrationProgress', { phase: 'generating_data', progress: 0 });
            const calibrationData: number[] = [];

            for (let i = 0; i < trials; i++) {
                calibrationData.push(this.rngEngine.generateBit());

                if (i % Math.floor(trials / 100) === 0) {
                    this.emit('calibrationProgress', {
                        phase: 'generating_data',
                        progress: (i / trials) * 100
                    });
                }
            }

            // Run randomness tests
            this.emit('calibrationProgress', { phase: 'running_tests', progress: 0 });
            const testResults = await this.randomnessValidator.runFullTestSuite(calibrationData);

            // Calculate baseline
            this.emit('calibrationProgress', { phase: 'calculating_baseline', progress: 0 });
            const baseline = await this.baselineEstimator.calculateBaseline(calibrationData);

            // Assess quality
            const passRate = this.calculatePassRate(testResults);
            const rngHealth = this.assessRNGHealth(testResults, baseline);
            const quality = this.determineQuality(passRate, rngHealth);
            const recommendations = this.generateRecommendations(testResults, baseline, quality);

            const duration = Date.now() - startTime;

            const result: CalibrationResult = {
                id: calibrationId,
                timestamp: new Date(),
                trials,
                duration,
                rngHealth,
                passRate,
                testResults,
                baseline: {
                    mean: baseline.mean,
                    variance: baseline.variance,
                    standardDeviation: baseline.standardDeviation
                },
                quality,
                recommendations
            };

            // Store result
            await this.storeCalibrationResult(result);
            this.lastCalibration = new Date();

            this.emit('calibrationCompleted', result);
            return result;

        } finally {
            this.isCalibrating = false;
        }
    }

    async runExtendedCalibration(hours: number = 24): Promise<ExtendedCalibrationResult> {
        if (this.isCalibrating) {
            throw new Error('Calibration already in progress');
        }

        this.isCalibrating = true;
        this.emit('calibrationStarted', { type: 'extended', hours });

        try {
            const startTime = Date.now();
            const calibrationId = `ext_cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const totalDuration = hours * 60 * 60 * 1000; // Convert to milliseconds
            const checkInterval = Math.min(60000, totalDuration / 100); // Check every minute or 1% of duration

            const allData: number[] = [];
            const timeSeriesData: Array<{ timestamp: number; data: number[] }> = [];

            while (Date.now() - startTime < totalDuration) {
                const intervalStart = Date.now();
                const intervalData: number[] = [];

                // Generate data for this interval (approximately 1000 bits per interval)
                for (let i = 0; i < 1000; i++) {
                    const bit = this.rngEngine.generateBit();
                    intervalData.push(bit);
                    allData.push(bit);
                }

                timeSeriesData.push({
                    timestamp: intervalStart,
                    data: intervalData
                });

                const progress = ((Date.now() - startTime) / totalDuration) * 100;
                this.emit('calibrationProgress', {
                    phase: 'extended_collection',
                    progress,
                    elapsed: Date.now() - startTime,
                    remaining: totalDuration - (Date.now() - startTime)
                });

                // Wait for next interval
                const sleepTime = checkInterval - (Date.now() - intervalStart);
                if (sleepTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, sleepTime));
                }
            }

            // Run comprehensive analysis
            this.emit('calibrationProgress', { phase: 'extended_analysis', progress: 0 });

            const testResults = await this.randomnessValidator.runFullTestSuite(allData);
            const baseline = await this.baselineEstimator.calculateBaseline(allData);

            // Extended analysis
            const longTermDrift = this.baselineEstimator.calculateLongTermDrift(timeSeriesData);
            const periodicPatterns = this.baselineEstimator.detectPeriodicPatterns(timeSeriesData);
            const environmentalCorrelations = await this.analyzeEnvironmentalCorrelations(timeSeriesData);
            const degradationIndicators = this.identifyDegradationIndicators(testResults, baseline);

            const passRate = this.calculatePassRate(testResults);
            const rngHealth = this.assessRNGHealth(testResults, baseline);
            const quality = this.determineQuality(passRate, rngHealth);
            const recommendations = this.generateExtendedRecommendations(
                testResults, baseline, longTermDrift, periodicPatterns, quality
            );

            const duration = Date.now() - startTime;
            const nextCalibrationDue = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days

            const result: ExtendedCalibrationResult = {
                id: calibrationId,
                timestamp: new Date(),
                trials: allData.length,
                duration,
                rngHealth,
                passRate,
                testResults,
                baseline: {
                    mean: baseline.mean,
                    variance: baseline.variance,
                    standardDeviation: baseline.standardDeviation
                },
                quality,
                recommendations,
                longTermDrift,
                periodicPatterns,
                environmentalCorrelations,
                degradationIndicators,
                nextCalibrationDue
            };

            await this.storeExtendedCalibrationResult(result);
            this.lastCalibration = new Date();

            this.emit('calibrationCompleted', result);
            return result;

        } finally {
            this.isCalibrating = false;
        }
    }

    async runRandomnessTests(data?: number[]): Promise<RandomnessTestSuite> {
        let testData = data;

        if (!testData) {
            // Generate fresh test data
            testData = [];
            for (let i = 0; i < 100000; i++) {
                testData.push(this.rngEngine.generateBit());
            }
        }

        this.emit('testsStarted', { dataLength: testData.length });
        const results = await this.randomnessValidator.runFullTestSuite(testData);
        this.emit('testsCompleted', results);

        return results;
    }

    async schedulePeriodicCalibration(interval: CalibrationInterval): Promise<void> {
        // Clear existing schedule for this interval
        const existingTimeout = this.scheduledCalibrations.get(interval);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const intervalMs = this.getIntervalMilliseconds(interval);

        const timeout = setTimeout(async () => {
            try {
                await this.runStandardCalibration();
                // Reschedule
                await this.schedulePeriodicCalibration(interval);
            } catch (error) {
                this.emit('calibrationError', { interval, error });
            }
        }, intervalMs);

        this.scheduledCalibrations.set(interval, timeout);

        // Store schedule in database
        const db = this.database.getDatabase();
        const stmt = db.prepare(`
      INSERT OR REPLACE INTO calibration_schedule
      (interval_type, next_due, enabled)
      VALUES (?, ?, 1)
    `);
        stmt.run(interval, Date.now() + intervalMs);

        this.emit('calibrationScheduled', { interval, nextDue: new Date(Date.now() + intervalMs) });
    }

    async validateHardwareHealth(): Promise<HardwareHealthReport> {
        const timestamp = new Date();

        // Test RNG performance
        const testData: number[] = [];
        const performanceStart = Date.now();
        for (let i = 0; i < 10000; i++) {
            testData.push(this.rngEngine.generateBit());
        }
        const performanceTime = Date.now() - performanceStart;
        const rngPerformance = Math.max(0, 100 - (performanceTime / 100)); // Scale performance

        // Run quick randomness tests
        const quickTests = await this.randomnessValidator.runQuickTests(testData);
        const timingAccuracy = this.assessTimingAccuracy();
        const dataIntegrity = this.assessDataIntegrity(testData);

        // System resources (simplified - would use actual OS calls in production)
        const systemResources = {
            cpu: Math.random() * 20 + 5, // 5-25% usage
            memory: Math.random() * 30 + 20, // 20-50% usage
            disk: Math.random() * 10 + 5 // 5-15% usage
        };

        // Environmental factors (simulated - would use actual sensors)
        const environmentalFactors = {
            temperature: Math.random() * 10 + 20, // 20-30°C
            humidity: Math.random() * 20 + 40, // 40-60%
            electromagnetic: Math.random() * 5 + 1 // Low EMI
        };

        const overallHealth = (
            rngPerformance * 0.3 +
            timingAccuracy * 0.2 +
            dataIntegrity * 0.2 +
            (100 - systemResources.cpu) * 0.1 +
            (100 - systemResources.memory) * 0.1 +
            (100 - environmentalFactors.electromagnetic * 10) * 0.1
        );

        const recommendations = this.generateHealthRecommendations(
            overallHealth, rngPerformance, timingAccuracy, dataIntegrity,
            systemResources, environmentalFactors
        );

        const report: HardwareHealthReport = {
            timestamp,
            overallHealth,
            rngPerformance,
            timingAccuracy,
            dataIntegrity,
            systemResources,
            environmentalFactors,
            recommendations
        };

        await this.storeHealthReport(report);
        return report;
    }

    // Private helper methods
    private calculatePassRate(testResults: RandomnessTestSuite): number {
        let totalTests = 0;
        let passedTests = 0;

        // Count NIST tests
        for (const [, result] of testResults.nist.results) {
            totalTests++;
            if (result.passed) passedTests++;
        }

        // Count other test suites
        totalTests += testResults.diehard.results.length;
        passedTests += testResults.diehard.results.filter(r => r.passed).length;

        totalTests += testResults.ent.results.length;
        passedTests += testResults.ent.results.filter(r => r.passed).length;

        return totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    }

    private assessRNGHealth(testResults: RandomnessTestSuite, baseline: any): number {
        const passRate = this.calculatePassRate(testResults);
        const baselineQuality = Math.abs(baseline.mean - 0.5) < 0.01 ? 100 : 80;
        const varianceQuality = Math.abs(baseline.variance - 0.25) < 0.01 ? 100 : 80;

        return (passRate * 0.6 + baselineQuality * 0.2 + varianceQuality * 0.2);
    }

    private determineQuality(passRate: number, rngHealth: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'failed' {
        const overallScore = (passRate + rngHealth) / 2;

        if (overallScore >= 95) return 'excellent';
        if (overallScore >= 85) return 'good';
        if (overallScore >= 70) return 'acceptable';
        if (overallScore >= 50) return 'poor';
        return 'failed';
    }

    private generateRecommendations(
        testResults: RandomnessTestSuite,
        baseline: any,
        quality: string
    ): string[] {
        const recommendations: string[] = [];

        if (quality === 'failed' || quality === 'poor') {
            recommendations.push('Consider recalibrating the RNG system');
            recommendations.push('Check for environmental interference');
        }

        if (Math.abs(baseline.mean - 0.5) > 0.01) {
            recommendations.push('Baseline mean deviation detected - investigate bias sources');
        }

        if (this.calculatePassRate(testResults) < 80) {
            recommendations.push('Multiple randomness tests failed - system validation required');
        }

        if (recommendations.length === 0) {
            recommendations.push('System operating within normal parameters');
        }

        return recommendations;
    }

    private generateExtendedRecommendations(
        testResults: RandomnessTestSuite,
        baseline: any,
        longTermDrift: number,
        periodicPatterns: number[],
        quality: string
    ): string[] {
        const recommendations = this.generateRecommendations(testResults, baseline, quality);

        if (Math.abs(longTermDrift) > 0.001) {
            recommendations.push(`Long-term drift detected: ${longTermDrift.toFixed(6)}`);
        }

        if (periodicPatterns.some(p => p > 0.1)) {
            recommendations.push('Periodic patterns detected - investigate timing correlations');
        }

        return recommendations;
    }

    private generateHealthRecommendations(
        overallHealth: number,
        rngPerformance: number,
        timingAccuracy: number,
        dataIntegrity: number,
        systemResources: any,
        environmentalFactors: any
    ): string[] {
        const recommendations: string[] = [];

        if (overallHealth < 70) {
            recommendations.push('Overall system health below acceptable threshold');
        }

        if (rngPerformance < 80) {
            recommendations.push('RNG performance degraded - consider system restart');
        }

        if (systemResources.cpu > 80) {
            recommendations.push('High CPU usage detected - close unnecessary applications');
        }

        if (systemResources.memory > 80) {
            recommendations.push('High memory usage detected - restart may be required');
        }

        if (environmentalFactors.electromagnetic > 3) {
            recommendations.push('High electromagnetic interference detected');
        }

        return recommendations;
    }

    private getIntervalMilliseconds(interval: CalibrationInterval): number {
        switch (interval) {
            case 'daily': return 24 * 60 * 60 * 1000;
            case 'weekly': return 7 * 24 * 60 * 60 * 1000;
            case 'monthly': return 30 * 24 * 60 * 60 * 1000;
            case 'quarterly': return 90 * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000;
        }
    }

    private assessTimingAccuracy(): number {
        // Simulate timing accuracy assessment
        const samples = 100;
        let totalDeviation = 0;

        for (let i = 0; i < samples; i++) {
            const start = performance.now();
            // Simulate some work
            this.rngEngine.generateBit();
            const end = performance.now();
            const expected = 0.1; // Expected 0.1ms
            totalDeviation += Math.abs(end - start - expected);
        }

        const averageDeviation = totalDeviation / samples;
        return Math.max(0, 100 - averageDeviation * 100);
    }

    private assessDataIntegrity(data: number[]): number {
        // Check for obvious data corruption
        let integrity = 100;

        // Check for impossible values
        const invalidValues = data.filter(d => d !== 0 && d !== 1).length;
        integrity -= (invalidValues / data.length) * 100;

        // Check for obvious patterns (all zeros or ones)
        const zeros = data.filter(d => d === 0).length;
        const ones = data.filter(d => d === 1).length;

        if (zeros === data.length || ones === data.length) {
            integrity = 0;
        }

        return Math.max(0, integrity);
    }

    private async analyzeEnvironmentalCorrelations(
        timeSeriesData: Array<{ timestamp: number; data: number[] }>
    ): Promise<Map<string, number>> {
        const correlations = new Map<string, number>();

        // Simulate environmental correlation analysis
        correlations.set('temperature', Math.random() * 0.1 - 0.05);
        correlations.set('humidity', Math.random() * 0.1 - 0.05);
        correlations.set('electromagnetic', Math.random() * 0.15 - 0.075);
        correlations.set('time_of_day', Math.random() * 0.05 - 0.025);

        return correlations;
    }

    private identifyDegradationIndicators(testResults: RandomnessTestSuite, baseline: any): string[] {
        const indicators: string[] = [];

        const passRate = this.calculatePassRate(testResults);
        if (passRate < 85) {
            indicators.push('Declining test pass rate');
        }

        if (Math.abs(baseline.mean - 0.5) > 0.005) {
            indicators.push('Baseline drift detected');
        }

        if (baseline.variance < 0.24 || baseline.variance > 0.26) {
            indicators.push('Variance outside normal range');
        }

        return indicators;
    }

    private async storeCalibrationResult(result: CalibrationResult): Promise<void> {
        const db = this.database.getDatabase();
        const stmt = db.prepare(`
      INSERT INTO calibration_results
      (id, timestamp, type, trials, duration, rng_health, pass_rate,
       baseline_mean, baseline_variance, baseline_std_dev, quality,
       test_results, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            result.id,
            result.timestamp.getTime(),
            'standard',
            result.trials,
            result.duration,
            result.rngHealth,
            result.passRate,
            result.baseline.mean,
            result.baseline.variance,
            result.baseline.standardDeviation,
            result.quality,
            JSON.stringify(result.testResults),
            JSON.stringify(result.recommendations)
        );
    }

    private async storeExtendedCalibrationResult(result: ExtendedCalibrationResult): Promise<void> {
        // Store basic calibration result
        await this.storeCalibrationResult(result);

        // Store extended data (could be in separate table)
        const db = this.database.getDatabase();
        db.exec(`
      CREATE TABLE IF NOT EXISTS extended_calibration_data (
        calibration_id TEXT PRIMARY KEY,
        long_term_drift REAL,
        periodic_patterns TEXT,
        environmental_correlations TEXT,
        degradation_indicators TEXT,
        next_calibration_due INTEGER,
        FOREIGN KEY (calibration_id) REFERENCES calibration_results (id)
      )
    `);

        const stmt = db.prepare(`
      INSERT INTO extended_calibration_data
      (calibration_id, long_term_drift, periodic_patterns,
       environmental_correlations, degradation_indicators, next_calibration_due)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            result.id,
            result.longTermDrift,
            JSON.stringify(result.periodicPatterns),
            JSON.stringify(Array.from(result.environmentalCorrelations)),
            JSON.stringify(result.degradationIndicators),
            result.nextCalibrationDue.getTime()
        );
    }

    private async storeHealthReport(report: HardwareHealthReport): Promise<void> {
        const db = this.database.getDatabase();
        const stmt = db.prepare(`
      INSERT INTO hardware_health
      (timestamp, overall_health, rng_performance, timing_accuracy, data_integrity,
       cpu_usage, memory_usage, disk_usage, environmental_data, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            report.timestamp.getTime(),
            report.overallHealth,
            report.rngPerformance,
            report.timingAccuracy,
            report.dataIntegrity,
            report.systemResources.cpu,
            report.systemResources.memory,
            report.systemResources.disk,
            JSON.stringify(report.environmentalFactors),
            JSON.stringify(report.recommendations)
        );
    }

    // Public utility methods
    getLastCalibration(): Date | null {
        return this.lastCalibration;
    }

    isCalibrationInProgress(): boolean {
        return this.isCalibrating;
    }

    getScheduledCalibrations(): Map<CalibrationInterval, Date> {
        const schedules = new Map<CalibrationInterval, Date>();
        // This would query the database for actual schedules
        return schedules;
    }

    async cancelScheduledCalibration(interval: CalibrationInterval): Promise<void> {
        const timeout = this.scheduledCalibrations.get(interval);
        if (timeout) {
            clearTimeout(timeout);
            this.scheduledCalibrations.delete(interval);
        }

        const db = this.database.getDatabase();
        const stmt = db.prepare('UPDATE calibration_schedule SET enabled = 0 WHERE interval_type = ?');
        stmt.run(interval);
    }
}