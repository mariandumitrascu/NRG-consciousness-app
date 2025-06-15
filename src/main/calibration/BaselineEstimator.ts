import * as ss from 'simple-statistics';

export interface BaselineResult {
    mean: number;
    variance: number;
    standardDeviation: number;
    skewness: number;
    kurtosis: number;
    confidence95Lower: number;
    confidence95Upper: number;
    sampleSize: number;
    timestamp: Date;
}

export interface DriftAnalysis {
    overallDrift: number;
    driftRate: number; // per hour
    driftDirection: 'positive' | 'negative' | 'stable';
    significance: number;
    changePoints: number[];
    confidence: number;
}

export interface PeriodicPattern {
    frequency: number;
    amplitude: number;
    phase: number;
    confidence: number;
    period: string; // 'hourly', 'daily', 'weekly', etc.
}

export interface BaselineComparison {
    currentBaseline: BaselineResult;
    referenceBaseline: BaselineResult;
    significantChange: boolean;
    changeType: 'mean' | 'variance' | 'both' | 'none';
    zScore: number;
    pValue: number;
    recommendation: string;
}

export class BaselineEstimator {
    private historicalBaselines: BaselineResult[] = [];
    private readonly SIGNIFICANCE_LEVEL = 0.05;

    async calculateBaseline(data: number[]): Promise<BaselineResult> {
        if (data.length === 0) {
            throw new Error('Cannot calculate baseline from empty data');
        }

        // Convert binary data to continuous for statistical analysis
        const values = data.map(bit => bit === 1 ? 1 : 0);

        const mean = ss.mean(values);
        const variance = ss.variance(values);
        const standardDeviation = ss.standardDeviation(values);
        const skewness = this.calculateSkewness(values);
        const kurtosis = this.calculateKurtosis(values);

        // Calculate 95% confidence interval for the mean
        const standardError = standardDeviation / Math.sqrt(values.length);
        const criticalValue = 1.96; // For 95% confidence
        const confidence95Lower = mean - (criticalValue * standardError);
        const confidence95Upper = mean + (criticalValue * standardError);

        const baseline: BaselineResult = {
            mean,
            variance,
            standardDeviation,
            skewness,
            kurtosis,
            confidence95Lower,
            confidence95Upper,
            sampleSize: values.length,
            timestamp: new Date()
        };

        this.historicalBaselines.push(baseline);

        // Keep only the last 100 baselines to manage memory
        if (this.historicalBaselines.length > 100) {
            this.historicalBaselines = this.historicalBaselines.slice(-100);
        }

        return baseline;
    }

    calculateLongTermDrift(timeSeriesData: Array<{ timestamp: number; data: number[] }>): number {
        if (timeSeriesData.length < 10) {
            return 0; // Need sufficient data for drift analysis
        }

        // Calculate means for each time interval
        const timeMeans = timeSeriesData.map(interval => ({
            timestamp: interval.timestamp,
            mean: ss.mean(interval.data)
        }));

        // Sort by timestamp
        timeMeans.sort((a, b) => a.timestamp - b.timestamp);

        // Calculate linear regression to detect drift
        const x = timeMeans.map((_, index) => index);
        const y = timeMeans.map(tm => tm.mean);

        const regression = ss.linearRegression([x, y]);

        // Convert slope to drift per hour
        const timeSpanHours = (timeMeans[timeMeans.length - 1].timestamp - timeMeans[0].timestamp) / (1000 * 60 * 60);
        const driftPerHour = regression.m * (timeMeans.length / timeSpanHours);

        return driftPerHour;
    }

    detectPeriodicPatterns(timeSeriesData: Array<{ timestamp: number; data: number[] }>): number[] {
        if (timeSeriesData.length < 20) {
            return []; // Need sufficient data for pattern detection
        }

        // Calculate means for each time interval
        const means = timeSeriesData.map(interval => ss.mean(interval.data));

        // Simple periodic pattern detection using autocorrelation
        const patterns: number[] = [];
        const maxLag = Math.min(means.length / 4, 50);

        for (let lag = 2; lag <= maxLag; lag++) {
            const correlation = this.calculateAutocorrelation(means, lag);
            if (Math.abs(correlation) > 0.3) { // Threshold for significant correlation
                patterns.push(correlation);
            } else {
                patterns.push(0);
            }
        }

        return patterns;
    }

    analyzeDrift(recentBaselines: BaselineResult[]): DriftAnalysis {
        if (recentBaselines.length < 5) {
            return {
                overallDrift: 0,
                driftRate: 0,
                driftDirection: 'stable',
                significance: 0,
                changePoints: [],
                confidence: 0
            };
        }

        // Sort baselines by timestamp
        const sortedBaselines = [...recentBaselines].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Extract means and timestamps
        const means = sortedBaselines.map(b => b.mean);
        const timestamps = sortedBaselines.map(b => b.timestamp.getTime());

        // Calculate time differences in hours
        const startTime = timestamps[0];
        const timeHours = timestamps.map(t => (t - startTime) / (1000 * 60 * 60));

        // Linear regression for drift analysis
        const regression = ss.linearRegression([timeHours, means]);
        const slope = regression.m;
        const correlation = ss.sampleCorrelation(timeHours, means);

        // Determine drift direction and significance
        let driftDirection: 'positive' | 'negative' | 'stable' = 'stable';
        if (Math.abs(slope) > 0.001) {
            driftDirection = slope > 0 ? 'positive' : 'negative';
        }

        // Calculate significance using t-test
        const n = means.length;
        const sxx = ss.sum(timeHours.map(x => Math.pow(x - ss.mean(timeHours), 2)));
        const residuals = means.map((y, i) => y - (regression.m * timeHours[i] + regression.b));
        const residualSumSquares = ss.sum(residuals.map(r => r * r));
        const standardError = Math.sqrt(residualSumSquares / (n - 2)) / Math.sqrt(sxx);
        const tStatistic = slope / standardError;
        const significance = 2 * (1 - this.tCDF(Math.abs(tStatistic), n - 2));

        // Detect change points using simple threshold method
        const changePoints: number[] = [];
        for (let i = 1; i < means.length - 1; i++) {
            const before = means.slice(0, i);
            const after = means.slice(i);
            const beforeMean = ss.mean(before);
            const afterMean = ss.mean(after);

            if (Math.abs(afterMean - beforeMean) > 0.01) { // Threshold for change point
                changePoints.push(i);
            }
        }

        return {
            overallDrift: slope * (timeHours[timeHours.length - 1] - timeHours[0]),
            driftRate: slope,
            driftDirection,
            significance,
            changePoints,
            confidence: Math.abs(correlation) * 100
        };
    }

    detectSeasonalPatterns(timeSeriesData: Array<{ timestamp: number; data: number[] }>): PeriodicPattern[] {
        if (timeSeriesData.length < 24) {
            return []; // Need at least 24 hours of data
        }

        const patterns: PeriodicPattern[] = [];
        const means = timeSeriesData.map(interval => ss.mean(interval.data));
        const timestamps = timeSeriesData.map(interval => new Date(interval.timestamp));

        // Detect hourly patterns (24-hour cycle)
        const hourlyPattern = this.detectPeriodicPattern(means, timestamps, 'hourly');
        if (hourlyPattern) patterns.push(hourlyPattern);

        // Detect daily patterns (7-day cycle)
        if (timeSeriesData.length >= 168) { // 7 days of hourly data
            const dailyPattern = this.detectPeriodicPattern(means, timestamps, 'daily');
            if (dailyPattern) patterns.push(dailyPattern);
        }

        return patterns;
    }

    compareBaselines(current: BaselineResult, reference: BaselineResult): BaselineComparison {
        // Test for significant difference in means
        const pooledVariance = ((current.sampleSize - 1) * current.variance +
            (reference.sampleSize - 1) * reference.variance) /
            (current.sampleSize + reference.sampleSize - 2);

        const standardError = Math.sqrt(pooledVariance * (1 / current.sampleSize + 1 / reference.sampleSize));
        const zScore = (current.mean - reference.mean) / standardError;
        const pValue = 2 * (1 - this.standardNormalCDF(Math.abs(zScore)));

        // Determine change type
        let changeType: 'mean' | 'variance' | 'both' | 'none' = 'none';
        const meanChanged = pValue < this.SIGNIFICANCE_LEVEL;
        const varianceChanged = Math.abs(current.variance - reference.variance) / reference.variance > 0.1;

        if (meanChanged && varianceChanged) {
            changeType = 'both';
        } else if (meanChanged) {
            changeType = 'mean';
        } else if (varianceChanged) {
            changeType = 'variance';
        }

        const significantChange = changeType !== 'none';

        // Generate recommendation
        let recommendation = 'No significant changes detected';
        if (significantChange) {
            if (changeType === 'mean') {
                recommendation = `Significant mean change detected (${current.mean.toFixed(6)} vs ${reference.mean.toFixed(6)})`;
            } else if (changeType === 'variance') {
                recommendation = `Significant variance change detected (${current.variance.toFixed(6)} vs ${reference.variance.toFixed(6)})`;
            } else {
                recommendation = 'Significant changes in both mean and variance detected';
            }
        }

        return {
            currentBaseline: current,
            referenceBaseline: reference,
            significantChange,
            changeType,
            zScore,
            pValue,
            recommendation
        };
    }

    getHistoricalBaselines(): BaselineResult[] {
        return [...this.historicalBaselines];
    }

    getBaselineTrend(): 'improving' | 'degrading' | 'stable' {
        if (this.historicalBaselines.length < 5) {
            return 'stable';
        }

        const recent = this.historicalBaselines.slice(-5);
        const meanDeviations = recent.map(b => Math.abs(b.mean - 0.5));

        // Calculate trend using linear regression
        const x = recent.map((_, index) => index);
        const regression = ss.linearRegression([x, meanDeviations]);

        if (regression.m > 0.001) {
            return 'degrading';
        } else if (regression.m < -0.001) {
            return 'improving';
        } else {
            return 'stable';
        }
    }

    predictNextBaseline(): { predictedMean: number; confidence: number } {
        if (this.historicalBaselines.length < 3) {
            return { predictedMean: 0.5, confidence: 0 };
        }

        const recent = this.historicalBaselines.slice(-10); // Use last 10 baselines
        const means = recent.map(b => b.mean);
        const x = recent.map((_, index) => index);

        const regression = ss.linearRegression([x, means]);
        const predictedMean = regression.m * recent.length + regression.b;

        // Calculate confidence based on R-squared
        const correlation = ss.sampleCorrelation(x, means);
        const confidence = Math.pow(correlation, 2) * 100;

        return { predictedMean, confidence };
    }

    // Private helper methods
    private calculateSkewness(values: number[]): number {
        const n = values.length;
        const mean = ss.mean(values);
        const stdDev = ss.standardDeviation(values);

        if (stdDev === 0) return 0;

        const skewSum = values.reduce((sum, x) => {
            return sum + Math.pow((x - mean) / stdDev, 3);
        }, 0);

        return (n / ((n - 1) * (n - 2))) * skewSum;
    }

    private calculateKurtosis(values: number[]): number {
        const n = values.length;
        const mean = ss.mean(values);
        const stdDev = ss.standardDeviation(values);

        if (stdDev === 0) return 0;

        const kurtSum = values.reduce((sum, x) => {
            return sum + Math.pow((x - mean) / stdDev, 4);
        }, 0);

        const kurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurtSum;
        return kurtosis - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
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

    private detectPeriodicPattern(
        means: number[],
        timestamps: Date[],
        periodType: 'hourly' | 'daily'
    ): PeriodicPattern | null {
        const period = periodType === 'hourly' ? 24 : 7;

        // Group data by period (hour of day or day of week)
        const groups: { [key: number]: number[] } = {};

        timestamps.forEach((timestamp, index) => {
            const key = periodType === 'hourly' ? timestamp.getHours() : timestamp.getDay();
            if (!groups[key]) groups[key] = [];
            groups[key].push(means[index]);
        });

        // Calculate group means
        const groupMeans: number[] = [];
        for (let i = 0; i < period; i++) {
            if (groups[i] && groups[i].length > 0) {
                groupMeans[i] = ss.mean(groups[i]);
            } else {
                groupMeans[i] = ss.mean(means); // Use overall mean if no data
            }
        }

        // Calculate amplitude and phase
        const overallMean = ss.mean(groupMeans);
        const deviations = groupMeans.map(gm => gm - overallMean);
        const amplitude = Math.sqrt(ss.sum(deviations.map(d => d * d)) / period);

        // Find phase (time of maximum deviation)
        const maxDeviationIndex = deviations.indexOf(Math.max(...deviations.map(Math.abs)));
        const phase = (maxDeviationIndex * 2 * Math.PI) / period;

        // Calculate confidence using F-test
        const betweenGroupVariance = ss.sum(Object.values(groups).map(group =>
            Math.pow(ss.mean(group) - overallMean, 2)
        ));
        const withinGroupVariance = ss.sum(Object.values(groups).map(group =>
            ss.sum(group.map(value => Math.pow(value - ss.mean(group), 2)))
        ));

        const fStatistic = betweenGroupVariance / (withinGroupVariance / (means.length - period));
        const confidence = fStatistic > 2 ? Math.min(95, fStatistic * 10) : 0;

        if (confidence < 50) return null; // Not significant enough

        return {
            frequency: 1 / period,
            amplitude,
            phase,
            confidence,
            period: periodType
        };
    }

    // Statistical distribution functions (simplified)
    private tCDF(t: number, df: number): number {
        // Simplified t-distribution CDF approximation
        if (df > 30) {
            return this.standardNormalCDF(t);
        }

        // Very rough approximation
        const x = t / Math.sqrt(df);
        return 0.5 + 0.5 * Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI));
    }

    private standardNormalCDF(z: number): number {
        // Simplified standard normal CDF approximation
        return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    }

    private erf(x: number): number {
        // Simplified error function approximation
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
}