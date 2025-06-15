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