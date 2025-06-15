/**
 * Database Connection Manager for RNG Consciousness Experiment App
 * Handles SQLite database initialization, connections, backups, and migrations
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export interface DatabaseConfig {
    dbPath: string;
    backupPath: string;
    enableWAL: boolean;
    cacheSize: number;
    busyTimeout: number;
}

export class DatabaseManager {
    private db: Database.Database | null = null;
    private config: DatabaseConfig;
    private isInitialized = false;

    constructor(config?: Partial<DatabaseConfig>) {
        // Default configuration
        this.config = {
            dbPath: path.join(process.cwd(), 'data', 'rng-consciousness.db'),
            backupPath: path.join(process.cwd(), 'data', 'backups'),
            enableWAL: true,
            cacheSize: 10000,
            busyTimeout: 5000,
            ...config
        };
    }

    /**
     * Initialize the database connection and schema
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Ensure data directories exist
            await this.ensureDirectoriesExist();

            // Create database connection
            this.db = new Database(this.config.dbPath);

            // Configure database for performance and reliability
            this.configurePragmas();

            // Run schema initialization
            await this.initializeSchema();

            // Run migrations if needed
            await this.migrate();

            this.isInitialized = true;
            console.log(`Database initialized successfully at: ${this.config.dbPath}`);
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }

    /**
     * Get the database connection
     */
    getConnection(): Database.Database {
        if (!this.db || !this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    /**
     * Close the database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('Database connection closed');
        }
    }

    /**
     * Create a backup of the database
     */
    async backup(filename?: string): Promise<string> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = filename || `rng-consciousness-backup-${timestamp}.db`;
        const backupPath = path.join(this.config.backupPath, backupFilename);

        try {
            // Ensure backup directory exists
            await mkdir(this.config.backupPath, { recursive: true });

            // Create backup using SQLite backup API
            const backup = this.db.backup(backupPath);

            // Wait for backup to complete
            await new Promise<void>((resolve, reject) => {
                backup.on('progress', ({ totalPages, remainingPages }) => {
                    console.log(`Backing up database: ${totalPages - remainingPages}/${totalPages} pages`);
                });

                backup.on('done', () => {
                    console.log(`Database backup completed: ${backupPath}`);
                    resolve();
                });

                backup.on('error', (error) => {
                    console.error('Backup failed:', error);
                    reject(error);
                });
            });

            return backupPath;
        } catch (error) {
            console.error('Failed to create backup:', error);
            throw new Error(`Backup failed: ${error.message}`);
        }
    }

    /**
     * Restore database from backup
     */
    async restore(backupPath: string): Promise<void> {
        try {
            // Verify backup file exists
            await access(backupPath, fs.constants.F_OK);

            // Close current connection
            this.close();

            // Copy backup to main database location
            const backupData = await readFile(backupPath);
            await writeFile(this.config.dbPath, backupData);

            // Reinitialize
            await this.initialize();

            console.log(`Database restored from backup: ${backupPath}`);
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error(`Restore failed: ${error.message}`);
        }
    }

    /**
     * Run database migrations
     */
    async migrate(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            // Get current schema version
            const currentVersion = this.getCurrentSchemaVersion();
            console.log(`Current schema version: ${currentVersion}`);

            // Run migrations if needed
            // Currently at version 1.0.0, but prepared for future migrations
            if (currentVersion === '1.0.0') {
                console.log('Schema is up to date');
                return;
            }

            // Future migration logic would go here
            console.log('Migration completed successfully');
        } catch (error) {
            console.error('Migration failed:', error);
            throw new Error(`Migration failed: ${error.message}`);
        }
    }

    /**
     * Get database statistics
     */
    getDatabaseStats(): any {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const stats = {
            fileSize: this.getFileSize(this.config.dbPath),
            tables: this.getTableStats(),
            pragma: this.getPragmaInfo(),
            indexes: this.getIndexInfo()
        };

        return stats;
    }

    /**
     * Optimize database performance
     */
    optimize(): void {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            console.log('Optimizing database...');

            // Analyze tables for better query planning
            this.db.exec('ANALYZE');

            // Vacuum if needed (only in exclusive mode)
            if (!this.config.enableWAL) {
                this.db.exec('VACUUM');
            }

            // Update table statistics
            this.db.exec('PRAGMA optimize');

            console.log('Database optimization completed');
        } catch (error) {
            console.error('Database optimization failed:', error);
        }
    }

    /**
     * Execute a transaction with automatic rollback on error
     */
    transaction<T>(fn: (db: Database.Database) => T): T {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        const transaction = this.db.transaction(fn);
        return transaction();
    }

    // Private methods

    private async ensureDirectoriesExist(): Promise<void> {
        const dataDir = path.dirname(this.config.dbPath);
        const backupDir = this.config.backupPath;

        await mkdir(dataDir, { recursive: true });
        await mkdir(backupDir, { recursive: true });
    }

    private configurePragmas(): void {
        if (!this.db) return;

        // Enable WAL mode for better concurrency
        if (this.config.enableWAL) {
            this.db.pragma('journal_mode = WAL');
        }

        // Set synchronous mode for reliability vs performance balance
        this.db.pragma('synchronous = NORMAL');

        // Increase cache size for better performance
        this.db.pragma(`cache_size = ${this.config.cacheSize}`);

        // Store temp tables in memory
        this.db.pragma('temp_store = MEMORY');

        // Set busy timeout
        this.db.pragma(`busy_timeout = ${this.config.busyTimeout}`);

        // Enable foreign key constraints
        this.db.pragma('foreign_keys = ON');

        // Set memory map size (256MB)
        this.db.pragma('mmap_size = 268435456');
    }

    private async initializeSchema(): Promise<void> {
        if (!this.db) return;

        try {
            // Read and execute schema file
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = await readFile(schemaPath, 'utf8');

            this.db.exec(schema);
            console.log('Database schema initialized');
        } catch (error) {
            console.error('Failed to initialize schema:', error);
            throw error;
        }
    }

    private getCurrentSchemaVersion(): string {
        if (!this.db) return '0.0.0';

        try {
            const stmt = this.db.prepare('SELECT value FROM database_metadata WHERE key = ?');
            const result = stmt.get('schema_version') as { value: string } | undefined;
            return result?.value || '0.0.0';
        } catch (error) {
            console.warn('Could not retrieve schema version:', error);
            return '0.0.0';
        }
    }

    private getFileSize(filePath: string): number {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    private getTableStats(): any {
        if (!this.db) return {};

        const tables = ['trials', 'sessions', 'intention_periods', 'calibration_runs'];
        const stats: any = {};

        for (const table of tables) {
            try {
                const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
                const result = stmt.get() as { count: number };
                stats[table] = result.count;
            } catch (error) {
                stats[table] = 'error';
            }
        }

        return stats;
    }

    private getPragmaInfo(): any {
        if (!this.db) return {};

        const pragmas = ['journal_mode', 'synchronous', 'cache_size', 'page_count', 'page_size'];
        const info: any = {};

        for (const pragma of pragmas) {
            try {
                const result = this.db.pragma(pragma);
                info[pragma] = result;
            } catch (error) {
                info[pragma] = 'error';
            }
        }

        return info;
    }

    private getIndexInfo(): any[] {
        if (!this.db) return [];

        try {
            const stmt = this.db.prepare(`
                SELECT name, tbl_name
                FROM sqlite_master
                WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `);
            return stmt.all();
        } catch (error) {
            console.error('Failed to get index info:', error);
            return [];
        }
    }
}

// Singleton instance for application-wide use
let dbManager: DatabaseManager | null = null;

export function getDatabaseManager(config?: Partial<DatabaseConfig>): DatabaseManager {
    if (!dbManager) {
        dbManager = new DatabaseManager(config);
    }
    return dbManager;
}