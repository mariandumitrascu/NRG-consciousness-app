import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { RNGTrial, IntentionType } from '../../../shared/types';

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

interface CumulativeChartProps {
    trials: RNGTrial[];
    intention: IntentionType;
    height: number;
    showGrid: boolean;
    highlightSignificance: boolean;
}

/**
 * Real-time cumulative deviation chart
 * Shows the running cumulative deviation from expected mean (100)
 */
export const CumulativeChart: React.FC<CumulativeChartProps> = ({
    trials,
    intention,
    height,
    showGrid,
    highlightSignificance
}) => {
    const chartRef = useRef<ChartJS<'line'>>(null);

    /**
     * Calculate cumulative deviation data
     */
    const calculateCumulativeData = () => {
        if (trials.length === 0) return { labels: [], data: [] };

        const expectedMean = 100;
        let cumulativeDeviation = 0;
        const labels: number[] = [];
        const data: number[] = [];

        trials.forEach((trial, index) => {
            cumulativeDeviation += (trial.trialValue - expectedMean);
            labels.push(index + 1);
            data.push(cumulativeDeviation);
        });

        return { labels, data };
    };

    /**
     * Get intention-based styling
     */
    const getIntentionStyling = () => {
        switch (intention) {
            case 'high':
                return {
                    color: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    expectedDirection: 'positive'
                };
            case 'low':
                return {
                    color: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    expectedDirection: 'negative'
                };
            case 'baseline':
                return {
                    color: '#9E9E9E',
                    backgroundColor: 'rgba(158, 158, 158, 0.1)',
                    expectedDirection: 'neutral'
                };
            default:
                return {
                    color: '#9E9E9E',
                    backgroundColor: 'rgba(158, 158, 158, 0.1)',
                    expectedDirection: 'neutral'
                };
        }
    };

    const { labels, data } = calculateCumulativeData();
    const styling = getIntentionStyling();

    /**
     * Calculate dynamic line color based on deviation and intention
     */
    const getLineColor = (dataPoint: number, index: number) => {
        if (intention === 'baseline') return styling.color;

        const isInIntendedDirection =
            (intention === 'high' && dataPoint > 0) ||
            (intention === 'low' && dataPoint < 0);

        return isInIntendedDirection ? styling.color : '#FF5722';
    };

    const chartData: ChartData<'line'> = {
        labels,
        datasets: [
            {
                label: 'Cumulative Deviation',
                data,
                borderColor: styling.color,
                backgroundColor: styling.backgroundColor,
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointBackgroundColor: styling.color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
            },
            {
                label: 'Zero Line',
                data: labels.map(() => 0),
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 1,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
            }
        ]
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 300,
            easing: 'easeInOutQuart'
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: `Real-Time Cumulative Deviation (${intention.charAt(0).toUpperCase() + intention.slice(1)} Intention)`,
                color: 'rgba(255, 255, 255, 0.9)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: styling.color,
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    title: (context) => `Trial ${context[0].label}`,
                    label: (context) => {
                        const value = context.parsed.y;
                        const direction = value > 0 ? '↑' : value < 0 ? '↓' : '→';
                        return `Deviation: ${direction} ${Math.abs(value).toFixed(1)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Trial Number',
                    color: 'rgba(255, 255, 255, 0.7)'
                },
                grid: {
                    display: showGrid,
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    maxTicksLimit: 10
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Cumulative Deviation',
                    color: 'rgba(255, 255, 255, 0.7)'
                },
                grid: {
                    display: showGrid,
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            }
        }
    };

    // Add significance threshold lines if requested
    if (highlightSignificance && trials.length > 30) {
        const stdError = Math.sqrt(trials.length * 50); // Approximate standard error
        const significanceThreshold = 1.96 * stdError; // 95% confidence interval

        chartData.datasets.push(
            {
                label: '+1.96σ',
                data: labels.map(() => significanceThreshold),
                borderColor: 'rgba(255, 193, 7, 0.6)',
                borderWidth: 1,
                borderDash: [3, 3],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
            },
            {
                label: '-1.96σ',
                data: labels.map(() => -significanceThreshold),
                borderColor: 'rgba(255, 193, 7, 0.6)',
                borderWidth: 1,
                borderDash: [3, 3],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
            }
        );
    }

    return (
        <div className="cumulative-chart">
            <div className="chart-wrapper" style={{ height: `${height}px` }}>
                <Line ref={chartRef} data={chartData} options={options} />
            </div>

            {/* Chart Status Info */}
            <div className="chart-info">
                <div className="info-item">
                    <span className="info-label">Trials:</span>
                    <span className="info-value">{trials.length}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Current Deviation:</span>
                    <span className="info-value" style={{ color: styling.color }}>
                        {data.length > 0 ? data[data.length - 1].toFixed(1) : '0.0'}
                    </span>
                </div>
                <div className="info-item">
                    <span className="info-label">Direction:</span>
                    <span className="info-value">
                        {data.length > 0 ? (
                            data[data.length - 1] > 0 ? '⬆️ Positive' :
                            data[data.length - 1] < 0 ? '⬇️ Negative' : '➡️ Neutral'
                        ) : '➡️ Starting'}
                    </span>
                </div>
            </div>

            <style>{`
                .cumulative-chart {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .chart-wrapper {
                    position: relative;
                    width: 100%;
                }

                .chart-info {
                    display: flex;
                    justify-content: space-around;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 12px;
                    backdrop-filter: blur(5px);
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .info-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                }

                .info-value {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 600;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .chart-info {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .info-item {
                        flex-direction: row;
                        justify-content: space-between;
                    }

                    .info-label {
                        font-size: 14px;
                    }

                    .info-value {
                        font-size: 14px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CumulativeChart;