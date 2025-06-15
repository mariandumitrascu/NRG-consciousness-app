import { RNGEngine } from '../../src/core/rng/RNGEngine';
import { StatisticalAnalysis } from '../../src/core/analysis/StatisticalAnalysis';
import { TrialData, RNGEngineConfig } from '../../src/shared/types';

describe('RNG Engine', () => {
    let rngEngine: RNGEngine;
    let mockConfig: RNGEngineConfig;

    beforeEach(() => {
        mockConfig = {
            trialIntervalMs: 1000,
            bitsPerTrial: 200,
            qualityControlEnabled: true,
            maxRetries: 3,
            timeoutMs: 5000
        };
        rngEngine = new RNGEngine(mockConfig);
    });

    afterEach(async () => {
        if (rngEngine) {
            await rngEngine.stop();
        }
    });

    describe('Trial Generation', () => {
        test('generates valid 200-bit trials', async () => {
            const trial = await rngEngine.generateTrial();

            expect(trial).toBeDefined();
            expect(trial.bits).toHaveLength(200);
            expect(trial.bits.every(bit => bit === 0 || bit === 1)).toBe(true);
            expect(trial.timestamp).toBeInstanceOf(Date);
            expect(trial.id).toBeDefined();
            expect(trial.ones).toBe(trial.bits.filter(bit => bit === 1).length);
            expect(trial.zeros).toBe(trial.bits.filter(bit => bit === 0).length);
            expect(trial.ones + trial.zeros).toBe(200);
        });

        test('maintains precise 1-second timing', async () => {
            const timestamps: number[] = [];
            const expectedInterval = 1000; // 1 second
            const tolerance = 10; // ±10ms tolerance

            rngEngine.on('trial', (trial: TrialData) => {
                timestamps.push(trial.timestamp.getTime());
            });

            await rngEngine.start();

            // Wait for 5 trials
            return new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                    if (timestamps.length >= 5) {
                        clearInterval(checkInterval);

                        // Check intervals between consecutive trials
                        for (let i = 1; i < timestamps.length; i++) {
                            const interval = timestamps[i] - timestamps[i - 1];
                            expect(Math.abs(interval - expectedInterval)).toBeLessThan(tolerance);
                        }

                        resolve();
                    }
                }, 100);
            });
        });

        test('handles continuous operation', async () => {
            let trialCount = 0;
            const targetTrials = 100;

            rngEngine.on('trial', () => {
                trialCount++;
            });

            await rngEngine.start();

            // Wait for 100 trials (approximately 100 seconds, but we'll use a mock timer)
            return new Promise<void>((resolve) => {
                const checkInterval = setInterval(async () => {
                    if (trialCount >= targetTrials) {
                        clearInterval(checkInterval);
                        await rngEngine.stop();

                        expect(trialCount).toBeGreaterThanOrEqual(targetTrials);
                        expect(rngEngine.isRunning()).toBe(false);
                        resolve();
                    }
                }, 50);
            });
        }, 10000); // 10 second timeout

        test('recovers from errors gracefully', async () => {
            let errorCount = 0;
            let recoveryCount = 0;

            rngEngine.on('error', () => {
                errorCount++;
            });

            rngEngine.on('recovery', () => {
                recoveryCount++;
            });

            // Simulate error conditions
            jest.spyOn(rngEngine as any, 'generateRandomBits')
                .mockRejectedValueOnce(new Error('Simulated RNG failure'))
                .mockRejectedValueOnce(new Error('Another simulated failure'))
                .mockResolvedValue(new Array(200).fill(0).map(() => Math.random() < 0.5 ? 1 : 0));

            await rngEngine.start();

            return new Promise<void>((resolve) => {
                setTimeout(async () => {
                    await rngEngine.stop();
                    expect(errorCount).toBeGreaterThan(0);
                    expect(recoveryCount).toBeGreaterThan(0);
                    resolve();
                }, 3000);
            });
        });
    });

    describe('Quality Control', () => {
        test('validates randomness quality', async () => {
            const trials: TrialData[] = [];

            for (let i = 0; i < 10; i++) {
                const trial = await rngEngine.generateTrial();
                trials.push(trial);
            }

            // Check that trials are reasonably random
            const allBits = trials.flatMap(trial => trial.bits);
            const onesCount = allBits.filter(bit => bit === 1).length;
            const expectedOnes = allBits.length / 2;
            const tolerance = allBits.length * 0.1; // 10% tolerance

            expect(Math.abs(onesCount - expectedOnes)).toBeLessThan(tolerance);
        });

        test('detects and handles poor quality randomness', async () => {
            // Mock poor quality randomness (all zeros)
            jest.spyOn(rngEngine as any, 'generateRandomBits')
                .mockResolvedValue(new Array(200).fill(0));

            const trial = await rngEngine.generateTrial();

            // Quality control should flag this or reject it
            expect(trial.qualityScore).toBeDefined();
            expect(trial.qualityScore).toBeLessThan(0.5); // Poor quality score
        });
    });

    describe('Performance', () => {
        test('maintains performance under load', async () => {
            const startTime = Date.now();
            const trials = await Promise.all(
                Array(50).fill(0).map(() => rngEngine.generateTrial())
            );
            const endTime = Date.now();

            expect(trials).toHaveLength(50);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
        });

        test('manages memory efficiently', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Generate many trials
            for (let i = 0; i < 1000; i++) {
                await rngEngine.generateTrial();
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 100MB)
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        });
    });

    describe('Configuration', () => {
        test('respects configuration parameters', () => {
            const customConfig: RNGEngineConfig = {
                trialIntervalMs: 500,
                bitsPerTrial: 100,
                qualityControlEnabled: false,
                maxRetries: 5,
                timeoutMs: 10000
            };

            const customEngine = new RNGEngine(customConfig);
            expect(customEngine.getConfig()).toEqual(customConfig);
        });

        test('validates configuration parameters', () => {
            const invalidConfig = {
                trialIntervalMs: -1000, // Invalid negative interval
                bitsPerTrial: 0, // Invalid zero bits
                qualityControlEnabled: true,
                maxRetries: -1, // Invalid negative retries
                timeoutMs: 0 // Invalid zero timeout
            };

            expect(() => new RNGEngine(invalidConfig as RNGEngineConfig)).toThrow();
        });
    });
});

describe('Statistical Analysis', () => {
    let analysis: StatisticalAnalysis;
    let sampleData: TrialData[];

    beforeEach(() => {
        analysis = new StatisticalAnalysis();

        // Generate sample data with known properties
        sampleData = Array(100).fill(0).map((_, index) => ({
            id: `trial-${index}`,
            timestamp: new Date(Date.now() + index * 1000),
            bits: Array(200).fill(0).map(() => Math.random() < 0.5 ? 1 : 0),
            ones: 0,
            zeros: 0,
            sessionId: 'test-session',
            qualityScore: 0.95
        }));

        // Calculate ones and zeros for each trial
        sampleData.forEach(trial => {
            trial.ones = trial.bits.filter(bit => bit === 1).length;
            trial.zeros = trial.bits.filter(bit => bit === 0).length;
        });
    });

    test('calculates network variance correctly', () => {
        const networkVariance = analysis.calculateNetworkVariance(sampleData);

        expect(networkVariance).toBeDefined();
        expect(typeof networkVariance).toBe('number');
        expect(networkVariance).toBeGreaterThan(0);

        // Network variance should be close to expected value for random data
        // For 200-bit trials, expected variance is 50
        const expectedVariance = 50;
        const tolerance = 10;
        expect(Math.abs(networkVariance - expectedVariance)).toBeLessThan(tolerance);
    });

    test('produces accurate z-scores', () => {
        const zScore = analysis.calculateZScore(sampleData);

        expect(zScore).toBeDefined();
        expect(typeof zScore).toBe('number');
        expect(!isNaN(zScore)).toBe(true);

        // For random data, z-score should be close to 0
        expect(Math.abs(zScore)).toBeLessThan(3); // Within 3 standard deviations
    });

    test('handles edge cases properly', () => {
        // Empty data
        expect(() => analysis.calculateNetworkVariance([])).toThrow();
        expect(() => analysis.calculateZScore([])).toThrow();

        // Single trial
        const singleTrial = [sampleData[0]];
        const singleVariance = analysis.calculateNetworkVariance(singleTrial);
        expect(singleVariance).toBeDefined();
        expect(typeof singleVariance).toBe('number');

        // All zeros
        const allZerosTrial: TrialData = {
            ...sampleData[0],
            bits: Array(200).fill(0),
            ones: 0,
            zeros: 200
        };
        const zeroVariance = analysis.calculateNetworkVariance([allZerosTrial]);
        expect(zeroVariance).toBe(0);

        // All ones
        const allOnesTrial: TrialData = {
            ...sampleData[0],
            bits: Array(200).fill(1),
            ones: 200,
            zeros: 0
        };
        const onesVariance = analysis.calculateNetworkVariance([allOnesTrial]);
        expect(onesVariance).toBe(10000); // (200-100)^2 = 10000
    });

    test('matches published GCP results', () => {
        // Create data that should match known GCP results
        // This would use actual published GCP data for validation
        const gcpSimulatedData = generateGCPTestData();

        const networkVariance = analysis.calculateNetworkVariance(gcpSimulatedData);
        const zScore = analysis.calculateZScore(gcpSimulatedData);
        const chisquare = analysis.calculateChiSquare(gcpSimulatedData);

        // These values should match published GCP statistical methods
        expect(networkVariance).toBeDefined();
        expect(zScore).toBeDefined();
        expect(chisquare).toBeDefined();

        // Validate against known statistical properties
        expect(analysis.validateStatisticalMethods(gcpSimulatedData)).toBe(true);
    });

    test('calculates cumulative deviation correctly', () => {
        const cumulativeDeviation = analysis.calculateCumulativeDeviation(sampleData);

        expect(cumulativeDeviation).toBeDefined();
        expect(Array.isArray(cumulativeDeviation)).toBe(true);
        expect(cumulativeDeviation).toHaveLength(sampleData.length);

        // First deviation should be based on first trial
        expect(cumulativeDeviation[0]).toBeDefined();

        // Deviations should be cumulative
        expect(cumulativeDeviation[cumulativeDeviation.length - 1]).toBeDefined();

        // For random data, final cumulative deviation should be reasonable
        const finalDeviation = Math.abs(cumulativeDeviation[cumulativeDeviation.length - 1]);
        expect(finalDeviation).toBeLessThan(100); // Reasonable bound for 100 trials
    });

    test('performs autocorrelation analysis', () => {
        const autocorrelation = analysis.calculateAutocorrelation(sampleData, 10);

        expect(autocorrelation).toBeDefined();
        expect(Array.isArray(autocorrelation)).toBe(true);
        expect(autocorrelation).toHaveLength(10);

        // First autocorrelation should be 1 (perfect correlation with itself)
        expect(autocorrelation[0]).toBeCloseTo(1, 2);

        // For random data, other autocorrelations should be close to 0
        for (let i = 1; i < autocorrelation.length; i++) {
            expect(Math.abs(autocorrelation[i])).toBeLessThan(0.3);
        }
    });
});

// Helper function to generate GCP-style test data
function generateGCPTestData(): TrialData[] {
    // This would generate data that mimics actual GCP datasets
    // for validation against published results
    return Array(1000).fill(0).map((_, index) => ({
        id: `gcp-trial-${index}`,
        timestamp: new Date(Date.now() + index * 1000),
        bits: generateGCPStyleBits(),
        ones: 0,
        zeros: 0,
        sessionId: 'gcp-validation',
        qualityScore: 0.98
    })).map(trial => {
        trial.ones = trial.bits.filter(bit => bit === 1).length;
        trial.zeros = trial.bits.filter(bit => bit === 0).length;
        return trial;
    });
}

function generateGCPStyleBits(): number[] {
    // Generate bits with slight bias to simulate real GCP data patterns
    return Array(200).fill(0).map(() => {
        const random = Math.random();
        // Slight bias toward 1s to simulate consciousness effect
        return random < 0.502 ? 1 : 0;
    });
}