import { EventEmitter } from 'events';
import * as ss from 'simple-statistics';
import { DatabaseManager } from '../../database/DatabaseManager';
import { RNGTrial } from '../../shared/types';

export interface QualityMetric {
    name: string;
    value: number;
    threshold: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    description: string;
    timestamp: Date;
}

export interface QualityReport {
    id: string;
    timestamp: Date;
    sessionId?: string;
    overallScore: number;
    status: 'pass' | 'warning' | 'fail';
    metrics: QualityMetric[];
    anomalies: AnomalyReport[];
    recommendations: string[];
    dataIntegrity: number;
    statisticalValidity: number;
}

export interface AnomalyReport {
    id: string;
    type: 'bias' | 'pattern' | 'correlation' | 'outlier' | 'missing_data' | 'timing';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: {
        startIndex?: number;
        endIndex?: number;
        timestamp?: Date;
    };
    confidence: number;
    suggestedAction: string;
}

export interface IntegrityReport {
    dataCompleteness: number;
    temporalConsistency: number;
    valueConsistency: number;
    sequenceIntegrity: number;
    missingDataPoints: number;
    duplicateEntries: number;
    outOfRangeValues: number;
    timestampGaps: number[];
    overallIntegrity: number;
}

export interface ValidityAssessment {
    statisticalPower: number;
    sampleSizeAdequacy: number;
    assumptionViolations: string[];
    effectSizeReliability: number;
    confidenceIntervalValidity: number;
    overallValidity: number;
    recommendations: string[];
}

export interface QualityIssue {
    type: 'data_quality' | 'system_performance' | 'statistical_anomaly' | 'hardware_issue';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    data?: any;
    timestamp: Date;
    sessionId?: string;
}

export class QualityController extends EventEmitter {
    private database: DatabaseManager;
    private qualityThresholds: Map<string, number>;
    private monitoringEnabled: boolean = true;
    private currentQualityScore: number = 100;
    private alertCallbacks: Map<string, Function[]> = new Map();

    constructor() {
        super();
        this.database = new DatabaseManager();
        this.initializeQualityThresholds();
        this.initializeQualityTables();
    }

    private initializeQualityThresholds(): void {
        this.qualityThresholds = new Map([
            ['bias_threshold', 0.05],
            ['variance_threshold', 0.01],
            ['autocorrelation_threshold', 0.1],
            ['missing_data_threshold', 0.01],
            ['timing_deviation_threshold', 0.1],
            ['outlier_threshold', 3.0],
            ['pattern_detection_threshold', 0.15],
            ['entropy_threshold', 0.95],
            ['compression_threshold', 0.05],
            ['drift_threshold', 0.001]
        ]);
    }

    private async initializeQualityTables(): Promise<void> {
        const db = this.database.getDatabase();

        // Quality reports table
        db.exec(`
      CREATE TABLE IF NOT EXISTS quality_reports (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        session_id TEXT,
        overall_score REAL NOT NULL,
        status TEXT NOT NULL,
        metrics TEXT NOT NULL,
        anomalies TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        data_integrity REAL NOT NULL,
        statistical_validity REAL NOT NULL
      )
    `);

        // Quality metrics table
        db.exec(`
      CREATE TABLE IF NOT EXISTS quality_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL,
        name TEXT NOT NULL,
        value REAL NOT NULL,
        threshold REAL NOT NULL,
        status TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (report_id) REFERENCES quality_reports (id)
      )
    `);

        // Anomalies table
        db.exec(`
      CREATE TABLE IF NOT EXISTS anomalies (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        start_index INTEGER,
        end_index INTEGER,
        anomaly_timestamp INTEGER,
        confidence REAL NOT NULL,
        suggested_action TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES quality_reports (id)
      )
    `);

        // Quality alerts table
        db.exec(`
      CREATE TABLE IF NOT EXISTS quality_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        timestamp INTEGER NOT NULL,
        session_id TEXT,
        acknowledged BOOLEAN DEFAULT 0
      )
    `);
    }

    async monitorDataQuality(): Promise<QualityReport> {
        if (!this.monitoringEnabled) {
            throw new Error('Quality monitoring is disabled');
        }

        const reportId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date();

        // Get recent data for analysis
        const recentData = await this.getRecentTrialData();

        if (recentData.length === 0) {
            return this.createEmptyQualityReport(reportId, timestamp);
        }

        // Run comprehensive quality analysis
        const metrics = await this.calculateQualityMetrics(recentData);
        const anomalies = await this.detectAnomalies(recentData);
        const integrityReport = await this.assessDataIntegrity(recentData);
        const validityAssessment = await this.assessStatisticalValidity(recentData);

        // Calculate overall scores
        const overallScore = this.calculateOverallQualityScore(metrics, anomalies);
        const status = this.determineQualityStatus(overallScore, anomalies);
        const recommendations = this.generateQualityRecommendations(metrics, anomalies, integrityReport);

        const report: QualityReport = {
            id: reportId,
            timestamp,
            overallScore,
            status,
            metrics,
            anomalies,
            recommendations,
            dataIntegrity: integrityReport.overallIntegrity,
            statisticalValidity: validityAssessment.overallValidity
        };

        // Store the report
        await this.storeQualityReport(report);

        // Update current quality score
        this.currentQualityScore = overallScore;

        // Emit quality report event
        this.emit('qualityReport', report);

        // Check for critical issues
        if (status === 'fail' || anomalies.some(a => a.severity === 'critical')) {
            await this.generateQualityAlert({
                type: 'data_quality',
                severity: 'critical',
                message: 'Critical quality issues detected',
                data: { reportId, overallScore },
                timestamp
            });
        }

        return report;
    }

    async detectAnomalies(data: RNGTrial[]): Promise<AnomalyReport[]> {
        const anomalies: AnomalyReport[] = [];

        if (data.length === 0) {
            return anomalies;
        }

        const bits = data.map(trial => trial.bit);

        // Detect bias anomalies
        const biasAnomalies = this.detectBiasAnomalies(bits);
        anomalies.push(...biasAnomalies);

        // Detect pattern anomalies
        const patternAnomalies = this.detectPatternAnomalies(bits);
        anomalies.push(...patternAnomalies);

        // Detect correlation anomalies
        const correlationAnomalies = this.detectCorrelationAnomalies(bits);
        anomalies.push(...correlationAnomalies);

        // Detect outlier anomalies
        const outlierAnomalies = this.detectOutlierAnomalies(data);
        anomalies.push(...outlierAnomalies);

        // Detect missing data anomalies
        const missingDataAnomalies = this.detectMissingDataAnomalies(data.map(trial => trial.timestamp));
        anomalies.push(...missingDataAnomalies);

        // Detect timing anomalies
        const timingAnomalies = this.detectTimingAnomalies(data.map(trial => trial.timestamp));
        anomalies.push(...timingAnomalies);

        return anomalies;
    }

    async validateSessionIntegrity(session: any): Promise<IntegrityReport> {
        const trials = await this.getSessionTrialData(session.id);

        if (trials.length === 0) {
            return {
                dataCompleteness: 0,
                temporalConsistency: 0,
                valueConsistency: 0,
                sequenceIntegrity: 0,
                missingDataPoints: 0,
                duplicateEntries: 0,
                outOfRangeValues: 0,
                timestampGaps: [],
                overallIntegrity: 0
            };
        }

        return this.assessDataIntegrity(trials);
    }

    async assessStatisticalValidity(data: RNGTrial[]): Promise<ValidityAssessment> {
        if (data.length === 0) {
            return {
                statisticalPower: 0,
                sampleSizeAdequacy: 0,
                assumptionViolations: ['Insufficient data'],
                effectSizeReliability: 0,
                confidenceIntervalValidity: 0,
                overallValidity: 0,
                recommendations: ['Collect more data before analysis']
            };
        }

        const bits = data.map(trial => trial.bit);
        const assumptionViolations: string[] = [];

        // Check sample size adequacy
        const minSampleSize = 1000; // Minimum for reliable statistical analysis
        const sampleSizeAdequacy = Math.min(100, (data.length / minSampleSize) * 100);

        if (data.length < minSampleSize) {
            assumptionViolations.push(`Sample size too small: ${data.length} < ${minSampleSize}`);
        }

        // Check normality assumption (for continuous approximation)
        const mean = ss.mean(bits);
        const variance = ss.variance(bits);
        const expectedVariance = mean * (1 - mean);

        if (Math.abs(variance - expectedVariance) > 0.01) {
            assumptionViolations.push('Variance deviates from binomial expectation');
        }

        // Check independence assumption
        const autocorrelation = this.calculateLagOneAutocorrelation(bits);
        if (Math.abs(autocorrelation) > 0.1) {
            assumptionViolations.push('Significant autocorrelation detected');
        }

        // Calculate statistical power for detecting small effects
        const effectSize = 0.1; // Small effect size
        const alpha = 0.05;
        const power = this.calculateStatisticalPower(data.length, effectSize, alpha);

        // Assess effect size reliability
        const standardError = Math.sqrt(variance / data.length);
        const effectSizeReliability = Math.min(100, (1 / standardError) * 10);

        // Assess confidence interval validity
        const confidenceIntervalWidth = 1.96 * standardError;
        const confidenceIntervalValidity = Math.max(0, 100 - (confidenceIntervalWidth * 1000));

        const overallValidity = (
            sampleSizeAdequacy * 0.3 +
            power * 0.25 +
            effectSizeReliability * 0.25 +
            confidenceIntervalValidity * 0.2
        );

        const recommendations: string[] = [];
        if (sampleSizeAdequacy < 80) {
            recommendations.push('Increase sample size for more reliable results');
        }
        if (power < 80) {
            recommendations.push('Low statistical power - consider longer data collection');
        }
        if (assumptionViolations.length > 0) {
            recommendations.push('Address assumption violations before interpreting results');
        }

        return {
            statisticalPower: power,
            sampleSizeAdequacy,
            assumptionViolations,
            effectSizeReliability,
            confidenceIntervalValidity,
            overallValidity,
            recommendations
        };
    }

    async generateQualityAlert(issue: QualityIssue): Promise<void> {
        // Store alert in database
        const db = this.database.getDatabase();
        const stmt = db.prepare(`
      INSERT INTO quality_alerts
      (type, severity, message, data, timestamp, session_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            issue.type,
            issue.severity,
            issue.message,
            issue.data ? JSON.stringify(issue.data) : null,
            issue.timestamp.getTime(),
            issue.sessionId || null
        );

        // Emit alert event
        this.emit('qualityAlert', issue);

        // Execute registered callbacks
        const callbacks = this.alertCallbacks.get(issue.type) || [];
        callbacks.forEach(callback => {
            try {
                callback(issue);
            } catch (error) {
                console.error('Error executing quality alert callback:', error);
            }
        });
    }

    // Public configuration methods
    setQualityThreshold(metric: string, threshold: number): void {
        this.qualityThresholds.set(metric, threshold);
    }

    getQualityThreshold(metric: string): number {
        return this.qualityThresholds.get(metric) || 0;
    }

    enableMonitoring(): void {
        this.monitoringEnabled = true;
    }

    disableMonitoring(): void {
        this.monitoringEnabled = false;
    }

    registerAlertCallback(alertType: string, callback: Function): void {
        if (!this.alertCallbacks.has(alertType)) {
            this.alertCallbacks.set(alertType, []);
        }
        this.alertCallbacks.get(alertType)!.push(callback);
    }

    getCurrentQualityScore(): number {
        return this.currentQualityScore;
    }

    // Private helper methods
    private async getRecentTrialData(): Promise<RNGTrial[]> {
        const db = this.database.getDatabase();
        const stmt = db.prepare(`
      SELECT * FROM trials
      WHERE timestamp > ?
      ORDER BY timestamp DESC
      LIMIT 10000
    `);

        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const rows = stmt.all(oneHourAgo);

        return rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            timestamp: new Date(row.timestamp),
            bit: row.bit,
            intention: row.intention,
            cumulativeDeviation: row.cumulative_deviation
        }));
    }

    private async getSessionTrialData(sessionId: string): Promise<RNGTrial[]> {
        const db = this.database.getDatabase();
        const stmt = db.prepare(`
      SELECT * FROM trials
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `);

        const rows = stmt.all(sessionId);

        return rows.map(row => ({
            id: row.id,
            sessionId: row.session_id,
            timestamp: new Date(row.timestamp),
            bit: row.bit,
            intention: row.intention,
            cumulativeDeviation: row.cumulative_deviation
        }));
    }

    private async calculateQualityMetrics(data: RNGTrial[]): Promise<QualityMetric[]> {
        const metrics: QualityMetric[] = [];
        const bits = data.map(trial => trial.bit);
        const timestamp = new Date();

        // Bias metric
        const mean = ss.mean(bits);
        const biasDeviation = Math.abs(mean - 0.5);
        metrics.push({
            name: 'Bias',
            value: biasDeviation,
            threshold: this.qualityThresholds.get('bias_threshold')!,
            status: this.getMetricStatus(biasDeviation, this.qualityThresholds.get('bias_threshold')!),
            description: 'Deviation from expected mean of 0.5',
            timestamp
        });

        // Variance metric
        const variance = ss.variance(bits);
        const expectedVariance = 0.25; // For fair coin
        const varianceDeviation = Math.abs(variance - expectedVariance);
        metrics.push({
            name: 'Variance',
            value: varianceDeviation,
            threshold: this.qualityThresholds.get('variance_threshold')!,
            status: this.getMetricStatus(varianceDeviation, this.qualityThresholds.get('variance_threshold')!),
            description: 'Deviation from expected variance of 0.25',
            timestamp
        });

        // Autocorrelation metric
        const autocorr = this.calculateLagOneAutocorrelation(bits);
        metrics.push({
            name: 'Autocorrelation',
            value: Math.abs(autocorr),
            threshold: this.qualityThresholds.get('autocorrelation_threshold')!,
            status: this.getMetricStatus(Math.abs(autocorr), this.qualityThresholds.get('autocorrelation_threshold')!),
            description: 'Serial correlation between consecutive bits',
            timestamp
        });

        // Entropy metric
        const entropy = this.calculateEntropy(bits);
        const maxEntropy = 1.0; // Maximum entropy for binary data
        const entropyRatio = entropy / maxEntropy;
        metrics.push({
            name: 'Entropy',
            value: entropyRatio,
            threshold: this.qualityThresholds.get('entropy_threshold')!,
            status: this.getMetricStatus(entropyRatio, this.qualityThresholds.get('entropy_threshold')!, true),
            description: 'Information content ratio',
            timestamp
        });

        return metrics;
    }

    private getMetricStatus(value: number, threshold: number, higherIsBetter: boolean = false): 'excellent' | 'good' | 'warning' | 'critical' {
        const ratio = higherIsBetter ? value / threshold : threshold / value;

        if (higherIsBetter) {
            if (value >= threshold) return 'excellent';
            if (value >= threshold * 0.9) return 'good';
            if (value >= threshold * 0.7) return 'warning';
            return 'critical';
        } else {
            if (value <= threshold) return 'excellent';
            if (value <= threshold * 2) return 'good';
            if (value <= threshold * 4) return 'warning';
            return 'critical';
        }
    }

    private detectBiasAnomalies(bits: number[]): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];
        const windowSize = 1000;

        for (let i = 0; i <= bits.length - windowSize; i += windowSize / 2) {
            const window = bits.slice(i, i + windowSize);
            const mean = ss.mean(window);
            const bias = Math.abs(mean - 0.5);

            if (bias > this.qualityThresholds.get('bias_threshold')!) {
                anomalies.push({
                    id: `bias_${i}_${Date.now()}`,
                    type: 'bias',
                    severity: bias > 0.1 ? 'high' : 'medium',
                    description: `Significant bias detected: ${(mean * 100).toFixed(1)}% ones`,
                    location: { startIndex: i, endIndex: i + windowSize },
                    confidence: Math.min(95, bias * 1000),
                    suggestedAction: 'Investigate RNG source for systematic bias'
                });
            }
        }

        return anomalies;
    }

    private detectPatternAnomalies(bits: number[]): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];

        // Detect runs that are too long
        let currentRun = 1;
        let currentBit = bits[0];

        for (let i = 1; i < bits.length; i++) {
            if (bits[i] === currentBit) {
                currentRun++;
            } else {
                if (currentRun > 20) { // Threshold for unusual run length
                    anomalies.push({
                        id: `pattern_run_${i}_${Date.now()}`,
                        type: 'pattern',
                        severity: currentRun > 50 ? 'high' : 'medium',
                        description: `Unusually long run of ${currentRun} ${currentBit}s`,
                        location: { startIndex: i - currentRun, endIndex: i },
                        confidence: Math.min(95, currentRun * 2),
                        suggestedAction: 'Check for pattern-generating issues in RNG'
                    });
                }
                currentRun = 1;
                currentBit = bits[i];
            }
        }

        return anomalies;
    }

    private detectCorrelationAnomalies(bits: number[]): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];

        // Check various lag correlations
        const maxLag = Math.min(100, bits.length / 10);
        for (let lag = 1; lag <= maxLag; lag++) {
            const correlation = this.calculateAutocorrelation(bits, lag);

            if (Math.abs(correlation) > this.qualityThresholds.get('autocorrelation_threshold')!) {
                anomalies.push({
                    id: `correlation_lag${lag}_${Date.now()}`,
                    type: 'correlation',
                    severity: Math.abs(correlation) > 0.2 ? 'high' : 'medium',
                    description: `Significant correlation at lag ${lag}: ${correlation.toFixed(3)}`,
                    location: {},
                    confidence: Math.min(95, Math.abs(correlation) * 500),
                    suggestedAction: `Investigate ${lag}-step dependency in RNG output`
                });
            }
        }

        return anomalies;
    }

    private detectOutlierAnomalies(data: RNGTrial[]): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];

        // For binary data, outliers are less meaningful, but we can check timing
        const intervals = [];
        for (let i = 1; i < data.length; i++) {
            const interval = data[i].timestamp.getTime() - data[i - 1].timestamp.getTime();
            intervals.push(interval);
        }

        if (intervals.length > 0) {
            const mean = ss.mean(intervals);
            const stdDev = ss.standardDeviation(intervals);

            intervals.forEach((interval, index) => {
                const zScore = Math.abs((interval - mean) / stdDev);
                if (zScore > this.qualityThresholds.get('outlier_threshold')!) {
                    anomalies.push({
                        id: `outlier_timing_${index}_${Date.now()}`,
                        type: 'outlier',
                        severity: zScore > 5 ? 'high' : 'medium',
                        description: `Unusual timing interval: ${interval}ms (${zScore.toFixed(1)} std devs)`,
                        location: { startIndex: index },
                        confidence: Math.min(95, zScore * 15),
                        suggestedAction: 'Check system performance and timing consistency'
                    });
                }
            });
        }

        return anomalies;
    }

    private detectMissingDataAnomalies(timestamps: Date[]): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];

        // Expected interval (assuming ~200 trials per second)
        const expectedInterval = 5; // ms
        const gapThreshold = expectedInterval * 10; // 10x expected interval

        for (let i = 1; i < timestamps.length; i++) {
            const gap = timestamps[i].getTime() - timestamps[i - 1].getTime();
            if (gap > gapThreshold) {
                const missedTrials = Math.floor(gap / expectedInterval) - 1;
                anomalies.push({
                    id: `missing_data_${i}_${Date.now()}`,
                    type: 'missing_data',
                    severity: missedTrials > 100 ? 'high' : 'medium',
                    description: `Data gap detected: ${gap}ms (approx ${missedTrials} missed trials)`,
                    location: { startIndex: i - 1, endIndex: i },
                    confidence: 90,
                    suggestedAction: 'Investigate data collection interruptions'
                });
            }
        }

        return anomalies;
    }

    private detectTimingAnomalies(timestamps: Date[]): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];

        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i].getTime() - timestamps[i - 1].getTime());
        }

        if (intervals.length > 0) {
            const mean = ss.mean(intervals);
            const coefficient_of_variation = ss.standardDeviation(intervals) / mean;

            if (coefficient_of_variation > this.qualityThresholds.get('timing_deviation_threshold')!) {
                anomalies.push({
                    id: `timing_variability_${Date.now()}`,
                    type: 'timing',
                    severity: coefficient_of_variation > 0.2 ? 'high' : 'medium',
                    description: `High timing variability: CV = ${coefficient_of_variation.toFixed(3)}`,
                    location: {},
                    confidence: Math.min(95, coefficient_of_variation * 300),
                    suggestedAction: 'Check system load and timing stability'
                });
            }
        }

        return anomalies;
    }

    private async assessDataIntegrity(data: RNGTrial[]): Promise<IntegrityReport> {
        // Data completeness
        const expectedTrialCount = data.length; // Simplified
        const actualTrialCount = data.length;
        const dataCompleteness = (actualTrialCount / expectedTrialCount) * 100;

        // Temporal consistency
        const timestamps = data.map(trial => trial.timestamp.getTime()).sort((a, b) => a - b);
        const temporalGaps = [];
        for (let i = 1; i < timestamps.length; i++) {
            const gap = timestamps[i] - timestamps[i - 1];
            if (gap > 50) { // 50ms threshold
                temporalGaps.push(gap);
            }
        }
        const temporalConsistency = Math.max(0, 100 - (temporalGaps.length / data.length) * 100);

        // Value consistency
        const validBits = data.filter(trial => trial.bit === 0 || trial.bit === 1).length;
        const valueConsistency = (validBits / data.length) * 100;

        // Sequence integrity
        let duplicateEntries = 0;
        const seenIds = new Set();
        for (const trial of data) {
            if (seenIds.has(trial.id)) {
                duplicateEntries++;
            } else {
                seenIds.add(trial.id);
            }
        }
        const sequenceIntegrity = Math.max(0, 100 - (duplicateEntries / data.length) * 100);

        // Out of range values
        const outOfRangeValues = data.filter(trial =>
            trial.bit !== 0 && trial.bit !== 1
        ).length;

        const overallIntegrity = (
            dataCompleteness * 0.3 +
            temporalConsistency * 0.25 +
            valueConsistency * 0.25 +
            sequenceIntegrity * 0.2
        );

        return {
            dataCompleteness,
            temporalConsistency,
            valueConsistency,
            sequenceIntegrity,
            missingDataPoints: expectedTrialCount - actualTrialCount,
            duplicateEntries,
            outOfRangeValues,
            timestampGaps: temporalGaps,
            overallIntegrity
        };
    }

    private calculateOverallQualityScore(metrics: QualityMetric[], anomalies: AnomalyReport[]): number {
        // Start with perfect score
        let score = 100;

        // Deduct points for poor metrics
        metrics.forEach(metric => {
            switch (metric.status) {
                case 'critical':
                    score -= 20;
                    break;
                case 'warning':
                    score -= 10;
                    break;
                case 'good':
                    score -= 2;
                    break;
                // 'excellent' doesn't deduct points
            }
        });

        // Deduct points for anomalies
        anomalies.forEach(anomaly => {
            switch (anomaly.severity) {
                case 'critical':
                    score -= 15;
                    break;
                case 'high':
                    score -= 10;
                    break;
                case 'medium':
                    score -= 5;
                    break;
                case 'low':
                    score -= 2;
                    break;
            }
        });

        return Math.max(0, score);
    }

    private determineQualityStatus(score: number, anomalies: AnomalyReport[]): 'pass' | 'warning' | 'fail' {
        const hasCriticalAnomalies = anomalies.some(a => a.severity === 'critical');

        if (hasCriticalAnomalies || score < 50) {
            return 'fail';
        } else if (score < 80 || anomalies.some(a => a.severity === 'high')) {
            return 'warning';
        } else {
            return 'pass';
        }
    }

    private generateQualityRecommendations(
        metrics: QualityMetric[],
        anomalies: AnomalyReport[],
        integrity: IntegrityReport
    ): string[] {
        const recommendations: string[] = [];

        // Check metrics
        metrics.forEach(metric => {
            if (metric.status === 'critical' || metric.status === 'warning') {
                recommendations.push(`Address ${metric.name.toLowerCase()} issues: ${metric.description}`);
            }
        });

        // Check anomalies
        const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
        if (criticalAnomalies.length > 0) {
            recommendations.push('Critical anomalies detected - immediate investigation required');
        }

        // Check integrity
        if (integrity.overallIntegrity < 90) {
            recommendations.push('Data integrity issues detected - verify collection process');
        }

        // Default recommendation
        if (recommendations.length === 0) {
            recommendations.push('Data quality is acceptable - continue monitoring');
        }

        return recommendations;
    }

    private createEmptyQualityReport(reportId: string, timestamp: Date): QualityReport {
        return {
            id: reportId,
            timestamp,
            overallScore: 0,
            status: 'fail',
            metrics: [],
            anomalies: [],
            recommendations: ['No data available for quality assessment'],
            dataIntegrity: 0,
            statisticalValidity: 0
        };
    }

    private calculateLagOneAutocorrelation(bits: number[]): number {
        return this.calculateAutocorrelation(bits, 1);
    }

    private calculateAutocorrelation(data: number[], lag: number): number {
        if (lag >= data.length) return 0;

        const n = data.length - lag;
        const mean = ss.mean(data);

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (data[i] - mean) * (data[i + lag] - mean);
        }

        for (let i = 0; i < data.length; i++) {
            denominator += Math.pow(data[i] - mean, 2);
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private calculateEntropy(bits: number[]): number {
        const counts = [0, 0];
        bits.forEach(bit => counts[bit]++);

        const total = bits.length;
        let entropy = 0;

        for (const count of counts) {
            if (count > 0) {
                const p = count / total;
                entropy -= p * Math.log2(p);
            }
        }

        return entropy;
    }

    private calculateStatisticalPower(n: number, effectSize: number, alpha: number): number {
        // Simplified power calculation for one-sample t-test
        const delta = effectSize * Math.sqrt(n);
        const criticalValue = 1.96; // For alpha = 0.05
        const power = 1 - this.standardNormalCDF(criticalValue - delta);
        return power * 100;
    }

    private standardNormalCDF(z: number): number {
        return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    }

    private erf(x: number): number {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    private async storeQualityReport(report: QualityReport): Promise<void> {
        const db = this.database.getDatabase();
        const stmt = db.prepare(`
      INSERT INTO quality_reports
      (id, timestamp, session_id, overall_score, status, metrics, anomalies,
       recommendations, data_integrity, statistical_validity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            report.id,
            report.timestamp.getTime(),
            report.sessionId || null,
            report.overallScore,
            report.status,
            JSON.stringify(report.metrics),
            JSON.stringify(report.anomalies),
            JSON.stringify(report.recommendations),
            report.dataIntegrity,
            report.statisticalValidity
        );
    }
}