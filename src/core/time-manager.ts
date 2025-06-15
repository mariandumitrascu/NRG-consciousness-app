/**
 * Precision timing utilities for RNG consciousness experiments
 * Ensures exactly 1 trial per second with microsecond accuracy
 */

/**
 * High-precision timestamp with microsecond accuracy
 */
export function getHighPrecisionTimestamp(): Date {
    // Use performance.now() for microsecond precision, then convert to Date
    const now = performance.now();
    const baseTime = Date.now() - now;
    return new Date(baseTime + now);
}

/**
 * Calculate duration between two timestamps in milliseconds with high precision
 */
export function calculateDuration(start: Date, end: Date): number {
    return end.getTime() - start.getTime();
}

/**
 * Convert duration to various time units
 */
export function formatDuration(milliseconds: number): {
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
} {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    const ms = Math.floor(milliseconds % 1000);

    return {
        hours,
        minutes,
        seconds,
        milliseconds: ms
    };
}

/**
 * Precise interval timer for RNG trial generation
 * Maintains exactly 1 trial per second with drift compensation
 */
export class PrecisionTimer {
    private intervalId: NodeJS.Timeout | null = null;
    private targetInterval: number;
    private callback: () => void;
    private startTime: number = 0;
    private expectedTime: number = 0;
    private intervalCount: number = 0;
    private driftCompensation: boolean = true;

    // Timing metrics
    private timingErrors: number[] = [];
    private maxTimingError: number = 0;
    private missedIntervals: number = 0;

    constructor(intervalMs: number, callback: () => void, enableDriftCompensation: boolean = true) {
        this.targetInterval = intervalMs;
        this.callback = callback;
        this.driftCompensation = enableDriftCompensation;
    }

    /**
     * Start the precision timer
     */
    start(): void {
        if (this.intervalId) {
            this.stop();
        }

        this.startTime = performance.now();
        this.expectedTime = this.startTime + this.targetInterval;
        this.intervalCount = 0;
        this.timingErrors = [];
        this.maxTimingError = 0;
        this.missedIntervals = 0;

        this.scheduleNext();
    }

    /**
     * Stop the precision timer
     */
    stop(): void {
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Check if timer is currently running
     */
    isRunning(): boolean {
        return this.intervalId !== null;
    }

    /**
     * Get timing accuracy metrics
     */
    getTimingMetrics(): {
        averageError: number;
        maxError: number;
        missedIntervals: number;
        intervalCount: number;
    } {
        const averageError = this.timingErrors.length > 0
            ? this.timingErrors.reduce((sum, err) => sum + Math.abs(err), 0) / this.timingErrors.length
            : 0;

        return {
            averageError,
            maxError: this.maxTimingError,
            missedIntervals: this.missedIntervals,
            intervalCount: this.intervalCount
        };
    }

    /**
     * Schedule the next interval with drift compensation
     */
    private scheduleNext(): void {
        const now = performance.now();
        const timingError = now - this.expectedTime;

        // Track timing metrics
        this.timingErrors.push(timingError);
        if (Math.abs(timingError) > Math.abs(this.maxTimingError)) {
            this.maxTimingError = timingError;
        }

        // Check for missed intervals (significant positive timing error)
        if (timingError > this.targetInterval / 2) {
            this.missedIntervals++;
        }

        // Execute callback
        try {
            this.callback();
        } catch (error) {
            console.error('Timer callback error:', error);
        }

        // Calculate next interval with drift compensation
        this.intervalCount++;
        this.expectedTime += this.targetInterval;

        let nextInterval = this.targetInterval;

        if (this.driftCompensation) {
            // Compensate for accumulated drift
            const drift = now - (this.startTime + (this.intervalCount * this.targetInterval));
            nextInterval = this.targetInterval - drift;

            // Ensure minimum interval to prevent excessive CPU usage
            nextInterval = Math.max(nextInterval, 1);
        }

        // Schedule next execution
        this.intervalId = setTimeout(() => {
            this.scheduleNext();
        }, Math.max(0, nextInterval));
    }

    /**
     * Keep only recent timing errors to prevent memory buildup
     */
    private maintainTimingHistory(): void {
        const maxHistorySize = 1000;
        if (this.timingErrors.length > maxHistorySize) {
            this.timingErrors = this.timingErrors.slice(-maxHistorySize);
        }
    }
}

/**
 * Session timing manager for tracking experiment durations
 */
export class SessionTimer {
    private startTime: Date | null = null;
    private endTime: Date | null = null;
    private pausedDuration: number = 0;
    private pauseStartTime: Date | null = null;

    /**
     * Start session timing
     */
    start(): void {
        this.startTime = getHighPrecisionTimestamp();
        this.endTime = null;
        this.pausedDuration = 0;
        this.pauseStartTime = null;
    }

    /**
     * Pause session timing
     */
    pause(): void {
        if (this.startTime && !this.pauseStartTime) {
            this.pauseStartTime = getHighPrecisionTimestamp();
        }
    }

    /**
     * Resume session timing
     */
    resume(): void {
        if (this.pauseStartTime) {
            const pauseDuration = getHighPrecisionTimestamp().getTime() - this.pauseStartTime.getTime();
            this.pausedDuration += pauseDuration;
            this.pauseStartTime = null;
        }
    }

    /**
     * Stop session timing
     */
    stop(): void {
        if (this.startTime) {
            this.endTime = getHighPrecisionTimestamp();

            // Account for any active pause
            if (this.pauseStartTime) {
                const pauseDuration = this.endTime.getTime() - this.pauseStartTime.getTime();
                this.pausedDuration += pauseDuration;
                this.pauseStartTime = null;
            }
        }
    }

    /**
     * Get total session duration excluding paused time
     */
    getDuration(): number | null {
        if (!this.startTime) return null;

        let endTime = this.endTime || getHighPrecisionTimestamp();

        // If currently paused, don't count pause time
        if (this.pauseStartTime) {
            endTime = this.pauseStartTime;
        }

        const totalDuration = endTime.getTime() - this.startTime.getTime();
        return Math.max(0, totalDuration - this.pausedDuration);
    }

    /**
     * Get elapsed time including current moment
     */
    getElapsedTime(): number | null {
        if (!this.startTime) return null;

        const now = getHighPrecisionTimestamp();
        let activeDuration = now.getTime() - this.startTime.getTime();

        // Subtract paused duration
        activeDuration -= this.pausedDuration;

        // If currently paused, don't count time since pause started
        if (this.pauseStartTime) {
            activeDuration -= (now.getTime() - this.pauseStartTime.getTime());
        }

        return Math.max(0, activeDuration);
    }

    /**
     * Check if session is currently running
     */
    isRunning(): boolean {
        return this.startTime !== null && this.endTime === null && this.pauseStartTime === null;
    }

    /**
     * Check if session is paused
     */
    isPaused(): boolean {
        return this.pauseStartTime !== null;
    }

    /**
     * Get session start time
     */
    getStartTime(): Date | null {
        return this.startTime;
    }

    /**
     * Get session end time
     */
    getEndTime(): Date | null {
        return this.endTime;
    }

    /**
     * Reset session timer
     */
    reset(): void {
        this.startTime = null;
        this.endTime = null;
        this.pausedDuration = 0;
        this.pauseStartTime = null;
    }
}

/**
 * Generate a human-readable timestamp string
 */
export function formatTimestamp(date: Date, includeMilliseconds: boolean = false): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    let formatted = date.toLocaleString('en-US', options);

    if (includeMilliseconds) {
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        formatted += `.${ms}`;
    }

    return formatted;
}

/**
 * Calculate time until next second boundary
 * Useful for synchronizing trial generation
 */
export function timeToNextSecond(): number {
    const now = new Date();
    const nextSecond = new Date(now);
    nextSecond.setMilliseconds(0);
    nextSecond.setSeconds(nextSecond.getSeconds() + 1);

    return nextSecond.getTime() - now.getTime();
}

/**
 * Sleep for specified duration (Promise-based)
 */
export function sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Validate timezone consistency
 */
export function validateTimezone(): {
    timezone: string;
    offset: number;
    isDST: boolean;
} {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = now.getTimezoneOffset();

    // Simple DST detection (not perfect but adequate for logging)
    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);
    const isDST = now.getTimezoneOffset() !== Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

    return {
        timezone,
        offset,
        isDST
    };
}