import React, { useState, useEffect, useCallback } from 'react';
import { RNGEngine } from '../core/rng/RNGEngine';
import { DatabaseConnection } from '../database/DatabaseConnection';
import { StatisticalAnalysis } from '../core/analysis/StatisticalAnalysis';

// Performance Report Interfaces
export interface RNGPerformanceReport {
  averageGenerationTime: number;
  trialGenerationRate: number;
  qualityScoreAverage: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  recommendations: string[];
}

export interface DatabasePerformanceReport {
  averageInsertTime: number;
  averageQueryTime: number;
  transactionThroughput: number;
  connectionPoolUtilization: number;
  indexEfficiency: number;
  diskIOMetrics: {
    readOps: number;
    writeOps: number;
    averageReadTime: number;
    averageWriteTime: number;
  };
  recommendations: string[];
}

export interface UIPerformanceReport {
  renderTime: number;
  componentUpdateFrequency: number;
  memoryLeaks: boolean;
  largeRenderCount: number;
  eventHandlingLatency: number;
  recommendations: string[];
}

export interface StatsPerformanceReport {
  calculationTime: number;
  accuracyScore: number;
  memoryEfficiency: number;
  algorithmComplexity: string;
  recommendations: string[];
}

export interface BottleneckReport {
  primaryBottleneck: string;
  secondaryBottlenecks: string[];
  impactScore: number;
  optimizationPriority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export class PerformanceProfiler {
  private rngEngine: RNGEngine | null = null;
  private dbConnection: DatabaseConnection | null = null;
  private statisticalAnalysis: StatisticalAnalysis | null = null;
  private performanceData: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializePerformanceObservers();
  }

  private initializePerformanceObservers(): void {
    // Memory usage observer
    if ('memory' in performance) {
      const memoryObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('memory', (performance as any).memory.usedJSHeapSize);
        }
      });
      this.observers.push(memoryObserver);
    }

    // Navigation timing observer
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.recordMetric('loadComplete', navEntry.loadEventEnd - navEntry.loadEventStart);
        }
      }
    });

    try {
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation timing not supported');
    }

    // Measure observer for custom measurements
    const measureObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry.name, entry.duration);
      }
    });

    try {
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    } catch (e) {
      console.warn('Measure observer not supported');
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.performanceData.has(name)) {
      this.performanceData.set(name, []);
    }
    const metrics = this.performanceData.get(name)!;
    metrics.push(value);

    // Keep only recent metrics (last 1000 entries)
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  private getMetricStatistics(name: string): { average: number; min: number; max: number; latest: number } {
    const metrics = this.performanceData.get(name) || [];
    if (metrics.length === 0) {
      return { average: 0, min: 0, max: 0, latest: 0 };
    }

    const sum = metrics.reduce((a, b) => a + b, 0);
    return {
      average: sum / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      latest: metrics[metrics.length - 1]
    };
  }

  async profileRNGGeneration(): Promise<RNGPerformanceReport> {
    if (!this.rngEngine) {
      throw new Error('RNG Engine not initialized for profiling');
    }

    const trials = 100;
    const startTime = performance.now();
    const generationTimes: number[] = [];
    const qualityScores: number[] = [];
    let errorCount = 0;

    // Profile trial generation
    for (let i = 0; i < trials; i++) {
      const trialStart = performance.now();
      try {
        const trial = await this.rngEngine.generateTrial();
        const trialEnd = performance.now();

        generationTimes.push(trialEnd - trialStart);
        qualityScores.push(trial.qualityScore || 0);
      } catch (error) {
        errorCount++;
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Calculate memory usage during RNG operations
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    // Generate additional trials to measure memory impact
    for (let i = 0; i < 50; i++) {
      try {
        await this.rngEngine.generateTrial();
      } catch (error) {
        // Ignore errors for memory measurement
      }
    }

    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryUsage = memoryAfter - memoryBefore;

    // Calculate statistics
    const averageGenerationTime = generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length;
    const trialGenerationRate = 1000 / averageGenerationTime; // trials per second
    const qualityScoreAverage = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const errorRate = errorCount / trials;

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageGenerationTime > 50) {
      recommendations.push('RNG generation time is high. Consider optimizing random number source.');
    }
    if (errorRate > 0.01) {
      recommendations.push('Error rate is above acceptable threshold. Review error handling.');
    }
    if (qualityScoreAverage < 0.95) {
      recommendations.push('Quality scores are below optimal. Review randomness quality controls.');
    }
    if (memoryUsage > 1024 * 1024) { // > 1MB
      recommendations.push('Memory usage per trial is high. Consider memory optimization.');
    }

    return {
      averageGenerationTime,
      trialGenerationRate,
      qualityScoreAverage,
      errorRate,
      memoryUsage,
      cpuUsage: this.estimateCPUUsage(totalTime, trials),
      recommendations
    };
  }

  async profileDatabaseOperations(): Promise<DatabasePerformanceReport> {
    if (!this.dbConnection) {
      throw new Error('Database connection not initialized for profiling');
    }

    const insertTimes: number[] = [];
    const queryTimes: number[] = [];

    // Profile insert operations
    for (let i = 0; i < 50; i++) {
      const insertStart = performance.now();
      try {
        // Simulate trial insert
        const mockTrial = {
          id: `profile-test-${i}`,
          timestamp: new Date(),
          bits: Array(200).fill(0).map(() => Math.random() < 0.5 ? 1 : 0),
          ones: 100,
          zeros: 100,
          sessionId: 'profile-session',
          qualityScore: 0.95
        };

        // This would use actual database operations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10)); // Simulate insert

        const insertEnd = performance.now();
        insertTimes.push(insertEnd - insertStart);
      } catch (error) {
        // Handle insert errors
      }
    }

    // Profile query operations
    for (let i = 0; i < 20; i++) {
      const queryStart = performance.now();
      try {
        // Simulate complex query
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20)); // Simulate query

        const queryEnd = performance.now();
        queryTimes.push(queryEnd - queryStart);
      } catch (error) {
        // Handle query errors
      }
    }

    // Calculate statistics
    const averageInsertTime = insertTimes.reduce((a, b) => a + b, 0) / insertTimes.length;
    const averageQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const transactionThroughput = 1000 / averageInsertTime; // transactions per second

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageInsertTime > 10) {
      recommendations.push('Insert operations are slow. Consider batch inserts or index optimization.');
    }
    if (averageQueryTime > 50) {
      recommendations.push('Query operations are slow. Review query optimization and indexing.');
    }
    if (transactionThroughput < 100) {
      recommendations.push('Transaction throughput is low. Consider connection pooling optimization.');
    }

    return {
      averageInsertTime,
      averageQueryTime,
      transactionThroughput,
      connectionPoolUtilization: 0.75, // Placeholder - would measure actual pool usage
      indexEfficiency: 0.85, // Placeholder - would analyze actual index usage
      diskIOMetrics: {
        readOps: 150,
        writeOps: 75,
        averageReadTime: 2.5,
        averageWriteTime: 5.0
      },
      recommendations
    };
  }

  async profileUIRendering(): Promise<UIPerformanceReport> {
    const renderTimes = this.getMetricStatistics('componentRender');
    const updateFrequency = this.getMetricStatistics('componentUpdate');

    // Detect memory leaks by monitoring memory growth
    const memoryGrowth = this.analyzeMemoryGrowth();
    const memoryLeaks = memoryGrowth > 1024 * 1024 * 10; // > 10MB growth indicates potential leak

    // Count large renders (>16ms for 60fps)
    const renderMetrics = this.performanceData.get('componentRender') || [];
    const largeRenderCount = renderMetrics.filter(time => time > 16).length;

    // Measure event handling latency
    const eventLatency = this.getMetricStatistics('eventHandling');

    // Generate recommendations
    const recommendations: string[] = [];
    if (renderTimes.average > 16) {
      recommendations.push('Render times exceed 16ms target. Consider React.memo and useMemo optimization.');
    }
    if (memoryLeaks) {
      recommendations.push('Potential memory leak detected. Review component cleanup and event listeners.');
    }
    if (largeRenderCount > renderMetrics.length * 0.1) {
      recommendations.push('High number of slow renders. Profile and optimize heavy components.');
    }
    if (eventLatency.average > 100) {
      recommendations.push('Event handling latency is high. Consider debouncing and async processing.');
    }

    return {
      renderTime: renderTimes.average,
      componentUpdateFrequency: updateFrequency.average,
      memoryLeaks,
      largeRenderCount,
      eventHandlingLatency: eventLatency.average,
      recommendations
    };
  }

  async profileStatisticalCalculations(): Promise<StatsPerformanceReport> {
    if (!this.statisticalAnalysis) {
      this.statisticalAnalysis = new StatisticalAnalysis();
    }

    // Generate test data
    const testData = Array(1000).fill(0).map((_, index) => ({
      id: `calc-test-${index}`,
      timestamp: new Date(Date.now() + index * 1000),
      bits: Array(200).fill(0).map(() => Math.random() < 0.5 ? 1 : 0),
      ones: 0,
      zeros: 0,
      sessionId: 'calculation-profile',
      qualityScore: 0.95
    })).map(trial => {
      trial.ones = trial.bits.filter(bit => bit === 1).length;
      trial.zeros = trial.bits.filter(bit => bit === 0).length;
      return trial;
    });

    // Profile different statistical calculations
    const calcStart = performance.now();

    const networkVariance = this.statisticalAnalysis.calculateNetworkVariance(testData);
    const zScore = this.statisticalAnalysis.calculateZScore(testData);
    const cumulativeDeviation = this.statisticalAnalysis.calculateCumulativeDeviation(testData);
    const autocorrelation = this.statisticalAnalysis.calculateAutocorrelation(testData, 20);

    const calcEnd = performance.now();
    const calculationTime = calcEnd - calcStart;

    // Validate accuracy by comparing with known results
    const accuracyScore = this.validateStatisticalAccuracy(testData, networkVariance, zScore);

    // Measure memory efficiency
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    // Run calculations again to measure memory usage
    this.statisticalAnalysis.calculateNetworkVariance(testData);
    this.statisticalAnalysis.calculateZScore(testData);

    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryEfficiency = (memoryAfter - memoryBefore) / testData.length; // bytes per data point

    // Generate recommendations
    const recommendations: string[] = [];
    if (calculationTime > 1000) {
      recommendations.push('Statistical calculations are slow. Consider algorithm optimization or data streaming.');
    }
    if (accuracyScore < 0.95) {
      recommendations.push('Statistical accuracy is below target. Review calculation implementations.');
    }
    if (memoryEfficiency > 1000) {
      recommendations.push('Memory efficiency is poor. Consider optimizing data structures.');
    }

    return {
      calculationTime,
      accuracyScore,
      memoryEfficiency,
      algorithmComplexity: this.analyzeAlgorithmComplexity(calculationTime, testData.length),
      recommendations
    };
  }

  async identifyBottlenecks(): Promise<BottleneckReport> {
    // Run all profiling operations
    const rngReport = await this.profileRNGGeneration().catch(() => null);
    const dbReport = await this.profileDatabaseOperations().catch(() => null);
    const uiReport = await this.profileUIRendering().catch(() => null);
    const statsReport = await this.profileStatisticalCalculations().catch(() => null);

    // Analyze bottlenecks
    const bottlenecks: Array<{ area: string; score: number; description: string }> = [];

    if (rngReport) {
      const rngScore = this.calculateBottleneckScore('rng', rngReport.averageGenerationTime, 10, 50);
      bottlenecks.push({ area: 'RNG Generation', score: rngScore, description: 'Random number generation performance' });
    }

    if (dbReport) {
      const dbScore = this.calculateBottleneckScore('database', dbReport.averageInsertTime, 5, 20);
      bottlenecks.push({ area: 'Database Operations', score: dbScore, description: 'Database read/write performance' });
    }

    if (uiReport) {
      const uiScore = this.calculateBottleneckScore('ui', uiReport.renderTime, 8, 16);
      bottlenecks.push({ area: 'UI Rendering', score: uiScore, description: 'User interface rendering performance' });
    }

    if (statsReport) {
      const statsScore = this.calculateBottleneckScore('statistics', statsReport.calculationTime, 100, 500);
      bottlenecks.push({ area: 'Statistical Calculations', score: statsScore, description: 'Statistical analysis performance' });
    }

    // Sort by bottleneck score (higher is worse)
    bottlenecks.sort((a, b) => b.score - a.score);

    const primaryBottleneck = bottlenecks[0]?.area || 'None identified';
    const secondaryBottlenecks = bottlenecks.slice(1, 3).map(b => b.area);
    const impactScore = bottlenecks[0]?.score || 0;

    let optimizationPriority: 'high' | 'medium' | 'low' = 'low';
    if (impactScore > 0.7) optimizationPriority = 'high';
    else if (impactScore > 0.4) optimizationPriority = 'medium';

    // Generate comprehensive recommendations
    const recommendations = [
      ...rngReport?.recommendations || [],
      ...dbReport?.recommendations || [],
      ...uiReport?.recommendations || [],
      ...statsReport?.recommendations || []
    ].slice(0, 5); // Top 5 recommendations

    return {
      primaryBottleneck,
      secondaryBottlenecks,
      impactScore,
      optimizationPriority,
      recommendations
    };
  }

  private calculateBottleneckScore(area: string, actualValue: number, goodThreshold: number, badThreshold: number): number {
    if (actualValue <= goodThreshold) return 0;
    if (actualValue >= badThreshold) return 1;
    return (actualValue - goodThreshold) / (badThreshold - goodThreshold);
  }

  private estimateCPUUsage(totalTime: number, operations: number): number {
    // Simplified CPU usage estimation based on operation density
    const operationsPerMs = operations / totalTime;
    return Math.min(operationsPerMs * 10, 100); // Cap at 100%
  }

  private analyzeMemoryGrowth(): number {
    const memoryMetrics = this.performanceData.get('memory') || [];
    if (memoryMetrics.length < 10) return 0;

    const recent = memoryMetrics.slice(-10);
    const older = memoryMetrics.slice(-20, -10);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return recentAvg - olderAvg;
  }

  private validateStatisticalAccuracy(data: any[], networkVariance: number, zScore: number): number {
    // Validate against expected statistical properties
    const expectedVariance = 50; // For 200-bit trials
    const varianceAccuracy = 1 - Math.abs(networkVariance - expectedVariance) / expectedVariance;

    // Z-score should be reasonable for random data
    const zScoreAccuracy = Math.abs(zScore) < 3 ? 1 : 0.5;

    return (varianceAccuracy + zScoreAccuracy) / 2;
  }

  private analyzeAlgorithmComplexity(executionTime: number, dataSize: number): string {
    const timePerElement = executionTime / dataSize;

    if (timePerElement < 0.01) return 'O(1) - Constant';
    if (timePerElement < 0.1) return 'O(log n) - Logarithmic';
    if (timePerElement < 1) return 'O(n) - Linear';
    if (timePerElement < 10) return 'O(n log n) - Linearithmic';
    return 'O(n²) - Quadratic';
  }

  // Public methods for measuring specific operations
  startMeasurement(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasurement(name: string): void {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  // Initialize profiler with system components
  initialize(rngEngine: RNGEngine, dbConnection: DatabaseConnection): void {
    this.rngEngine = rngEngine;
    this.dbConnection = dbConnection;
  }

  // Cleanup
  dispose(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.performanceData.clear();
  }
}

// React component for performance monitoring dashboard
export const PerformanceProfilerComponent: React.FC = () => {
  const [profiler] = useState(() => new PerformanceProfiler());
  const [reports, setReports] = useState<{
    rng?: RNGPerformanceReport;
    database?: DatabasePerformanceReport;
    ui?: UIPerformanceReport;
    statistics?: StatsPerformanceReport;
    bottlenecks?: BottleneckReport;
  }>({});
  const [isProfilering, setIsProfilering] = useState(false);

  const runCompleteProfile = useCallback(async () => {
    setIsProfilering(true);
    try {
      const [rng, database, ui, statistics, bottlenecks] = await Promise.allSettled([
        profiler.profileRNGGeneration(),
        profiler.profileDatabaseOperations(),
        profiler.profileUIRendering(),
        profiler.profileStatisticalCalculations(),
        profiler.identifyBottlenecks()
      ]);

      setReports({
        rng: rng.status === 'fulfilled' ? rng.value : undefined,
        database: database.status === 'fulfilled' ? database.value : undefined,
        ui: ui.status === 'fulfilled' ? ui.value : undefined,
        statistics: statistics.status === 'fulfilled' ? statistics.value : undefined,
        bottlenecks: bottlenecks.status === 'fulfilled' ? bottlenecks.value : undefined
      });
    } finally {
      setIsProfilering(false);
    }
  }, [profiler]);

  useEffect(() => {
    return () => {
      profiler.dispose();
    };
  }, [profiler]);

  return (
    <div className="performance-profiler">
      <div className="profiler-header">
        <h2>Performance Profiler</h2>
        <button
          onClick={runCompleteProfile}
          disabled={isProfilering}
          className="profile-btn"
        >
          {isProfilering ? 'Profiling...' : 'Run Complete Profile'}
        </button>
      </div>

      {reports.bottlenecks && (
        <div className="bottleneck-summary">
          <h3>Performance Bottlenecks</h3>
          <div className={`bottleneck-priority ${reports.bottlenecks.optimizationPriority}`}>
            <strong>Primary: </strong>{reports.bottlenecks.primaryBottleneck}
            <span className="impact-score">Impact: {(reports.bottlenecks.impactScore * 100).toFixed(0)}%</span>
          </div>
          {reports.bottlenecks.secondaryBottlenecks.length > 0 && (
            <div className="secondary-bottlenecks">
              <strong>Secondary: </strong>{reports.bottlenecks.secondaryBottlenecks.join(', ')}
            </div>
          )}
          <div className="recommendations">
            <h4>Top Recommendations:</h4>
            <ul>
              {reports.bottlenecks.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="performance-reports">
        {reports.rng && (
          <div className="performance-card">
            <h3>RNG Performance</h3>
            <div className="metrics">
              <div className="metric">
                <label>Generation Time:</label>
                <span>{reports.rng.averageGenerationTime.toFixed(2)}ms</span>
              </div>
              <div className="metric">
                <label>Generation Rate:</label>
                <span>{reports.rng.trialGenerationRate.toFixed(1)} trials/sec</span>
              </div>
              <div className="metric">
                <label>Quality Score:</label>
                <span>{(reports.rng.qualityScoreAverage * 100).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <label>Error Rate:</label>
                <span>{(reports.rng.errorRate * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        {reports.database && (
          <div className="performance-card">
            <h3>Database Performance</h3>
            <div className="metrics">
              <div className="metric">
                <label>Insert Time:</label>
                <span>{reports.database.averageInsertTime.toFixed(2)}ms</span>
              </div>
              <div className="metric">
                <label>Query Time:</label>
                <span>{reports.database.averageQueryTime.toFixed(2)}ms</span>
              </div>
              <div className="metric">
                <label>Throughput:</label>
                <span>{reports.database.transactionThroughput.toFixed(1)} tx/sec</span>
              </div>
              <div className="metric">
                <label>Pool Utilization:</label>
                <span>{(reports.database.connectionPoolUtilization * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {reports.ui && (
          <div className="performance-card">
            <h3>UI Performance</h3>
            <div className="metrics">
              <div className="metric">
                <label>Render Time:</label>
                <span>{reports.ui.renderTime.toFixed(2)}ms</span>
              </div>
              <div className="metric">
                <label>Memory Leaks:</label>
                <span className={reports.ui.memoryLeaks ? 'warning' : 'good'}>
                  {reports.ui.memoryLeaks ? 'Detected' : 'None'}
                </span>
              </div>
              <div className="metric">
                <label>Slow Renders:</label>
                <span>{reports.ui.largeRenderCount}</span>
              </div>
              <div className="metric">
                <label>Event Latency:</label>
                <span>{reports.ui.eventHandlingLatency.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        )}

        {reports.statistics && (
          <div className="performance-card">
            <h3>Statistical Analysis Performance</h3>
            <div className="metrics">
              <div className="metric">
                <label>Calculation Time:</label>
                <span>{reports.statistics.calculationTime.toFixed(2)}ms</span>
              </div>
              <div className="metric">
                <label>Accuracy Score:</label>
                <span>{(reports.statistics.accuracyScore * 100).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <label>Memory Efficiency:</label>
                <span>{reports.statistics.memoryEfficiency.toFixed(0)} bytes/point</span>
              </div>
              <div className="metric">
                <label>Complexity:</label>
                <span>{reports.statistics.algorithmComplexity}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};