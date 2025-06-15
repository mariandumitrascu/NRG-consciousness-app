/**
 * Database Demo Script
 * Tests the complete database system including continuous trial insertion,
 * session management, and performance monitoring
 */

import { v4 as uuidv4 } from 'uuid';
import { RNGTrial, ExperimentSession } from '../shared/types';
import { initializeDatabase, shutdownDatabase } from './index';

interface DemoConfig {
    trialsPerSecond: number;
    sessionDurationMinutes: number;
    demoTimeMinutes: number;
    showPerformanceMetrics: boolean;
}

const defaultConfig: DemoConfig = {
    trialsPerSecond: 1,
    sessionDurationMinutes: 2,
    demoTimeMinutes: 5,
    showPerformanceMetrics: true
};

class DatabaseDemo {
    private isRunning = false;
    private currentSessionId: string | null = null;
    private trialCount = 0;
    private db: any;

    async run(config: DemoConfig = defaultConfig): Promise<void> {
        console.log('🚀 Starting RNG Consciousness Database Demo...');
        console.log(`Configuration:`, config);

        try {
            // Initialize database system
            this.db = await initializeDatabase();

            // Start demo
            this.isRunning = true;

            // Create initial manual backup
            console.log('\n📦 Creating initial backup...');
            const backup = await this.db.maintenance.createManualBackup('demo-start');
            console.log(`Backup created: ${backup.filename} (${Math.round(backup.size / 1024)}KB)`);

            // Start continuous trial generation
            console.log('\n🎲 Starting continuous trial generation...');
            this.startContinuousTrials(config.trialsPerSecond);

            // Start session management
            console.log('\n📊 Starting session management...');
            this.startSessionManagement(config.sessionDurationMinutes);

            // Start performance monitoring
            if (config.showPerformanceMetrics) {
                console.log('\n📈 Starting performance monitoring...');
                this.startPerformanceMonitoring();
            }

            // Run for specified duration
            console.log(`\n⏱️  Running demo for ${config.demoTimeMinutes} minutes...\n`);
            await this.sleep(config.demoTimeMinutes * 60 * 1000);

            // Stop demo
            await this.stop();

        } catch (error) {
            console.error('❌ Demo failed:', error);
            await this.stop();
        }
    }

    private startContinuousTrials(trialsPerSecond: number): void {
        const intervalMs = 1000 / trialsPerSecond;

        setInterval(async () => {
            if (!this.isRunning) return;

            try {
                const trial: RNGTrial = {
                    timestamp: new Date(),
                    trialValue: this.generateRandomTrialValue(),
                    sessionId: this.currentSessionId || 'continuous',
                    experimentMode: this.currentSessionId ? 'session' : 'continuous',
                    intention: this.getCurrentIntention(),
                    trialNumber: ++this.trialCount
                };

                // Use batch insertion for performance
                this.db.repositories.trials.addToBatch(trial);

                if (this.trialCount % 100 === 0) {
                    console.log(`📝 Generated ${this.trialCount} trials (Value: ${trial.trialValue}, Mode: ${trial.experimentMode})`);
                }

            } catch (error) {
                console.error('Trial generation error:', error);
            }
        }, intervalMs);
    }

    private startSessionManagement(sessionDurationMinutes: number): void {
        const startNewSession = async () => {
            if (!this.isRunning) return;

            try {
                // End current session if exists
                if (this.currentSessionId) {
                    await this.db.repositories.sessions.completeSession(this.currentSessionId);
                    console.log(`✅ Completed session: ${this.currentSessionId}`);
                }

                // Start new session
                const session: Omit<ExperimentSession, 'id'> = {
                    startTime: new Date(),
                    endTime: null,
                    intention: Math.random() > 0.5 ? 'high' : 'low',
                    targetTrials: sessionDurationMinutes * 60 * 1, // 1 trial per second
                    status: 'running',
                    notes: `Demo session - ${new Date().toISOString()}`
                };

                this.currentSessionId = await this.db.repositories.sessions.createSession(session);
                console.log(`🆕 Started new session: ${this.currentSessionId} (Intention: ${session.intention})`);

                // Schedule session completion
                setTimeout(startNewSession, sessionDurationMinutes * 60 * 1000);

            } catch (error) {
                console.error('Session management error:', error);
            }
        };

        // Start first session immediately
        startNewSession();
    }

    private startPerformanceMonitoring(): void {
        setInterval(() => {
            if (!this.isRunning) return;

            try {
                const metrics = this.db.optimizer.getPerformanceMetrics();
                const stats = this.db.dbManager.getDatabaseStats();

                console.log('\n📊 Performance Metrics:');
                console.log(`  • Inserts/sec: ${metrics.insertsPerSecond.toFixed(2)}`);
                console.log(`  • Queries/sec: ${metrics.queriesPerSecond.toFixed(2)}`);
                console.log(`  • Avg Query Time: ${metrics.averageQueryTime.toFixed(2)}ms`);
                console.log(`  • Memory Usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
                console.log(`  • Batch Size: ${metrics.batchSize}`);
                console.log(`  • Database Size: ${Math.round(stats.fileSize / 1024 / 1024)}MB`);
                console.log(`  • Total Trials: ${stats.tables.trials}`);
                console.log(`  • Total Sessions: ${stats.tables.sessions}`);

            } catch (error) {
                console.error('Performance monitoring error:', error);
            }
        }, 30000); // Every 30 seconds
    }

    private async demonstrateQueries(): Promise<void> {
        console.log('\n🔍 Demonstrating database queries...');

        try {
            // Get recent sessions
            const recentSessions = await this.db.repositories.sessions.getRecentSessions(5);
            console.log(`Recent sessions: ${recentSessions.length}`);

            // Get session statistics
            if (recentSessions.length > 0) {
                const sessionStats = await this.db.repositories.sessions.getSessionStats(recentSessions[0].id);
                if (sessionStats) {
                    console.log(`Session stats - Mean: ${sessionStats.mean.toFixed(2)}, Z-score: ${sessionStats.zScore.toFixed(3)}`);
                }
            }

            // Get continuous trials
            const continuousTrials = await this.db.repositories.trials.getContinuousTrials(1); // Last hour
            console.log(`Continuous trials (last hour): ${continuousTrials.length}`);

            // Get trial statistics
            const trialStats = await this.db.repositories.trials.getTrialStatistics({
                experimentMode: 'continuous'
            });
            console.log(`Trial stats - Count: ${trialStats.count}, Mean: ${trialStats.mean.toFixed(2)}`);

        } catch (error) {
            console.error('Query demonstration error:', error);
        }
    }

    private async demonstrateBackupAndExport(): Promise<void> {
        console.log('\n💾 Demonstrating backup and export...');

        try {
            // Create backup
            const backup = await this.db.maintenance.createManualBackup('demo-end');
            console.log(`Created backup: ${backup.filename}`);

            // List all backups
            const backups = await this.db.maintenance.listBackups();
            console.log(`Total backups: ${backups.length}`);

            // Validate data integrity
            const validation = await this.db.maintenance.validateDataIntegrity();
            console.log(`Data validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
            if (validation.errors.length > 0) {
                console.log(`Validation errors: ${validation.errors.join(', ')}`);
            }
            if (validation.warnings.length > 0) {
                console.log(`Validation warnings: ${validation.warnings.join(', ')}`);
            }

            // Export data
            const exportPath = await this.db.maintenance.exportData({
                format: 'json',
                includeTrials: true,
                includeSessions: true,
                includeIntentionPeriods: true,
                compression: false
            });
            console.log(`Data exported to: ${exportPath}`);

        } catch (error) {
            console.error('Backup/export demonstration error:', error);
        }
    }

    private async stop(): Promise<void> {
        console.log('\n🛑 Stopping demo...');
        this.isRunning = false;

        try {
            // Complete current session
            if (this.currentSessionId) {
                await this.db.repositories.sessions.completeSession(this.currentSessionId);
                console.log(`✅ Completed final session: ${this.currentSessionId}`);
            }

            // Flush any pending batches
            await this.db.repositories.trials.flushBatch();
            console.log('✅ Flushed pending trial batches');

            // Demonstrate queries
            await this.demonstrateQueries();

            // Demonstrate backup and export
            await this.demonstrateBackupAndExport();

            // Shutdown database
            await shutdownDatabase();
            console.log('✅ Database shutdown completed');

            // Show final statistics
            console.log('\n📊 Final Demo Statistics:');
            console.log(`  • Total trials generated: ${this.trialCount}`);
            console.log(`  • Demo duration: ${defaultConfig.demoTimeMinutes} minutes`);
            console.log(`  • Average rate: ${(this.trialCount / (defaultConfig.demoTimeMinutes * 60)).toFixed(2)} trials/second`);

        } catch (error) {
            console.error('Stop error:', error);
        }
    }

    private generateRandomTrialValue(): number {
        // Simulate summing 200 random bits (0 or 1)
        let sum = 0;
        for (let i = 0; i < 200; i++) {
            sum += Math.random() < 0.5 ? 0 : 1;
        }
        return sum;
    }

    private getCurrentIntention(): 'high' | 'low' | 'baseline' | null {
        if (this.currentSessionId) {
            // In session mode, intention comes from session
            return null; // Will be set by session
        } else {
            // In continuous mode, use intention periods (simplified for demo)
            return Math.random() > 0.7 ? (Math.random() > 0.5 ? 'high' : 'low') : 'baseline';
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run demo if called directly
if (require.main === module) {
    const demo = new DatabaseDemo();

    demo.run({
        trialsPerSecond: 2, // Faster for demo
        sessionDurationMinutes: 1, // Shorter sessions for demo
        demoTimeMinutes: 3, // Shorter demo time
        showPerformanceMetrics: true
    }).then(() => {
        console.log('\n🎉 Demo completed successfully!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n💥 Demo failed:', error);
        process.exit(1);
    });
}

export { DatabaseDemo };