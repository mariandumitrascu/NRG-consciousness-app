import { CalibrationManager, CalibrationResult, ExtendedCalibrationResult } from '../../main/calibration/CalibrationManager';
import { RandomnessValidator, RandomnessTestSuite } from '../../main/calibration/RandomnessValidator';
import { BaselineEstimator, BaselineResult } from '../../main/calibration/BaselineEstimator';
import { QualityController, QualityReport } from '../../core/quality-control/QualityController';

interface CalibrationDemo {
    runBasicCalibration(): Promise<CalibrationResult>;
    runExtendedCalibration(): Promise<ExtendedCalibrationResult>;
    runRandomnessTests(): Promise<RandomnessTestSuite>;
    runQualityAssessment(): Promise<QualityReport>;
    generateValidationReport(): Promise<ValidationReport>;
}

interface ValidationReport {
    timestamp: Date;
    systemInfo: SystemInfo;
    calibrationResults: CalibrationResult;
    randomnessTests: RandomnessTestSuite;
    qualityAssessment: QualityReport;
    baselineAnalysis: BaselineResult;
    overallAssessment: OverallAssessment;
    recommendations: string[];
    certification: CertificationInfo;
}

interface SystemInfo {
    platform: string;
    nodeVersion: string;
    appVersion: string;
    calibrationVersion: string;
    timestamp: Date;
}

interface OverallAssessment {
    overallScore: number;
    status: 'certified' | 'conditionally_certified' | 'not_certified';
    rngQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'failed';
    scientificValidity: 'high' | 'medium' | 'low';
    recommendedUse: string[];
    limitations: string[];
}

interface CertificationInfo {
    certified: boolean;
    certificationLevel: 'research_grade' | 'educational' | 'experimental' | 'not_certified';
    validUntil?: Date;
    certificationAuthority: string;
    standards: string[];
}

export class CalibrationDemoRunner implements CalibrationDemo {
    private calibrationManager: CalibrationManager;
    private randomnessValidator: RandomnessValidator;
    private baselineEstimator: BaselineEstimator;
    private qualityController: QualityController;

    constructor() {
        this.calibrationManager = new CalibrationManager();
        this.randomnessValidator = new RandomnessValidator();
        this.baselineEstimator = new BaselineEstimator();
        this.qualityController = new QualityController();
    }

    async runBasicCalibration(): Promise<CalibrationResult> {
        console.log('🔧 Starting Basic Calibration...');
        console.log('📊 Generating 100,000 random bits for testing...');

        const result = await this.calibrationManager.runStandardCalibration(100000);

        console.log('\n✅ Basic Calibration Complete!');
        console.log(`📈 RNG Health: ${result.rngHealth.toFixed(1)}%`);
        console.log(`🎯 Test Pass Rate: ${result.passRate.toFixed(1)}%`);
        console.log(`⭐ Quality Rating: ${result.quality.toUpperCase()}`);
        console.log(`⏱️  Duration: ${this.formatDuration(result.duration)}`);

        console.log('\n📋 Baseline Statistics:');
        console.log(`   Mean: ${result.baseline.mean.toFixed(6)} (expected: 0.500000)`);
        console.log(`   Variance: ${result.baseline.variance.toFixed(6)} (expected: 0.250000)`);
        console.log(`   Std Dev: ${result.baseline.standardDeviation.toFixed(6)} (expected: 0.500000)`);

        if (result.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            result.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }

        return result;
    }

    async runExtendedCalibration(): Promise<ExtendedCalibrationResult> {
        console.log('\n🔧 Starting Extended Calibration (1 hour simulation)...');

        // For demo purposes, we'll simulate a shorter version
        const result = await this.calibrationManager.runExtendedCalibration(0.1); // 6 minutes

        console.log('\n✅ Extended Calibration Complete!');
        console.log(`📈 RNG Health: ${result.rngHealth.toFixed(1)}%`);
        console.log(`🎯 Test Pass Rate: ${result.passRate.toFixed(1)}%`);
        console.log(`⭐ Quality Rating: ${result.quality.toUpperCase()}`);
        console.log(`⏱️  Duration: ${this.formatDuration(result.duration)}`);
        console.log(`📊 Long-term Drift: ${result.longTermDrift.toFixed(8)}`);
        console.log(`🔄 Next Calibration Due: ${result.nextCalibrationDue.toLocaleDateString()}`);

        console.log('\n🌡️ Environmental Correlations:');
        for (const [factor, correlation] of result.environmentalCorrelations) {
            console.log(`   ${factor}: ${correlation.toFixed(6)}`);
        }

        if (result.degradationIndicators.length > 0) {
            console.log('\n⚠️  Degradation Indicators:');
            result.degradationIndicators.forEach(indicator => console.log(`   • ${indicator}`));
        }

        return result;
    }

    async runRandomnessTests(): Promise<RandomnessTestSuite> {
        console.log('\n🧪 Running Comprehensive Randomness Tests...');

        // Generate test data
        const testData: number[] = [];
        for (let i = 0; i < 50000; i++) {
            testData.push(Math.random() > 0.5 ? 1 : 0);
        }

        const results = await this.randomnessValidator.runFullTestSuite(testData);

        console.log('\n✅ Randomness Tests Complete!');
        console.log(`📊 Overall Quality: ${results.overallQuality.toFixed(1)}%`);
        console.log(`💬 Recommendation: ${results.recommendation}`);

        console.log('\n🔬 NIST SP 800-22 Results:');
        let nistPassed = 0;
        for (const [testName, result] of results.nist.results) {
            const status = result.passed ? '✅' : '❌';
            console.log(`   ${status} ${testName}: p=${result.pValue.toFixed(4)}`);
            if (result.passed) nistPassed++;
        }
        console.log(`   Overall: ${nistPassed}/${results.nist.results.size} tests passed`);

        console.log('\n🎲 DIEHARD Test Results:');
        const diehardPassed = results.diehard.results.filter(r => r.passed).length;
        console.log(`   ${diehardPassed}/${results.diehard.results.length} tests passed`);

        console.log('\n📊 ENT Test Results:');
        console.log(`   Entropy: ${results.ent.entropy.toFixed(4)} bits/byte`);
        console.log(`   Compression: ${(results.ent.compression * 100).toFixed(1)}%`);
        const entPassed = results.ent.results.filter(r => r.passed).length;
        console.log(`   ${entPassed}/${results.ent.results.length} tests passed`);

        console.log('\n🔗 Autocorrelation Results:');
        console.log(`   Lag 1: ${results.autocorrelation.lag1.toFixed(6)}`);
        console.log(`   Lag 5: ${results.autocorrelation.lag5.toFixed(6)}`);
        console.log(`   Lag 10: ${results.autocorrelation.lag10.toFixed(6)}`);
        console.log(`   Status: ${results.autocorrelation.passed ? '✅ Passed' : '❌ Failed'}`);

        return results;
    }

    async runQualityAssessment(): Promise<QualityReport> {
        console.log('\n🎯 Running Quality Assessment...');

        const report = await this.qualityController.monitorDataQuality();

        console.log('\n✅ Quality Assessment Complete!');
        console.log(`📊 Overall Score: ${report.overallScore.toFixed(1)}%`);
        console.log(`📈 Status: ${report.status.toUpperCase()}`);
        console.log(`🔧 Data Integrity: ${report.dataIntegrity.toFixed(1)}%`);
        console.log(`📋 Statistical Validity: ${report.statisticalValidity.toFixed(1)}%`);

        if (report.metrics.length > 0) {
            console.log('\n📊 Quality Metrics:');
            report.metrics.forEach(metric => {
                const status = this.getStatusIcon(metric.status);
                console.log(`   ${status} ${metric.name}: ${metric.value.toFixed(6)} (threshold: ${metric.threshold})`);
            });
        }

        if (report.anomalies.length > 0) {
            console.log('\n⚠️  Anomalies Detected:');
            report.anomalies.forEach(anomaly => {
                const severity = this.getSeverityIcon(anomaly.severity);
                console.log(`   ${severity} ${anomaly.type}: ${anomaly.description}`);
            });
        }

        if (report.recommendations.length > 0) {
            console.log('\n💡 Quality Recommendations:');
            report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }

        return report;
    }

    async generateValidationReport(): Promise<ValidationReport> {
        console.log('\n📄 Generating Comprehensive Validation Report...');

        // Run all tests
        const calibrationResults = await this.runBasicCalibration();
        const randomnessTests = await this.runRandomnessTests();
        const qualityAssessment = await this.runQualityAssessment();

        // Generate baseline analysis
        const testData: number[] = [];
        for (let i = 0; i < 10000; i++) {
            testData.push(Math.random() > 0.5 ? 1 : 0);
        }
        const baselineAnalysis = await this.baselineEstimator.calculateBaseline(testData);

        // System information
        const systemInfo: SystemInfo = {
            platform: process.platform,
            nodeVersion: process.version,
            appVersion: '1.0.0',
            calibrationVersion: '1.0.0',
            timestamp: new Date()
        };

        // Overall assessment
        const overallScore = (
            calibrationResults.rngHealth * 0.4 +
            randomnessTests.overallQuality * 0.3 +
            qualityAssessment.overallScore * 0.3
        );

        const overallAssessment: OverallAssessment = {
            overallScore,
            status: this.determineOverallStatus(overallScore, calibrationResults, randomnessTests),
            rngQuality: this.determineRNGQuality(overallScore),
            scientificValidity: this.determineScientificValidity(randomnessTests, qualityAssessment),
            recommendedUse: this.getRecommendedUse(overallScore, calibrationResults),
            limitations: this.getLimitations(calibrationResults, randomnessTests, qualityAssessment)
        };

        // Certification information
        const certification: CertificationInfo = {
            certified: overallScore >= 80,
            certificationLevel: this.determineCertificationLevel(overallScore),
            validUntil: overallScore >= 80 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined,
            certificationAuthority: 'RNG Consciousness Research Validation System',
            standards: ['NIST SP 800-22', 'DIEHARD', 'ENT', 'Custom Consciousness Research Standards']
        };

        const validationReport: ValidationReport = {
            timestamp: new Date(),
            systemInfo,
            calibrationResults,
            randomnessTests,
            qualityAssessment,
            baselineAnalysis,
            overallAssessment,
            recommendations: this.generateOverallRecommendations(calibrationResults, randomnessTests, qualityAssessment),
            certification
        };

        this.printValidationReport(validationReport);

        return validationReport;
    }

    private printValidationReport(report: ValidationReport): void {
        console.log('\n' + '='.repeat(80));
        console.log('🏆 COMPREHENSIVE VALIDATION REPORT');
        console.log('='.repeat(80));

        console.log('\n📋 SYSTEM INFORMATION');
        console.log(`Platform: ${report.systemInfo.platform}`);
        console.log(`Node.js: ${report.systemInfo.nodeVersion}`);
        console.log(`App Version: ${report.systemInfo.appVersion}`);
        console.log(`Report Generated: ${report.timestamp.toLocaleString()}`);

        console.log('\n📊 OVERALL ASSESSMENT');
        console.log(`Overall Score: ${report.overallAssessment.overallScore.toFixed(1)}%`);
        console.log(`Status: ${report.overallAssessment.status.toUpperCase()}`);
        console.log(`RNG Quality: ${report.overallAssessment.rngQuality.toUpperCase()}`);
        console.log(`Scientific Validity: ${report.overallAssessment.scientificValidity.toUpperCase()}`);

        console.log('\n🏅 CERTIFICATION STATUS');
        console.log(`Certified: ${report.certification.certified ? '✅ YES' : '❌ NO'}`);
        console.log(`Level: ${report.certification.certificationLevel.toUpperCase()}`);
        if (report.certification.validUntil) {
            console.log(`Valid Until: ${report.certification.validUntil.toLocaleDateString()}`);
        }

        console.log('\n✅ RECOMMENDED USE CASES');
        report.overallAssessment.recommendedUse.forEach(use => {
            console.log(`   • ${use}`);
        });

        console.log('\n⚠️  LIMITATIONS');
        report.overallAssessment.limitations.forEach(limitation => {
            console.log(`   • ${limitation}`);
        });

        console.log('\n💡 FINAL RECOMMENDATIONS');
        report.recommendations.forEach(rec => {
            console.log(`   • ${rec}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('🎉 PHASE 9 CALIBRATION & VALIDATION COMPLETE!');
        console.log('='.repeat(80));
    }

    // Utility methods
    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'excellent': return '🟢';
            case 'good': return '🟡';
            case 'warning': return '🟠';
            case 'critical': return '🔴';
            default: return '⚪';
        }
    }

    private getSeverityIcon(severity: string): string {
        switch (severity) {
            case 'low': return '🟢';
            case 'medium': return '🟡';
            case 'high': return '🟠';
            case 'critical': return '🔴';
            default: return '⚪';
        }
    }

    private determineOverallStatus(score: number, calibration: CalibrationResult, randomness: RandomnessTestSuite): 'certified' | 'conditionally_certified' | 'not_certified' {
        if (score >= 90 && calibration.quality === 'excellent' && randomness.overallQuality >= 90) {
            return 'certified';
        } else if (score >= 70 && calibration.quality !== 'failed') {
            return 'conditionally_certified';
        } else {
            return 'not_certified';
        }
    }

    private determineRNGQuality(score: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'failed' {
        if (score >= 95) return 'excellent';
        if (score >= 85) return 'good';
        if (score >= 70) return 'acceptable';
        if (score >= 50) return 'poor';
        return 'failed';
    }

    private determineScientificValidity(randomness: RandomnessTestSuite, quality: QualityReport): 'high' | 'medium' | 'low' {
        if (randomness.overallQuality >= 90 && quality.statisticalValidity >= 90) {
            return 'high';
        } else if (randomness.overallQuality >= 70 && quality.statisticalValidity >= 70) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    private determineCertificationLevel(score: number): 'research_grade' | 'educational' | 'experimental' | 'not_certified' {
        if (score >= 95) return 'research_grade';
        if (score >= 85) return 'educational';
        if (score >= 70) return 'experimental';
        return 'not_certified';
    }

    private getRecommendedUse(score: number, calibration: CalibrationResult): string[] {
        const uses: string[] = [];

        if (score >= 95) {
            uses.push('Publication-quality consciousness research');
            uses.push('Peer-reviewed scientific studies');
            uses.push('Replication of PEAR laboratory experiments');
        }

        if (score >= 85) {
            uses.push('Educational consciousness research');
            uses.push('Preliminary studies and pilot research');
            uses.push('Training and methodology development');
        }

        if (score >= 70) {
            uses.push('Personal exploration and learning');
            uses.push('Methodology testing and development');
            uses.push('Educational demonstrations');
        }

        if (score >= 50) {
            uses.push('System testing and calibration');
            uses.push('Algorithm development');
        }

        if (uses.length === 0) {
            uses.push('System requires recalibration before use');
        }

        return uses;
    }

    private getLimitations(calibration: CalibrationResult, randomness: RandomnessTestSuite, quality: QualityReport): string[] {
        const limitations: string[] = [];

        if (calibration.rngHealth < 90) {
            limitations.push('RNG health below optimal - monitor for degradation');
        }

        if (randomness.overallQuality < 90) {
            limitations.push('Some randomness tests show suboptimal results');
        }

        if (quality.dataIntegrity < 95) {
            limitations.push('Data integrity monitoring recommended');
        }

        if (calibration.quality === 'poor' || calibration.quality === 'failed') {
            limitations.push('System requires immediate attention and recalibration');
        }

        if (limitations.length === 0) {
            limitations.push('No significant limitations detected');
        }

        return limitations;
    }

    private generateOverallRecommendations(calibration: CalibrationResult, randomness: RandomnessTestSuite, quality: QualityReport): string[] {
        const recommendations: string[] = [];

        // Add calibration recommendations
        recommendations.push(...calibration.recommendations);

        // Add quality recommendations
        recommendations.push(...quality.recommendations);

        // Add randomness recommendations
        recommendations.push(randomness.recommendation);

        // Add general recommendations
        if (calibration.rngHealth >= 95 && randomness.overallQuality >= 95) {
            recommendations.push('System is operating at optimal levels - suitable for research use');
        }

        if (calibration.passRate < 90) {
            recommendations.push('Consider running extended calibration for better assessment');
        }

        recommendations.push('Schedule periodic calibrations to maintain system quality');
        recommendations.push('Monitor system performance during active research sessions');

        return [...new Set(recommendations)]; // Remove duplicates
    }
}

// Demo execution function
export async function runCalibrationDemo(): Promise<void> {
    const demo = new CalibrationDemoRunner();

    try {
        console.log('🚀 Starting RNG Consciousness App Calibration & Validation Demo');
        console.log('Phase 9: Comprehensive System Validation\n');

        // Run comprehensive validation
        await demo.generateValidationReport();

    } catch (error) {
        console.error('❌ Demo failed:', error);
        throw error;
    }
}

// Export for use in other parts of the application
export { CalibrationDemoRunner };