import { RNGEngine } from '../../src/core/rng/RNGEngine';
import { TrialRepository } from '../../src/database/repositories/TrialRepository';
import { SessionRepository } from '../../src/database/repositories/SessionRepository';
import { DatabaseConnection } from '../../src/database/DatabaseConnection';
import { TrialData, SessionData, RNGEngineConfig } from '../../src/shared/types';
import * as path from 'path';
import * as fs from 'fs';

describe('Database-RNG Integration', () => {
    let rngEngine: RNGEngine;
    let trialRepo: TrialRepository;
    let sessionRepo: SessionRepository;
    let dbConnection: DatabaseConnection;
    let testDbPath: string;

    beforeEach(async () => {
        // Create temporary database for testing
        testDbPath = path.join(__dirname, 'test-integration.db');

        // Remove existing test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }

        // Initialize database connection and repositories
        dbConnection = new DatabaseConnection(testDbPath);
        await dbConnection.initialize();

        trialRepo = new TrialRepository(dbConnection);
        sessionRepo = new SessionRepository(dbConnection);

        // Initialize RNG engine
        const config: RNGEngineConfig = {
            trialIntervalMs: 100, // Faster for testing
            bitsPerTrial: 200,
            qualityControlEnabled: true,
            maxRetries: 3,
            timeoutMs: 5000
        };
        rngEngine = new RNGEngine(config);
    });

    afterEach(async () => {
        if (rngEngine && rngEngine.isRunning()) {
            await rngEngine.stop();
        }

        if (dbConnection) {
            await dbConnection.close();
        }

        // Clean up test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('Trial Generation and Storage', () => {
        test('stores generated trials in database', async () => {
            // Create a session
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'Integration Test Session',
                description: 'Testing trial storage',
                mode: 'session',
                status: 'active',
                targetTrials: 10,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);

            // Generate trials and store them
            const trials: TrialData[] = [];
            for (let i = 0; i < 5; i++) {
                const trial = await rngEngine.generateTrial();
                trial.sessionId = sessionId;
                await trialRepo.create(trial);
                trials.push(trial);
            }

            // Verify trials are stored correctly
            const storedTrials = await trialRepo.findBySessionId(sessionId);
            expect(storedTrials).toHaveLength(5);

            storedTrials.forEach((stored, index) => {
                expect(stored.id).toBe(trials[index].id);
                expect(stored.sessionId).toBe(sessionId);
                expect(stored.bits).toEqual(trials[index].bits);
                expect(stored.ones).toBe(trials[index].ones);
                expect(stored.zeros).toBe(trials[index].zeros);
            });
        });

        test('handles concurrent trial generation and storage', async () => {
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'Concurrent Test Session',
                description: 'Testing concurrent operations',
                mode: 'session',
                status: 'active',
                targetTrials: 20,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);

            // Generate and store trials concurrently
            const trialPromises = Array(10).fill(0).map(async () => {
                const trial = await rngEngine.generateTrial();
                trial.sessionId = sessionId;
                await trialRepo.create(trial);
                return trial;
            });

            const trials = await Promise.all(trialPromises);

            // Verify all trials are stored
            const storedTrials = await trialRepo.findBySessionId(sessionId);
            expect(storedTrials).toHaveLength(10);

            // Verify no data corruption
            const storedIds = new Set(storedTrials.map(t => t.id));
            const generatedIds = new Set(trials.map(t => t.id));
            expect(storedIds).toEqual(generatedIds);
        });

        test('maintains data integrity during high-frequency operations', async () => {
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'High Frequency Test',
                description: 'Testing data integrity at high frequency',
                mode: 'continuous',
                status: 'active',
                targetTrials: 100,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);
            const trials: TrialData[] = [];

            // Set up automatic storage of trials
            rngEngine.on('trial', async (trial: TrialData) => {
                trial.sessionId = sessionId;
                await trialRepo.create(trial);
                trials.push(trial);
            });

            await rngEngine.start();

            // Wait for multiple trials to be generated and stored
            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(async () => {
                    if (trials.length >= 20) {
                        clearInterval(checkInterval);
                        await rngEngine.stop();
                        resolve();
                    }
                }, 50);
            });

            // Verify data integrity
            const storedTrials = await trialRepo.findBySessionId(sessionId);
            expect(storedTrials.length).toBeGreaterThanOrEqual(20);

            // Check each stored trial
            for (const storedTrial of storedTrials) {
                expect(storedTrial.bits).toHaveLength(200);
                expect(storedTrial.ones + storedTrial.zeros).toBe(200);
                expect(storedTrial.sessionId).toBe(sessionId);
                expect(storedTrial.timestamp).toBeInstanceOf(Date);
            }
        });
    });

    describe('Real-time Data Flow', () => {
        test('updates session statistics in real-time', async () => {
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'Real-time Statistics Test',
                description: 'Testing real-time updates',
                mode: 'session',
                status: 'active',
                targetTrials: 10,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);
            let completedTrials = 0;

            // Set up real-time updates
            rngEngine.on('trial', async (trial: TrialData) => {
                trial.sessionId = sessionId;
                await trialRepo.create(trial);

                completedTrials++;
                await sessionRepo.update(sessionId, {
                    completedTrials,
                    status: completedTrials >= 10 ? 'completed' : 'active'
                });
            });

            await rngEngine.start();

            // Wait for completion
            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(async () => {
                    const session = await sessionRepo.findById(sessionId);
                    if (session && session.completedTrials >= 10) {
                        clearInterval(checkInterval);
                        await rngEngine.stop();
                        resolve();
                    }
                }, 100);
            });

            // Verify final session state
            const finalSession = await sessionRepo.findById(sessionId);
            expect(finalSession).toBeDefined();
            expect(finalSession!.completedTrials).toBe(10);
            expect(finalSession!.status).toBe('completed');
        });

        test('handles database transaction rollbacks correctly', async () => {
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'Transaction Test',
                description: 'Testing transaction handling',
                mode: 'session',
                status: 'active',
                targetTrials: 5,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);

            // Mock a database error after the 3rd trial
            let trialCount = 0;
            const originalCreate = trialRepo.create.bind(trialRepo);

            jest.spyOn(trialRepo, 'create').mockImplementation(async (trial: TrialData) => {
                trialCount++;
                if (trialCount === 3) {
                    throw new Error('Simulated database error');
                }
                return originalCreate(trial);
            });

            const storedTrials: TrialData[] = [];
            const errors: Error[] = [];

            // Set up error handling
            rngEngine.on('trial', async (trial: TrialData) => {
                try {
                    trial.sessionId = sessionId;
                    await trialRepo.create(trial);
                    storedTrials.push(trial);
                } catch (error) {
                    errors.push(error as Error);
                }
            });

            await rngEngine.start();

            // Wait for trials and errors
            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(async () => {
                    if (storedTrials.length + errors.length >= 5) {
                        clearInterval(checkInterval);
                        await rngEngine.stop();
                        resolve();
                    }
                }, 100);
            });

            // Verify error handling
            expect(errors.length).toBeGreaterThan(0);
            expect(storedTrials.length).toBeLessThan(5);

            // Verify database consistency
            const dbTrials = await trialRepo.findBySessionId(sessionId);
            expect(dbTrials).toHaveLength(storedTrials.length);
        });
    });

    describe('Performance Under Load', () => {
        test('maintains performance with large datasets', async () => {
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'Performance Test',
                description: 'Testing performance with large dataset',
                mode: 'continuous',
                status: 'active',
                targetTrials: 1000,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);
            const startTime = Date.now();

            // Generate and store many trials
            const trials: TrialData[] = [];
            for (let i = 0; i < 100; i++) {
                const trial = await rngEngine.generateTrial();
                trial.sessionId = sessionId;
                await trialRepo.create(trial);
                trials.push(trial);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Verify performance (should complete 100 trials in reasonable time)
            expect(duration).toBeLessThan(10000); // Less than 10 seconds
            expect(trials).toHaveLength(100);

            // Verify data retrieval performance
            const retrievalStart = Date.now();
            const storedTrials = await trialRepo.findBySessionId(sessionId);
            const retrievalEnd = Date.now();
            const retrievalDuration = retrievalEnd - retrievalStart;

            expect(retrievalDuration).toBeLessThan(1000); // Less than 1 second
            expect(storedTrials).toHaveLength(100);
        });

        test('handles memory efficiently during continuous operation', async () => {
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'Memory Test',
                description: 'Testing memory efficiency',
                mode: 'continuous',
                status: 'active',
                targetTrials: 500,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);
            const initialMemory = process.memoryUsage().heapUsed;
            let trialCount = 0;

            // Set up continuous operation
            rngEngine.on('trial', async (trial: TrialData) => {
                trial.sessionId = sessionId;
                await trialRepo.create(trial);
                trialCount++;
            });

            await rngEngine.start();

            // Wait for many trials
            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(async () => {
                    if (trialCount >= 200) {
                        clearInterval(checkInterval);
                        await rngEngine.stop();
                        resolve();
                    }
                }, 50);
            });

            // Force garbage collection
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable
            expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
            expect(trialCount).toBeGreaterThanOrEqual(200);
        });
    });

    describe('Error Recovery', () => {
        test('recovers from database connection failures', async () => {
            const sessionData: Omit<SessionData, 'id' | 'createdAt'> = {
                name: 'Recovery Test',
                description: 'Testing database recovery',
                mode: 'session',
                status: 'active',
                targetTrials: 10,
                completedTrials: 0,
                settings: {},
                startTime: new Date(),
                endTime: null
            };

            const sessionId = await sessionRepo.create(sessionData);
            let successfulTrials = 0;
            let recoveredTrials = 0;

            // Simulate database connection failure and recovery
            let failureSimulated = false;
            const originalCreate = trialRepo.create.bind(trialRepo);

            jest.spyOn(trialRepo, 'create').mockImplementation(async (trial: TrialData) => {
                if (!failureSimulated && successfulTrials >= 3) {
                    failureSimulated = true;
                    throw new Error('Database connection lost');
                }

                if (failureSimulated && successfulTrials < 6) {
                    // Simulate recovery after a few attempts
                    throw new Error('Still recovering...');
                }

                return originalCreate(trial);
            });

            // Set up trial handling with retry logic
            rngEngine.on('trial', async (trial: TrialData) => {
                let attempts = 0;
                const maxAttempts = 5;

                while (attempts < maxAttempts) {
                    try {
                        trial.sessionId = sessionId;
                        await trialRepo.create(trial);
                        successfulTrials++;
                        if (failureSimulated && attempts > 0) {
                            recoveredTrials++;
                        }
                        break;
                    } catch (error) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 100)); // Wait before retry
                        }
                    }
                }
            });

            await rngEngine.start();

            // Wait for trials including recovery
            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(async () => {
                    if (successfulTrials >= 8) {
                        clearInterval(checkInterval);
                        await rngEngine.stop();
                        resolve();
                    }
                }, 100);
            });

            // Verify recovery occurred
            expect(recoveredTrials).toBeGreaterThan(0);
            expect(successfulTrials).toBeGreaterThanOrEqual(8);

            // Verify data integrity after recovery
            const storedTrials = await trialRepo.findBySessionId(sessionId);
            expect(storedTrials).toHaveLength(successfulTrials);
        });
    });
});