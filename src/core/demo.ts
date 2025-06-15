/**
 * Demonstration of the RNG Engine functionality
 * Shows sample RNG trials and basic engine capabilities
 */

import { createRNGEngine, verifyCryptoSupport, testRNGQuality } from './rng-engine';
import { calculateBasicStats, calculateStatisticalResult } from './statistics';
import { formatTimestamp } from './time-manager';

/**
 * Demonstrate basic RNG engine functionality
 */
export async function demonstrateRNGEngine(): Promise<void> {
    console.log('=== RNG Consciousness Experiment Engine Demo ===\n');

    // 1. Verify crypto support
    console.log('1. Verifying crypto.getRandomValues() support...');
    const cryptoSupport = verifyCryptoSupport();
    console.log(`   Supported: ${cryptoSupport.supported}`);
    console.log(`   Quality: ${cryptoSupport.quality}`);
    if (cryptoSupport.issues.length > 0) {
        console.log(`   Issues: ${cryptoSupport.issues.join(', ')}`);
    }
    console.log();

    if (!cryptoSupport.supported) {
        console.log('Cannot proceed without crypto support.');
        return;
    }

    // 2. Create engine instance
    console.log('2. Creating RNG engine...');
    const engine = createRNGEngine({
        targetRate: 1.0,
        bitsPerTrial: 200,
        highPrecisionTiming: true,
        qualityMonitoring: true
    });
    console.log('   Engine created successfully');
    console.log();

    // 3. Generate sample trials
    console.log('3. Generating sample RNG trials...');
    const sampleTrials = [];

    for (let i = 0; i < 10; i++) {
        const trial = engine.generateTrial();
        sampleTrials.push(trial);

        console.log(`   Trial ${i + 1}:`);
        console.log(`     Value: ${trial.trialValue} (out of 200)`);
        console.log(`     Timestamp: ${formatTimestamp(trial.timestamp, true)}`);
        console.log(`     Session ID: ${trial.sessionId.substring(0, 8)}...`);
        console.log(`     Mode: ${trial.experimentMode}`);
        console.log(`     Intention: ${trial.intention || 'none'}`);
        console.log();
    }

    // 4. Basic statistics
    console.log('4. Basic statistics for sample trials:');
    const stats = calculateBasicStats(sampleTrials);
    console.log(`   Trial count: ${stats.trialCount}`);
    console.log(`   Mean: ${stats.mean.toFixed(2)} (expected: 100.00)`);
    console.log(`   Standard deviation: ${stats.standardDeviation.toFixed(2)} (expected: ~7.07)`);
    console.log(`   Min value: ${stats.min}`);
    console.log(`   Max value: ${stats.max}`);
    console.log();

    // 5. Run calibration
    console.log('5. Running calibration with 100 trials...');
    const calibration = await engine.runCalibration(100);
    console.log(`   Calibration ID: ${calibration.id.substring(0, 8)}...`);
    console.log(`   Trial count: ${calibration.trialCount}`);
    console.log(`   Duration: ${(calibration.endTime.getTime() - calibration.startTime.getTime())}ms`);
    console.log(`   Mean: ${calibration.statistics.mean.toFixed(2)}`);
    console.log(`   Z-score: ${calibration.statistics.zScore.toFixed(3)}`);
    console.log(`   P-value: ${calibration.statistics.pValue.toFixed(6)}`);
    console.log(`   Quality passed: ${calibration.passed}`);
    console.log(`   Issues: ${calibration.issues.length > 0 ? calibration.issues.join(', ') : 'None'}`);
    console.log();

    // 6. Demonstrate continuous generation
    console.log('6. Testing continuous generation (3 seconds)...');

    const receivedTrials: any[] = [];
    engine.addTrialListener((trial) => {
        receivedTrials.push(trial);
        console.log(`   Continuous trial ${trial.trialNumber}: value=${trial.trialValue}, time=${formatTimestamp(trial.timestamp, true)}`);
    });

    engine.startContinuous(undefined, 'continuous', 'baseline');

    // Let it run for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    engine.stopContinuous();
    console.log(`   Generated ${receivedTrials.length} trials in continuous mode`);
    console.log();

    // 7. Engine status
    console.log('7. Final engine status:');
    const status = engine.getStatus();
    console.log(`   Total trials generated: ${status.totalTrials}`);
    console.log(`   Memory usage: ${status.memoryUsage.current}MB (peak: ${status.memoryUsage.peak}MB)`);
    console.log(`   Timing accuracy: avg error ${status.timingMetrics.averageError.toFixed(2)}ms`);
    console.log();

    // 8. Clean up
    console.log('8. Cleaning up...');
    engine.destroy();
    console.log('   Engine destroyed');
    console.log();

    console.log('=== Demo Complete ===');
}

/**
 * Generate and display sample RNG trials
 */
export function generateSampleTrials(count: number = 5): void {
    console.log(`\n=== Sample RNG Trials (${count} trials) ===`);

    const engine = createRNGEngine();

    for (let i = 0; i < count; i++) {
        const trial = engine.generateTrial();

        console.log(`\nTrial ${i + 1}:`);
        console.log(`  Timestamp: ${trial.timestamp.toISOString()}`);
        console.log(`  Trial Value: ${trial.trialValue}/200 bits`);
        console.log(`  Session ID: ${trial.sessionId}`);
        console.log(`  Experiment Mode: ${trial.experimentMode}`);
        console.log(`  Intention: ${trial.intention || 'null'}`);
        console.log(`  Trial Number: ${trial.trialNumber}`);
    }

    engine.destroy();
    console.log('\n=== End Sample Trials ===\n');
}

// Run demo if this file is executed directly
if (require.main === module) {
    demonstrateRNGEngine().catch(console.error);
}