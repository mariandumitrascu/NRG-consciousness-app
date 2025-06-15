/**
 * Database Maintenance Utilities
 * Handles data protection, backup management, recovery, and export capabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { getDatabaseManager } from './connection';
import { getDatabaseOptimizer } from './optimization';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

export interface BackupInfo {
    filename: string;
    filepath: string;
    timestamp: Date;
    size: number;
    checksum: string;
    type: 'manual' | 'automatic';
    compressed: boolean;
}

export interface DataValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    statistics: {
        totalTrials: number;
        totalSessions: number;
        totalIntentionPeriods: number;
        dateRange: { start: Date; end: Date } | null;
    };
    validatedAt: Date;
}

export interface ExportOptions {
    format: 'csv' | 'json' | 'excel';
    startDate?: Date;
    endDate?: Date;
    sessionIds?: string[];
    includeTrials: boolean;
    includeSessions: boolean;
    includeIntentionPeriods: boolean;
    compression: boolean;
}

export class DatabaseMaintenance {
    private backupPath: string;
    private exportPath: string;

    constructor() {
        this.backupPath = path.join(process.cwd(), 'data', 'backups');
        this.exportPath = path.join(process.cwd(), 'data', 'exports');
        this.ensureDirectories();
    }

    /**
     * Create automatic backup with rotation
     */
    async createAutomaticBackup(): Promise<BackupInfo> {
        const dbManager = getDatabaseManager();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `auto-backup-${timestamp}.db`;

        try {
            const backupPath = await dbManager.backup(filename);
            const backupInfo = await this.getBackupInfo(backupPath, 'automatic');

            // Rotate old backups (keep last 7 automatic backups)
            await this.rotateBackups('automatic', 7);

            console.log(`Automatic backup created: ${filename}`);
            return backupInfo;
        } catch (error) {
            console.error('Automatic backup failed:', error);
            throw new Error(`Automatic backup failed: ${error.message}`);
        }
    }

    /**
     * Create manual backup
     */
    async createManualBackup(description?: string): Promise<BackupInfo> {
        const dbManager = getDatabaseManager();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const desc = description ? `-${description.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
        const filename = `manual-backup${desc}-${timestamp}.db`;

        try {
            const backupPath = await dbManager.backup(filename);
            const backupInfo = await this.getBackupInfo(backupPath, 'manual');

            console.log(`Manual backup created: ${filename}`);
            return backupInfo;
        } catch (error) {
            console.error('Manual backup failed:', error);
            throw new Error(`Manual backup failed: ${error.message}`);
        }
    }

    /**
     * List all available backups
     */
    async listBackups(): Promise<BackupInfo[]> {
        try {
            const files = await readdir(this.backupPath);
            const backupFiles = files.filter(file => file.endsWith('.db'));

            const backupInfos: BackupInfo[] = [];
            for (const file of backupFiles) {
                const filepath = path.join(this.backupPath, file);
                const type = file.startsWith('auto-') ? 'automatic' : 'manual';
                const info = await this.getBackupInfo(filepath, type);
                backupInfos.push(info);
            }

            // Sort by timestamp (newest first)
            return backupInfos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        } catch (error) {
            console.error('Failed to list backups:', error);
            return [];
        }
    }

    /**
     * Restore database from backup
     */
    async restoreFromBackup(backupFilename: string): Promise<void> {
        const backupPath = path.join(this.backupPath, backupFilename);

        try {
            // Verify backup exists and is valid
            await stat(backupPath);

            // Create a backup of current database before restore
            await this.createManualBackup('pre-restore');

            // Restore database
            const dbManager = getDatabaseManager();
            await dbManager.restore(backupPath);

            console.log(`Database restored from backup: ${backupFilename}`);
        } catch (error) {
            console.error('Restore failed:', error);
            throw new Error(`Restore failed: ${error.message}`);
        }
    }

    /**
     * Validate data integrity
     */
    async validateDataIntegrity(): Promise<DataValidationResult> {
        const dbManager = getDatabaseManager();
        const db = dbManager.getConnection();

        const result: DataValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            statistics: {
                totalTrials: 0,
                totalSessions: 0,
                totalIntentionPeriods: 0,
                dateRange: null
            },
            validatedAt: new Date()
        };

        try {
            // Check database integrity
            const integrityCheck = db.pragma('integrity_check');
            if (integrityCheck !== 'ok' && !Array.isArray(integrityCheck)) {
                result.errors.push('Database integrity check failed');
                result.isValid = false;
            }

            // Get basic statistics
            const trialCount = db.prepare('SELECT COUNT(*) as count FROM trials').get() as { count: number };
            result.statistics.totalTrials = trialCount.count;

            const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
            result.statistics.totalSessions = sessionCount.count;

            const intentionCount = db.prepare('SELECT COUNT(*) as count FROM intention_periods').get() as { count: number };
            result.statistics.totalIntentionPeriods = intentionCount.count;

            // Get date range
            if (result.statistics.totalTrials > 0) {
                const dateRange = db.prepare(`
                    SELECT MIN(timestamp) as start, MAX(timestamp) as end FROM trials
                `).get() as { start: number; end: number };

                result.statistics.dateRange = {
                    start: new Date(dateRange.start),
                    end: new Date(dateRange.end)
                };
            }

            // Validate trial values
            const invalidTrials = db.prepare(`
                SELECT COUNT(*) as count FROM trials
                WHERE trial_value < 0 OR trial_value > 200
            `).get() as { count: number };

            if (invalidTrials.count > 0) {
                result.errors.push(`Found ${invalidTrials.count} trials with invalid values`);
                result.isValid = false;
            }

            // Check for orphaned trials
            const orphanedTrials = db.prepare(`
                SELECT COUNT(*) as count FROM trials t
                LEFT JOIN sessions s ON t.session_id = s.id
                WHERE t.session_id IS NOT NULL AND s.id IS NULL
            `).get() as { count: number };

            if (orphanedTrials.count > 0) {
                result.warnings.push(`Found ${orphanedTrials.count} trials with missing session references`);
            }

            // Check for sessions without trials
            const emptySessions = db.prepare(`
                SELECT COUNT(*) as count FROM sessions s
                LEFT JOIN trials t ON s.id = t.session_id
                WHERE s.status = 'completed' AND t.id IS NULL
            `).get() as { count: number };

            if (emptySessions.count > 0) {
                result.warnings.push(`Found ${emptySessions.count} completed sessions without trials`);
            }

            // Check timing consistency
            const timingIssues = db.prepare(`
                SELECT COUNT(*) as count FROM sessions
                WHERE end_time IS NOT NULL AND end_time < start_time
            `).get() as { count: number };

            if (timingIssues.count > 0) {
                result.errors.push(`Found ${timingIssues.count} sessions with invalid timing`);
                result.isValid = false;
            }

            console.log('Data integrity validation completed');
        } catch (error) {
            result.errors.push(`Validation error: ${error.message}`);
            result.isValid = false;
        }

        return result;
    }

    /**
     * Export data in specified format
     */
    async exportData(options: ExportOptions): Promise<string> {
        const dbManager = getDatabaseManager();
        const db = dbManager.getConnection();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `rng-export-${timestamp}.${options.format}`;
        const filepath = path.join(this.exportPath, filename);

        try {
            let exportData: any = {};

            // Export sessions if requested
            if (options.includeSessions) {
                let sessionQuery = 'SELECT * FROM sessions WHERE 1=1';
                const sessionParams: any[] = [];

                if (options.startDate) {
                    sessionQuery += ' AND start_time >= ?';
                    sessionParams.push(options.startDate.getTime());
                }

                if (options.endDate) {
                    sessionQuery += ' AND start_time <= ?';
                    sessionParams.push(options.endDate.getTime());
                }

                if (options.sessionIds && options.sessionIds.length > 0) {
                    sessionQuery += ` AND id IN (${options.sessionIds.map(() => '?').join(',')})`;
                    sessionParams.push(...options.sessionIds);
                }

                const sessions = db.prepare(sessionQuery).all(...sessionParams);
                exportData.sessions = sessions;
            }

            // Export trials if requested
            if (options.includeTrials) {
                let trialQuery = 'SELECT * FROM trials WHERE 1=1';
                const trialParams: any[] = [];

                if (options.startDate) {
                    trialQuery += ' AND timestamp >= ?';
                    trialParams.push(options.startDate.getTime());
                }

                if (options.endDate) {
                    trialQuery += ' AND timestamp <= ?';
                    trialParams.push(options.endDate.getTime());
                }

                if (options.sessionIds && options.sessionIds.length > 0) {
                    trialQuery += ` AND session_id IN (${options.sessionIds.map(() => '?').join(',')})`;
                    trialParams.push(...options.sessionIds);
                }

                const trials = db.prepare(trialQuery).all(...trialParams);
                exportData.trials = trials;
            }

            // Export intention periods if requested
            if (options.includeIntentionPeriods) {
                let intentionQuery = 'SELECT * FROM intention_periods WHERE 1=1';
                const intentionParams: any[] = [];

                if (options.startDate) {
                    intentionQuery += ' AND start_time >= ?';
                    intentionParams.push(options.startDate.getTime());
                }

                if (options.endDate) {
                    intentionQuery += ' AND start_time <= ?';
                    intentionParams.push(options.endDate.getTime());
                }

                const intentions = db.prepare(intentionQuery).all(...intentionParams);
                exportData.intention_periods = intentions;
            }

            // Add export metadata
            exportData.metadata = {
                exportedAt: new Date().toISOString(),
                format: options.format,
                filters: {
                    startDate: options.startDate?.toISOString(),
                    endDate: options.endDate?.toISOString(),
                    sessionIds: options.sessionIds
                },
                counts: {
                    sessions: exportData.sessions?.length || 0,
                    trials: exportData.trials?.length || 0,
                    intentionPeriods: exportData.intention_periods?.length || 0
                }
            };

            // Write data in requested format
            await this.writeExportData(filepath, exportData, options.format);

            // Log export to database
            await this.logExport(filepath, exportData.metadata, options);

            console.log(`Data exported to: ${filename}`);
            return filepath;
        } catch (error) {
            console.error('Export failed:', error);
            throw new Error(`Export failed: ${error.message}`);
        }
    }

    /**
     * Setup automatic maintenance schedule
     */
    setupAutomaticMaintenance(): void {
        // Daily backup at 2 AM
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 2 && now.getMinutes() === 0) {
                try {
                    await this.createAutomaticBackup();
                } catch (error) {
                    console.error('Automatic backup failed:', error);
                }
            }
        }, 60000); // Check every minute

        // Weekly optimization on Sunday at 3 AM
        setInterval(async () => {
            const now = new Date();
            if (now.getDay() === 0 && now.getHours() === 3 && now.getMinutes() === 0) {
                try {
                    const optimizer = getDatabaseOptimizer();
                    optimizer.analyzeAndOptimize();
                    await optimizer.cleanupOldData(90); // Keep 90 days
                } catch (error) {
                    console.error('Automatic optimization failed:', error);
                }
            }
        }, 60000); // Check every minute

        console.log('Automatic maintenance schedule setup completed');
    }

    // Private methods

    private async ensureDirectories(): Promise<void> {
        await mkdir(this.backupPath, { recursive: true });
        await mkdir(this.exportPath, { recursive: true });
    }

    private async getBackupInfo(filepath: string, type: 'manual' | 'automatic'): Promise<BackupInfo> {
        const stats = await stat(filepath);
        const data = await readFile(filepath);
        const checksum = crypto.createHash('sha256').update(data).digest('hex');

        return {
            filename: path.basename(filepath),
            filepath,
            timestamp: stats.mtime,
            size: stats.size,
            checksum,
            type,
            compressed: false // Not implementing compression in this version
        };
    }

    private async rotateBackups(type: 'manual' | 'automatic', keepCount: number): Promise<void> {
        try {
            const backups = await this.listBackups();
            const backupsOfType = backups.filter(b => b.type === type);

            if (backupsOfType.length > keepCount) {
                const toDelete = backupsOfType.slice(keepCount);

                for (const backup of toDelete) {
                    await unlink(backup.filepath);
                    console.log(`Rotated old backup: ${backup.filename}`);
                }
            }
        } catch (error) {
            console.error('Backup rotation failed:', error);
        }
    }

    private async writeExportData(filepath: string, data: any, format: 'csv' | 'json' | 'excel'): Promise<void> {
        switch (format) {
            case 'json':
                await writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
                break;

            case 'csv':
                // Simple CSV implementation - in production, use a proper CSV library
                const csvData = this.convertToCSV(data);
                await writeFile(filepath, csvData, 'utf8');
                break;

            case 'excel':
                // For Excel, we'll export as CSV for now
                // In production, use a library like 'xlsx'
                const excelData = this.convertToCSV(data);
                await writeFile(filepath.replace('.excel', '.csv'), excelData, 'utf8');
                break;
        }
    }

    private convertToCSV(data: any): string {
        // Simple CSV conversion - focuses on trials data
        if (!data.trials || data.trials.length === 0) {
            return 'No trial data to export';
        }

        const headers = Object.keys(data.trials[0]);
        const csvRows = [headers.join(',')];

        for (const trial of data.trials) {
            const values = headers.map(header => {
                const value = trial[header];
                return typeof value === 'string' ? `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    private async logExport(filepath: string, metadata: any, options: ExportOptions): Promise<void> {
        try {
            const dbManager = getDatabaseManager();
            const db = dbManager.getConnection();

            const checksum = crypto.createHash('sha256')
                .update(await readFile(filepath))
                .digest('hex');

            const stmt = db.prepare(`
                INSERT INTO export_log (
                    id, export_type, data_range_start, data_range_end,
                    trial_count, session_count, file_path, checksum
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const id = crypto.randomUUID();
            const startTime = options.startDate?.getTime() || 0;
            const endTime = options.endDate?.getTime() || Date.now();

            stmt.run([
                id,
                options.format,
                startTime,
                endTime,
                metadata.counts.trials,
                metadata.counts.sessions,
                filepath,
                checksum
            ]);
        } catch (error) {
            console.error('Failed to log export:', error);
        }
    }
}

// Export singleton instance
let maintenance: DatabaseMaintenance | null = null;

export function getDatabaseMaintenance(): DatabaseMaintenance {
    if (!maintenance) {
        maintenance = new DatabaseMaintenance();
    }
    return maintenance;
}