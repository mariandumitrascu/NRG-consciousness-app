/**
 * CumulativeDeviationChart - Primary analysis chart for RNG consciousness experiments
 * Displays cumulative deviation over time with significance bands, trend lines, and interactive features
 * Following PEAR laboratory methodology and scientific visualization standards
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  InteractionItem,
  ChartEvent
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, differenceInMinutes } from 'date-fns';

import { CumulativeChartProps, SignificanceBand, TrendLine, ChartPoint } from './types';
import { scientificTheme, getSignificanceColor, adaptThemeForChartJs } from '../../styles/charts/themes';
import { chartOptimizer, getOptimalDecimationStrategy } from '../../utils/chart-optimization';
import { CumulativePoint } from '../../../shared/types';

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
 * Calculate significance bands based on standard statistical thresholds
 */
function calculateSignificanceBands(trialCount: number): SignificanceBand[] {
  const standardError = Math.sqrt(50 * trialCount); // For 200-bit trials, variance = 50

  return [
    {
      level: 0.1,
      color: 'rgba(254, 243, 199, 0.3)', // Light yellow
      label: 'p < 0.1 (marginal)',
      zScore: 1.645
    },
    {
      level: 0.05,
      color: 'rgba(254, 215, 119, 0.4)', // Orange
      label: 'p < 0.05 (significant)',
      zScore: 1.96
    },
    {
      level: 0.01,
      color: 'rgba(245, 158, 11, 0.5)', // Amber
      label: 'p < 0.01 (highly significant)',
      zScore: 2.576
    },
    {
      level: 0.001,
      color: 'rgba(217, 119, 6, 0.6)', // Dark amber
      label: 'p < 0.001 (extremely significant)',
      zScore: 3.291
    }
  ];
}

/**
 * Calculate linear trend line using least squares regression
 */
function calculateTrendLine(data: CumulativePoint[]): TrendLine | null {
  if (data.length < 2) return null;

  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  data.forEach((point, index) => {
    const x = index; // Use index as x value for trend calculation
    const y = point.cumulativeDeviation;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate correlation coefficient
  let sumYY = 0;
  data.forEach(point => {
    sumYY += point.cumulativeDeviation * point.cumulativeDeviation;
  });

  const correlation = (n * sumXY - sumX * sumY) /
    Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  // Calculate p-value (simplified t-test)
  const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
  const pValue = 2 * (1 - studentTCDF(Math.abs(tStat), n - 2));

  // Generate trend line points
  const points: ChartPoint[] = data.map((_, index) => ({
    x: data[index].timestamp,
    y: slope * index + intercept
  }));

  return {
    slope,
    intercept,
    correlation,
    pValue,
    confidence: 0.95,
    points
  };
}

/**
 * Simplified Student's t-distribution CDF approximation
 */
function studentTCDF(t: number, df: number): number {
  // Simplified approximation - in real implementation, use proper statistical library
  const x = df / (t * t + df);
  return 1 - 0.5 * Math.pow(x, df / 2);
}

/**
 * CumulativeDeviationChart Component
 */
export const CumulativeDeviationChart: React.FC<CumulativeChartProps> = ({
  data,
  intention = 'baseline',
  showSignificanceBands = true,
  showTrendLine = true,
  interactive = true,
  height = 400,
  timeLabels = true,
  theme = scientificTheme,
  onPointClick,
  onRangeSelect
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  // Optimize data for performance
  const optimizedData = useMemo(() => {
    if (data.length <= 1000) return data;

    const strategy = getOptimalDecimationStrategy(data.length, 1000, 'cumulative');
    const chartPoints: ChartPoint[] = data.map(point => ({
      x: point.timestamp,
      y: point.cumulativeDeviation,
      metadata: point
    }));

    const optimized = chartOptimizer.decimateData(chartPoints, 1000, strategy);
    return optimized.map(point => point.metadata as CumulativePoint);
  }, [data]);

  // Calculate significance bands
  const significanceBands = useMemo(() => {
    if (!showSignificanceBands || optimizedData.length === 0) return [];
    return calculateSignificanceBands(optimizedData.length);
  }, [showSignificanceBands, optimizedData.length]);

  // Calculate trend line
  const trendLine = useMemo(() => {
    if (!showTrendLine || optimizedData.length < 10) return null;
    return calculateTrendLine(optimizedData);
  }, [showTrendLine, optimizedData]);

  // Prepare chart datasets
  const chartData = useMemo(() => {
    const datasets: any[] = [];

    // Add significance bands as background fills
    if (showSignificanceBands && significanceBands.length > 0) {
      significanceBands.forEach((band, index) => {
        const standardError = Math.sqrt(50 * optimizedData.length);
        const upperBound = band.zScore * standardError;
        const lowerBound = -band.zScore * standardError;

        // Upper band
        datasets.push({
          label: `+${band.label}`,
          data: optimizedData.map(() => upperBound),
          borderColor: 'transparent',
          backgroundColor: band.color,
          fill: index === 0 ? 'origin' : `-${index * 2}`,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          order: 10 + index
        });

        // Lower band
        datasets.push({
          label: `-${band.label}`,
          data: optimizedData.map(() => lowerBound),
          borderColor: 'transparent',
          backgroundColor: band.color,
          fill: `-1`,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          order: 10 + index
        });
      });
    }

    // Add trend line
    if (trendLine) {
      datasets.push({
        label: `Trend (r=${trendLine.correlation.toFixed(3)}, p=${trendLine.pValue.toFixed(3)})`,
        data: trendLine.points.map(point => ({
          x: point.x,
          y: point.y
        })),
        borderColor: theme.colors.secondary,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
        order: 2
      });
    }

    // Main cumulative deviation line
    datasets.push({
      label: `Cumulative Deviation (${intention})`,
      data: optimizedData.map(point => ({
        x: point.timestamp,
        y: point.cumulativeDeviation
      })),
      borderColor: intention === 'high' ? theme.colors.positive :
                  intention === 'low' ? theme.colors.negative :
                  theme.colors.primary,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: interactive ? 1 : 0,
      pointHoverRadius: interactive ? 4 : 0,
      pointBackgroundColor: intention === 'high' ? theme.colors.positive :
                           intention === 'low' ? theme.colors.negative :
                           theme.colors.primary,
      tension: 0.1,
      order: 1
    });

    return {
      labels: optimizedData.map(point => point.timestamp),
      datasets
    };
  }, [optimizedData, significanceBands, trendLine, theme, intention, showSignificanceBands, interactive]);

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
          text: `Cumulative Deviation Analysis - ${intention.charAt(0).toUpperCase() + intention.slice(1)} Intention`,
          font: theme.fonts.title
        },
        legend: {
          ...baseOptions.plugins.legend,
          filter: (legendItem: any) => {
            // Hide significance band labels to reduce clutter
            return !legendItem.text.includes('p <');
          }
        },
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            title: (context: any) => {
              const timestamp = new Date(context[0].parsed.x);
              return format(timestamp, 'PPpp');
            },
            label: (context: any) => {
              const point = optimizedData[context.dataIndex];
              if (!point) return '';

              return [
                `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`,
                `Trial: ${point.trialIndex}`,
                `Z-Score: ${point.zScore.toFixed(3)}`,
                `Running Mean: ${point.runningMean.toFixed(2)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          ...baseOptions.scales.x,
          type: 'time' as const,
          time: {
            displayFormats: {
              minute: 'HH:mm',
              hour: 'MMM dd HH:mm',
              day: 'MMM dd'
            }
          },
          title: {
            display: true,
            text: timeLabels ? 'Time' : 'Trial Number'
          }
        },
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: 'Cumulative Deviation'
          },
          grid: {
            ...baseOptions.scales.y.grid,
            color: (context: any) => {
              // Highlight zero line
              return context.tick.value === 0 ? theme.colors.text : theme.colors.grid;
            },
            lineWidth: (context: any) => {
              return context.tick.value === 0 ? 2 : 1;
            }
          }
        }
      },
      onClick: interactive ? (event: ChartEvent, elements: InteractionItem[]) => {
        if (elements.length > 0 && onPointClick) {
          const element = elements[0];
          const point = optimizedData[element.index];
          if (point) {
            onPointClick(point);
          }
        }
      } : undefined,
      onHover: interactive ? (event: ChartEvent, elements: InteractionItem[]) => {
        const canvas = chartRef.current?.canvas;
        if (canvas) {
          canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      } : undefined
    };
  }, [theme, intention, interactive, timeLabels, optimizedData, onPointClick]);

  // Handle range selection (simplified implementation)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!interactive || !onRangeSelect) return;

    setIsSelecting(true);
    setSelectionStart(event.clientX);
  }, [interactive, onRangeSelect]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !onRangeSelect) return;

    const selectionEnd = event.clientX;
    const range = {
      start: Math.min(selectionStart, selectionEnd),
      end: Math.max(selectionStart, selectionEnd)
    };

    // Convert pixel coordinates to data range (simplified)
    // In a real implementation, you'd use Chart.js coordinate transformation
    onRangeSelect(range);

    setIsSelecting(false);
    setSelectionStart(null);
  }, [isSelecting, selectionStart, onRangeSelect]);

  // Performance monitoring
  useEffect(() => {
    const metrics = chartOptimizer.getPerformanceMetrics();
    if (metrics.totalOptimizations > 0) {
      console.log(`Chart optimization: ${metrics.averageTime.toFixed(2)}ms avg, ${data.length} → ${optimizedData.length} points`);
    }
  }, [data.length, optimizedData.length]);

  return (
    <div
      className="cumulative-deviation-chart"
      style={{
        height: `${height}px`,
        position: 'relative',
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.grid}`,
        borderRadius: '8px',
        padding: theme.spacing.padding
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <Line
        ref={chartRef}
        data={chartData}
        options={chartOptions}
      />

      {/* Statistical summary overlay */}
      {optimizedData.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: `${theme.colors.background}ee`,
            border: `1px solid ${theme.colors.grid}`,
            borderRadius: '4px',
            padding: '8px',
            fontSize: theme.fonts.annotation.size,
            color: theme.fonts.annotation.color,
            fontFamily: theme.fonts.annotation.family
          }}
        >
          <div>Trials: {optimizedData[optimizedData.length - 1]?.trialIndex || 0}</div>
          <div>Final Deviation: {optimizedData[optimizedData.length - 1]?.cumulativeDeviation.toFixed(3) || '0.000'}</div>
          <div>Current Z-Score: {optimizedData[optimizedData.length - 1]?.zScore.toFixed(3) || '0.000'}</div>
          {trendLine && (
            <div>Trend: {trendLine.correlation > 0 ? '↑' : '↓'} (r={trendLine.correlation.toFixed(3)})</div>
          )}
        </div>
      )}

      {/* Selection indicator */}
      {isSelecting && selectionStart && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(selectionStart, 0)}px`,
            width: `${Math.abs(selectionStart)}px`,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

export default CumulativeDeviationChart;