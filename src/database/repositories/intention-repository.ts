/**
 * Intention Repository - Handle intention periods for continuous monitoring mode
 * Manages intention tracking during continuous data collection
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IntentionPeriod, RNGTrial } from '../../shared/types';
import { getDatabaseManager, DatabaseManager } from '../connection';
import { TrialRepository } from './trial-repository';

export interface IntentionQueryOptions {
    intention?: 'high' | 'low';
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
}

export interface IntentionPeriodStats {
    id: string;
    startTime: Date;
    endTime: Date | null;
    intention: 'high' | 'low';
    duration: number | null;
    trialCount: number;
    meanTrialValue: number | null;
    zScore: number | null;
    notes: string;
}

export class IntentionRepository {
    private db: Database.Database;
    private trialRepository: TrialRepository;
    private insertStmt!: Database.Statement;
    private updateStmt!: Database.Statement;

    constructor(dbManager?: DatabaseManager) {
        const manager = dbManager || getDatabaseManager();
        this.db = manager.getConnection();
        this.trialRepository = new TrialRepository(manager);
        this.prepareStatements();
    }

    /**
     * Start a new intention period
     */
    async startIntentionPeriod(intention: 'high' | 'low', notes?: string): Promise<string> {
        const periodId = uuidv4();
        const startTime = new Date();

        try {
            // End any currently running intention period
            await this.endCurrentIntentionPeriod();

            // Create new intention period
            const params = [
                periodId,
                startTime.getTime(),
                null, // End time (null for active period)
                intention,
                notes || '',
                null // Session ID (for continuous mode)
            ];

            this.insertStmt.run(params);
            console.log(`Started intention period: ${periodId} (${intention})`);
            return periodId;
        } catch (error) {
            console.error('Failed to start intention period:', error);
            throw new Error(`Intention period start failed: ${error.message}`);
        }
    }

    /**
     * End a specific intention period
     */
    async endIntentionPeriod(periodId: string): Promise<void> {
        const endTime = new Date();

        try {
            const stmt = this.db.prepare(`
                UPDATE intention_periods
                SET end_time = ?
                WHERE id = ? AND end_time IS NULL
            `);

            const result = stmt.run(endTime.getTime(), periodId);

            if (result.changes === 0) {
                throw new Error(`Active intention period not found: ${periodId}`);
            }

            console.log(`Ended intention period: ${periodId}`);
        } catch (error) {
            console.error('Failed to end intention period:', error);
            throw new Error(`Intention period end failed: ${error.message}`);
        }
    }

    /**
     * End the current active intention period (if any)
     */
    async endCurrentIntentionPeriod(): Promise<void> {
        const endTime = new Date();

        try {
            const stmt = this.db.prepare(`
                UPDATE intention_periods
                SET end_time = ?
                WHERE end_time IS NULL
            `);

            const result = stmt.run(endTime.getTime());

            if (result.changes > 0) {
                console.log(`Ended current intention period`);
            }
        } catch (error) {
            console.error('Failed to end current intention period:', error);
            // Don't throw error here as this is often called before starting a new period
        }
    }

    /**
     * Get the currently active intention period
     */
    async getCurrentIntentionPeriod(): Promise<IntentionPeriod | null> {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM intention_periods
                WHERE end_time IS NULL
                ORDER BY start_time DESC
                LIMIT 1
            `);

            const row = stmt.get();
            return row ? this.dbRowToIntentionPeriod(row) : null;
        } catch (error) {
            console.error('Failed to get current intention period:', error);
            return null;
        }
    }

    /**
     * Get intention periods for the last N days
     */
    async getIntentionPeriods(days: number, options?: IntentionQueryOptions): Promise<IntentionPeriod[]> {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (days * 24 * 60 * 60 * 1000));

        try {
            let query = `
                SELECT * FROM intention_periods
                WHERE start_time >= ?
            `;
            const params: any[] = [startTime.getTime()];

            // Add filters
            if (options?.intention) {
                query += ' AND intention = ?';
                params.push(options.intention);
            }

            if (options?.startTime) {
                query += ' AND start_time >= ?';
                params.push(options.startTime.getTime());
            }

            if (options?.endTime) {
                query += ' AND start_time <= ?';
                params.push(options.endTime.getTime());
            }

            query += ' ORDER BY start_time DESC';

            if (options?.limit) {
                query += ' LIMIT ?';
                params.push(options.limit);
            }

            if (options?.offset) {
                query += ' OFFSET ?';
                params.push(options.offset);
            }

            const stmt = this.db.prepare(query);
            const rows = stmt.all(...params);
            return rows.map(row => this.dbRowToIntentionPeriod(row));
        } catch (error) {
            console.error('Failed to get intention periods:', error);
            throw new Error(`Query failed: ${error.message}`);
        }
    }

    /**
     * Get trials that occurred during a specific intention period
     */
    async getTrialsForPeriod(periodId: string): Promise<RNGTrial[]> {
        try {
            const period = await this.getIntentionPeriod(periodId);
            if (!period) {
                return [];
            }

            const endTime = period.endTime || new Date();
            return this.trialRepository.getTrialsByTimeRange(
                period.startTime,
                endTime,
                { experimentMode: 'continuous' }
            );
        } catch (error) {
            console.error('Failed to get trials for period:', error);
            throw new Error(`Query failed: ${error.message}`);
        }
    }

    /**
     * Get a specific intention period by ID
     */
    async getIntentionPeriod(periodId: string): Promise<IntentionPeriod | null> {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM intention_periods WHERE id = ?
            `);

            const row = stmt.get(periodId);
            return row ? this.dbRowToIntentionPeriod(row) : null;
        } catch (error) {
            console.error('Failed to get intention period:', error);
            return null;
        }
    }

    /**
     * Get intention period statistics with trial analysis
     */
    async getIntentionPeriodStats(periodId: string): Promise<IntentionPeriodStats | null> {
        try {
            const period = await this.getIntentionPeriod(periodId);
            if (!period) {
                return null;
            }

            const trials = await this.getTrialsForPeriod(periodId);
            const endTime = period.endTime || new Date();
            const duration = endTime.getTime() - period.startTime.getTime();

            let meanTrialValue: number | null = null;
            let zScore: number | null = null;

            if (trials.length > 0) {
                const trialValues = trials.map(t => t.trialValue);
                const sum = trialValues.reduce((a, b) => a + b, 0);
                meanTrialValue = sum / trials.length;

                // Calculate Z-score
                const expectedMean = 100;
                const expectedStandardDeviation = Math.sqrt(50); // sqrt(200 * 0.25)
                const standardError = expectedStandardDeviation / Math.sqrt(trials.length);
                zScore = (meanTrialValue - expectedMean) / standardError;
            }

            return {
                id: period.id,
                startTime: period.startTime,
                endTime: period.endTime,
                intention: period.intention,
                duration,
                trialCount: trials.length,
                meanTrialValue,
                zScore,
                notes: period.notes
            };
        } catch (error) {
            console.error('Failed to get intention period stats:', error);
            return null;
        }
    }

    /**
     * Get all intention periods with their statistics
     */
    async getAllIntentionPeriodStats(days: number): Promise<IntentionPeriodStats[]> {
        try {
            const periods = await this.getIntentionPeriods(days);
            const statsPromises = periods.map(period =>
                this.getIntentionPeriodStats(period.id)
            );

            const results = await Promise.all(statsPromises);
            return results.filter(stats => stats !== null) as IntentionPeriodStats[];
        } catch (error) {
            console.error('Failed to get all intention period stats:', error);
            return [];
        }
    }

    /**
     * Get intention statistics summary
     */
    async getIntentionSummary(days: number): Promise<{
        totalPeriods: number;
        highIntentionPeriods: number;
        lowIntentionPeriods: number;
        averageHighZ: number;
        averageLowZ: number;
        totalTrials: number;
    }> {
        try {
            const stats = await this.getAllIntentionPeriodStats(days);

            const highStats = stats.filter(s => s.intention === 'high');
            const lowStats = stats.filter(s => s.intention === 'low');

            const averageHighZ = highStats.length > 0
                ? highStats.reduce((sum, s) => sum + (s.zScore || 0), 0) / highStats.length
                : 0;

            const averageLowZ = lowStats.length > 0
                ? lowStats.reduce((sum, s) => sum + (s.zScore || 0), 0) / lowStats.length
                : 0;

            const totalTrials = stats.reduce((sum, s) => sum + s.trialCount, 0);

            return {
                totalPeriods: stats.length,
                highIntentionPeriods: highStats.length,
                lowIntentionPeriods: lowStats.length,
                averageHighZ,
                averageLowZ,
                totalTrials
            };
        } catch (error) {
            console.error('Failed to get intention summary:', error);
            return {
                totalPeriods: 0,
                highIntentionPeriods: 0,
                lowIntentionPeriods: 0,
                averageHighZ: 0,
                averageLowZ: 0,
                totalTrials: 0
            };
        }
    }

    /**
     * Update intention period notes
     */
    async updateIntentionPeriodNotes(periodId: string, notes: string): Promise<void> {
        try {
            const stmt = this.db.prepare(`
                UPDATE intention_periods
                SET notes = ?
                WHERE id = ?
            `);

            const result = stmt.run(notes, periodId);

            if (result.changes === 0) {
                throw new Error(`Intention period not found: ${periodId}`);
            }

            console.log(`Updated intention period notes: ${periodId}`);
        } catch (error) {
            console.error('Failed to update intention period notes:', error);
            throw new Error(`Update failed: ${error.message}`);
        }
    }

    /**
     * Delete an intention period
     */
    async deleteIntentionPeriod(periodId: string): Promise<void> {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM intention_periods WHERE id = ?
            `);

            const result = stmt.run(periodId);

            if (result.changes === 0) {
                throw new Error(`Intention period not found: ${periodId}`);
            }

            console.log(`Deleted intention period: ${periodId}`);
        } catch (error) {
            console.error('Failed to delete intention period:', error);
            throw new Error(`Deletion failed: ${error.message}`);
        }
    }

    /**
     * Get the current intention for continuous trials
     */
    async getCurrentIntention(): Promise<'high' | 'low' | null> {
        const currentPeriod = await this.getCurrentIntentionPeriod();
        return currentPeriod?.intention || null;
    }

    // Private methods

    private prepareStatements(): void {
        this.insertStmt = this.db.prepare(`
            INSERT INTO intention_periods (
                id, start_time, end_time, intention, notes, session_id
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        this.updateStmt = this.db.prepare(`
            UPDATE intention_periods
            SET end_time = ?, notes = ?
            WHERE id = ?
        `);
    }

    private dbRowToIntentionPeriod(row: any): IntentionPeriod {
        return {
            id: row.id,
            startTime: new Date(row.start_time),
            endTime: row.end_time ? new Date(row.end_time) : null,
            intention: row.intention as 'high' | 'low',
            notes: row.notes || '',
            sessionId: row.session_id
        };
    }
}