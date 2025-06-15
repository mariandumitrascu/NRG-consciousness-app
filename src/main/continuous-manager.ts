/**
 * Continuous Data Collection Manager
 *
 * Handles 24/7 background RNG data collection with:
 * - Automatic trial generation and storage
 * - Error recovery and logging
 * - Performance monitoring
 * - System health tracking
 */

import { EventEmitter } from 'events';
import { RNGEngine } from '../core/rng-engine';
import { DatabaseManager } from '../database';
import {
    ContinuousStatus,
    HealthStatus,
    RNGTrial,
    IntentionPeriod,
    SignificantEvent,
    ContinuousConfig
} from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Continuous data collector for 24/7 operation
 */
export class ContinuousDataCollector extends EventEmitter {
    private isRunning: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;
    private startTime: Date | null = null;
    private totalTrials: number = 0;
    private currentIntentionPeriod: IntentionPeriod | null = null;
    private lastTrialTime: Date | null = null;
    private errorCount: number = 0;
    private lastError: Error | null = null;
    private missedIntervals: number = 0;
    private memoryPeak: number = 0;

    private config: ContinuousConfig = {
        autoStart: true,
        targetRate: 1.0, // 1 trial per second
        retentionDays: 365,
        autoAnalysis: true,
        analysisInterval: 5,
        anomalyDetection: true,
        notifications: {
            significantEvents: true,
            dailyReports: true,
            systemErrors: true
        },
        autoExport: {
            enabled: false,
            interval: 'daily',
            format: 'csv',
            location: './exports'
        }
    };

    private rngEngine: RNGEngine;
    private database: DatabaseManager;
    private performanceHistory: Array<{ timestamp: Date; rate: number }> = [];
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor(rngEngine: RNGEngine, database: DatabaseManager) {
        super();
        this.rngEngine = rngEngine;
        this.database = database;

        // Set up periodic health checks
        this.startHealthMonitoring();

        // Handle system sleep/wake events
        this.setupSystemEventHandlers();
    }

    /**
     * Start continuous data collection
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.warn('Continuous collection already running');
            return;
        }

        try {
            console.log('Starting continuous RNG data collection...');

            // Initialize RNG engine
            await this.rngEngine.initialize();

            // Set up trial generation interval
            this.startTime = new Date();
            this.isRunning = true;
            this.totalTrials = 0;
            this.errorCount = 0;
            this.missedIntervals = 0;

            // Start trial generation at 1Hz
            this.intervalId = setInterval(() => {
                this.handleTrialGeneration().catch(error => {
                    this.handleErrors(error);
                });
            }, 1000); // 1 second intervals

            console.log('Continuous collection started successfully');
            this.emit('started', this.getStatus());

        } catch (error) {
            console.error('Failed to start continuous collection:', error);
            this.handleErrors(error as Error);
            throw error;
        }
    }

    /**
     * Stop continuous data collection
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            console.warn('Continuous collection not running');
            return;
        }

        try {
            console.log('Stopping continuous RNG data collection...');

            this.isRunning = false;

            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }

            // End current intention period if active
            if (this.currentIntentionPeriod && !this.currentIntentionPeriod.endTime) {
                await this.endIntentionPeriod();
            }

            console.log(`Continuous collection stopped. Total trials: ${this.totalTrials}`);
            this.emit('stopped', this.getStatus());

        } catch (error) {
            console.error('Error stopping continuous collection:', error);
            this.handleErrors(error as Error);
        }
    }

    /**
     * Get current collection status
     */
    async getStatus(): Promise<ContinuousStatus> {
        const todayStats = await this.getTodayStatistics();

        return {
            isRunning: this.isRunning,
            startTime: this.startTime,
            totalTrials: this.totalTrials,
            currentRate: this.getCurrentRate(),
            currentIntentionPeriod: this.currentIntentionPeriod,
            systemHealth: await this.getHealthStatus(),
            todayStats
        };
    }

    /**
     * Start a new intention period
     */
    async startIntentionPeriod(intention: 'high' | 'low', notes: string = ''): Promise<IntentionPeriod> {
        // End current period if active
        if (this.currentIntentionPeriod && !this.currentIntentionPeriod.endTime) {
            await this.endIntentionPeriod();
        }

        const period: IntentionPeriod = {
            id: uuidv4(),
            startTime: new Date(),
            endTime: null,
            intention,
            notes
        };

        // Store in database
        await this.database.intentionPeriods.create(period);

        this.currentIntentionPeriod = period;
        console.log(`Started ${intention} intention period: ${period.id}`);

        this.emit('intentionPeriodStarted', period);
        return period;
    }

    /**
     * End current intention period
     */
    async endIntentionPeriod(): Promise<void> {
        if (!this.currentIntentionPeriod || this.currentIntentionPeriod.endTime) {
            return;
        }

        const endTime = new Date();
        this.currentIntentionPeriod.endTime = endTime;

        // Update in database
        await this.database.intentionPeriods.update(this.currentIntentionPeriod.id, {
            endTime
        });

        console.log(`Ended intention period: ${this.currentIntentionPeriod.id}`);
        this.emit('intentionPeriodEnded', this.currentIntentionPeriod);

        this.currentIntentionPeriod = null;
    }

    /**
     * Update notes for current intention period
     */
    async updateIntentionNotes(notes: string): Promise<void> {
        if (!this.currentIntentionPeriod) {
            throw new Error('No active intention period');
        }

        this.currentIntentionPeriod.notes = notes;

        await this.database.intentionPeriods.update(this.currentIntentionPeriod.id, {
            notes
        });

        this.emit('intentionPeriodUpdated', this.currentIntentionPeriod);
    }

    /**
     * Handle trial generation
     */
    private async handleTrialGeneration(): Promise<void> {
        if (!this.isRunning) return;

        try {
            const startTime = Date.now();

            // Generate RNG trial
            const trial = await this.rngEngine.generateTrial();

            // Create trial record
            const rngTrial: RNGTrial = {
                timestamp: new Date(),
                trialValue: trial.value,
                sessionId: 'continuous', // Special session ID for continuous mode
                experimentMode: 'continuous',
                intention: this.currentIntentionPeriod?.intention || null,
                trialNumber: this.totalTrials + 1
            };

            // Store in database
            await this.database.trials.create(rngTrial);

            this.totalTrials++;
            this.lastTrialTime = rngTrial.timestamp;

            // Update performance metrics
            const generationTime = Date.now() - startTime;
            this.updatePerformanceMetrics(generationTime);

            // Emit trial event
            this.emit('trialGenerated', rngTrial);

        } catch (error) {
            this.missedIntervals++;
            console.error('Error generating trial:', error);
            this.handleErrors(error as Error);
        }
    }

    /**
     * Handle errors with recovery
     */
    private async handleErrors(error: Error): Promise<void> {
        this.errorCount++;
        this.lastError = error;

        console.error(`Continuous collection error (${this.errorCount}):`, error);

        // Emit error event
        this.emit('error', error);

        // Attempt recovery for certain errors
        if (this.errorCount < 5) {
            console.log('Attempting error recovery...');

            try {
                // Re-initialize RNG engine
                await this.rngEngine.initialize();
                console.log('Error recovery successful');

                // Reset error count on successful recovery
                this.errorCount = 0;

            } catch (recoveryError) {
                console.error('Error recovery failed:', recoveryError);
            }
        } else {
            console.error('Too many errors, stopping continuous collection');
            await this.stop();
        }
    }

    /**
     * Get current trial generation rate
     */
    private getCurrentRate(): number {
        if (this.performanceHistory.length < 2) return 0;

        const recent = this.performanceHistory.slice(-10); // Last 10 trials
        const totalTime = recent[recent.length - 1].timestamp.getTime() - recent[0].timestamp.getTime();

        if (totalTime === 0) return 0;

        return (recent.length - 1) / (totalTime / 1000); // trials per second
    }

    /**
     * Update performance metrics
     */
    private updatePerformanceMetrics(generationTime: number): void {
        const now = new Date();

        this.performanceHistory.push({
            timestamp: now,
            rate: 1000 / generationTime // trials per second based on generation time
        });

        // Keep only last 100 entries
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }

        // Update memory peak
        const memUsage = process.memoryUsage();
        const currentMB = memUsage.heapUsed / 1024 / 1024;
        this.memoryPeak = Math.max(this.memoryPeak, currentMB);
    }

    /**
     * Get system health status
     */
    private async getHealthStatus(): Promise<HealthStatus> {
        const memUsage = process.memoryUsage();
        const currentMB = memUsage.heapUsed / 1024 / 1024;
        const currentRate = this.getCurrentRate();

        return {
            status: this.getOverallStatus(),
            rngStatus: this.errorCount > 0 ? 'warning' : 'healthy',
            dataRate: {
                current: currentRate,
                expected: this.config.targetRate,
                status: Math.abs(currentRate - this.config.targetRate) < 0.1 ? 'healthy' : 'warning'
            },
            databaseStatus: 'healthy', // TODO: Implement database health checks
            memoryUsage: {
                current: currentMB,
                peak: this.memoryPeak,
                status: currentMB > 100 ? 'warning' : 'healthy'
            },
            lastError: this.lastError,
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
            missedTrials: this.missedIntervals
        };
    }

    /**
     * Get overall system status
     */
    private getOverallStatus(): 'healthy' | 'warning' | 'error' {
        if (this.errorCount > 0) return 'error';
        if (this.missedIntervals > 10) return 'warning';
        return 'healthy';
    }

    /**
     * Get today's statistics
     */
    private async getTodayStatistics(): Promise<ContinuousStatus['todayStats']> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        try {
            // Get today's trials
            const todayTrials = await this.database.trials.getByDateRange(today, tomorrow);

            // Get today's intention periods
            const todayPeriods = await this.database.intentionPeriods.getByDateRange(today, tomorrow);

            // Calculate average deviation
            let totalDeviation = 0;
            todayTrials.forEach(trial => {
                totalDeviation += Math.abs(trial.trialValue - 100);
            });
            const averageDeviation = todayTrials.length > 0 ? totalDeviation / todayTrials.length : 0;

            return {
                trialsCollected: todayTrials.length,
                intentionPeriods: todayPeriods.length,
                averageDeviation,
                significantEvents: 0 // TODO: Implement significant event detection
            };

        } catch (error) {
            console.error('Error getting today statistics:', error);
            return {
                trialsCollected: 0,
                intentionPeriods: 0,
                averageDeviation: 0,
                significantEvents: 0
            };
        }
    }

    /**
     * Start health monitoring
     */
    private startHealthMonitoring(): void {
        this.healthCheckInterval = setInterval(async () => {
            const health = await this.getHealthStatus();
            this.emit('healthUpdate', health);

            // Check for critical issues
            if (health.status === 'error') {
                this.emit('criticalError', health);
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Setup system event handlers for sleep/wake
     */
    private setupSystemEventHandlers(): void {
        // Handle app suspension/resume
        process.on('SIGTERM', async () => {
            console.log('Received SIGTERM, stopping continuous collection...');
            await this.stop();
        });

        process.on('SIGINT', async () => {
            console.log('Received SIGINT, stopping continuous collection...');
            await this.stop();
        });
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ContinuousConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Restart if running and critical settings changed
        if (this.isRunning && (newConfig.targetRate !== undefined)) {
            console.log('Configuration changed, restarting collection...');
            this.stop().then(() => this.start());
        }
    }

    /**
     * Get configuration
     */
    getConfig(): ContinuousConfig {
        return { ...this.config };
    }

    /**
     * Cleanup resources
     */
    async destroy(): Promise<void> {
        await this.stop();

        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

        this.removeAllListeners();
    }
}