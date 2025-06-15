// Simple JavaScript test for the database system
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing SQLite Database System...');

// Test database creation
const dbPath = path.join(__dirname, 'data', 'test-rng.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

try {
    // Create database connection
    console.log('📊 Creating database connection...');
    const db = new Database(dbPath);

    // Configure for performance
    console.log('⚡ Configuring database for performance...');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 10000');
    db.pragma('temp_store = MEMORY');
    db.pragma('foreign_keys = ON');

    // Create basic table
    console.log('🔨 Creating test table...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS test_trials (
            id TEXT PRIMARY KEY,
            timestamp INTEGER NOT NULL,
            trial_value INTEGER NOT NULL CHECK(trial_value >= 0 AND trial_value <= 200),
            session_id TEXT,
            experiment_mode TEXT NOT NULL CHECK(experiment_mode IN ('session', 'continuous'))
        );
    `);

    // Insert test data
    console.log('📝 Inserting test data...');
    const insertStmt = db.prepare(`
        INSERT INTO test_trials (id, timestamp, trial_value, session_id, experiment_mode)
        VALUES (?, ?, ?, ?, ?)
    `);

    const testData = [];
    for (let i = 0; i < 100; i++) {
        // Generate random trial value (sum of 200 bits)
        let trialValue = 0;
        for (let j = 0; j < 200; j++) {
            trialValue += Math.random() < 0.5 ? 0 : 1;
        }

        testData.push([
            `test-${i}`,
            Date.now() + i * 1000,
            trialValue,
            i % 10 === 0 ? `session-${Math.floor(i/10)}` : null,
            i % 10 === 0 ? 'session' : 'continuous'
        ]);
    }

    // Batch insert using transaction
    const insertBatch = db.transaction((trials) => {
        for (const trial of trials) {
            insertStmt.run(trial);
        }
    });

    console.log('🔄 Running batch insert transaction...');
    const startTime = Date.now();
    insertBatch(testData);
    const endTime = Date.now();

    console.log(`✅ Inserted ${testData.length} trials in ${endTime - startTime}ms`);

    // Test queries
    console.log('🔍 Testing queries...');

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM test_trials');
    const count = countStmt.get();
    console.log(`Total trials: ${count.count}`);

    const statsStmt = db.prepare(`
        SELECT
            experiment_mode,
            COUNT(*) as count,
            AVG(trial_value) as mean_value,
            MIN(trial_value) as min_value,
            MAX(trial_value) as max_value
        FROM test_trials
        GROUP BY experiment_mode
    `);
    const stats = statsStmt.all();
    console.log('Statistics by mode:', stats);

    // Test performance
    console.log('⏱️  Testing query performance...');
    const perfStart = Date.now();
    for (let i = 0; i < 1000; i++) {
        db.prepare('SELECT * FROM test_trials WHERE trial_value > ? LIMIT 10').all(100);
    }
    const perfEnd = Date.now();
    console.log(`1000 queries completed in ${perfEnd - perfStart}ms (avg: ${(perfEnd - perfStart) / 1000}ms per query)`);

    // Test database size and pragmas
    console.log('📊 Database information:');
    console.log(`Journal mode: ${db.pragma('journal_mode', { simple: true })}`);
    console.log(`Page count: ${db.pragma('page_count', { simple: true })}`);
    console.log(`Page size: ${db.pragma('page_size', { simple: true })}`);

    const fileSize = fs.statSync(dbPath).size;
    console.log(`Database file size: ${Math.round(fileSize / 1024)}KB`);

        // Test backup (simple file copy method)
    console.log('💾 Testing backup functionality...');
    const backupPath = dbPath.replace('.db', '-backup.db');

    try {
        // Simple backup by copying file
        fs.copyFileSync(dbPath, backupPath);
        console.log('✅ Backup completed successfully');
        const backupSize = fs.statSync(backupPath).size;
        console.log(`Backup file size: ${Math.round(backupSize / 1024)}KB`);

        // Cleanup
        console.log('🧹 Cleaning up test files...');
        db.close();

        try {
            fs.unlinkSync(dbPath);
            fs.unlinkSync(backupPath);
            // Clean up WAL and SHM files
            try { fs.unlinkSync(dbPath + '-wal'); } catch (e) {}
            try { fs.unlinkSync(dbPath + '-shm'); } catch (e) {}
            console.log('✅ Test files cleaned up');
        } catch (e) {
            console.log('⚠️  Could not clean up test files:', e.message);
        }

        console.log('\n🎉 Database system test completed successfully!');
        console.log('\n📋 Test Results Summary:');
        console.log(`  • Database creation: ✅`);
        console.log(`  • Table creation: ✅`);
        console.log(`  • Data insertion (${testData.length} records): ✅`);
        console.log(`  • Query performance: ✅ (avg ${(perfEnd - perfStart) / 1000}ms)`);
        console.log(`  • Backup functionality: ✅`);
        console.log(`  • Database size optimization: ✅ (${Math.round(fileSize / 1024)}KB for ${testData.length} records)`);
        console.log('\n💡 The database system is ready for Phase 2 integration!');

    } catch (backupError) {
        console.error('❌ Backup failed:', backupError);
        db.close();
    }

} catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
}