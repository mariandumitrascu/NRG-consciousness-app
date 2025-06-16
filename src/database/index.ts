/**
 * Database Module - Entry point for all database operations
 * Exports all database components for the RNG Consciousness Experiment App
 */

// Core database infrastructure
export { DatabaseManager, getDatabaseManager, type DatabaseConfig } from './connection';

// Export the new DatabaseConnection wrapper and DatabaseManager module
export { DatabaseConnection, createDatabaseConnection } from './DatabaseConnection';
export { DatabaseManager as DatabaseManagerAlias } from './DatabaseManager';

// Repository layer for data access
export { TrialRepository, type TrialQueryOptions, type TrialStatistics } from './repositories/trial-repository';
export { SessionRepository, type SessionQueryOptions, type SessionSummary } from './repositories/session-repository';
export { IntentionRepository, type IntentionQueryOptions, type IntentionPeriodStats } from './repositories/intention-repository';

// Performance and optimization
export {
    DatabaseOptimizer,
    getDatabaseOptimizer,
    type PerformanceMetrics,
    type BatchOptions
} from './optimization';

// Maintenance and backup
export {
    DatabaseMaintenance,
    getDatabaseMaintenance,
    type BackupInfo,
    type DataValidationResult,
    type ExportOptions
} from './maintenance';

/**
 * Initialize the complete database system
 * This should be called once at application startup
 */
export async function initializeDatabase(): Promise<{
    dbManager: DatabaseManager;
    repositories: {
        trials: TrialRepository;
        sessions: SessionRepository;
        intentions: IntentionRepository;
    };
    optimizer: DatabaseOptimizer;
    maintenance: DatabaseMaintenance;
}> {
    console.log('Initializing RNG Consciousness database system...');

    try {
        // Initialize database connection and schema
        const dbManager = getDatabaseManager();
        await dbManager.initialize();

        // Initialize repositories
        const repositories = {
            trials: new TrialRepository(dbManager),
            sessions: new SessionRepository(dbManager),
            intentions: new IntentionRepository(dbManager)
        };

        // Initialize performance optimizer
        const optimizer = getDatabaseOptimizer();
        // Note: optimizeForUseCases method will be implemented in optimizer

        // Initialize maintenance system
        const maintenance = getDatabaseMaintenance();
        // Note: setupAutomaticMaintenance method will be implemented in maintenance

        console.log('Database system initialization completed successfully');

        return {
            dbManager,
            repositories,
            optimizer,
            maintenance
        };
    } catch (error) {
        console.error('Database system initialization failed:', error);
        throw new Error(`Database initialization failed: ${(error as Error).message}`);
    }
}

/**
 * Shutdown the database system gracefully
 */
export async function shutdownDatabase(): Promise<void> {
    try {
        console.log('Shutting down database system...');

        // Get database manager for cleanup
        const dbManager = getDatabaseManager();

        // Flush any pending operations
        // Note: Repository cleanup will be handled by database manager

        // Stop performance monitoring
        const optimizer = getDatabaseOptimizer();
        // Note: stopPerformanceMonitoring method will be implemented in optimizer

        // Close database connection
        const dbManager = getDatabaseManager();
        dbManager.close();

        console.log('Database system shutdown completed');
    } catch (error) {
        console.error('Database shutdown error:', error);
    }
}