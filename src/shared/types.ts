/**
 * Core data types for RNG consciousness experiment application
 * Following PEAR laboratory methodology and Global Consciousness Project approaches
 */

// Experiment modes
export type ExperimentMode = 'session' | 'continuous';
export type IntentionType = 'high' | 'low' | 'baseline' | null;
export type SessionStatus = 'running' | 'completed' | 'stopped';

/**
 * Single RNG trial consisting of 200 random bits summed together
 * This is the fundamental data unit for all experiments
 */
export interface RNGTrial {
    /** Precise timestamp when trial was generated (microsecond precision) */
    timestamp: Date;

    /** Sum of 200 random bits (range: 0-200) */
    trialValue: number;

    /** UUID of the session this trial belongs to */
    sessionId: string;

    /** Operating mode when trial was generated */
    experimentMode: ExperimentMode;

    /** Intended outcome direction (null for baseline/calibration) */
    intention: IntentionType;

    /** Sequential trial number within session */
    trialNumber: number;
}

/**
 * Experiment session containing multiple trials with specific intention
 */
export interface ExperimentSession {
    /** Unique session identifier (UUID) */
    id: string;

    /** Session start timestamp */
    startTime: Date;

    /** Session end timestamp (null if still running) */
    endTime: Date | null;

    /** Target intention for this session */
    intention: IntentionType;

    /** Target number of trials to collect */
    targetTrials: number;

    /** Current session status */
    status: SessionStatus;

    /** Optional session description/notes */
    notes?: string;

    /** Participant/researcher identifier */
    participantId?: string;

    /** Session duration in milliseconds */
    duration?: number;
}

/**
 * Intention period for continuous monitoring mode
 * Used when switching intentions during continuous data collection
 */
export interface IntentionPeriod {
    /** Unique period identifier (UUID) */
    id: string;

    /** Period start timestamp */
    startTime: Date;

    /** Period end timestamp (null if current period) */
    endTime: Date | null;

    /** Intention during this period */
    intention: 'high' | 'low';

    /** Optional notes about this intention period */
    notes: string;

    /** Reference to parent session if applicable */
    sessionId?: string;
}

/**
 * Comprehensive statistical analysis results
 */
export interface StatisticalResult {
    /** Number of trials analyzed */
    trialCount: number;

    /** Sample mean */
    mean: number;

    /** Expected mean (should be 100 for 200-bit trials) */
    expectedMean: number;

    /** Sample variance */
    variance: number;

    /** Standard deviation */
    standardDeviation: number;

    /** Z-score (standardized deviation from expected mean) */
    zScore: number;

    /** Cumulative deviation values for plotting */
    cumulativeDeviation: number[];

    /** P-value (two-tailed) */
    pValue: number;

    /** Network variance (Global Consciousness Project method) */
    networkVariance?: number;

    /** Squared Stouffer Z statistic */
    stoufferZ?: number;

    /** Analysis timestamp */
    calculatedAt: Date;

    /** Range of data analyzed */
    dataRange: {
        startTime: Date;
        endTime: Date;
    };
}

/**
 * Calibration run results for baseline establishment
 */
export interface CalibrationResult {
    /** Unique calibration run identifier */
    id: string;

    /** Calibration start timestamp */
    startTime: Date;

    /** Calibration end timestamp */
    endTime: Date;

    /** Number of calibration trials */
    trialCount: number;

    /** Statistical results of calibration */
    statistics: StatisticalResult;

    /** Quality assessment of randomness */
    qualityMetrics: {
        /** Chi-square test result */
        chiSquare: number;

        /** Runs test result */
        runsTest: number;

        /** Autocorrelation test */
        autocorrelation: number;
    };

    /** Whether calibration passed quality tests */
    passed: boolean;

    /** Any issues detected during calibration */
    issues: string[];
}

/**
 * Real-time engine status and performance metrics
 */
export interface EngineStatus {
    /** Whether engine is currently running */
    isRunning: boolean;

    /** Current trial generation rate (trials per second) */
    currentRate: number;

    /** Target rate (should be 1.0) */
    targetRate: number;

    /** Total trials generated since start */
    totalTrials: number;

    /** Last trial generation timestamp */
    lastTrialTime: Date | null;

    /** Engine start timestamp */
    startTime: Date | null;

    /** Timing accuracy metrics */
    timingMetrics: {
        /** Average timing error in milliseconds */
        averageError: number;

        /** Maximum timing error encountered */
        maxError: number;

        /** Number of missed intervals */
        missedIntervals: number;
    };

    /** Memory usage statistics */
    memoryUsage: {
        /** Current memory usage in MB */
        current: number;

        /** Peak memory usage in MB */
        peak: number;
    };
}

/**
 * Configuration for RNG engine operation
 */
export interface RNGConfig {
    /** Target trial generation rate (trials per second) */
    targetRate: number;

    /** Number of bits per trial (should be 200) */
    bitsPerTrial: number;

    /** Maximum timing tolerance in milliseconds */
    timingTolerance: number;

    /** Enable high-precision timing */
    highPrecisionTiming: boolean;

    /** Buffer size for continuous operation */
    bufferSize: number;

    /** Enable quality monitoring */
    qualityMonitoring: boolean;
}

/**
 * Validation result for data integrity checks
 */
export interface ValidationResult {
    /** Whether validation passed */
    isValid: boolean;

    /** List of validation errors */
    errors: string[];

    /** List of validation warnings */
    warnings: string[];

    /** Validation timestamp */
    validatedAt: Date;

    /** Type of validation performed */
    validationType: 'trial' | 'session' | 'statistics' | 'timing';
}

/**
 * Export metadata for data analysis
 */
export interface ExportMetadata {
    /** Export timestamp */
    exportedAt: Date;

    /** Data range exported */
    dataRange: {
        startTime: Date;
        endTime: Date;
    };

    /** Number of trials exported */
    trialCount: number;

    /** Number of sessions exported */
    sessionCount: number;

    /** Export format */
    format: 'csv' | 'json' | 'excel';

    /** File path or identifier */
    filePath: string;

    /** Checksum for data integrity */
    checksum: string;
}

/**
 * Session configuration for intention-based experiments
 */
export interface SessionConfig {
    /** Target intention for the session */
    intention: IntentionType;

    /** Target number of trials */
    targetTrials: number;

    /** Session description/notes */
    notes?: string;

    /** Participant identifier */
    participantId?: string;

    /** Pre-session meditation duration in minutes (0 = skip) */
    meditationDuration: number;

    /** Enable full-screen mode during session */
    fullScreen: boolean;

    /** Block notifications during session */
    blockNotifications: boolean;
}

/**
 * Real-time session state for live updates
 */
export interface SessionModeState {
    /** Current active session */
    currentSession: ExperimentSession | null;

    /** Session execution status */
    sessionStatus: 'setup' | 'meditation' | 'running' | 'paused' | 'completed' | 'stopped';

    /** Live trial data */
    realTimeData: RNGTrial[];

    /** Current statistical results */
    statisticalResults: import('./analysis-types').NetworkVarianceResult | null;

    /** Cumulative deviation data for charts */
    cumulativeData: import('./analysis-types').CumulativePoint[];

    /** Real-time engine status */
    engineStatus: EngineStatus;

    /** Session progress metrics */
    progress: SessionProgress;
}

/**
 * Session progress tracking
 */
export interface SessionProgress {
    /** Trials completed */
    trialsCompleted: number;

    /** Target trials */
    targetTrials: number;

    /** Session start time */
    startTime: Date;

    /** Estimated completion time */
    estimatedCompletion: Date | null;

    /** Current generation rate */
    currentRate: number;

    /** Percentage complete */
    percentComplete: number;

    /** Elapsed time in milliseconds */
    elapsedTime: number;
}

/**
 * Session control states
 */
export type SessionControlAction = 'start' | 'pause' | 'resume' | 'stop' | 'emergency_stop';

/**
 * Meditation timer configuration
 */
export interface MeditationConfig {
    /** Duration in minutes */
    duration: number;

    /** Enable breathing guidance */
    breathingGuidance: boolean;

    /** Chime intervals in seconds (0 = no chimes) */
    chimeInterval: number;

    /** Instructions to display */
    instructions: string[];
}

/**
 * Session comparison data for historical analysis
 */
export interface SessionComparison {
    /** Sessions being compared */
    sessions: ExperimentSession[];

    /** Comparative statistics */
    comparison: import('./analysis-types').ComparisonResult;

    /** Meta-analysis results */
    metaAnalysis: {
        combinedZScore: number;
        combinedPValue: number;
        heterogeneity: number;
        effectSizes: number[];
    };
}

/**
 * Export configuration for session data
 */
export interface SessionExportConfig {
    /** Include raw trial data */
    includeRawData: boolean;

    /** Include statistical analysis */
    includeStatistics: boolean;

    /** Include charts as images */
    includeCharts: boolean;

    /** Export format */
    format: 'csv' | 'json' | 'pdf' | 'excel';

    /** Date range filter */
    dateRange?: {
        start: Date;
        end: Date;
    };

    /** Intention filter */
    intentionFilter?: IntentionType[];
}

/**
 * Real-time statistics update event
 */
export interface StatisticsUpdate {
    /** Current trial count */
    trialCount: number;

    /** Current mean */
    mean: number;

    /** Current z-score */
    zScore: number;

    /** Current p-value */
    pValue: number;

    /** Current cumulative deviation */
    cumulativeDeviation: number;

    /** Effect size */
    effectSize: number;

    /** Update timestamp */
    timestamp: Date;

    /** Significance level */
    significance: 'none' | 'marginal' | 'significant' | 'highly_significant';
}

/**
 * Session alert/notification types
 */
export interface SessionAlert {
    /** Unique alert ID */
    id: string;

    /** Alert type */
    type: 'significance' | 'milestone' | 'warning' | 'error' | 'completion';

    /** Alert severity */
    severity: 'info' | 'warning' | 'error' | 'success';

    /** Alert title */
    title: string;

    /** Alert message */
    message: string;

    /** When alert occurred */
    timestamp: Date;

    /** Whether alert requires user acknowledgment */
    requiresAck: boolean;

    /** Associated data */
    data?: any;
}

/**
 * Continuous monitoring system status
 */
export interface ContinuousStatus {
    /** Whether continuous collection is active */
    isRunning: boolean;

    /** Collection start timestamp */
    startTime: Date | null;

    /** Total trials collected in current session */
    totalTrials: number;

    /** Current collection rate (trials per second) */
    currentRate: number;

    /** Current intention period (if any) */
    currentIntentionPeriod: IntentionPeriod | null;

    /** System health status */
    systemHealth: HealthStatus;

    /** Data collection statistics for today */
    todayStats: {
        trialsCollected: number;
        intentionPeriods: number;
        averageDeviation: number;
        significantEvents: number;
    };
}

/**
 * System health monitoring
 */
export interface HealthStatus {
    /** Overall system status */
    status: 'healthy' | 'warning' | 'error';

    /** RNG hardware status */
    rngStatus: 'healthy' | 'warning' | 'error';

    /** Data collection rate health */
    dataRate: {
        current: number;
        expected: number;
        status: 'healthy' | 'warning' | 'error';
    };

    /** Database health */
    databaseStatus: 'healthy' | 'warning' | 'error';

    /** Memory usage */
    memoryUsage: {
        current: number; // MB
        peak: number;    // MB
        status: 'healthy' | 'warning' | 'error';
    };

    /** Last error encountered */
    lastError: Error | null;

    /** System uptime */
    uptime: number; // milliseconds

    /** Missed trial intervals */
    missedTrials: number;
}

/**
 * Timeline data point for visualization
 */
export interface TimelinePoint {
    /** Timestamp */
    timestamp: Date;

    /** Trial value or aggregated value */
    value: number;

    /** Cumulative deviation at this point */
    cumulativeDeviation: number;

    /** Associated intention period */
    intentionPeriod: IntentionPeriod | null;

    /** Whether this point represents a significant event */
    isSignificant: boolean;
}

/**
 * Significant event detected in continuous monitoring
 */
export interface SignificantEvent {
    /** Unique event identifier */
    id: string;

    /** Event timestamp */
    timestamp: Date;

    /** Event type */
    type: 'deviation_spike' | 'trend_change' | 'anomaly' | 'milestone';

    /** Event severity */
    severity: 'low' | 'medium' | 'high';

    /** Event description */
    description: string;

    /** Statistical significance */
    significance: {
        zScore: number;
        pValue: number;
    };

    /** Associated data range */
    dataRange: {
        startTime: Date;
        endTime: Date;
        trialCount: number;
    };

    /** Whether user has been notified */
    notified: boolean;
}

/**
 * Daily analysis report
 */
export interface DailyReport {
    /** Report date */
    date: Date;

    /** Total trials collected */
    totalTrials: number;

    /** Number of intention periods */
    intentionPeriods: number;

    /** Overall statistical summary */
    statistics: StatisticalResult;

    /** Intention period analysis */
    intentionAnalysis: {
        highPeriods: IntentionPeriodAnalysis[];
        lowPeriods: IntentionPeriodAnalysis[];
        effectiveness: number; // -1 to 1 scale
    };

    /** Significant events */
    significantEvents: SignificantEvent[];

    /** Trend analysis */
    trends: {
        hourlyPatterns: number[]; // 24 hourly averages
        deviationTrend: 'increasing' | 'decreasing' | 'stable';
        effectStrength: 'weak' | 'moderate' | 'strong';
    };

    /** Quality metrics */
    qualityMetrics: {
        dataCompleteness: number; // 0-1
        timingAccuracy: number;   // average ms error
        anomalies: number;        // count of data anomalies
    };
}

/**
 * Intention period analysis results
 */
export interface IntentionPeriodAnalysis {
    /** Reference to the intention period */
    period: IntentionPeriod;

    /** Trials during this period */
    trialCount: number;

    /** Statistical results for this period */
    statistics: StatisticalResult;

    /** Comparison with baseline periods */
    baselineComparison: {
        zScoreChange: number;
        effectSize: number;
        significance: number;
    };

    /** Success rating (0-1) */
    successRating: number;

    /** Quality assessment */
    quality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Correlation analysis result
 */
export interface CorrelationResult {
    /** Correlation type */
    type: 'time_of_day' | 'duration' | 'intention_type' | 'environmental';

    /** Correlation coefficient (-1 to 1) */
    correlation: number;

    /** Statistical significance */
    significance: number;

    /** Description of correlation */
    description: string;

    /** Associated data */
    data: {
        labels: string[];
        values: number[];
    };
}

/**
 * Time range specification
 */
export interface TimeRange {
    /** Start time */
    start: Date;

    /** End time */
    end: Date;

    /** Range label */
    label: string;

    /** Range type for UI optimization */
    type: 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom';
}

/**
 * Continuous mode configuration
 */
export interface ContinuousConfig {
    /** Auto-start collection on app launch */
    autoStart: boolean;

    /** Target collection rate (trials per second) */
    targetRate: number;

    /** Data retention period (days) */
    retentionDays: number;

    /** Enable automatic analysis */
    autoAnalysis: boolean;

    /** Analysis interval (minutes) */
    analysisInterval: number;

    /** Enable anomaly detection */
    anomalyDetection: boolean;

    /** Notification settings */
    notifications: {
        significantEvents: boolean;
        dailyReports: boolean;
        systemErrors: boolean;
    };

    /** Export settings */
    autoExport: {
        enabled: boolean;
        interval: 'daily' | 'weekly' | 'monthly';
        format: 'csv' | 'json';
        location: string;
    };
}