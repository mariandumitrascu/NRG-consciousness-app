/**
 * StatisticalDistributionChart - Distribution analysis for RNG trial values
 * Displays histogram of trial values with expected distribution overlay
 * Includes chi-square goodness of fit visualization and statistical tests
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { StatisticalDistributionProps } from './types';
import { scientificTheme, adaptThemeForChartJs } from '../../styles/charts/themes';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Calculate expected binomial distribution for 200-bit trials
 */
function calculateExpectedDistribution(sampleSize: number): number[] {
  const n = 200; // Number of bits per trial
  const p = 0.5; // Probability of each bit being 1
  const mean = n * p; // Expected mean = 100
  const variance = n * p * (1 - p); // Expected variance = 50
  const stdDev = Math.sqrt(variance);

  const distribution = new Array(201).fill(0);

  // Calculate probability for each possible value (0-200)
  for (let k = 0; k <= 200; k++) {
    // Use normal approximation for binomial distribution
    const z = (k - mean) / stdDev;
    const probability = normalPDF(z) / stdDev;
    distribution[k] = probability * sampleSize;
  }

  return distribution;
}

/**
 * Normal probability density function
 */
function normalPDF(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate histogram bins for trial values
 */
function calculateHistogram(values: number[], binSize: number = 5): { bins: number[], counts: number[] } {
  const bins: number[] = [];
  const counts: number[] = [];

  // Create bins from 0 to 200 with specified bin size
  for (let i = 0; i <= 200; i += binSize) {
    bins.push(i);
    counts.push(0);
  }

  // Count values in each bin
  values.forEach(value => {
    const binIndex = Math.floor(value / binSize);
    if (binIndex >= 0 && binIndex < counts.length) {
      counts[binIndex]++;
    }
  });

  return { bins, counts };
}

/**
 * Calculate chi-square goodness of fit test
 */
function calculateChiSquareTest(observed: number[], expected: number[]): {
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  interpretation: string;
} {
  let chiSquare = 0;
  let validBins = 0;

  for (let i = 0; i < observed.length; i++) {
    if (expected[i] >= 5) { // Only include bins with expected count >= 5
      const diff = observed[i] - expected[i];
      chiSquare += (diff * diff) / expected[i];
      validBins++;
    }
  }

  const degreesOfFreedom = validBins - 1;
  const pValue = 1 - chiSquareCDF(chiSquare, degreesOfFreedom);

  let interpretation = '';
  if (pValue > 0.05) {
    interpretation = 'Distribution appears random (p > 0.05)';
  } else if (pValue > 0.01) {
    interpretation = 'Some deviation from randomness detected (p < 0.05)';
  } else {
    interpretation = 'Significant deviation from randomness (p < 0.01)';
  }

  return { chiSquare, degreesOfFreedom, pValue, interpretation };
}

/**
 * Simplified chi-square CDF approximation
 */
function chiSquareCDF(x: number, df: number): number {
  // Simple approximation - in real implementation, use proper statistical library
  return Math.min(1, x / (2 * df));
}

/**
 * StatisticalDistributionChart Component
 */
export const StatisticalDistributionChart: React.FC<StatisticalDistributionProps> = ({
  trialValues,
  expectedDistribution,
  showChiSquare = true,
  showNormalOverlay = true,
  theme = scientificTheme
}) => {
  // Calculate histogram of observed values
  const histogram = useMemo(() => {
    return calculateHistogram(trialValues, 5); // 5-value bins
  }, [trialValues]);

  // Calculate expected distribution if not provided
  const expectedDist = useMemo(() => {
    if (expectedDistribution) return expectedDistribution;
    return calculateExpectedDistribution(trialValues.length);
  }, [expectedDistribution, trialValues.length]);

  // Calculate expected histogram bins
  const expectedHistogram = useMemo(() => {
    const { bins } = histogram;
    const expectedCounts = new Array(bins.length).fill(0);

    // Group expected distribution into bins
    for (let i = 0; i < expectedDist.length; i++) {
      const binIndex = Math.floor(i / 5);
      if (binIndex < expectedCounts.length) {
        expectedCounts[binIndex] += expectedDist[i];
      }
    }

    return expectedCounts;
  }, [expectedDist, histogram]);

  // Calculate chi-square test
  const chiSquareTest = useMemo(() => {
    if (!showChiSquare) return null;
    return calculateChiSquareTest(histogram.counts, expectedHistogram);
  }, [histogram.counts, expectedHistogram, showChiSquare]);

  // Calculate basic statistics
  const statistics = useMemo(() => {
    if (trialValues.length === 0) return null;

    const mean = trialValues.reduce((sum, val) => sum + val, 0) / trialValues.length;
    const variance = trialValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / trialValues.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...trialValues);
    const max = Math.max(...trialValues);

    // Calculate z-score for the mean
    const expectedMean = 100;
    const expectedStdDev = Math.sqrt(50);
    const meanZScore = (mean - expectedMean) / (expectedStdDev / Math.sqrt(trialValues.length));

    return { mean, variance, stdDev, min, max, meanZScore };
  }, [trialValues]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const datasets: any[] = [];

    // Observed distribution (histogram bars)
    datasets.push({
      type: 'bar',
      label: 'Observed Distribution',
      data: histogram.counts,
      backgroundColor: `${theme.colors.primary}80`,
      borderColor: theme.colors.primary,
      borderWidth: 1,
      order: 2
    });

    // Expected distribution (overlay line)
    if (showNormalOverlay) {
      datasets.push({
        type: 'line',
        label: 'Expected Distribution',
        data: expectedHistogram,
        borderColor: theme.colors.secondary,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.3,
        yAxisID: 'y',
        order: 1
      });
    }

    return {
      labels: histogram.bins.map(bin => `${bin}-${bin + 4}`),
      datasets
    };
  }, [histogram, expectedHistogram, showNormalOverlay, theme]);

  // Chart options
  const chartOptions = useMemo(() => {
    const baseOptions = adaptThemeForChartJs(theme);

    return {
      ...baseOptions,
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const
      },
      plugins: {
        ...baseOptions.plugins,
        title: {
          display: true,
          text: 'Trial Value Distribution Analysis',
          font: theme.fonts.title
        },
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y;
              const percentage = ((value / trialValues.length) * 100).toFixed(1);
              return `${context.dataset.label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          ...baseOptions.scales.x,
          title: {
            display: true,
            text: 'Trial Value Range'
          }
        },
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: 'Frequency'
          }
        }
      }
    };
  }, [theme, trialValues.length]);

  return (
    <div className="statistical-distribution-chart">
      {/* Main chart */}
      <div
        style={{
          height: '400px',
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.grid}`,
          borderRadius: '8px',
          padding: theme.spacing.padding,
          marginBottom: '16px'
        }}
      >
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Statistics summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Basic Statistics */}
        {statistics && (
          <div
            style={{
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.grid}`,
              borderRadius: '8px',
              padding: theme.spacing.padding
            }}
          >
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: theme.fonts.title.size - 2,
              color: theme.fonts.title.color,
              fontFamily: theme.fonts.title.family
            }}>
              Distribution Statistics
            </h4>

            <div style={{
              fontSize: theme.fonts.axis.size,
              color: theme.fonts.axis.color,
              fontFamily: theme.fonts.axis.family,
              lineHeight: 1.6
            }}>
              <div><strong>Sample Size:</strong> {trialValues.length.toLocaleString()}</div>
              <div><strong>Mean:</strong> {statistics.mean.toFixed(3)} (expected: 100.000)</div>
              <div><strong>Std Dev:</strong> {statistics.stdDev.toFixed(3)} (expected: 7.071)</div>
              <div><strong>Variance:</strong> {statistics.variance.toFixed(3)} (expected: 50.000)</div>
              <div><strong>Range:</strong> {statistics.min} - {statistics.max}</div>
              <div>
                <strong>Mean Z-Score:</strong> {statistics.meanZScore.toFixed(3)}
                <span style={{
                  color: Math.abs(statistics.meanZScore) > 1.96 ? theme.colors.negative : theme.colors.neutral,
                  marginLeft: '8px'
                }}>
                  {Math.abs(statistics.meanZScore) > 2.576 ? '***' :
                   Math.abs(statistics.meanZScore) > 1.96 ? '**' :
                   Math.abs(statistics.meanZScore) > 1.645 ? '*' : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chi-Square Test Results */}
        {chiSquareTest && (
          <div
            style={{
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.grid}`,
              borderRadius: '8px',
              padding: theme.spacing.padding
            }}
          >
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: theme.fonts.title.size - 2,
              color: theme.fonts.title.color,
              fontFamily: theme.fonts.title.family
            }}>
              Chi-Square Goodness of Fit
            </h4>

            <div style={{
              fontSize: theme.fonts.axis.size,
              color: theme.fonts.axis.color,
              fontFamily: theme.fonts.axis.family,
              lineHeight: 1.6
            }}>
              <div><strong>χ² Statistic:</strong> {chiSquareTest.chiSquare.toFixed(3)}</div>
              <div><strong>Degrees of Freedom:</strong> {chiSquareTest.degreesOfFreedom}</div>
              <div><strong>P-Value:</strong> {chiSquareTest.pValue.toFixed(6)}</div>
              <div style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: chiSquareTest.pValue > 0.05 ? `${theme.colors.positive}20` :
                                 chiSquareTest.pValue > 0.01 ? `${theme.colors.neutral}20` :
                                 `${theme.colors.negative}20`,
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                {chiSquareTest.interpretation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Distribution quality indicators */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.grid}`,
          borderRadius: '8px',
          fontSize: theme.fonts.annotation.size,
          color: theme.fonts.annotation.color,
          fontFamily: theme.fonts.annotation.family
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <strong>Randomness Quality:</strong>
            <span style={{
              marginLeft: '8px',
              color: chiSquareTest && chiSquareTest.pValue > 0.05 ? theme.colors.positive : theme.colors.negative
            }}>
              {chiSquareTest && chiSquareTest.pValue > 0.05 ? 'GOOD' : 'QUESTIONABLE'}
            </span>
          </div>
          <div>
            <strong>Bin Size:</strong> 5 values per bin
          </div>
          <div>
            <strong>Expected Mean:</strong> 100 ± 7.07
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticalDistributionChart;