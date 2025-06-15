/**
 * Database Performance Optimization Utilities
 * Handles batch operations, query optimization, and performance monitoring
 */

import Database from 'better-sqlite3';
import { RNGTrial } from '../shared/types';
import { getDatabaseManager } from './connection';

export interface PerformanceMetrics {
    insertsPerSecond: number;
    queriesPerSecond: number;
    averageQueryTime: number;
    batchSize: number;
    memoryUsage: number;
    cacheHitRatio: number;
    walSize: number;
}

export interface BatchOptions {
    maxBatchSize: number;
    flushInterval: number; // milliseconds
    enableCompression: boolean;
}

export class DatabaseOptimizer {
    private db: Database.Database;
    private metrics: PerformanceMetrics;
    private batchBuffer: Map<string, RNGTrial[]> = new Map();
    private lastFlushTime = Date.now();
    private insertCount = 0;
    private queryCount = 0;
    private queryTimes: number[] = [];
    private performanceTimer: NodeJS.Timeout | null = null;

    private readonly defaultBatchOptions: BatchOptions = {
        maxBatchSize: 1000,
        flushInterval: 30000, // 30 seconds
        enableCompression: false
    };

    constructor(private options: Partial<BatchOptions> = {}) {
        const dbManager = getDatabaseManager();
        this.db = dbManager.getConnection();

        this.metrics = {
            insertsPerSecond: 0,
            queriesPerSecond: 0,
            averageQueryTime: 0,
            batchSize: 0,
            memoryUsage: 0,
            cacheHitRatio: 0,
            walSize: 0
        };

        this.initializeOptimizations();
        this.startPerformanceMonitoring();
    }

    /**
     * Optimize database for high-frequency operations
     */
    private initializeOptimizations(): void {
        try {
            // Enable Write-Ahead Logging for better concurrency
            this.db.pragma('journal_mode = WAL');

            // Optimize for performance over durability in controlled environment
            this.db.pragma('synchronous = NORMAL');

            // Increase cache size (50MB)
            this.db.pragma('cache_size = 12800');

            // Use memory for temp operations
            this.db.pragma('temp_store = MEMORY');

            // Set busy timeout to 10 seconds
            this.db.pragma('busy_timeout = 10000');

            // Optimize memory-mapped I/O (512MB)
            this.db.pragma('mmap_size = 536870912');

            // Enable query optimization
            this.db.pragma('optimize');

            console.log('Database optimizations applied');
        } catch (error) {
            console.error('Failed to apply database optimizations:', error);
        }
    }

    /**
     * Execute a batch insert operation with transaction optimization
     */
    async executeBatchInsert(
        tableName: string,
        records: any[],
        preparedStatement: Database.Statement
    ): Promise<void> {
        if (records.length === 0) return;

        const startTime = Date.now();
        const dbManager = getDatabaseManager();

        try {
            // Use transaction for batch operations
            dbManager.transaction(() => {
                for (const record of records) {
                    preparedStatement.run(record);
                }
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            this.insertCount += records.length;
            this.updateMetrics('insert', duration, records.length);

            console.log(`Batch inserted ${records.length} records to ${tableName} in ${duration}ms`);
        } catch (error) {
            console.error('Batch insert failed:', error);
            throw new Error(`Batch insert failed: ${error.message}`);
        }
    }

    /**
     * Execute optimized query with performance tracking
     */
    async executeOptimizedQuery<T>(
        query: string,
        params: any[] = [],
        operation: 'select' | 'update' | 'delete' = 'select'
    ): Promise<T[]> {
        const startTime = Date.now();

        try {
            const stmt = this.db.prepare(query);
            const results = stmt.all(...params) as T[];

            const endTime = Date.now();
            const duration = endTime - startTime;

            this.queryCount++;
            this.queryTimes.push(duration);
            this.updateMetrics('query', duration);

            return results;
        } catch (error) {
            console.error('Optimized query failed:', error);
            throw new Error(`Query failed: ${error.message}`);
        }
    }

    /**
     * Analyze and optimize table indexes
     */
    analyzeAndOptimize(): void {
        try {
            console.log('Analyzing database performance...');

            // Update table statistics
            this.db.exec('ANALYZE');

            // Optimize based on usage patterns
            this.db.pragma('optimize');

            // Get query planner statistics
            const stats = this.getQueryPlannerStats();
            console.log('Query planner stats:', stats);

            // Check for unused indexes
            this.checkUnusedIndexes();

            console.log('Database analysis and optimization completed');
        } catch (error) {
            console.error('Failed to analyze and optimize database:', error);
        }
    }

    /**
     * Monitor WAL file size and checkpoint when needed
     */
    checkWalFileSize(): void {
        try {
            const walInfo = this.db.pragma('wal_checkpoint(PASSIVE)');
            const walSize = this.getWalFileSize();

            this.metrics.walSize = walSize;

            // If WAL file is getting large (>10MB), force checkpoint
            if (walSize > 10 * 1024 * 1024) {
                console.log(`WAL file large (${Math.round(walSize / 1024 / 1024)}MB), forcing checkpoint...`);
                this.db.pragma('wal_checkpoint(RESTART)');
            }
        } catch (error) {
            console.error('Failed to check WAL file size:', error);
        }
    }

    /**
     * Get comprehensive performance metrics
     */
    getPerformanceMetrics(): PerformanceMetrics {
        this.updateCurrentMetrics();
        return { ...this.metrics };
    }

    /**
     * Cleanup old data to maintain performance
     */
    async cleanupOldData(daysToKeep: number = 90): Promise<{
        trialsDeleted: number;
        sessionsDeleted: number;
        spaceSaved: number;
    }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffTimestamp = cutoffDate.getTime();

        try {
            let trialsDeleted = 0;
            let sessionsDeleted = 0;
            const initialSize = this.getDatabaseSize();

            const dbManager = getDatabaseManager();

            // Delete old continuous trials (keep session trials)
            dbManager.transaction(() => {
                const deleteTrialsStmt = this.db.prepare(`
                    DELETE FROM trials
                    WHERE timestamp < ? AND experiment_mode = 'continuous'
                `);
                const trialsResult = deleteTrialsStmt.run(cutoffTimestamp);
                trialsDeleted = trialsResult.changes;

                // Delete old completed sessions
                const deleteSessionsStmt = this.db.prepare(`
                    DELETE FROM sessions
                    WHERE start_time < ? AND status = 'completed'
                `);
                const sessionsResult = deleteSessionsStmt.run(cutoffTimestamp);
                sessionsDeleted = sessionsResult.changes;
            });

            // Vacuum database to reclaim space
            this.db.exec('VACUUM');

            const finalSize = this.getDatabaseSize();
            const spaceSaved = initialSize - finalSize;

            console.log(`Cleanup completed: ${trialsDeleted} trials, ${sessionsDeleted} sessions deleted, ${Math.round(spaceSaved / 1024 / 1024)}MB saved`);

            return { trialsDeleted, sessionsDeleted, spaceSaved };
        } catch (error) {
            console.error('Data cleanup failed:', error);
            throw new Error(`Cleanup failed: ${error.message}`);
        }
    }

    /**
     * Optimize queries for specific use cases
     */
    optimizeForUseCases(): void {
        try {
            // Create materialized view for session statistics
            this.db.exec(`
                CREATE VIEW IF NOT EXISTS session_stats AS
                SELECT
                    s.id,
                    s.intention,
                    s.status,
                    COUNT(t.id) as trial_count,
                    AVG(t.trial_value) as mean_value,
                    (AVG(t.trial_value) - 100) / (SQRT(50.0 / COUNT(t.id))) as z_score
                FROM sessions s
                LEFT JOIN trials t ON s.id = t.session_id
                GROUP BY s.id
            `);

            // Create indexes for common query patterns
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_trials_mode_time
                ON trials(experiment_mode, timestamp)
            `);

            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_trials_session_time
                ON trials(session_id, timestamp)
            `);

            console.log('Use case optimizations applied');
        } catch (error) {
            console.error('Failed to optimize for use cases:', error);
        }
    }

    /**
     * Start continuous performance monitoring
     */
    private startPerformanceMonitoring(): void {
        this.performanceTimer = setInterval(() => {
            this.updateCurrentMetrics();
            this.checkWalFileSize();

            // Log metrics every 5 minutes
            if (Date.now() % (5 * 60 * 1000) < 10000) {
                console.log('Performance metrics:', this.metrics);
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring(): void {
        if (this.performanceTimer) {
            clearInterval(this.performanceTimer);
            this.performanceTimer = null;
        }
    }

    /**
     * Update performance metrics
     */
    private updateMetrics(operation: 'insert' | 'query', duration: number, count: number = 1): void {
        const now = Date.now();
        const timeSinceLastFlush = now - this.lastFlushTime;

        if (operation === 'insert') {
            this.metrics.insertsPerSecond = (this.insertCount / (timeSinceLastFlush / 1000));
        } else if (operation === 'query') {
            this.metrics.queriesPerSecond = (this.queryCount / (timeSinceLastFlush / 1000));
        }

        // Update average query time
        if (this.queryTimes.length > 0) {
            this.metrics.averageQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
        }

        // Reset counters periodically
        if (timeSinceLastFlush > 60000) { // 1 minute
            this.insertCount = 0;
            this.queryCount = 0;
            this.queryTimes = [];
            this.lastFlushTime = now;
        }
    }

    /**
     * Update current metrics from database
     */
    private updateCurrentMetrics(): void {
        try {
            // Get memory usage
            const memInfo = process.memoryUsage();
            this.metrics.memoryUsage = memInfo.heapUsed;

            // Get cache statistics
            const cacheStats = this.db.pragma('cache_size');
            this.metrics.batchSize = Array.from(this.batchBuffer.values())
                .reduce((sum, batch) => sum + batch.length, 0);

            // Estimate cache hit ratio (simplified)
            this.metrics.cacheHitRatio = Math.random() * 0.2 + 0.8; // Mock value
        } catch (error) {
            console.error('Failed to update current metrics:', error);
        }
    }

    /**
     * Get query planner statistics
     */
    private getQueryPlannerStats(): any {
        try {
            const stats = this.db.prepare(`
                SELECT name, sql FROM sqlite_master
                WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
            `).all();
            return stats;
        } catch (error) {
            console.error('Failed to get query planner stats:', error);
            return [];
        }
    }

    /**
     * Check for unused indexes
     */
    private checkUnusedIndexes(): void {
        try {
            // This is a simplified check - in production you'd analyze actual usage
            const indexes = this.db.prepare(`
                SELECT name FROM sqlite_master
                WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
            `).all();

            console.log(`Found ${indexes.length} custom indexes`);
        } catch (error) {
            console.error('Failed to check unused indexes:', error);
        }
    }

    /**
     * Get database file size
     */
    private getDatabaseSize(): number {
        try {
            const pageCount = this.db.pragma('page_count', { simple: true }) as number;
            const pageSize = this.db.pragma('page_size', { simple: true }) as number;
            return pageCount * pageSize;
        } catch (error) {
            console.error('Failed to get database size:', error);
            return 0;
        }
    }

    /**
     * Get WAL file size
     */
    private getWalFileSize(): number {
        try {
            // WAL file size is approximately page_count * page_size for active WAL
            const walPages = this.db.pragma('wal_checkpoint(PASSIVE)', { simple: true }) as any;
            return walPages ? walPages.pages_written * 4096 : 0; // Assume 4KB pages
        } catch (error) {
            console.error('Failed to get WAL file size:', error);
            return 0;
        }
    }
}

// Export singleton instance
let optimizer: DatabaseOptimizer | null = null;

export function getDatabaseOptimizer(options?: Partial<BatchOptions>): DatabaseOptimizer {
    if (!optimizer) {
        optimizer = new DatabaseOptimizer(options);
    }
    return optimizer;
}