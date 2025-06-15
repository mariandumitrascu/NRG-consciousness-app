import { app, BrowserWindow } from 'electron';
import { Application } from 'spectron';
import * as path from 'path';
import * as fs from 'fs';

describe('Complete Workflow E2E Tests', () => {
    let application: Application;
    let testDbPath: string;

    beforeAll(async () => {
        // Set up test database path
        testDbPath = path.join(__dirname, 'e2e-test.db');

        // Clean up any existing test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }

        // Set environment variable for test database
        process.env.TEST_DATABASE_PATH = testDbPath;

        // Initialize Spectron application
        application = new Application({
            path: path.join(__dirname, '../../node_modules/.bin/electron'),
            args: [path.join(__dirname, '../../dist/main/main.js')],
            env: {
                NODE_ENV: 'test',
                TEST_DATABASE_PATH: testDbPath
            }
        });

        await application.start();
    });

    afterAll(async () => {
        if (application && application.isRunning()) {
            await application.stop();
        }

        // Clean up test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('Application Startup', () => {
        test('launches application successfully', async () => {
            expect(application).toBeDefined();
            expect(application.isRunning()).toBe(true);

            const windowCount = await application.client.getWindowCount();
            expect(windowCount).toBe(1);
        });

        test('displays main window with correct title', async () => {
            const title = await application.client.browserWindow.getTitle();
            expect(title).toContain('RNG Consciousness Experiment');
        });

        test('loads main interface components', async () => {
            // Wait for application to load
            await application.client.waitUntilWindowLoaded();

            // Check for main navigation elements
            const navigation = await application.client.$('[data-testid="main-navigation"]');
            expect(await navigation.isExisting()).toBe(true);

            // Check for dashboard
            const dashboard = await application.client.$('[data-testid="dashboard"]');
            expect(await dashboard.isExisting()).toBe(true);
        });
    });

    describe('Session Mode Workflow', () => {
        test('creates new session successfully', async () => {
            // Navigate to session mode
            await application.client.click('[data-testid="nav-session-mode"]');

            // Wait for session mode to load
            await application.client.waitForExist('[data-testid="session-mode-view"]');

            // Click create new session
            await application.client.click('[data-testid="create-session-btn"]');

            // Fill in session details
            await application.client.waitForExist('[data-testid="session-form"]');
            await application.client.setValue('[data-testid="session-name-input"]', 'E2E Test Session');
            await application.client.setValue('[data-testid="session-description-input"]', 'Automated end-to-end test session');
            await application.client.setValue('[data-testid="target-trials-input"]', '10');

            // Submit form
            await application.client.click('[data-testid="create-session-submit"]');

            // Verify session was created
            await application.client.waitForExist('[data-testid="session-created-confirmation"]');
            const confirmationText = await application.client.getText('[data-testid="session-created-confirmation"]');
            expect(confirmationText).toContain('E2E Test Session');
        });

        test('starts session and generates trials', async () => {
            // Start the session
            await application.client.click('[data-testid="start-session-btn"]');

            // Wait for session to start
            await application.client.waitForExist('[data-testid="session-running"]');

            // Verify session status
            const statusElement = await application.client.$('[data-testid="session-status"]');
            const status = await statusElement.getText();
            expect(status).toBe('Running');

            // Wait for first trial to be generated
            await application.client.waitUntil(async () => {
                const trialCountElement = await application.client.$('[data-testid="completed-trials-count"]');
                const count = await trialCountElement.getText();
                return parseInt(count) > 0;
            }, 5000, 'First trial should be generated within 5 seconds');

            // Verify trial counter updates
            const trialCount = await application.client.getText('[data-testid="completed-trials-count"]');
            expect(parseInt(trialCount)).toBeGreaterThan(0);
        });

        test('displays real-time statistical analysis', async () => {
            // Wait for some trials to be generated
            await application.client.waitUntil(async () => {
                const trialCountElement = await application.client.$('[data-testid="completed-trials-count"]');
                const count = await trialCountElement.getText();
                return parseInt(count) >= 3;
            }, 10000, 'At least 3 trials should be generated');

            // Check that statistical displays are present and updating
            const networkVariance = await application.client.$('[data-testid="network-variance"]');
            expect(await networkVariance.isExisting()).toBe(true);

            const zScore = await application.client.$('[data-testid="z-score"]');
            expect(await zScore.isExisting()).toBe(true);

            const chiSquare = await application.client.$('[data-testid="chi-square"]');
            expect(await chiSquare.isExisting()).toBe(true);

            // Verify values are numeric and reasonable
            const networkVarianceValue = await networkVariance.getText();
            expect(parseFloat(networkVarianceValue)).toBeGreaterThan(0);
        });

        test('displays real-time charts', async () => {
            // Check for cumulative deviation chart
            const cumulativeChart = await application.client.$('[data-testid="cumulative-deviation-chart"]');
            expect(await cumulativeChart.isExisting()).toBe(true);

            // Check for trial distribution chart
            const distributionChart = await application.client.$('[data-testid="trial-distribution-chart"]');
            expect(await distributionChart.isExisting()).toBe(true);

            // Verify charts are rendering data
            await application.client.waitUntil(async () => {
                const chartElements = await application.client.$$('[data-testid*="chart-data-point"]');
                return chartElements.length > 0;
            }, 5000, 'Chart should display data points');
        });

        test('completes session successfully', async () => {
            // Wait for session to complete (10 trials)
            await application.client.waitUntil(async () => {
                const trialCountElement = await application.client.$('[data-testid="completed-trials-count"]');
                const count = await trialCountElement.getText();
                return parseInt(count) >= 10;
            }, 30000, 'Session should complete with 10 trials');

            // Verify session status changed to completed
            await application.client.waitForExist('[data-testid="session-completed"]');
            const statusElement = await application.client.$('[data-testid="session-status"]');
            const status = await statusElement.getText();
            expect(status).toBe('Completed');

            // Check final statistics are displayed
            const finalReport = await application.client.$('[data-testid="final-session-report"]');
            expect(await finalReport.isExisting()).toBe(true);
        });

        test('exports session data', async () => {
            // Click export button
            await application.client.click('[data-testid="export-session-btn"]');

            // Wait for export dialog
            await application.client.waitForExist('[data-testid="export-dialog"]');

            // Select export format
            await application.client.click('[data-testid="export-format-csv"]');

            // Click export
            await application.client.click('[data-testid="confirm-export-btn"]');

            // Wait for export confirmation
            await application.client.waitForExist('[data-testid="export-success-message"]');

            const successMessage = await application.client.getText('[data-testid="export-success-message"]');
            expect(successMessage).toContain('exported successfully');
        });
    });

    describe('Continuous Mode Workflow', () => {
        test('starts continuous monitoring', async () => {
            // Navigate to continuous mode
            await application.client.click('[data-testid="nav-continuous-mode"]');

            // Wait for continuous mode to load
            await application.client.waitForExist('[data-testid="continuous-mode-view"]');

            // Configure continuous monitoring
            await application.client.setValue('[data-testid="monitoring-duration-input"]', '30'); // 30 seconds for test

            // Start continuous monitoring
            await application.client.click('[data-testid="start-continuous-btn"]');

            // Verify monitoring started
            await application.client.waitForExist('[data-testid="continuous-monitoring-active"]');
            const statusElement = await application.client.$('[data-testid="monitoring-status"]');
            const status = await statusElement.getText();
            expect(status).toBe('Active');
        });

        test('displays continuous monitoring data', async () => {
            // Wait for some data to be collected
            await application.client.waitUntil(async () => {
                const trialCountElement = await application.client.$('[data-testid="total-trials-count"]');
                const count = await trialCountElement.getText();
                return parseInt(count) >= 5;
            }, 10000, 'Should collect at least 5 trials');

            // Check real-time displays
            const realtimeChart = await application.client.$('[data-testid="realtime-monitoring-chart"]');
            expect(await realtimeChart.isExisting()).toBe(true);

            const networkStatus = await application.client.$('[data-testid="network-status-display"]');
            expect(await networkStatus.isExisting()).toBe(true);
        });

        test('stops continuous monitoring', async () => {
            // Stop monitoring
            await application.client.click('[data-testid="stop-continuous-btn"]');

            // Verify monitoring stopped
            await application.client.waitForExist('[data-testid="continuous-monitoring-stopped"]');
            const statusElement = await application.client.$('[data-testid="monitoring-status"]');
            const status = await statusElement.getText();
            expect(status).toBe('Stopped');

            // Check final summary is displayed
            const summary = await application.client.$('[data-testid="monitoring-summary"]');
            expect(await summary.isExisting()).toBe(true);
        });
    });

    describe('Analysis and Reporting', () => {
        test('navigates to analysis view', async () => {
            // Navigate to analysis
            await application.client.click('[data-testid="nav-analysis"]');

            // Wait for analysis view to load
            await application.client.waitForExist('[data-testid="analysis-view"]');

            // Check that historical data is displayed
            const sessionList = await application.client.$('[data-testid="historical-sessions-list"]');
            expect(await sessionList.isExisting()).toBe(true);
        });

        test('analyzes historical session data', async () => {
            // Select the test session we created
            await application.client.click('[data-testid="session-item-0"]');

            // Wait for session analysis to load
            await application.client.waitForExist('[data-testid="session-analysis-details"]');

            // Check various analysis components
            const statisticalSummary = await application.client.$('[data-testid="statistical-summary"]');
            expect(await statisticalSummary.isExisting()).toBe(true);

            const trialByTrialAnalysis = await application.client.$('[data-testid="trial-by-trial-analysis"]');
            expect(await trialByTrialAnalysis.isExisting()).toBe(true);

            const significanceTests = await application.client.$('[data-testid="significance-tests"]');
            expect(await significanceTests.isExisting()).toBe(true);
        });

        test('generates comprehensive report', async () => {
            // Click generate report button
            await application.client.click('[data-testid="generate-report-btn"]');

            // Wait for report generation
            await application.client.waitForExist('[data-testid="generated-report"]');

            // Check report sections
            const executiveSummary = await application.client.$('[data-testid="executive-summary"]');
            expect(await executiveSummary.isExisting()).toBe(true);

            const methodologySection = await application.client.$('[data-testid="methodology-section"]');
            expect(await methodologySection.isExisting()).toBe(true);

            const resultsSection = await application.client.$('[data-testid="results-section"]');
            expect(await resultsSection.isExisting()).toBe(true);

            const conclusionsSection = await application.client.$('[data-testid="conclusions-section"]');
            expect(await conclusionsSection.isExisting()).toBe(true);
        });
    });

    describe('Calibration and Settings', () => {
        test('runs RNG calibration', async () => {
            // Navigate to calibration
            await application.client.click('[data-testid="nav-calibration"]');

            // Wait for calibration view
            await application.client.waitForExist('[data-testid="calibration-view"]');

            // Start calibration
            await application.client.click('[data-testid="start-calibration-btn"]');

            // Wait for calibration to complete
            await application.client.waitUntil(async () => {
                const calibrationStatus = await application.client.$('[data-testid="calibration-status"]');
                const status = await calibrationStatus.getText();
                return status.includes('Complete');
            }, 30000, 'Calibration should complete within 30 seconds');

            // Check calibration results
            const calibrationResults = await application.client.$('[data-testid="calibration-results"]');
            expect(await calibrationResults.isExisting()).toBe(true);
        });

        test('configures application settings', async () => {
            // Navigate to settings
            await application.client.click('[data-testid="nav-settings"]');

            // Wait for settings view
            await application.client.waitForExist('[data-testid="settings-view"]');

            // Modify some settings
            await application.client.click('[data-testid="trial-interval-setting"]');
            await application.client.setValue('[data-testid="trial-interval-input"]', '2000'); // 2 seconds

            // Save settings
            await application.client.click('[data-testid="save-settings-btn"]');

            // Verify settings saved
            await application.client.waitForExist('[data-testid="settings-saved-confirmation"]');
        });
    });

    describe('Error Handling and Recovery', () => {
        test('handles RNG engine errors gracefully', async () => {
            // Navigate to session mode
            await application.client.click('[data-testid="nav-session-mode"]');

            // Simulate RNG error by injecting test error
            await application.client.execute(() => {
                (window as any).electronAPI.simulateRNGError();
            });

            // Start a session
            await application.client.click('[data-testid="create-session-btn"]');
            await application.client.setValue('[data-testid="session-name-input"]', 'Error Test Session');
            await application.client.setValue('[data-testid="target-trials-input"]', '5');
            await application.client.click('[data-testid="create-session-submit"]');
            await application.client.click('[data-testid="start-session-btn"]');

            // Check that error is handled gracefully
            await application.client.waitForExist('[data-testid="error-recovery-notification"]');

            const errorMessage = await application.client.getText('[data-testid="error-recovery-notification"]');
            expect(errorMessage).toContain('recovered');
        });

        test('recovers from database connection issues', async () => {
            // Simulate database error
            await application.client.execute(() => {
                (window as any).electronAPI.simulateDatabaseError();
            });

            // Try to perform database operation
            await application.client.click('[data-testid="nav-analysis"]');

            // Check for error notification and recovery
            await application.client.waitForExist('[data-testid="database-error-notification"]');

            // Wait for automatic recovery
            await application.client.waitUntil(async () => {
                const recoveryStatus = await application.client.$('[data-testid="database-recovery-status"]');
                if (await recoveryStatus.isExisting()) {
                    const status = await recoveryStatus.getText();
                    return status.includes('Recovered');
                }
                return false;
            }, 10000, 'Database should recover automatically');
        });
    });

    describe('Performance Validation', () => {
        test('maintains responsive UI during high-frequency operations', async () => {
            // Start a high-frequency session
            await application.client.click('[data-testid="nav-session-mode"]');
            await application.client.click('[data-testid="create-session-btn"]');
            await application.client.setValue('[data-testid="session-name-input"]', 'Performance Test');
            await application.client.setValue('[data-testid="target-trials-input"]', '100');

            // Set high frequency (faster than normal)
            await application.client.click('[data-testid="advanced-settings-toggle"]');
            await application.client.setValue('[data-testid="trial-interval-override"]', '100'); // 100ms

            await application.client.click('[data-testid="create-session-submit"]');
            await application.client.click('[data-testid="start-session-btn"]');

            // Test UI responsiveness during operation
            const startTime = Date.now();

            // Try to interact with UI elements
            await application.client.click('[data-testid="pause-session-btn"]');
            await application.client.click('[data-testid="resume-session-btn"]');

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // UI should remain responsive (interactions complete within 1 second)
            expect(responseTime).toBeLessThan(1000);
        });

        test('validates memory usage during extended operation', async () => {
            // Get initial memory usage
            const initialMemory = await application.client.execute(() => {
                return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
            });

            // Run extended operation
            await application.client.click('[data-testid="nav-continuous-mode"]');
            await application.client.setValue('[data-testid="monitoring-duration-input"]', '60'); // 1 minute
            await application.client.click('[data-testid="start-continuous-btn"]');

            // Wait for significant operation time
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

            // Check memory usage
            const currentMemory = await application.client.execute(() => {
                return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
            });

            // Stop continuous mode
            await application.client.click('[data-testid="stop-continuous-btn"]');

            // Memory increase should be reasonable (less than 50MB)
            const memoryIncrease = currentMemory - initialMemory;
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });
    });
});