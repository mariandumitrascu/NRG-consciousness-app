/**
 * Database Connection Module
 * Provides DatabaseConnection class compatible with existing imports
 */

import { DatabaseManager, getDatabaseManager, type DatabaseConfig } from './connection';
import Database from 'better-sqlite3';

/**
 * DatabaseConnection class - wrapper around DatabaseManager for compatibility
 */
export class DatabaseConnection {
    private databaseManager: DatabaseManager;

    constructor(config?: Partial<DatabaseConfig>) {
        this.databaseManager = getDatabaseManager(config);
    }

    /**
     * Initialize the database connection
     */
    async initialize(): Promise<void> {
        return this.databaseManager.initialize();
    }

    /**
     * Get the underlying DatabaseManager instance
     */
    getManager(): DatabaseManager {
        return this.databaseManager;
    }

    /**
     * Get the raw database connection
     */
    getConnection(): Database.Database {
        return this.databaseManager.getConnection();
    }

    /**
     * Close the database connection
     */
    close(): void {
        this.databaseManager.close();
    }

    /**
     * Create a backup
     */
    async backup(filename?: string): Promise<string> {
        return this.databaseManager.backup(filename);
    }

    /**
     * Restore from backup
     */
    async restore(backupPath: string): Promise<void> {
        return this.databaseManager.restore(backupPath);
    }

    /**
     * Run database migrations
     */
    async migrate(): Promise<void> {
        return this.databaseManager.migrate();
    }

    /**
     * Get database statistics
     */
    getDatabaseStats(): any {
        return this.databaseManager.getDatabaseStats();
    }

    /**
     * Optimize database
     */
    optimize(): void {
        this.databaseManager.optimize();
    }

    /**
     * Run a transaction
     */
    transaction<T>(fn: (db: Database.Database) => T): T {
        return this.databaseManager.transaction(fn);
    }
}

/**
 * Create a new DatabaseConnection instance
 */
export function createDatabaseConnection(config?: Partial<DatabaseConfig>): DatabaseConnection {
    return new DatabaseConnection(config);
}

// Re-export types from connection module
export type { DatabaseConfig } from './connection';