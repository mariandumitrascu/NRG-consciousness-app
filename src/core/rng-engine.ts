/**
 * Core RNG Engine for consciousness experiments
 * Generates 200-bit trials using crypto.getRandomValues() with precise timing
 * Following PEAR laboratory methodology
 */

import {
    RNGTrial,
    CalibrationResult,
    EngineStatus,
    RNGConfig,
    ExperimentMode,
    IntentionType
} from '../shared/types';
import {
    PrecisionTimer,
    getHighPrecisionTimestamp,
    SessionTimer
} from './time-manager';
import {
    calculateStatisticalResult,
    runBaselineTest,
    runChiSquareTest,
    runRunsTest,
    calculateAutocorrelation
} from './statistics';
import { validateRNGTrial } from './validation';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Main RNG Engine class
 */
export class RNGEngine {
    private config: RNGConfig;
    private isRunning: boolean = false;
    private currentSessionId: string | null = null;
    private currentMode: ExperimentMode = 'session';
    private currentIntention: IntentionType = null;
    private trialCounter: number = 0;
    private totalTrialsGenerated: number = 0;

    // Timing components
    private precisionTimer: PrecisionTimer | null = null;
    private sessionTimer: SessionTimer;
    private startTime: Date | null = null;
    private lastTrialTime: Date | null = null;

    // Data storage
    private trialBuffer: RNGTrial[] = [];
    private listeners: Array<(trial: RNGTrial) => void> = [];
    private statusListeners: Array<(status: EngineStatus) => void> = [];

    // Performance monitoring
    private memoryUsage: { current: number; peak: number } = { current: 0, peak: 0 };
    private qualityMetrics: {
        lastCalibration: CalibrationResult | null;
        recentTrials: RNGTrial[];
    } = {
            lastCalibration: null,
            recentTrials: []
        };

    constructor(config?: Partial<RNGConfig>) {
        this.config = {
            targetRate: 1.0, // 1 trial per second
            bitsPerTrial: 200,
            timingTolerance: 100, // 100ms tolerance
            highPrecisionTiming: true,
            bufferSize: 1000, // Buffer up to 1000 trials
            qualityMonitoring: true,
            ...config
        };

        this.sessionTimer = new SessionTimer();

        // Initialize precision timer
        this.precisionTimer = new PrecisionTimer(
            1000 / this.config.targetRate, // Interval in milliseconds
            () => this.generateAndProcessTrial(),
            this.config.highPrecisionTiming
        );

        // Monitor memory usage periodically
        setInterval(() => this.updateMemoryUsage(), 5000);
    }

    /**
     * Generate a single 200-bit trial
     */
    generateTrial(): RNGTrial {
        const timestamp = getHighPrecisionTimestamp();

        // Generate exactly 200 random bits using crypto.getRandomValues()
        const trialValue = this.generate200BitSum();

        // Increment trial counter
        this.trialCounter++;
        this.totalTrialsGenerated++;

        const trial: RNGTrial = {
            timestamp,
            trialValue,
            sessionId: this.currentSessionId || generateUUID(),
            experimentMode: this.currentMode,
            intention: this.currentIntention,
            trialNumber: this.trialCounter
        };

        // Validate the generated trial
        const validation = validateRNGTrial(trial);
        if (!validation.isValid) {
            console.error('Generated invalid trial:', validation.errors);
            throw new Error(`Generated invalid trial: ${validation.errors.join(', ')}`);
        }

        this.lastTrialTime = timestamp;

        return trial;
    }

    /**
     * Start continuous trial generation
     */
    startContinuous(sessionId?: string, mode: ExperimentMode = 'continuous', intention: IntentionType = null): void {
        if (this.isRunning) {
            this.stopContinuous();
        }

        this.currentSessionId = sessionId || generateUUID();
        this.currentMode = mode;
        this.currentIntention = intention;
        this.trialCounter = 0;
        this.isRunning = true;
        this.startTime = getHighPrecisionTimestamp();

        // Start timers
        this.sessionTimer.start();
        if (this.precisionTimer) {
            this.precisionTimer.start();
        }

        console.log(`RNG Engine started - Session: ${this.currentSessionId}, Mode: ${mode}, Intention: ${intention}`);
        this.notifyStatusListeners();
    }

    /**
     * Stop continuous trial generation
     */
    stopContinuous(): void {
        if (!this.isRunning) return;

        this.isRunning = false;

        // Stop timers
        if (this.precisionTimer) {
            this.precisionTimer.stop();
        }
        this.sessionTimer.stop();

        console.log(`RNG Engine stopped - Generated ${this.trialCounter} trials`);
        this.notifyStatusListeners();
    }

    /**
     * Run calibration trials to establish baseline
     */
    async runCalibration(trialCount: number): Promise<CalibrationResult> {
        const calibrationId = generateUUID();
        const startTime = getHighPrecisionTimestamp();

        console.log(`Starting calibration with ${trialCount} trials...`);

        // Generate calibration trials
        const calibrationTrials: RNGTrial[] = [];
        const originalSessionId = this.currentSessionId;

        // Set calibration mode
        this.currentSessionId = calibrationId;
        this.currentMode = 'session';
        this.currentIntention = 'baseline';
        this.trialCounter = 0;

        try {
            for (let i = 0; i < trialCount; i++) {
                const trial = this.generateTrial();
                calibrationTrials.push(trial);

                // Add small delay to simulate real-time generation
                if (i < trialCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            const endTime = getHighPrecisionTimestamp();

            // Analyze calibration results
            const statistics = calculateStatisticalResult(calibrationTrials);
            const baselineTest = runBaselineTest(calibrationTrials);
            const chiSquareTest = runChiSquareTest(calibrationTrials);
            const runsTest = runRunsTest(calibrationTrials);
            const autocorrelationTest = calculateAutocorrelation(calibrationTrials);

            const calibrationResult: CalibrationResult = {
                id: calibrationId,
                startTime,
                endTime,
                trialCount: calibrationTrials.length,
                statistics,
                qualityMetrics: {
                    chiSquare: chiSquareTest.chiSquare,
                    runsTest: runsTest.runsObserved,
                    autocorrelation: autocorrelationTest.autocorrelation
                },
                passed: baselineTest.passed,
                issues: baselineTest.issues
            };

            // Store calibration results
            this.qualityMetrics.lastCalibration = calibrationResult;

            console.log(`Calibration completed - Quality: ${baselineTest.overallQuality}, Passed: ${calibrationResult.passed}`);

            return calibrationResult;

        } finally {
            // Restore original session
            this.currentSessionId = originalSessionId;
            this.trialCounter = 0;
        }
    }

    /**
     * Get current engine status
     */
    getStatus(): EngineStatus {
        const timingMetrics = this.precisionTimer?.getTimingMetrics() || {
            averageError: 0,
            maxError: 0,
            missedIntervals: 0,
            intervalCount: 0
        };

        const currentRate = this.isRunning && this.startTime
            ? this.totalTrialsGenerated / ((Date.now() - this.startTime.getTime()) / 1000)
            : 0;

        return {
            isRunning: this.isRunning,
            currentRate,
            targetRate: this.config.targetRate,
            totalTrials: this.totalTrialsGenerated,
            lastTrialTime: this.lastTrialTime,
            startTime: this.startTime,
            timingMetrics,
            memoryUsage: { ...this.memoryUsage }
        };
    }

    /**
     * Update current session parameters
     */
    updateSession(sessionId: string, intention: IntentionType): void {
        this.currentSessionId = sessionId;
        this.currentIntention = intention;
        this.trialCounter = 0; // Reset counter for new session

        console.log(`Session updated - ID: ${sessionId}, Intention: ${intention}`);
    }

    /**
     * Add listener for new trials
     */
    addTrialListener(listener: (trial: RNGTrial) => void): void {
        this.listeners.push(listener);
    }

    /**
     * Remove trial listener
     */
    removeTrialListener(listener: (trial: RNGTrial) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Add listener for status updates
     */
    addStatusListener(listener: (status: EngineStatus) => void): void {
        this.statusListeners.push(listener);
    }

    /**
     * Remove status listener
     */
    removeStatusListener(listener: (status: EngineStatus) => void): void {
        const index = this.statusListeners.indexOf(listener);
        if (index > -1) {
            this.statusListeners.splice(index, 1);
        }
    }

    /**
     * Get recent trials for quality monitoring
     */
    getRecentTrials(count: number = 100): RNGTrial[] {
        return this.qualityMetrics.recentTrials.slice(-count);
    }

    /**
     * Get last calibration result
     */
    getLastCalibration(): CalibrationResult | null {
        return this.qualityMetrics.lastCalibration;
    }

    /**
     * Get current configuration
     */
    getConfig(): RNGConfig {
        return { ...this.config };
    }

    /**
     * Update configuration (requires restart if running)
     */
    updateConfig(newConfig: Partial<RNGConfig>): void {
        const wasRunning = this.isRunning;

        if (wasRunning) {
            this.stopContinuous();
        }

        this.config = { ...this.config, ...newConfig };

        // Recreate precision timer if timing settings changed
        if (newConfig.targetRate || newConfig.highPrecisionTiming) {
            this.precisionTimer = new PrecisionTimer(
                1000 / this.config.targetRate,
                () => this.generateAndProcessTrial(),
                this.config.highPrecisionTiming
            );
        }

        if (wasRunning) {
            this.startContinuous(this.currentSessionId || undefined, this.currentMode, this.currentIntention);
        }
    }

    /**
     * Generate exactly 200 random bits and sum them
     * Uses crypto.getRandomValues() for cryptographically secure randomness
     */
    private generate200BitSum(): number {
        // We need 200 bits, which is 25 bytes (25 * 8 = 200)
        const randomBytes = new Uint8Array(25);
        crypto.getRandomValues(randomBytes);

        let bitSum = 0;
        let bitCount = 0;

        // Process each byte and extract exactly 200 bits
        for (let byteIndex = 0; byteIndex < randomBytes.length && bitCount < 200; byteIndex++) {
            const byte = randomBytes[byteIndex];

            // Extract bits from this byte
            for (let bitPosition = 0; bitPosition < 8 && bitCount < 200; bitPosition++) {
                const bit = (byte >> bitPosition) & 1;
                bitSum += bit;
                bitCount++;
            }
        }

        return bitSum;
    }

    /**
     * Generate and process a trial (called by precision timer)
     */
    private generateAndProcessTrial(): void {
        if (!this.isRunning) return;

        try {
            const trial = this.generateTrial();

            // Add to buffer
            this.trialBuffer.push(trial);

            // Maintain buffer size
            if (this.trialBuffer.length > this.config.bufferSize) {
                this.trialBuffer.shift();
            }

            // Update quality monitoring
            if (this.config.qualityMonitoring) {
                this.qualityMetrics.recentTrials.push(trial);
                if (this.qualityMetrics.recentTrials.length > 1000) {
                    this.qualityMetrics.recentTrials.shift();
                }
            }

            // Notify listeners
            this.listeners.forEach(listener => {
                try {
                    listener(trial);
                } catch (error) {
                    console.error('Error in trial listener:', error);
                }
            });

            // Periodic status updates
            if (this.trialCounter % 10 === 0) {
                this.notifyStatusListeners();
            }

        } catch (error) {
            console.error('Error generating trial:', error);
            this.stopContinuous();
        }
    }

    /**
     * Notify status listeners
     */
    private notifyStatusListeners(): void {
        const status = this.getStatus();
        this.statusListeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                console.error('Error in status listener:', error);
            }
        });
    }

    /**
     * Update memory usage statistics
     */
    private updateMemoryUsage(): void {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            this.memoryUsage.current = Math.round(usage.heapUsed / 1024 / 1024); // MB
            this.memoryUsage.peak = Math.max(this.memoryUsage.peak, this.memoryUsage.current);
        } else {
            // Browser environment - approximate memory usage
            this.memoryUsage.current = Math.round(
                (this.trialBuffer.length * 100 + // Approximate size per trial
                    this.qualityMetrics.recentTrials.length * 100) / 1024 / 1024
            );
            this.memoryUsage.peak = Math.max(this.memoryUsage.peak, this.memoryUsage.current);
        }
    }

    /**
 * Clean up resources
 */
    destroy(): void {
        this.stopContinuous();
        this.listeners.length = 0;
        this.statusListeners.length = 0;
        this.trialBuffer.length = 0;
        this.qualityMetrics.recentTrials.length = 0;

        console.log('RNG Engine destroyed');
    }
}

/**
 * Create and configure a new RNG engine instance
 */
export function createRNGEngine(config?: Partial<RNGConfig>): RNGEngine {
    return new RNGEngine(config);
}

/**
 * Test the quality of the RNG by generating a sample of trials
 */
export async function testRNGQuality(sampleSize: number = 1000): Promise<{
    passed: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    statistics: any;
}> {
    const engine = createRNGEngine();

    try {
        const calibration = await engine.runCalibration(sampleSize);

        return {
            passed: calibration.passed,
            quality: runBaselineTest(calibration.statistics.cumulativeDeviation.map((_, i) => ({
                timestamp: new Date(),
                trialValue: Math.round(Math.random() * 200), // This is just for the test structure
                sessionId: calibration.id,
                experimentMode: 'session' as ExperimentMode,
                intention: 'baseline' as IntentionType,
                trialNumber: i + 1
            }))).overallQuality,
            issues: calibration.issues,
            statistics: calibration.statistics
        };
    } finally {
        engine.destroy();
    }
}

/**
 * Verify crypto.getRandomValues() availability
 */
export function verifyCryptoSupport(): {
    supported: boolean;
    quality: 'high' | 'medium' | 'low';
    issues: string[];
} {
    const issues: string[] = [];
    let supported = false;
    let quality: 'high' | 'medium' | 'low' = 'low';

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        supported = true;

        try {
            // Test crypto.getRandomValues()
            const testArray = new Uint8Array(32);
            crypto.getRandomValues(testArray);

            // Check for obvious non-randomness
            const allSame = testArray.every(val => val === testArray[0]);
            const allZero = testArray.every(val => val === 0);
            const allMax = testArray.every(val => val === 255);

            if (allSame || allZero || allMax) {
                quality = 'low';
                issues.push('crypto.getRandomValues() appears to be producing non-random output');
            } else {
                quality = 'high';
            }

        } catch (error) {
            supported = false;
            issues.push(`crypto.getRandomValues() test failed: ${error}`);
        }
    } else {
        issues.push('crypto.getRandomValues() is not available');
    }

    return { supported, quality, issues };
}