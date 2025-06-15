/**
 * LiveChart - Real-time streaming data visualization for continuous RNG monitoring
 * Optimized for high-frequency updates with smooth animations and performance management
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartEvent,
  InteractionItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

import { LiveChartProps, ChartPoint } from './types';
import { scientificTheme, adaptThemeForChartJs } from '../../styles/charts/themes';
import { CumulativePoint } from '../../../shared/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Circular buffer for efficient real-time data management
 */
class CircularBuffer<T> {
  private buffer: T[];
  private size: number;
  private index: number = 0;
  private full: boolean = false;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size);
  }

  push(item: T): void {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.size;
    if (!this.full && this.index === 0) {
      this.full = true;
    }
  }

  getAll(): T[] {
    if (!this.full) {
      return this.buffer.slice(0, this.index);
    }
    return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
  }

  size(): number {
    return this.full ? this.size : this.index;
  }

  clear(): void {
    this.index = 0;
    this.full = false;
  }
}

/**
 * Performance monitor for chart updates
 */
class PerformanceMonitor {
  private frameStartTime: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  endFrame(): void {
    const frameTime = performance.now() - this.frameStartTime;
    this.frameCount++;

    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  getFps(): number {
    return this.currentFps;
  }
}

/**
 * LiveChart Component
 */
export const LiveChart: React.FC<LiveChartProps & {
  data?: CumulativePoint[];
  onNewData?: (point: CumulativePoint) => void;
}> = ({
  updateInterval = 1000,
  bufferSize = 1000,
  animationSpeed = 200,
  pauseOnHover = true,
  theme = scientificTheme,
  data = [],
  onNewData
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const dataBuffer = useRef(new CircularBuffer<CumulativePoint>(bufferSize));
  const performanceMonitor = useRef(new PerformanceMonitor());
  const animationFrameId = useRef<number>();
  const lastUpdateTime = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentFps, setCurrentFps] = useState(0);
  const [dataPoints, setDataPoints] = useState<CumulativePoint[]>([]);

  // Initialize buffer with existing data
  useEffect(() => {
    if (data.length > 0) {
      data.forEach(point => dataBuffer.current.push(point));
      setDataPoints(dataBuffer.current.getAll());
    }
  }, [data]);

  // Real-time data update simulation (in real app, this would come from props)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && !(pauseOnHover && isHovered)) {
        // Simulate new data point
        const lastPoint = dataBuffer.current.getAll().slice(-1)[0];
        const newPoint: CumulativePoint = {
          trialIndex: lastPoint ? lastPoint.trialIndex + 1 : 1,
          timestamp: new Date(),
          cumulativeDeviation: lastPoint ?
            lastPoint.cumulativeDeviation + (Math.random() - 0.5) * 2 :
            (Math.random() - 0.5) * 2,
          runningMean: 100 + (Math.random() - 0.5) * 0.1,
          zScore: 0, // Will be calculated
          runningVariance: 50
        };

        // Calculate z-score
        newPoint.zScore = newPoint.cumulativeDeviation / Math.sqrt(50 * newPoint.trialIndex);

        dataBuffer.current.push(newPoint);
        setDataPoints(dataBuffer.current.getAll());

        if (onNewData) {
          onNewData(newPoint);
        }
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, isPaused, isHovered, pauseOnHover, onNewData]);

  // Performance monitoring
  useEffect(() => {
    const updateFps = () => {
      setCurrentFps(performanceMonitor.current.getFps());
    };

    const interval = setInterval(updateFps, 1000);
    return () => clearInterval(interval);
  }, []);

  // Chart data with optimized updates
  const chartData = useMemo(() => {
    performanceMonitor.current.startFrame();

    const optimizedData = dataPoints.length > 500 ?
      dataPoints.filter((_, index) => index % Math.ceil(dataPoints.length / 500) === 0) :
      dataPoints;

    const result = {
      labels: optimizedData.map(point => point.timestamp),
      datasets: [
        {
          label: 'Cumulative Deviation',
          data: optimizedData.map(point => ({
            x: point.timestamp,
            y: point.cumulativeDeviation
          })),
          borderColor: theme.colors.primary,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          animation: false // Disable animation for real-time performance
        },
        {
          label: 'Z-Score (scaled)',
          data: optimizedData.map(point => ({
            x: point.timestamp,
            y: point.zScore * 10 // Scale for visibility
          })),
          borderColor: theme.colors.secondary,
          backgroundColor: 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.1,
          borderDash: [5, 5],
          animation: false
        }
      ]
    };

    performanceMonitor.current.endFrame();
    return result;
  }, [dataPoints, theme]);

  // Chart options optimized for real-time updates
  const chartOptions = useMemo(() => {
    const baseOptions = adaptThemeForChartJs(theme);

    return {
      ...baseOptions,
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: animationSpeed,
        easing: 'linear' as const
      },
      interaction: {
        intersect: false,
        mode: 'index' as const
      },
      plugins: {
        ...baseOptions.plugins,
        title: {
          display: true,
          text: `Live Data Stream - ${dataPoints.length} points`,
          font: theme.fonts.title
        },
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            title: (context: any) => {
              const timestamp = new Date(context[0].parsed.x);
              return format(timestamp, 'HH:mm:ss.SSS');
            },
            label: (context: any) => {
              const point = dataPoints[context.dataIndex];
              if (!point) return '';

              if (context.datasetIndex === 0) {
                return [
                  `Cumulative Deviation: ${context.parsed.y.toFixed(3)}`,
                  `Trial: ${point.trialIndex}`,
                  `Z-Score: ${point.zScore.toFixed(3)}`
                ];
              } else {
                return `Z-Score: ${(context.parsed.y / 10).toFixed(3)}`;
              }
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
              second: 'HH:mm:ss',
              minute: 'HH:mm'
            }
          },
          title: {
            display: true,
            text: 'Time'
          },
          // Auto-scale to show recent data
          suggestedMin: dataPoints.length > 0 ?
            dataPoints[Math.max(0, dataPoints.length - 100)].timestamp.getTime() : undefined
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
              return context.tick.value === 0 ? theme.colors.text : theme.colors.grid;
            },
            lineWidth: (context: any) => {
              return context.tick.value === 0 ? 2 : 1;
            }
          }
        }
      },
      onHover: (event: ChartEvent, elements: InteractionItem[]) => {
        const canvas = chartRef.current?.canvas;
        if (canvas) {
          canvas.style.cursor = elements.length > 0 ? 'crosshair' : 'default';
        }
      }
    };
  }, [theme, animationSpeed, dataPoints]);

  // Control handlers
  const handlePauseResume = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleClear = useCallback(() => {
    dataBuffer.current.clear();
    setDataPoints([]);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Latest statistics
  const latestStats = useMemo(() => {
    if (dataPoints.length === 0) return null;

    const latest = dataPoints[dataPoints.length - 1];
    const maxDeviation = Math.max(...dataPoints.map(p => Math.abs(p.cumulativeDeviation)));
    const avgDeviation = dataPoints.reduce((sum, p) => sum + Math.abs(p.cumulativeDeviation), 0) / dataPoints.length;

    return {
      latest,
      maxDeviation,
      avgDeviation,
      dataRate: dataPoints.length > 1 ?
        1000 / ((latest.timestamp.getTime() - dataPoints[dataPoints.length - 2].timestamp.getTime()) || 1000) : 0
    };
  }, [dataPoints]);

  return (
    <div className="live-chart">
      {/* Control panel */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.grid}`,
          borderRadius: '8px 8px 0 0',
          fontSize: theme.fonts.axis.size,
          color: theme.fonts.axis.color,
          fontFamily: theme.fonts.axis.family
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handlePauseResume}
            style={{
              padding: '4px 12px',
              backgroundColor: isPaused ? theme.colors.positive : theme.colors.negative,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: theme.fonts.axis.size
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '4px 12px',
              backgroundColor: theme.colors.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: theme.fonts.axis.size
            }}
          >
            🗑 Clear
          </button>

          <div style={{
            color: (pauseOnHover && isHovered) || isPaused ? theme.colors.negative : theme.colors.positive
          }}>
            ● {(pauseOnHover && isHovered) || isPaused ? 'PAUSED' : 'LIVE'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: theme.fonts.annotation.size }}>
          <span>FPS: {currentFps}</span>
          <span>Points: {dataPoints.length}/{bufferSize}</span>
          {latestStats && <span>Rate: {latestStats.dataRate.toFixed(1)}/s</span>}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          height: '400px',
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.grid}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: theme.spacing.padding
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
        />
      </div>

      {/* Live statistics */}
      {latestStats && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px 16px',
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.grid}`,
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            fontSize: theme.fonts.axis.size,
            color: theme.fonts.axis.color,
            fontFamily: theme.fonts.axis.family
          }}
        >
          <div>
            <strong>Current:</strong> {latestStats.latest.cumulativeDeviation.toFixed(3)}
          </div>
          <div>
            <strong>Z-Score:</strong> {latestStats.latest.zScore.toFixed(3)}
          </div>
          <div>
            <strong>Max Dev:</strong> {latestStats.maxDeviation.toFixed(3)}
          </div>
          <div>
            <strong>Avg Dev:</strong> {latestStats.avgDeviation.toFixed(3)}
          </div>
          <div>
            <strong>Trial:</strong> {latestStats.latest.trialIndex.toLocaleString()}
          </div>
          <div>
            <strong>Time:</strong> {format(latestStats.latest.timestamp, 'HH:mm:ss')}
          </div>
        </div>
      )}

      {/* Performance warning */}
      {currentFps < 30 && currentFps > 0 && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            backgroundColor: `${theme.colors.negative}20`,
            border: `1px solid ${theme.colors.negative}`,
            borderRadius: '8px',
            fontSize: theme.fonts.annotation.size,
            color: theme.colors.negative,
            fontFamily: theme.fonts.annotation.family
          }}
        >
          ⚠ Performance Warning: Low frame rate ({currentFps} FPS). Consider reducing update frequency or buffer size.
        </div>
      )}
    </div>
  );
};

export default LiveChart;