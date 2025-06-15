/**
 * Chart optimization utilities for handling large datasets and performance optimization
 * Implements data decimation, virtualization, and caching strategies
 */

import { ChartPoint, DecimationOptions, ChartOptimization } from '../components/Charts/types';
import { CumulativePoint } from '../../shared/types';

/**
 * Chart performance optimizer
 * Handles large datasets with various optimization strategies
 */
export class ChartOptimizer {
    private cache = new Map<string, any>();
    private performanceMetrics = {
        lastOptimization: new Date(),
        totalOptimizations: 0,
        averageTime: 0
    };

    /**
     * Decimate data points to reduce chart complexity while preserving shape
     */
    decimateData(data: ChartPoint[], maxPoints: number, options: DecimationOptions = {
        method: 'douglas_peucker',
        tolerance: 0.5,
        preserveExtremes: true
    }): ChartPoint[] {
        const startTime = performance.now();

        if (data.length <= maxPoints) {
            return data;
        }

        let result: ChartPoint[];

        switch (options.method) {
            case 'subsample':
                result = this.subsampleData(data, maxPoints);
                break;
            case 'average':
                result = this.averageData(data, maxPoints);
                break;
            case 'minmax':
                result = this.minMaxData(data, maxPoints);
                break;
            case 'douglas_peucker':
                result = this.douglasPeuckerDecimation(data, options.tolerance);
                if (result.length > maxPoints) {
                    // Fallback to subsampling if Douglas-Peucker doesn't reduce enough
                    result = this.subsampleData(result, maxPoints);
                }
                break;
            default:
                result = this.subsampleData(data, maxPoints);
        }

        // Preserve extremes if requested
        if (options.preserveExtremes && result.length > 2) {
            result = this.preserveExtremes(data, result);
        }

        this.updatePerformanceMetrics(performance.now() - startTime);
        return result;
    }

    /**
     * Aggregate data by time intervals for better performance
     */
    aggregateByTime(data: CumulativePoint[], intervalMs: number): CumulativePoint[] {
        if (data.length === 0) return [];

        const aggregated: CumulativePoint[] = [];
        const intervals = new Map<number, CumulativePoint[]>();

        // Group data by time intervals
        for (const point of data) {
            const intervalKey = Math.floor(point.timestamp.getTime() / intervalMs) * intervalMs;
            if (!intervals.has(intervalKey)) {
                intervals.set(intervalKey, []);
            }
            intervals.get(intervalKey)!.push(point);
        }

        // Aggregate each interval
        for (const [intervalKey, points] of intervals) {
            const avgPoint: CumulativePoint = {
                trialIndex: points[points.length - 1].trialIndex, // Use last trial index
                timestamp: new Date(intervalKey + intervalMs / 2), // Middle of interval
                cumulativeDeviation: points.reduce((sum, p) => sum + p.cumulativeDeviation, 0) / points.length,
                runningMean: points.reduce((sum, p) => sum + p.runningMean, 0) / points.length,
                zScore: points.reduce((sum, p) => sum + p.zScore, 0) / points.length,
                runningVariance: points.reduce((sum, p) => sum + p.runningVariance, 0) / points.length
            };
            aggregated.push(avgPoint);
        }

        return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    /**
     * Virtualize rendering for very large datasets
     */
    virtualizeRendering(data: ChartPoint[], viewport: { start: number; end: number }): ChartPoint[] {
        const viewportSize = viewport.end - viewport.start;
        const bufferSize = Math.floor(viewportSize * 0.1); // 10% buffer on each side

        const startIndex = Math.max(0, viewport.start - bufferSize);
        const endIndex = Math.min(data.length, viewport.end + bufferSize);

        return data.slice(startIndex, endIndex);
    }

    /**
     * Cache calculation results to avoid redundant computation
     */
    cacheCalculation<T>(key: string, calculation: () => T): T {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const result = calculation();
        this.cache.set(key, result);

        // Limit cache size
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return result;
    }

    /**
     * Clear optimization cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    // Private optimization methods

    private subsampleData(data: ChartPoint[], maxPoints: number): ChartPoint[] {
        const step = Math.ceil(data.length / maxPoints);
        const result: ChartPoint[] = [];

        for (let i = 0; i < data.length; i += step) {
            result.push(data[i]);
        }

        return result;
    }

    private averageData(data: ChartPoint[], maxPoints: number): ChartPoint[] {
        const chunkSize = Math.ceil(data.length / maxPoints);
        const result: ChartPoint[] = [];

        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const avgY = chunk.reduce((sum, p) => sum + p.y, 0) / chunk.length;
            const avgX = chunk.reduce((sum, p) => {
                const x = typeof p.x === 'number' ? p.x : p.x.getTime();
                return sum + x;
            }, 0) / chunk.length;

            result.push({
                x: typeof data[0].x === 'number' ? avgX : new Date(avgX),
                y: avgY,
                metadata: chunk[Math.floor(chunk.length / 2)].metadata // Use middle point metadata
            });
        }

        return result;
    }

    private minMaxData(data: ChartPoint[], maxPoints: number): ChartPoint[] {
        const chunkSize = Math.ceil(data.length / (maxPoints / 2)); // Half for min, half for max
        const result: ChartPoint[] = [];

        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);

            // Find min and max in chunk
            let minPoint = chunk[0];
            let maxPoint = chunk[0];

            for (const point of chunk) {
                if (point.y < minPoint.y) minPoint = point;
                if (point.y > maxPoint.y) maxPoint = point;
            }

            // Add both min and max (unless they're the same point)
            result.push(minPoint);
            if (minPoint !== maxPoint) {
                result.push(maxPoint);
            }
        }

        return result.sort((a, b) => {
            const aTime = typeof a.x === 'number' ? a.x : a.x.getTime();
            const bTime = typeof b.x === 'number' ? b.x : b.x.getTime();
            return aTime - bTime;
        });
    }

    private douglasPeuckerDecimation(data: ChartPoint[], tolerance: number): ChartPoint[] {
        if (data.length <= 2) return data;

        return this.douglasPeucker(data, tolerance);
    }

    private douglasPeucker(points: ChartPoint[], tolerance: number): ChartPoint[] {
        if (points.length <= 2) return points;

        // Find the point with maximum distance from the line between first and last
        let maxDistance = 0;
        let index = 0;
        const start = points[0];
        const end = points[points.length - 1];

        for (let i = 1; i < points.length - 1; i++) {
            const distance = this.perpendicularDistance(points[i], start, end);
            if (distance > maxDistance) {
                index = i;
                maxDistance = distance;
            }
        }

        // If max distance is greater than tolerance, recursively simplify
        if (maxDistance > tolerance) {
            const results1 = this.douglasPeucker(points.slice(0, index + 1), tolerance);
            const results2 = this.douglasPeucker(points.slice(index), tolerance);

            return [...results1.slice(0, -1), ...results2];
        } else {
            return [start, end];
        }
    }

    private perpendicularDistance(point: ChartPoint, lineStart: ChartPoint, lineEnd: ChartPoint): number {
        const startX = typeof lineStart.x === 'number' ? lineStart.x : lineStart.x.getTime();
        const endX = typeof lineEnd.x === 'number' ? lineEnd.x : lineEnd.x.getTime();
        const pointX = typeof point.x === 'number' ? point.x : point.x.getTime();

        const A = endX - startX;
        const B = lineEnd.y - lineStart.y;
        const C = startX * lineEnd.y - endX * lineStart.y;

        return Math.abs(A * point.y - B * pointX + C) / Math.sqrt(A * A + B * B);
    }

    private preserveExtremes(originalData: ChartPoint[], decimatedData: ChartPoint[]): ChartPoint[] {
        if (originalData.length === 0) return decimatedData;

        // Find global min and max in original data
        let minPoint = originalData[0];
        let maxPoint = originalData[0];

        for (const point of originalData) {
            if (point.y < minPoint.y) minPoint = point;
            if (point.y > maxPoint.y) maxPoint = point;
        }

        // Check if extremes are already in decimated data
        const hasMin = decimatedData.some(p => p === minPoint);
        const hasMax = decimatedData.some(p => p === maxPoint);

        const result = [...decimatedData];

        if (!hasMin) result.push(minPoint);
        if (!hasMax) result.push(maxPoint);

        // Sort by x-axis
        return result.sort((a, b) => {
            const aTime = typeof a.x === 'number' ? a.x : a.x.getTime();
            const bTime = typeof b.x === 'number' ? b.x : b.x.getTime();
            return aTime - bTime;
        });
    }

    private updatePerformanceMetrics(time: number): void {
        this.performanceMetrics.totalOptimizations++;
        this.performanceMetrics.averageTime =
            (this.performanceMetrics.averageTime * (this.performanceMetrics.totalOptimizations - 1) + time) /
            this.performanceMetrics.totalOptimizations;
        this.performanceMetrics.lastOptimization = new Date();
    }
}

/**
 * Global chart optimizer instance
 */
export const chartOptimizer = new ChartOptimizer();

/**
 * Utility functions for common optimization tasks
 */

/**
 * Determine optimal decimation strategy based on data characteristics
 */
export function getOptimalDecimationStrategy(
    dataLength: number,
    targetPoints: number,
    dataType: 'time_series' | 'cumulative' | 'statistical'
): DecimationOptions {
    const reductionRatio = dataLength / targetPoints;

    if (reductionRatio < 2) {
        return { method: 'subsample', tolerance: 0.1, preserveExtremes: false };
    }

    if (dataType === 'cumulative' || dataType === 'time_series') {
        // Preserve shape for cumulative data
        return {
            method: 'douglas_peucker',
            tolerance: reductionRatio * 0.1,
            preserveExtremes: true
        };
    }

    if (reductionRatio < 10) {
        return { method: 'minmax', tolerance: 0.5, preserveExtremes: true };
    }

    return { method: 'average', tolerance: 1.0, preserveExtremes: true };
}

/**
 * Calculate appropriate time interval for aggregation
 */
export function calculateAggregationInterval(
    timeSpan: number, // in milliseconds
    targetPoints: number
): number {
    const optimalInterval = timeSpan / targetPoints;

    // Round to sensible intervals
    const intervals = [
        1000,      // 1 second
        5000,      // 5 seconds
        10000,     // 10 seconds
        30000,     // 30 seconds
        60000,     // 1 minute
        300000,    // 5 minutes
        600000,    // 10 minutes
        1800000,   // 30 minutes
        3600000,   // 1 hour
        14400000,  // 4 hours
        86400000   // 1 day
    ];

    for (const interval of intervals) {
        if (optimalInterval <= interval) {
            return interval;
        }
    }

    return intervals[intervals.length - 1];
}

/**
 * Memory usage estimation for chart data
 */
export function estimateMemoryUsage(dataPoints: number): number {
    // Rough estimation: each point uses ~100 bytes (including overhead)
    return dataPoints * 100;
}

/**
 * Performance budget checker
 */
export function checkPerformanceBudget(
    dataPoints: number,
    chartDimensions: { width: number; height: number }
): { withinBudget: boolean; recommendations: string[] } {
    const recommendations: string[] = [];
    let withinBudget = true;

    // Check data point budget (aim for < 10k points for smooth interaction)
    if (dataPoints > 10000) {
        withinBudget = false;
        recommendations.push(`Consider decimating data: ${dataPoints} points is above recommended 10,000`);
    }

    // Check memory budget (aim for < 50MB)
    const memoryUsage = estimateMemoryUsage(dataPoints);
    if (memoryUsage > 50 * 1024 * 1024) {
        withinBudget = false;
        recommendations.push(`High memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
    }

    // Check render complexity
    const pixelDensity = dataPoints / (chartDimensions.width * chartDimensions.height);
    if (pixelDensity > 0.1) {
        withinBudget = false;
        recommendations.push('High pixel density may cause render performance issues');
    }

    return { withinBudget, recommendations };
}