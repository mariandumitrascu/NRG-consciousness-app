/**
 * Simple test of the RNG Engine
 * Shows sample RNG trials and basic functionality
 */

import { createRNGEngine, verifyCryptoSupport } from './rng-engine';
import { calculateBasicStats } from './statistics';

console.log('=== RNG Engine Phase 1 Test ===\n');

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
    console.log('❌ Cannot proceed without crypto support.');
    process.exit(1);
}

// 2. Create engine
console.log('2. Creating RNG engine...');
const engine = createRNGEngine();
console.log('   ✅ Engine created successfully');
console.log();

// 3. Generate sample trials
console.log('3. Generating sample RNG trials:');
const trials = [];

for (let i = 0; i < 5; i++) {
    const trial = engine.generateTrial();
    trials.push(trial);

    console.log(`   Trial ${trial.trialNumber}:`);
    console.log(`     • Value: ${trial.trialValue}/200 bits`);
    console.log(`     • Timestamp: ${trial.timestamp.toISOString()}`);
    console.log(`     • Session ID: ${trial.sessionId.substring(0, 8)}...`);
    console.log(`     • Mode: ${trial.experimentMode}`);
    console.log(`     • Intention: ${trial.intention || 'null'}`);
    console.log();
}

// 4. Basic statistics
console.log('4. Statistical summary:');
const stats = calculateBasicStats(trials);
console.log(`   • Trial count: ${stats.trialCount}`);
console.log(`   • Mean: ${stats.mean.toFixed(2)} (expected: ~100.00)`);
console.log(`   • Standard deviation: ${stats.standardDeviation.toFixed(2)}`);
console.log(`   • Range: ${stats.min} - ${stats.max}`);
console.log();

// 5. Validate trials are in expected range
const validTrials = trials.every(t => t.trialValue >= 0 && t.trialValue <= 200);
console.log(`5. Validation: ${validTrials ? '✅ All trials valid' : '❌ Some trials invalid'}`);

console.log('\n=== Phase 1 Complete ===');
console.log('✅ Core RNG Engine and Data Models successfully implemented!');

// Clean up
engine.destroy();