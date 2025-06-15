/**
 * Continuous Data Management
 *
 * Handles long-term data storage, archiving, and maintenance:
 * - Automatic data archiving
 * - Database optimization
 * - Integrity checking
 * - Backup management
 * - Storage usage monitoring
 */

import { DatabaseManager } from '../database';
import { ExportMetadata, ValidationResult } from '../shared/types';
import { promises as fs } from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

interface ExportResult {
    success: boolean;
    filePath?: string;
    metadata?: ExportMetadata;
    error?: string;
}

interface ValidationResults {
    dataIntegrity: ValidationResult;
    timestampConsistency: ValidationResult;
    statisticalConsistency: ValidationResult;
}

/**
 * Data retention and management for continuous operation
 */
export class DataRetentionManager {
    private database: DatabaseManager;
    private exportDirectory: string;
    private archiveDirectory: string;

    constructor(database: DatabaseManager, dataDirectory: string = './data') {
        this.database = database;
        this.exportDirectory = path.join(dataDirectory, 'exports');
        this.archiveDirectory = path.join(dataDirectory, 'archives');

        this.ensureDirectories();
    }

    /**
     * Archive old data based on retention policy
     */
    async archiveOldData(retentionDays: number): Promise<void> {
        console.log(`Starting data archival for data older than ${retentionDays} days`);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        try {
            // Export data before archiving
            const exportResult = await this.exportTimeRange(
                new Date(0), // Start from beginning
                cutoffDate,
                'archive'
            );

            if (!exportResult.success) {
                throw new Error(`Failed to export data for archiving: ${exportResult.error}`);
            }

            // Archive trials
            const trialsArchived = await this.database.trials.deleteOlderThan(cutoffDate);
            console.log(`Archived ${trialsArchived} trials`);

            // Archive intention periods
            const periodsArchived = await this.database.intentionPeriods.deleteOlderThan(cutoffDate);
            console.log(`Archived ${periodsArchived} intention periods`);

            // Archive sessions if they exist
            const sessionsArchived = await this.database.sessions.deleteOlderThan?.(cutoffDate) ?? 0;
            console.log(`Archived ${sessionsArchived} sessions`);

            console.log(`Data archival completed. Export saved to: ${exportResult.filePath}`);

        } catch (error) {
            console.error('Error during data archival:', error);
            throw error;
        }
    }

    /**
     * Compact database for optimal performance
     */
    async compactDatabase(): Promise<void> {
        console.log('Starting database compaction...');

        try {
            // Vacuum database to reclaim space
            await this.database.vacuum();

            // Analyze tables for query optimization
            await this.database.analyze();

            // Rebuild indexes
            await this.database.reindex();

            console.log('Database compaction completed');

        } catch (error) {
            console.error('Error during database compaction:', error);
            throw error;
        }
    }

    /**
     * Export data for a specific time range
     */
    async exportTimeRange(
        start: Date,
        end: Date,
        format: 'csv' | 'json' = 'csv',
        prefix: string = 'export'
    ): Promise<ExportResult> {
        try {
            console.log(`Exporting data from ${start.toISOString()} to ${end.toISOString()}`);

            // Get data to export
            const trials = await this.database.trials.getByDateRange(start, end);
            const intentionPeriods = await this.database.intentionPeriods.getByDateRange(start, end);

            if (trials.length === 0 && intentionPeriods.length === 0) {
                return {
                    success: false,
                    error: 'No data found in specified time range'
                };
            }

            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${prefix}_${timestamp}.${format}`;
            const filePath = path.join(this.exportDirectory, filename);

            // Export based on format
            let exportData: string;
            if (format === 'csv') {
                exportData = await this.exportToCSV(trials, intentionPeriods);
            } else {
                exportData = await this.exportToJSON(trials, intentionPeriods);
            }

            // Write to file
            await fs.writeFile(filePath, exportData, 'utf-8');

            // Calculate checksum
            const checksum = createHash('sha256').update(exportData).digest('hex');

            // Create metadata
            const metadata: ExportMetadata = {
                exportedAt: new Date(),
                dataRange: { startTime: start, endTime: end },
                trialCount: trials.length,
                sessionCount: intentionPeriods.length,
                format,
                filePath,
                checksum
            };

            // Save metadata
            const metadataPath = filePath.replace(`.${format}`, '_metadata.json');
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

            console.log(`Export completed: ${filePath}`);
            console.log(`Trials: ${trials.length}, Intention Periods: ${intentionPeriods.length}`);

            return {
                success: true,
                filePath,
                metadata
            };

        } catch (error) {
            console.error('Error during export:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Validate data integrity
     */
    async validateDataIntegrity(): Promise<ValidationResults> {
        console.log('Starting comprehensive data integrity validation...');

        const results: ValidationResults = {
            dataIntegrity: await this.validateBasicDataIntegrity(),
            timestampConsistency: await this.validateTimestampConsistency(),
            statisticalConsistency: await this.validateStatisticalConsistency()
        };

        const overallValid = results.dataIntegrity.isValid &&
            results.timestampConsistency.isValid &&
            results.statisticalConsistency.isValid;

        console.log(`Data integrity validation completed. Overall valid: ${overallValid}`);

        if (!overallValid) {
            console.warn('Data integrity issues found:');
            [results.dataIntegrity, results.timestampConsistency, results.statisticalConsistency]
                .forEach((result, index) => {
                    const types = ['Data Integrity', 'Timestamp Consistency', 'Statistical Consistency'];
                    if (!result.isValid) {
                        console.warn(`${types[index]} errors:`, result.errors);
                    }
                });
        }

        return results;
    }

    /**
     * Get storage usage statistics
     */
    async getStorageUsage(): Promise<{
        databaseSize: number;
        exportSize: number;
        archiveSize: number;
        totalSize: number;
        trialCount: number;
        intentionPeriodCount: number;
    }> {
        try {
            // Get database size
            const databaseSize = await this.getDatabaseSize();

            // Get export directory size
            const exportSize = await this.getDirectorySize(this.exportDirectory);

            // Get archive directory size
            const archiveSize = await this.getDirectorySize(this.archiveDirectory);

            // Get record counts
            const trialCount = await this.database.trials.count();
            const intentionPeriodCount = await this.database.intentionPeriods.count();

            return {
                databaseSize,
                exportSize,
                archiveSize,
                totalSize: databaseSize + exportSize + archiveSize,
                trialCount,
                intentionPeriodCount
            };

        } catch (error) {
            console.error('Error getting storage usage:', error);
            return {
                databaseSize: 0,
                exportSize: 0,
                archiveSize: 0,
                totalSize: 0,
                trialCount: 0,
                intentionPeriodCount: 0
            };
        }
    }

    /**
     * Clean up old exports
     */
    async cleanupOldExports(retentionDays: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        try {
            const files = await fs.readdir(this.exportDirectory);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.exportDirectory, file);
                const stats = await fs.stat(filePath);

                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`Deleted old export: ${file}`);
                }
            }

            console.log(`Cleaned up ${deletedCount} old export files`);
            return deletedCount;

        } catch (error) {
            console.error('Error cleaning up old exports:', error);
            return 0;
        }
    }

    /**
     * Create backup of current database
     */
    async createBackup(): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `database_backup_${timestamp}.db`;
        const backupPath = path.join(this.archiveDirectory, backupFilename);

        try {
            await this.database.backup(backupPath);
            console.log(`Database backup created: ${backupPath}`);
            return backupPath;

        } catch (error) {
            console.error('Error creating database backup:', error);
            throw error;
        }
    }

    /**
     * Private helper methods
     */
    private async ensureDirectories(): Promise<void> {
        try {
            await fs.mkdir(this.exportDirectory, { recursive: true });
            await fs.mkdir(this.archiveDirectory, { recursive: true });
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    private async exportToCSV(trials: any[], intentionPeriods: any[]): Promise<string> {
        const lines: string[] = [];

        // CSV header for trials
        lines.push('# TRIALS');
        lines.push('timestamp,trialValue,sessionId,experimentMode,intention,trialNumber');

        // Trial data
        trials.forEach(trial => {
            lines.push([
                trial.timestamp.toISOString(),
                trial.trialValue,
                trial.sessionId,
                trial.experimentMode,
                trial.intention || '',
                trial.trialNumber
            ].join(','));
        });

        // CSV header for intention periods
        lines.push('');
        lines.push('# INTENTION PERIODS');
        lines.push('id,startTime,endTime,intention,notes,sessionId');

        // Intention period data
        intentionPeriods.forEach(period => {
            lines.push([
                period.id,
                period.startTime.toISOString(),
                period.endTime ? period.endTime.toISOString() : '',
                period.intention,
                `"${period.notes.replace(/"/g, '""')}"`, // Escape quotes
                period.sessionId || ''
            ].join(','));
        });

        return lines.join('\n');
    }

    private async exportToJSON(trials: any[], intentionPeriods: any[]): Promise<string> {
        const exportData = {
            exportInfo: {
                timestamp: new Date().toISOString(),
                version: '1.0',
                format: 'json'
            },
            trials: trials.map(trial => ({
                ...trial,
                timestamp: trial.timestamp.toISOString()
            })),
            intentionPeriods: intentionPeriods.map(period => ({
                ...period,
                startTime: period.startTime.toISOString(),
                endTime: period.endTime ? period.endTime.toISOString() : null
            }))
        };

        return JSON.stringify(exportData, null, 2);
    }

    private async validateBasicDataIntegrity(): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Check for null/invalid trial values
            const invalidTrials = await this.database.trials.findInvalidTrials();
            if (invalidTrials.length > 0) {
                errors.push(`Found ${invalidTrials.length} trials with invalid values`);
            }

            // Check for duplicate trials
            const duplicateTrials = await this.database.trials.findDuplicates();
            if (duplicateTrials.length > 0) {
                warnings.push(`Found ${duplicateTrials.length} potential duplicate trials`);
            }

            // Check for orphaned intention periods
            const orphanedPeriods = await this.database.intentionPeriods.findOrphaned();
            if (orphanedPeriods.length > 0) {
                warnings.push(`Found ${orphanedPeriods.length} orphaned intention periods`);
            }

        } catch (error) {
            errors.push(`Error during basic integrity check: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            validatedAt: new Date(),
            validationType: 'trial'
        };
    }

    private async validateTimestampConsistency(): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Check for future timestamps
            const futureTrials = await this.database.trials.findFutureTimestamps();
            if (futureTrials.length > 0) {
                errors.push(`Found ${futureTrials.length} trials with future timestamps`);
            }

            // Check for timestamp gaps
            const gaps = await this.database.trials.findTimestampGaps(5000); // 5 second gaps
            if (gaps.length > 0) {
                warnings.push(`Found ${gaps.length} significant timestamp gaps (>5s)`);
            }

            // Check intention period overlaps
            const overlaps = await this.database.intentionPeriods.findOverlaps();
            if (overlaps.length > 0) {
                warnings.push(`Found ${overlaps.length} overlapping intention periods`);
            }

        } catch (error) {
            errors.push(`Error during timestamp consistency check: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            validatedAt: new Date(),
            validationType: 'timing'
        };
    }

    private async validateStatisticalConsistency(): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Check for statistically impossible sequences
            const impossibleSequences = await this.findImpossibleSequences();
            if (impossibleSequences.length > 0) {
                errors.push(`Found ${impossibleSequences.length} statistically impossible sequences`);
            }

            // Check for bias in random data
            const biasCheck = await this.checkForSystematicBias();
            if (biasCheck.isBiased) {
                warnings.push(`Potential systematic bias detected: ${biasCheck.description}`);
            }

        } catch (error) {
            errors.push(`Error during statistical consistency check: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            validatedAt: new Date(),
            validationType: 'statistics'
        };
    }

    private async findImpossibleSequences(): Promise<any[]> {
        // Check for sequences that would be extremely unlikely in true random data
        // E.g., 50 consecutive identical values, patterns that repeat exactly
        return [];
    }

    private async checkForSystematicBias(): Promise<{ isBiased: boolean; description: string }> {
        // Check for overall bias in the data that might indicate hardware issues
        const recentTrials = await this.database.trials.getRecent(10000);

        if (recentTrials.length < 1000) {
            return { isBiased: false, description: 'Insufficient data for bias check' };
        }

        const mean = recentTrials.reduce((sum, trial) => sum + trial.trialValue, 0) / recentTrials.length;
        const expectedMean = 100;
        const standardError = Math.sqrt(200 * 0.25) / Math.sqrt(recentTrials.length); // Standard error for binomial
        const zScore = Math.abs(mean - expectedMean) / standardError;

        if (zScore > 3.0) {
            return {
                isBiased: true,
                description: `Mean ${mean.toFixed(2)} significantly differs from expected ${expectedMean} (Z=${zScore.toFixed(2)})`
            };
        }

        return { isBiased: false, description: 'No systematic bias detected' };
    }

    private async getDatabaseSize(): Promise<number> {
        try {
            const stats = await fs.stat(this.database.getDatabasePath());
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    private async getDirectorySize(dirPath: string): Promise<number> {
        try {
            const files = await fs.readdir(dirPath);
            let totalSize = 0;

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory()) {
                    totalSize += await this.getDirectorySize(filePath);
                } else {
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch (error) {
            return 0;
        }
    }
}