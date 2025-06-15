/**
 * SessionComparisonChart - Multi-session analysis and comparison visualization
 * Displays overlaid sessions for comparative analysis with statistical summaries
 * Supporting PEAR laboratory methodology for longitudinal studies
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, differenceInMinutes } from 'date-fns';

import { SessionComparisonProps, ChartPoint } from './types';
import { scientificTheme, adaptThemeForChartJs } from '../../styles/charts/themes';
import { chartOptimizer, getOptimalDecimationStrategy } from '../../utils/chart-optimization';
import { ExperimentSession, CumulativePoint } from '../../../shared/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Generate distinct colors for multiple sessions
 */
function generateSessionColors(count: number): string[] {
  const baseColors = [
    '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
    '#db2777', '#0891b2', '#65a30d', '#dc2626', '#0f766e'
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < baseColors.length) {
      colors.push(baseColors[i]);
    } else {
      // Generate additional colors with hue rotation
      const hue = (i * 137.5) % 360; // Golden angle for better distribution
      colors.push(`hsl(${hue}, 60%, 50%)`);
    }
  }

  return colors;
}

/**
 * Align sessions by time or trial count for comparison
 */
function alignSessions(
  sessions: ExperimentSession[],
  sessionData: Map<string, CumulativePoint[]>,
  alignBy: 'time' | 'trialCount'
): Map<string, CumulativePoint[]> {
  const alignedData = new Map<string, CumulativePoint[]>();

  if (alignBy === 'time') {
    // Find common time reference (earliest start time)
    const startTimes = sessions.map(s => s.startTime.getTime());
    const referenceTime = Math.min(...startTimes);

    sessions.forEach(session => {
      const rawData = sessionData.get(session.id);
      if (!rawData) return;

      const sessionStartOffset = session.startTime.getTime() - referenceTime;

      const aligned = rawData.map(point => ({
        ...point,
        timestamp: new Date(point.timestamp.getTime() - session.startTime.getTime() + sessionStartOffset)
      }));

      alignedData.set(session.id, aligned);
    });
  } else {
    // Align by trial count (no transformation needed)
    sessions.forEach(session => {
      const data = sessionData.get(session.id);
      if (data) {
        alignedData.set(session.id, data);
      }
    });
  }

  return alignedData;
}

/**
 * Calculate session statistics for comparison
 */
interface SessionStats {
  sessionId: string;
  finalDeviation: number;
  maxDeviation: number;
  minDeviation: number;
  finalZScore: number;
  trialCount: number;
  duration: number; // minutes
  effectSize: number;
  significance: 'none' | 'marginal' | 'significant' | 'highly_significant';
}

function calculateSessionStats(
  session: ExperimentSession,
  data: CumulativePoint[]
): SessionStats {
  if (data.length === 0) {
    return {
      sessionId: session.id,
      finalDeviation: 0,
      maxDeviation: 0,
      minDeviation: 0,
      finalZScore: 0,
      trialCount: 0,
      duration: 0,
      effectSize: 0,
      significance: 'none'
    };
  }

  const finalPoint = data[data.length - 1];
  const maxDeviation = Math.max(...data.map(p => p.cumulativeDeviation));
  const minDeviation = Math.min(...data.map(p => p.cumulativeDeviation));
  const duration = session.endTime ?
    differenceInMinutes(session.endTime, session.startTime) : 0;

  // Calculate effect size (Cohen's d approximation)
  const standardError = Math.sqrt(50 * data.length); // For 200-bit trials
  const effectSize = Math.abs(finalPoint.cumulativeDeviation) / standardError;

  // Determine significance level
  const pValue = 2 * (1 - normalCDF(Math.abs(finalPoint.zScore)));
  let significance: 'none' | 'marginal' | 'significant' | 'highly_significant' = 'none';
  if (pValue < 0.001) significance = 'highly_significant';
  else if (pValue < 0.05) significance = 'significant';
  else if (pValue < 0.1) significance = 'marginal';

  return {
    sessionId: session.id,
    finalDeviation: finalPoint.cumulativeDeviation,
    maxDeviation,
    minDeviation,
    finalZScore: finalPoint.zScore,
    trialCount: finalPoint.trialIndex,
    duration,
    effectSize,
    significance
  };
}

/**
 * Simplified normal distribution CDF
 */
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x: number): number {
  // Approximation of error function
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * SessionComparisonChart Component
 */
export const SessionComparisonChart: React.FC<SessionComparisonProps> = ({
  sessions,
  metric = 'cumulative',
  alignBy = 'trialCount',
  showIndividual = true,
  showAverage = true,
  theme = scientificTheme
}) => {
  const [sessionData] = useState<Map<string, CumulativePoint[]>>(() => {
    // In a real implementation, this would come from props or a data fetcher
    // For now, we'll create mock data
    const mockData = new Map<string, CumulativePoint[]>();

    sessions.forEach(session => {
      const points: CumulativePoint[] = [];
      const trialCount = session.targetTrials || 1000;

      // Generate mock cumulative data
      let cumulativeDeviation = 0;
      let runningSum = 0;

      for (let i = 0; i < trialCount; i++) {
        // Simulate trial value (0-200 range, mean=100)
        const trialValue = Math.round(Math.random() * 200);
        const deviation = trialValue - 100;
        cumulativeDeviation += deviation;
        runningSum += trialValue;

        const runningMean = runningSum / (i + 1);
        const variance = 50; // For 200-bit trials
        const zScore = cumulativeDeviation / Math.sqrt(variance * (i + 1));

        points.push({
          trialIndex: i + 1,
          timestamp: new Date(session.startTime.getTime() + i * 1000), // 1 trial per second
          cumulativeDeviation,
          runningMean,
          zScore,
          runningVariance: variance
        });
      }

      mockData.set(session.id, points);
    });

    return mockData;
  });

  // Align session data for comparison
  const alignedData = useMemo(() => {
    return alignSessions(sessions, sessionData, alignBy);
  }, [sessions, sessionData, alignBy]);

  // Calculate session statistics
  const sessionStats = useMemo(() => {
    return sessions.map(session => {
      const data = alignedData.get(session.id) || [];
      return calculateSessionStats(session, data);
    });
  }, [sessions, alignedData]);

  // Generate colors for sessions
  const sessionColors = useMemo(() => {
    return generateSessionColors(sessions.length);
  }, [sessions.length]);

  // Calculate average trajectory if requested
  const averageData = useMemo(() => {
    if (!showAverage || alignedData.size === 0) return null;

    // Find maximum trial count across all sessions
    let maxTrials = 0;
    alignedData.forEach(data => {
      maxTrials = Math.max(maxTrials, data.length);
    });

    const avgPoints: CumulativePoint[] = [];

    for (let i = 0; i < maxTrials; i++) {
      const valuesAtIndex: number[] = [];
      let validTimestamp: Date | null = null;

      alignedData.forEach(data => {
        if (i < data.length) {
          const value = metric === 'cumulative' ? data[i].cumulativeDeviation :
                       metric === 'zScore' ? data[i].zScore :
                       data[i].cumulativeDeviation; // effectSize calculation would go here
          valuesAtIndex.push(value);

          if (!validTimestamp) {
            validTimestamp = data[i].timestamp;
          }
        }
      });

      if (valuesAtIndex.length > 0 && validTimestamp) {
        const avgValue = valuesAtIndex.reduce((sum, v) => sum + v, 0) / valuesAtIndex.length;
        avgPoints.push({
          trialIndex: i + 1,
          timestamp: validTimestamp,
          cumulativeDeviation: avgValue,
          runningMean: 100, // Approximate
          zScore: avgValue / Math.sqrt(50 * (i + 1)),
          runningVariance: 50
        });
      }
    }

    return avgPoints;
  }, [showAverage, alignedData, metric]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const datasets: any[] = [];

    // Individual session datasets
    if (showIndividual) {
      sessions.forEach((session, index) => {
        const data = alignedData.get(session.id);
        if (!data) return;

        const yValues = data.map(point => {
          switch (metric) {
            case 'zScore':
              return point.zScore;
            case 'effectSize':
              // Calculate effect size
              const standardError = Math.sqrt(50 * point.trialIndex);
              return Math.abs(point.cumulativeDeviation) / standardError;
            case 'cumulative':
            default:
              return point.cumulativeDeviation;
          }
        });

        const xValues = alignBy === 'time'
          ? data.map(point => point.timestamp)
          : data.map(point => point.trialIndex);

        datasets.push({
          label: `Session ${index + 1} (${session.intention || 'baseline'})`,
          data: xValues.map((x, i) => ({ x, y: yValues[i] })),
          borderColor: sessionColors[index],
          backgroundColor: `${sessionColors[index]}20`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.1,
          order: index + 1
        });
      });
    }

    // Average trajectory dataset
    if (averageData) {
      const yValues = averageData.map(point => {
        switch (metric) {
          case 'zScore':
            return point.zScore;
          case 'effectSize':
            const standardError = Math.sqrt(50 * point.trialIndex);
            return Math.abs(point.cumulativeDeviation) / standardError;
          case 'cumulative':
          default:
            return point.cumulativeDeviation;
        }
      });

      const xValues = alignBy === 'time'
        ? averageData.map(point => point.timestamp)
        : averageData.map(point => point.trialIndex);

      datasets.push({
        label: 'Average',
        data: xValues.map((x, i) => ({ x, y: yValues[i] })),
        borderColor: theme.colors.text,
        backgroundColor: 'transparent',
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
        borderDash: [10, 5],
        order: 0
      });
    }

    return { datasets };
  }, [sessions, alignedData, sessionColors, showIndividual, averageData, metric, alignBy, theme]);

  // Chart options
  const chartOptions = useMemo(() => {
    const baseOptions = adaptThemeForChartJs(theme);

    const metricLabel = metric === 'cumulative' ? 'Cumulative Deviation' :
                       metric === 'zScore' ? 'Z-Score' :
                       'Effect Size';

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
          text: `Session Comparison - ${metricLabel} (${alignBy === 'time' ? 'Time Aligned' : 'Trial Aligned'})`,
          font: theme.fonts.title
        },
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            title: (context: any) => {
              if (alignBy === 'time') {
                const timestamp = new Date(context[0].parsed.x);
                return format(timestamp, 'PPpp');
              } else {
                return `Trial ${context[0].parsed.x}`;
              }
            },
            label: (context: any) => {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ...baseOptions.scales.x,
          type: alignBy === 'time' ? 'time' as const : 'linear' as const,
          title: {
            display: true,
            text: alignBy === 'time' ? 'Time' : 'Trial Number'
          },
          ...(alignBy === 'time' && {
            time: {
              displayFormats: {
                minute: 'HH:mm',
                hour: 'MMM dd HH:mm',
                day: 'MMM dd'
              }
            }
          })
        },
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: metricLabel
          },
          grid: {
            ...baseOptions.scales.y.grid,
            color: (context: any) => {
              return context.tick.value === 0 ? theme.colors.text : theme.colors.grid;
            },
            lineWidth: (context: any) => {
              return context.tick.value === 0 ? 2 : 1;
            }
          }
        }
      }
    };
  }, [theme, metric, alignBy]);

  return (
    <div className="session-comparison-chart">
      <div
        style={{
          height: '500px',
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.grid}`,
          borderRadius: '8px',
          padding: theme.spacing.padding,
          marginBottom: '16px'
        }}
      >
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Session statistics summary */}
      <div
        style={{
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.grid}`,
          borderRadius: '8px',
          padding: theme.spacing.padding
        }}
      >
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: theme.fonts.title.size,
          color: theme.fonts.title.color,
          fontFamily: theme.fonts.title.family
        }}>
          Session Statistics Summary
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: theme.fonts.axis.size,
            color: theme.fonts.axis.color,
            fontFamily: theme.fonts.axis.family
          }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.colors.grid}` }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Session</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Intention</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Trials</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Duration</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Final Dev.</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Z-Score</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Effect Size</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Significance</th>
              </tr>
            </thead>
            <tbody>
              {sessionStats.map((stats, index) => {
                const session = sessions[index];
                return (
                  <tr key={stats.sessionId} style={{
                    borderBottom: `1px solid ${theme.colors.grid}`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : `${theme.colors.grid}40`
                  }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: sessionColors[index],
                            marginRight: '8px',
                            borderRadius: '2px'
                          }}
                        />
                        Session {index + 1}
                      </div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {session.intention || 'baseline'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {stats.trialCount.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {Math.round(stats.duration)}m
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {stats.finalDeviation.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {stats.finalZScore.toFixed(3)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {stats.effectSize.toFixed(3)}
                    </td>
                    <td style={{
                      padding: '8px',
                      textAlign: 'right',
                      color: stats.significance === 'highly_significant' ? theme.colors.positive :
                             stats.significance === 'significant' ? theme.colors.secondary :
                             stats.significance === 'marginal' ? theme.colors.neutral :
                             theme.colors.text
                    }}>
                      {stats.significance.replace('_', ' ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionComparisonChart;