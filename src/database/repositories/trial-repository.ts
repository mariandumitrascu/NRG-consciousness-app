/**
 * Trial Repository - Handle all RNG trial data operations
 * Optimized for high-frequency data insertion and efficient querying
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { RNGTrial, ExperimentMode, IntentionType } from '../../shared/types';
import { getDatabaseManager, DatabaseManager } from '../connection';

export interface TrialQueryOptions {
    sessionId?: string;
    experimentMode?: ExperimentMode;
    intention?: IntentionType;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
}

export interface TrialStatistics {
    count: number;
    minValue: number;
    maxValue: number;
    sum: number;
    mean: number;
    firstTimestamp: Date;
    lastTimestamp: Date;
}

export class TrialRepository {
    private db: Database.Database;
    private insertStmt!: Database.Statement;
    private insertBatchStmt!: Database.Statement;
    private batchBuffer: RNGTrial[] = [];
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly batchSize = 100;
    private readonly batchTimeoutMs = 30000; // 30 seconds

    constructor(dbManager?: DatabaseManager) {
        const manager = dbManager || getDatabaseManager();
        this.db = manager.getConnection();
        this.prepareStatements();
    }

    /**
     * Insert a single trial
     */
    async insertTrial(trial: RNGTrial): Promise<void> {
        try {
            const params = this.trialToDbParams(trial);
            this.insertStmt.run(params);
        } catch (error) {
            console.error('Failed to insert trial:', error);
            throw new Error(`Trial insertion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Insert multiple trials efficiently using batch processing
     */
    async insertTrialsBatch(trials: RNGTrial[]): Promise<void> {
        if (trials.length === 0) return;

        const dbManager = getDatabaseManager();

        try {
            dbManager.transaction(() => {
                for (const trial of trials) {
                    const params = this.trialToDbParams(trial);
                    this.insertStmt.run(params);
                }
            });
        } catch (error) {
            console.error('Failed to insert trials batch:', error);
            throw new Error(`Batch insertion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Add trial to batch buffer for delayed insertion (performance optimization)
     */
    addToBatch(trial: RNGTrial): void {
        this.batchBuffer.push(trial);

        // Set timeout for batch processing if not already set
        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => {
                this.flushBatch();
            }, this.batchTimeoutMs);
        }

        // Process batch if it reaches the size limit
        if (this.batchBuffer.length >= this.batchSize) {
            this.flushBatch();
        }
    }

    /**
     * Flush the batch buffer immediately
     */
    async flushBatch(): Promise<void> {
        if (this.batchBuffer.length === 0) return;

        const trialsToInsert = [...this.batchBuffer];
        this.batchBuffer = [];

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        try {
            await this.insertTrialsBatch(trialsToInsert);
            console.log(`Batch inserted ${trialsToInsert.length} trials`);
        } catch (error) {
            console.error('Failed to flush batch:', error);
            // Re-add failed trials to buffer for retry
            this.batchBuffer.unshift(...trialsToInsert);
        }
    }

    /**
     * Get trials by session ID
     */
    async getTrialsBySession(sessionId: string): Promise<RNGTrial[]> {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM trials
                WHERE session_id = ?
                ORDER BY timestamp ASC
            `);

            const rows = stmt.all(sessionId);
            return rows.map(row => this.dbRowToTrial(row));
        } catch (error) {
            console.error('Failed to get trials by session:', error);
            throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get trials within a time range
     */
    async getTrialsByTimeRange(startTime: Date, endTime: Date, options?: TrialQueryOptions): Promise<RNGTrial[]> {
        try {
            let query = `
                SELECT * FROM trials
                WHERE timestamp >= ? AND timestamp <= ?
            `;
            const params: any[] = [startTime.getTime(), endTime.getTime()];

            // Add optional filters
            if (options?.experimentMode) {
                query += ' AND experiment_mode = ?';
                params.push(options.experimentMode);
            }

            if (options?.intention) {
                query += ' AND intention = ?';
                params.push(options.intention);
            }

            if (options?.sessionId) {
                query += ' AND session_id = ?';
                params.push(options.sessionId);
            }

            query += ' ORDER BY timestamp ASC';

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
            return rows.map(row => this.dbRowToTrial(row));
        } catch (error) {
            console.error('Failed to get trials by time range:', error);
            throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get trials by intention type
     */
    async getTrialsByIntention(intention: IntentionType, limit?: number): Promise<RNGTrial[]> {
        try {
            let query = `
                SELECT * FROM trials
                WHERE intention = ?
                ORDER BY timestamp DESC
            `;

            if (limit) {
                query += ' LIMIT ?';
            }

            const stmt = this.db.prepare(query);
            const params = limit ? [intention, limit] : [intention];
            const rows = stmt.all(...params);
            return rows.map(row => this.dbRowToTrial(row));
        } catch (error) {
            console.error('Failed to get trials by intention:', error);
            throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get continuous trials for the last N hours
     */
    async getContinuousTrials(hours: number): Promise<RNGTrial[]> {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

        return this.getTrialsByTimeRange(startTime, endTime, {
            experimentMode: 'continuous'
        });
    }

    /**
     * Get trial statistics for a given set of parameters
     */
    async getTrialStatistics(options?: TrialQueryOptions): Promise<TrialStatistics> {
        try {
            let query = `
                SELECT
                    COUNT(*) as count,
                    MIN(trial_value) as minValue,
                    MAX(trial_value) as maxValue,
                    SUM(trial_value) as sum,
                    AVG(trial_value) as mean,
                    MIN(timestamp) as firstTimestamp,
                    MAX(timestamp) as lastTimestamp
                FROM trials
                WHERE 1=1
            `;
            const params: any[] = [];

            // Add filters
            if (options?.sessionId) {
                query += ' AND session_id = ?';
                params.push(options.sessionId);
            }

            if (options?.experimentMode) {
                query += ' AND experiment_mode = ?';
                params.push(options.experimentMode);
            }

            if (options?.intention) {
                query += ' AND intention = ?';
                params.push(options.intention);
            }

            if (options?.startTime) {
                query += ' AND timestamp >= ?';
                params.push(options.startTime.getTime());
            }

            if (options?.endTime) {
                query += ' AND timestamp <= ?';
                params.push(options.endTime.getTime());
            }

            const stmt = this.db.prepare(query);
            const result = stmt.get(...params) as any;

            return {
                count: result.count || 0,
                minValue: result.minValue || 0,
                maxValue: result.maxValue || 0,
                sum: result.sum || 0,
                mean: result.mean || 0,
                firstTimestamp: result.firstTimestamp ? new Date(result.firstTimestamp) : new Date(),
                lastTimestamp: result.lastTimestamp ? new Date(result.lastTimestamp) : new Date()
            };
        } catch (error) {
            console.error('Failed to get trial statistics:', error);
            throw new Error(`Statistics query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete old trials to manage database size
     */
    async deleteOldTrials(daysToKeep: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        try {
            const stmt = this.db.prepare(`
                DELETE FROM trials
                WHERE timestamp < ? AND experiment_mode = 'continuous'
            `);

            const result = stmt.run(cutoffDate.getTime());
            console.log(`Deleted ${result.changes} old trials older than ${daysToKeep} days`);
            return result.changes;
        } catch (error) {
            console.error('Failed to delete old trials:', error);
            throw new Error(`Deletion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get trial count for a session
     */
    async getSessionTrialCount(sessionId: string): Promise<number> {
        try {
            const stmt = this.db.prepare(`
                SELECT COUNT(*) as count FROM trials WHERE session_id = ?
            `);
            const result = stmt.get(sessionId) as { count: number };
            return result.count;
        } catch (error) {
            console.error('Failed to get session trial count:', error);
            return 0;
        }
    }

    /**
     * Get the latest trial for a session
     */
    async getLatestTrialForSession(sessionId: string): Promise<RNGTrial | null> {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM trials
                WHERE session_id = ?
                ORDER BY timestamp DESC
                LIMIT 1
            `);

            const row = stmt.get(sessionId);
            return row ? this.dbRowToTrial(row) : null;
        } catch (error) {
            console.error('Failed to get latest trial:', error);
            return null;
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        if (this.batchBuffer.length > 0) {
            this.flushBatch();
        }
    }

    /**
     * Delete trials older than specified number of days
     */
    async deleteOlderThan(date: Date): Promise<number> {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM trials
                WHERE timestamp < ?
            `);

            const result = stmt.run(date.getTime());
            console.log(`Deleted ${result.changes} trials older than ${date.toISOString()}`);
            return result.changes || 0;
        } catch (error) {
            console.error('Failed to delete old trials:', error);
            throw new Error(`Delete operation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Find trials that fail validation
     */
    async findInvalidTrials(): Promise<RNGTrial[]> {
        try {
            // Find trials with invalid values (outside expected range for 200-bit trials)
            const stmt = this.db.prepare(`
                SELECT * FROM trials
                WHERE trial_value < 0 OR trial_value > 200
                   OR session_id IS NULL OR session_id = ''
                   OR timestamp IS NULL
                ORDER BY timestamp DESC
            `);

            const rows = stmt.all();
            return rows.map(row => this.dbRowToTrial(row));
        } catch (error) {
            console.error('Failed to find invalid trials:', error);
            throw new Error(`Invalid trials query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Find duplicate trials (same timestamp and session)
     */
    async findDuplicates(): Promise<RNGTrial[]> {
        try {
            const stmt = this.db.prepare(`
                SELECT t1.* FROM trials t1
                INNER JOIN (
                    SELECT timestamp, session_id, COUNT(*) as cnt
                    FROM trials
                    GROUP BY timestamp, session_id
                    HAVING cnt > 1
                ) t2 ON t1.timestamp = t2.timestamp AND t1.session_id = t2.session_id
                ORDER BY t1.timestamp DESC
            `);

            const rows = stmt.all();
            return rows.map(row => this.dbRowToTrial(row));
        } catch (error) {
            console.error('Failed to find duplicate trials:', error);
            throw new Error(`Duplicate search failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Private methods

    private prepareStatements(): void {
        this.insertStmt = this.db.prepare(`
            INSERT INTO trials (
                id, timestamp, trial_value, session_id,
                experiment_mode, intention, trial_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        this.insertBatchStmt = this.db.prepare(`
            INSERT INTO trials (
                id, timestamp, trial_value, session_id,
                experiment_mode, intention, trial_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
    }

    private trialToDbParams(trial: RNGTrial): any[] {
        return [
            uuidv4(), // Generate ID if not provided
            trial.timestamp.getTime(),
            trial.trialValue,
            trial.sessionId,
            trial.experimentMode,
            trial.intention,
            trial.trialNumber
        ];
    }

    private dbRowToTrial(row: any): RNGTrial {
        return {
            timestamp: new Date(row.timestamp),
            trialValue: row.trial_value,
            sessionId: row.session_id,
            experimentMode: row.experiment_mode as ExperimentMode,
            intention: row.intention as IntentionType,
            trialNumber: row.trial_number
        };
    }
}