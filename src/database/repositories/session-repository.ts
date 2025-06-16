/**
 * Session Repository - Handle experiment session data operations
 * Manages session-based experiments with statistical analysis integration
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { ExperimentSession, SessionStatus, IntentionType, StatisticalResult } from '../../shared/types';
import { getDatabaseManager, DatabaseManager } from '../connection';
import { TrialRepository } from './trial-repository';

export interface SessionQueryOptions {
    status?: SessionStatus;
    intention?: IntentionType;
    participantId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
}

export interface SessionSummary {
    id: string;
    startTime: Date;
    endTime: Date | null;
    intention: IntentionType;
    targetTrials: number;
    actualTrials: number;
    status: SessionStatus;
    duration: number | null;
    meanTrialValue: number | null;
    zScore: number | null;
    notes?: string;
}

export class SessionRepository {
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
     * Create a new experiment session
     */
    async createSession(session: Omit<ExperimentSession, 'id'>): Promise<string> {
        const sessionId = uuidv4();

        try {
            const params = [
                sessionId,
                session.startTime.getTime(),
                session.endTime?.getTime() || null,
                session.intention,
                session.targetTrials,
                0, // Initial actual trials
                session.status,
                session.notes || null,
                session.participantId || null,
                session.duration || null
            ];

            this.insertStmt.run(params);
            console.log(`Created session: ${sessionId}`);
            return sessionId;
        } catch (error) {
            console.error('Failed to create session:', error);
            throw new Error(`Session creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update an existing session
     */
    async updateSession(sessionId: string, updates: Partial<ExperimentSession>): Promise<void> {
        try {
            const updateFields: string[] = [];
            const params: any[] = [];

            if (updates.endTime !== undefined) {
                updateFields.push('end_time = ?');
                params.push(updates.endTime?.getTime() || null);
            }

            if (updates.status !== undefined) {
                updateFields.push('status = ?');
                params.push(updates.status);
            }

            if (updates.notes !== undefined) {
                updateFields.push('notes = ?');
                params.push(updates.notes);
            }

            if (updates.duration !== undefined) {
                updateFields.push('duration = ?');
                params.push(updates.duration);
            }

            if (updateFields.length === 0) {
                return; // Nothing to update
            }

            // Update actual trial count from database
            const actualTrials = await this.trialRepository.getSessionTrialCount(sessionId);
            updateFields.push('actual_trials = ?');
            params.push(actualTrials);

            const query = `
                UPDATE sessions
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `;
            params.push(sessionId);

            const stmt = this.db.prepare(query);
            const result = stmt.run(params);

            if (result.changes === 0) {
                throw new Error(`Session not found: ${sessionId}`);
            }

            console.log(`Updated session: ${sessionId}`);
        } catch (error) {
            console.error('Failed to update session:', error);
            throw new Error(`Session update failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get a session by ID
     */
    async getSession(sessionId: string): Promise<ExperimentSession | null> {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM sessions WHERE id = ?
            `);

            const row = stmt.get(sessionId);
            return row ? this.dbRowToSession(row) : null;
        } catch (error) {
            console.error('Failed to get session:', error);
            throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get recent sessions with optional filtering
     */
    async getRecentSessions(limit: number, options?: SessionQueryOptions): Promise<ExperimentSession[]> {
        try {
            let query = `
                SELECT * FROM sessions
                WHERE 1=1
            `;
            const params: any[] = [];

            // Add filters
            if (options?.status) {
                query += ' AND status = ?';
                params.push(options.status);
            }

            if (options?.intention) {
                query += ' AND intention = ?';
                params.push(options.intention);
            }

            if (options?.participantId) {
                query += ' AND participant_id = ?';
                params.push(options.participantId);
            }

            if (options?.startTime) {
                query += ' AND start_time >= ?';
                params.push(options.startTime.getTime());
            }

            if (options?.endTime) {
                query += ' AND start_time <= ?';
                params.push(options.endTime.getTime());
            }

            query += ' ORDER BY start_time DESC LIMIT ?';
            params.push(limit);

            if (options?.offset) {
                query += ' OFFSET ?';
                params.push(options.offset);
            }

            const stmt = this.db.prepare(query);
            const rows = stmt.all(...params);
            return rows.map(row => this.dbRowToSession(row));
        } catch (error) {
            console.error('Failed to get recent sessions:', error);
            throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get session statistics with trial analysis
     */
    async getSessionStats(sessionId: string): Promise<StatisticalResult | null> {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                return null;
            }

            const trials = await this.trialRepository.getTrialsBySession(sessionId);
            if (trials.length === 0) {
                return null;
            }

            // Calculate basic statistics
            const trialValues = trials.map(t => t.trialValue);
            const n = trialValues.length;
            const sum = trialValues.reduce((a, b) => a + b, 0);
            const mean = sum / n;
            const expectedMean = 100; // Expected mean for 200-bit trials

            // Calculate variance and standard deviation
            const variance = trialValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
            const standardDeviation = Math.sqrt(variance);

            // Calculate Z-score
            const expectedVariance = 50; // Expected variance for 200-bit trials (200 * 0.25)
            const expectedStandardDeviation = Math.sqrt(expectedVariance);
            const standardError = expectedStandardDeviation / Math.sqrt(n);
            const zScore = (mean - expectedMean) / standardError;

            // Calculate cumulative deviation
            const cumulativeDeviation: number[] = [];
            let cumulativeSum = 0;
            for (let i = 0; i < trialValues.length; i++) {
                cumulativeSum += trialValues[i] - expectedMean;
                cumulativeDeviation.push(cumulativeSum);
            }

            // Calculate p-value (two-tailed)
            const pValue = this.calculatePValue(zScore);

            return {
                trialCount: n,
                mean,
                expectedMean,
                variance,
                standardDeviation,
                zScore,
                cumulativeDeviation,
                pValue,
                calculatedAt: new Date(),
                dataRange: {
                    startTime: trials[0].timestamp,
                    endTime: trials[trials.length - 1].timestamp
                }
            };
        } catch (error) {
            console.error('Failed to get session stats:', error);
            throw new Error(`Statistics calculation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get session summaries for dashboard display
     */
    async getSessionSummaries(limit: number, options?: SessionQueryOptions): Promise<SessionSummary[]> {
        try {
            let query = `
                SELECT
                    s.*,
                    COALESCE(t.mean_trial_value, 0) as mean_trial_value,
                    COALESCE(t.z_score, 0) as z_score
                FROM sessions s
                LEFT JOIN (
                    SELECT
                        session_id,
                        AVG(trial_value) as mean_trial_value,
                        (AVG(trial_value) - 100) / (SQRT(50.0 / COUNT(*))) as z_score
                    FROM trials
                    WHERE session_id IS NOT NULL
                    GROUP BY session_id
                ) t ON s.id = t.session_id
                WHERE 1=1
            `;
            const params: any[] = [];

            // Add filters (similar to getRecentSessions)
            if (options?.status) {
                query += ' AND s.status = ?';
                params.push(options.status);
            }

            if (options?.intention) {
                query += ' AND s.intention = ?';
                params.push(options.intention);
            }

            if (options?.participantId) {
                query += ' AND s.participant_id = ?';
                params.push(options.participantId);
            }

            query += ' ORDER BY s.start_time DESC LIMIT ?';
            params.push(limit);

            const stmt = this.db.prepare(query);
            const rows = stmt.all(...params);

            return rows.map((row: any) => ({
                id: row.id,
                startTime: new Date(row.start_time),
                endTime: row.end_time ? new Date(row.end_time) : null,
                intention: row.intention as IntentionType,
                targetTrials: row.target_trials,
                actualTrials: row.actual_trials,
                status: row.status as SessionStatus,
                duration: row.duration,
                meanTrialValue: row.mean_trial_value || null,
                zScore: row.z_score || null,
                notes: row.notes
            }));
        } catch (error) {
            console.error('Failed to get session summaries:', error);
            throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Complete a session (set end time and status)
     */
    async completeSession(sessionId: string): Promise<void> {
        const endTime = new Date();
        const session = await this.getSession(sessionId);

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const duration = endTime.getTime() - session.startTime.getTime();

        await this.updateSession(sessionId, {
            endTime,
            status: 'completed',
            duration
        });
    }

    /**
     * Stop a session (set status to stopped)
     */
    async stopSession(sessionId: string): Promise<void> {
        const endTime = new Date();
        const session = await this.getSession(sessionId);

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const duration = endTime.getTime() - session.startTime.getTime();

        await this.updateSession(sessionId, {
            endTime,
            status: 'stopped',
            duration
        });
    }

    /**
     * Get running sessions
     */
    async getRunningSessions(): Promise<ExperimentSession[]> {
        return this.getRecentSessions(100, { status: 'running' });
    }

    /**
     * Delete a session and all its trials
     */
    async deleteSession(sessionId: string): Promise<void> {
        const dbManager = getDatabaseManager();

        try {
            dbManager.transaction(() => {
                // Delete trials first (handled by foreign key cascade)
                const deleteSessionStmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
                const result = deleteSessionStmt.run(sessionId);

                if (result.changes === 0) {
                    throw new Error(`Session not found: ${sessionId}`);
                }
            });

            console.log(`Deleted session: ${sessionId}`);
        } catch (error) {
            console.error('Failed to delete session:', error);
            throw new Error(`Session deletion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Private methods

    private prepareStatements(): void {
        this.insertStmt = this.db.prepare(`
            INSERT INTO sessions (
                id, start_time, end_time, intention, target_trials,
                actual_trials, status, notes, participant_id, duration
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        this.updateStmt = this.db.prepare(`
            UPDATE sessions
            SET end_time = ?, status = ?, notes = ?, duration = ?, actual_trials = ?
            WHERE id = ?
        `);
    }

    private dbRowToSession(row: any): ExperimentSession {
        return {
            id: row.id,
            startTime: new Date(row.start_time),
            endTime: row.end_time ? new Date(row.end_time) : null,
            intention: row.intention as IntentionType,
            targetTrials: row.target_trials,
            status: row.status as SessionStatus,
            notes: row.notes,
            participantId: row.participant_id,
            duration: row.duration
        };
    }

    private calculatePValue(zScore: number): number {
        // Approximation of the complementary error function for p-value calculation
        // This is a simplified implementation - in production, you might want to use a proper statistics library
        const absZ = Math.abs(zScore);

        // Using the complementary error function approximation
        const t = 1.0 / (1.0 + 0.3275911 * absZ);
        const erfcApprox = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absZ * absZ);

        return erfcApprox; // Two-tailed p-value
    }
}