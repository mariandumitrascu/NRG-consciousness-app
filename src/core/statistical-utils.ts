/**
 * Statistical Utilities for RNG Consciousness Analysis
 * Implements core statistical functions used in PEAR and GCP research
 */

export class StatisticalUtils {

    // Constants for statistical calculations
    private static readonly SQRT_2PI = Math.sqrt(2 * Math.PI);
    private static readonly LOG_SQRT_2PI = Math.log(StatisticalUtils.SQRT_2PI);

    /**
     * Calculate chi-square probability (right-tail)
     * Uses series expansion for accurate computation
     */
    static chiSquareProbability(x: number, df: number): number {
        if (x < 0 || df <= 0) return NaN;
        if (x === 0) return 1;

        // For large df, use normal approximation
        if (df > 100) {
            const z = Math.sqrt(2 * x) - Math.sqrt(2 * df - 1);
            return 1 - this.normalCdf(z);
        }

        return this.incompleteGamma(df / 2, x / 2);
    }

    /**
     * Standard normal cumulative distribution function
     * Uses high-precision approximation
     */
    static normalCdf(z: number): number {
        if (z < -6) return 0;
        if (z > 6) return 1;

        // Abramowitz and Stegun approximation
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

        return z > 0 ? 1 - p : p;
    }

    /**
     * Two-tailed p-value from z-score
     */
    static normalProbability(z: number): number {
        return 2 * (1 - this.normalCdf(Math.abs(z)));
    }

    /**
     * Alias for normalCdf for backward compatibility
     */
    static normalCDF(z: number): number {
        return this.normalCdf(z);
    }

    /**
     * One-tailed p-value from z-score
     */
    static normalProbabilityOneTailed(z: number): number {
        return 1 - this.normalCdf(z);
    }

    /**
     * T-distribution probability (two-tailed)
     */
    static tDistributionProbability(t: number, df: number): number {
        if (df <= 0) return NaN;
        if (df > 1000) return this.normalProbability(t); // Use normal approximation

        const x = df / (df + t * t);
        const p = 0.5 * this.incompleteBeta(df / 2, 0.5, x);
        return 2 * p;
    }

    /**
     * Calculate confidence interval for mean
     */
    static calculateConfidenceInterval(
        mean: number,
        std: number,
        n: number,
        confidence: number = 0.95
    ): [number, number] {
        if (n <= 1) return [mean, mean];

        const alpha = 1 - confidence;
        const standardError = std / Math.sqrt(n);

        let criticalValue: number;
        if (n >= 30) {
            // Use normal distribution for large samples
            criticalValue = this.normalInverse(1 - alpha / 2);
        } else {
            // Use t-distribution for small samples
            criticalValue = this.tInverse(1 - alpha / 2, n - 1);
        }

        const margin = criticalValue * standardError;
        return [mean - margin, mean + margin];
    }

    /**
     * Cohen's d effect size
     */
    static cohensD(mean1: number, mean2: number, pooledStd: number): number {
        if (pooledStd === 0) return 0;
        return (mean1 - mean2) / pooledStd;
    }

    /**
     * Hedges' g effect size (bias-corrected Cohen's d)
     */
    static hedgesG(mean1: number, mean2: number, pooledStd: number, n1: number, n2: number): number {
        const d = this.cohensD(mean1, mean2, pooledStd);
        const df = n1 + n2 - 2;
        const correction = 1 - (3 / (4 * df - 1));
        return d * correction;
    }

    /**
     * Calculate pooled standard deviation
     */
    static pooledStandardDeviation(std1: number, n1: number, std2: number, n2: number): number {
        const var1 = std1 * std1;
        const var2 = std2 * std2;
        const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
        return Math.sqrt(pooledVar);
    }

    /**
     * Point-biserial correlation coefficient
     */
    static pointBiserialCorrelation(values: number[], groups: boolean[]): number {
        if (values.length !== groups.length) return NaN;

        const group1Values = values.filter((_, i) => groups[i]);
        const group0Values = values.filter((_, i) => !groups[i]);

        if (group1Values.length === 0 || group0Values.length === 0) return 0;

        const mean1 = this.mean(group1Values);
        const mean0 = this.mean(group0Values);
        const stdTotal = this.standardDeviation(values);
        const n = values.length;
        const n1 = group1Values.length;
        const n0 = group0Values.length;

        return ((mean1 - mean0) / stdTotal) * Math.sqrt((n1 * n0) / (n * n));
    }

    /**
     * Bonferroni correction for multiple comparisons
     */
    static bonferroniCorrection(pValues: number[]): number[] {
        const m = pValues.length;
        return pValues.map(p => Math.min(p * m, 1));
    }

    /**
     * Benjamini-Hochberg False Discovery Rate correction
     */
    static benjaminiHochbergCorrection(pValues: number[]): number[] {
        const m = pValues.length;
        const indexed = pValues.map((p, i) => ({ p, i }))
            .sort((a, b) => a.p - b.p);

        const corrected = new Array(m);

        // Apply BH correction from largest to smallest p-value
        for (let k = m - 1; k >= 0; k--) {
            const rank = k + 1;
            const bhValue = indexed[k].p * m / rank;

            if (k === m - 1) {
                corrected[indexed[k].i] = Math.min(bhValue, 1);
            } else {
                corrected[indexed[k].i] = Math.min(bhValue, corrected[indexed[k + 1].i]);
            }
        }

        return corrected;
    }

    /**
     * Holm step-down correction
     */
    static holmCorrection(pValues: number[]): number[] {
        const m = pValues.length;
        const indexed = pValues.map((p, i) => ({ p, i }))
            .sort((a, b) => a.p - b.p);

        const corrected = new Array(m);

        for (let k = 0; k < m; k++) {
            const holmValue = indexed[k].p * (m - k);

            if (k === 0) {
                corrected[indexed[k].i] = Math.min(holmValue, 1);
            } else {
                corrected[indexed[k].i] = Math.min(holmValue, Math.max(corrected[indexed[k - 1].i], holmValue));
            }
        }

        return corrected;
    }

    /**
     * Power analysis for one-sample t-test
     */
    static powerAnalysis(effectSize: number, n: number, alpha: number = 0.05): number {
        const df = n - 1;
        const criticalT = this.tInverse(1 - alpha / 2, df);
        const ncp = effectSize * Math.sqrt(n); // Non-centrality parameter

        // Approximate power using non-central t-distribution
        return 1 - this.nonCentralTCdf(criticalT, df, ncp) + this.nonCentralTCdf(-criticalT, df, ncp);
    }

    /**
     * Sample size calculation for desired power
     */
    static requiredSampleSize(effectSize: number, power: number = 0.8, alpha: number = 0.05): number {
        if (effectSize === 0) return Infinity;

        const zAlpha = this.normalInverse(1 - alpha / 2);
        const zBeta = this.normalInverse(power);

        return Math.ceil(Math.pow(zAlpha + zBeta, 2) / (effectSize * effectSize));
    }

    /**
     * Minimum detectable effect size
     */
    static minimumDetectableEffect(n: number, power: number = 0.8, alpha: number = 0.05): number {
        const zAlpha = this.normalInverse(1 - alpha / 2);
        const zBeta = this.normalInverse(power);

        return (zAlpha + zBeta) / Math.sqrt(n);
    }

    // Helper statistical functions

    static mean(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, x) => sum + x, 0) / values.length;
    }

    static variance(values: number[], sample: boolean = true): number {
        if (values.length <= 1) return 0;

        const m = this.mean(values);
        const sumSquaredDeviations = values.reduce((sum, x) => sum + (x - m) * (x - m), 0);
        const denominator = sample ? values.length - 1 : values.length;

        return sumSquaredDeviations / denominator;
    }

    static standardDeviation(values: number[], sample: boolean = true): number {
        return Math.sqrt(this.variance(values, sample));
    }

    static skewness(values: number[]): number {
        if (values.length < 3) return 0;

        const m = this.mean(values);
        const s = this.standardDeviation(values);
        const n = values.length;

        const sumCubedDeviations = values.reduce((sum, x) => sum + Math.pow((x - m) / s, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sumCubedDeviations;
    }

    static kurtosis(values: number[]): number {
        if (values.length < 4) return 0;

        const m = this.mean(values);
        const s = this.standardDeviation(values);
        const n = values.length;

        const sumQuartedDeviations = values.reduce((sum, x) => sum + Math.pow((x - m) / s, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumQuartedDeviations -
            (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    }

    /**
     * Jarque-Bera normality test
     */
    static jarqueBeraTest(values: number[]): { statistic: number; pValue: number; isNormal: boolean } {
        const n = values.length;
        const s = this.skewness(values);
        const k = this.kurtosis(values);

        const jb = (n / 6) * (s * s + (k * k) / 4);
        const pValue = this.chiSquareProbability(jb, 2);

        return {
            statistic: jb,
            pValue,
            isNormal: pValue > 0.05
        };
    }

    /**
     * Runs test for randomness
     */
    static runsTest(values: number[]): { statistic: number; pValue: number; isRandom: boolean } {
        if (values.length < 2) return { statistic: 0, pValue: 1, isRandom: true };

        const median = this.median(values);
        const signs = values.map(x => x > median ? 1 : 0);

        // Count runs
        let runs = 1;
        for (let i = 1; i < signs.length; i++) {
            if (signs[i] !== signs[i - 1]) runs++;
        }

        const n1 = signs.filter(x => x === 1).length;
        const n2 = signs.filter(x => x === 0).length;
        const n = n1 + n2;

        if (n1 === 0 || n2 === 0) return { statistic: 0, pValue: 1, isRandom: true };

        const expectedRuns = (2 * n1 * n2) / n + 1;
        const varianceRuns = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));

        const z = Math.abs(runs - expectedRuns) / Math.sqrt(varianceRuns);
        const pValue = this.normalProbability(z);

        return {
            statistic: z,
            pValue,
            isRandom: pValue > 0.05
        };
    }

    static median(values: number[]): number {
        if (values.length === 0) return 0;

        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    // Advanced probability function implementations

    /**
     * Normal distribution inverse (quantile function)
     * Uses Beasley-Springer-Moro algorithm for high precision
     */
    static normalInverse(p: number): number {
        if (p <= 0 || p >= 1) return NaN;
        if (p < 0.5) return -this.normalInverse(1 - p);

        // Constants for the Beasley-Springer-Moro algorithm
        const a = [
            0, -3.969683028665376e+01, 2.209460984245205e+02,
            -2.759285104469687e+02, 1.383577518672690e+02,
            -3.066479806614716e+01, 2.506628277459239e+00
        ];

        const b = [
            0, -5.447609879822406e+01, 1.615858368580409e+02,
            -1.556989798598866e+02, 6.680131188771972e+01,
            -1.328068155288572e+01
        ];

        const c = [
            0, -7.784894002430293e-03, -3.223964580411365e-01,
            -2.400758277161838e+00, -2.549732539343734e+00,
            4.374664141464968e+00, 2.938163982698783e+00
        ];

        const d = [
            0, 7.784695709041462e-03, 3.224671290700398e-01,
            2.445134137142996e+00, 3.754408661907416e+00
        ];

        const pLow = 0.02425;
        const pHigh = 1 - pLow;

        let q, r;

        if (0 < p && p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
                ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
        }

        if (pLow <= p && p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            return (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q /
                (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
        }

        if (pHigh < p && p < 1) {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
                ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
        }

        return NaN;
    }

    private static tInverse(p: number, df: number): number {
        if (df > 1000) return this.normalInverse(p);

        // Approximation for t-distribution inverse
        const z = this.normalInverse(p);
        const a = z * z * z * z;
        const b = z * z;

        const correction = (b + 1) / (4 * df) +
            (5 * a + 16 * b + 3) / (96 * df * df) +
            (3 * a * b + 19 * a + 17 * b - 15) / (384 * df * df * df);

        return z + z * correction;
    }

    private static incompleteGamma(a: number, x: number): number {
        // Regularized incomplete gamma function approximation
        if (x < 0 || a <= 0) return NaN;
        if (x === 0) return 1;

        // Use continued fraction for better accuracy
        return 1 - this.gammaIncomplete(a, x) / this.gamma(a);
    }

    private static gammaIncomplete(a: number, x: number): number {
        // Simple series approximation
        let sum = 0;
        let term = 1;

        for (let n = 0; n < 100; n++) {
            sum += term;
            term *= x / (a + n);
            if (Math.abs(term) < 1e-15) break;
        }

        return Math.pow(x, a) * Math.exp(-x) * sum;
    }

    private static gamma(z: number): number {
        // Stirling's approximation for gamma function
        if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));

        z -= 1;
        const x = 0.99999999999980993 +
            676.5203681218851 / (z + 1) -
            1259.1392167224028 / (z + 2) +
            771.32342877765313 / (z + 3) -
            176.61502916214059 / (z + 4) +
            12.507343278686905 / (z + 5) -
            0.13857109526572012 / (z + 6) +
            9.9843695780195716e-6 / (z + 7) +
            1.5056327351493116e-7 / (z + 8);

        const t = z + 7.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }

    private static incompleteBeta(a: number, b: number, x: number): number {
        // Regularized incomplete beta function approximation
        if (x < 0 || x > 1) return NaN;
        if (x === 0) return 0;
        if (x === 1) return 1;

        // Use continued fraction method
        const bt = Math.exp(this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
            a * Math.log(x) + b * Math.log(1 - x));

        if (x < (a + 1) / (a + b + 2)) {
            return bt * this.betacf(a, b, x) / a;
        } else {
            return 1 - bt * this.betacf(b, a, 1 - x) / b;
        }
    }

    private static logGamma(z: number): number {
        return Math.log(this.gamma(z));
    }

    private static betacf(a: number, b: number, x: number): number {
        // Continued fraction for incomplete beta function
        const qab = a + b;
        const qap = a + 1;
        const qam = a - 1;
        let c = 1;
        let d = 1 - qab * x / qap;

        if (Math.abs(d) < 1e-30) d = 1e-30;
        d = 1 / d;
        let h = d;

        for (let m = 1; m <= 100; m++) {
            const m2 = 2 * m;
            let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1 + aa * d;
            if (Math.abs(d) < 1e-30) d = 1e-30;
            c = 1 + aa / c;
            if (Math.abs(c) < 1e-30) c = 1e-30;
            d = 1 / d;
            h *= d * c;

            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1 + aa * d;
            if (Math.abs(d) < 1e-30) d = 1e-30;
            c = 1 + aa / c;
            if (Math.abs(c) < 1e-30) c = 1e-30;
            d = 1 / d;
            const del = d * c;
            h *= del;

            if (Math.abs(del - 1) < 1e-15) break;
        }

        return h;
    }

    private static nonCentralTCdf(t: number, df: number, ncp: number): number {
        // Approximation for non-central t-distribution CDF
        // This is a simplified approximation - for production use, consider a more accurate implementation
        const standardized = (t - ncp) / Math.sqrt(1 + ncp * ncp / df);
        return this.normalCdf(standardized);
    }

    /**
     * Complementary error function (erfc)
     * Used in statistical calculations for normal distributions
     */
    static erfc(x: number): number {
        // For large positive x, erfc approaches 0
        if (x > 6) return 0;
        if (x < -6) return 2;

        // Use the relationship: erfc(x) = 2 * (1 - normalCdf(x * sqrt(2)))
        const z = x * Math.sqrt(2);
        return 2 * (1 - this.normalCdf(z));
    }

    /**
     * Error function (erf)
     * Implemented using erfc: erf(x) = 1 - erfc(x)
     */
    static erf(x: number): number {
        return 1 - this.erfc(x);
    }
}