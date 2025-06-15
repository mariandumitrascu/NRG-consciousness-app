/**
 * Professional chart themes for scientific visualization
 * Following publication standards and accessibility guidelines
 */

import { ChartTheme } from '../../components/Charts/types';

// Scientific publication theme - clean and professional
export const scientificTheme: ChartTheme = {
    colors: {
        primary: '#2563eb',      // Professional blue
        secondary: '#64748b',    // Neutral gray
        positive: '#059669',     // Success green
        negative: '#dc2626',     // Alert red
        neutral: '#6b7280',      // Mid gray
        significance: [
            '#fef3c7',            // p < 0.1 (marginal) - light yellow
            '#fed777',            // p < 0.05 (significant) - orange
            '#f59e0b',            // p < 0.01 (highly significant) - amber
            '#d97706'             // p < 0.001 (extremely significant) - dark amber
        ],
        intention: {
            high: '#059669',       // Green for high intention
            low: '#dc2626',        // Red for low intention
            baseline: '#6b7280'    // Gray for baseline
        },
        background: '#ffffff',
        grid: '#f1f5f9',
        text: '#1e293b'
    },
    fonts: {
        title: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 16,
            weight: 'bold',
            color: '#0f172a'
        },
        axis: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 12,
            weight: 'normal',
            color: '#475569'
        },
        legend: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 11,
            weight: 'normal',
            color: '#64748b'
        },
        annotation: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 10,
            weight: 'normal',
            color: '#64748b'
        }
    },
    spacing: {
        padding: 16,
        margin: 20,
        legendSpacing: 12,
        axisPadding: 8
    },
    animations: {
        duration: 300,
        easing: 'easeInOut',
        enabled: true
    }
};

// Dark mode theme for extended research sessions
export const darkTheme: ChartTheme = {
    colors: {
        primary: '#60a5fa',      // Light blue
        secondary: '#94a3b8',    // Light gray
        positive: '#10b981',     // Bright green
        negative: '#f87171',     // Bright red
        neutral: '#9ca3af',      // Light neutral
        significance: [
            '#451a03',            // Dark amber tones
            '#78350f',
            '#92400e',
            '#b45309'
        ],
        intention: {
            high: '#10b981',
            low: '#f87171',
            baseline: '#9ca3af'
        },
        background: '#0f172a',
        grid: '#1e293b',
        text: '#f1f5f9'
    },
    fonts: {
        title: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 16,
            weight: 'bold',
            color: '#f8fafc'
        },
        axis: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 12,
            weight: 'normal',
            color: '#cbd5e1'
        },
        legend: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 11,
            weight: 'normal',
            color: '#94a3b8'
        },
        annotation: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 10,
            weight: 'normal',
            color: '#94a3b8'
        }
    },
    spacing: {
        padding: 16,
        margin: 20,
        legendSpacing: 12,
        axisPadding: 8
    },
    animations: {
        duration: 300,
        easing: 'easeInOut',
        enabled: true
    }
};

// High contrast theme for accessibility
export const highContrastTheme: ChartTheme = {
    colors: {
        primary: '#000000',
        secondary: '#333333',
        positive: '#006600',
        negative: '#cc0000',
        neutral: '#666666',
        significance: [
            '#ffff99',
            '#ffcc00',
            '#ff9900',
            '#ff6600'
        ],
        intention: {
            high: '#006600',
            low: '#cc0000',
            baseline: '#666666'
        },
        background: '#ffffff',
        grid: '#cccccc',
        text: '#000000'
    },
    fonts: {
        title: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 18,
            weight: 'bold',
            color: '#000000'
        },
        axis: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 14,
            weight: 'bold',
            color: '#000000'
        },
        legend: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 13,
            weight: 'bold',
            color: '#000000'
        },
        annotation: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 12,
            weight: 'bold',
            color: '#000000'
        }
    },
    spacing: {
        padding: 20,
        margin: 24,
        legendSpacing: 16,
        axisPadding: 12
    },
    animations: {
        duration: 0,
        easing: 'linear',
        enabled: false
    }
};

// Print-friendly theme for publications
export const printTheme: ChartTheme = {
    colors: {
        primary: '#000000',
        secondary: '#333333',
        positive: '#000000',
        negative: '#666666',
        neutral: '#999999',
        significance: [
            '#f5f5f5',
            '#e0e0e0',
            '#cccccc',
            '#b3b3b3'
        ],
        intention: {
            high: '#000000',
            low: '#666666',
            baseline: '#999999'
        },
        background: '#ffffff',
        grid: '#e5e5e5',
        text: '#000000'
    },
    fonts: {
        title: {
            family: 'Times, serif',
            size: 14,
            weight: 'bold',
            color: '#000000'
        },
        axis: {
            family: 'Times, serif',
            size: 10,
            weight: 'normal',
            color: '#000000'
        },
        legend: {
            family: 'Times, serif',
            size: 9,
            weight: 'normal',
            color: '#000000'
        },
        annotation: {
            family: 'Times, serif',
            size: 8,
            weight: 'normal',
            color: '#000000'
        }
    },
    spacing: {
        padding: 12,
        margin: 16,
        legendSpacing: 10,
        axisPadding: 6
    },
    animations: {
        duration: 0,
        easing: 'linear',
        enabled: false
    }
};

// Color-blind safe theme
export const colorBlindSafeTheme: ChartTheme = {
    colors: {
        primary: '#1f77b4',      // Blue
        secondary: '#ff7f0e',    // Orange
        positive: '#2ca02c',     // Green
        negative: '#d62728',     // Red
        neutral: '#7f7f7f',      // Gray
        significance: [
            '#ffecb3',            // Light amber
            '#ffc947',            // Medium amber
            '#ff8f00',            // Dark amber
            '#e65100'             // Very dark amber
        ],
        intention: {
            high: '#2ca02c',       // Green (distinguishable)
            low: '#d62728',        // Red (distinguishable)
            baseline: '#7f7f7f'    // Gray
        },
        background: '#ffffff',
        grid: '#f0f0f0',
        text: '#2f2f2f'
    },
    fonts: {
        title: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 16,
            weight: 'bold',
            color: '#2f2f2f'
        },
        axis: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 12,
            weight: 'normal',
            color: '#5f5f5f'
        },
        legend: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 11,
            weight: 'normal',
            color: '#7f7f7f'
        },
        annotation: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 10,
            weight: 'normal',
            color: '#7f7f7f'
        }
    },
    spacing: {
        padding: 16,
        margin: 20,
        legendSpacing: 12,
        axisPadding: 8
    },
    animations: {
        duration: 300,
        easing: 'easeInOut',
        enabled: true
    }
};

// Presentation theme for larger displays
export const presentationTheme: ChartTheme = {
    colors: {
        primary: '#1e40af',
        secondary: '#64748b',
        positive: '#059669',
        negative: '#dc2626',
        neutral: '#6b7280',
        significance: [
            '#fef3c7',
            '#fed777',
            '#f59e0b',
            '#d97706'
        ],
        intention: {
            high: '#059669',
            low: '#dc2626',
            baseline: '#6b7280'
        },
        background: '#ffffff',
        grid: '#f1f5f9',
        text: '#1e293b'
    },
    fonts: {
        title: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 24,
            weight: 'bold',
            color: '#0f172a'
        },
        axis: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 16,
            weight: 'normal',
            color: '#475569'
        },
        legend: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 14,
            weight: 'normal',
            color: '#64748b'
        },
        annotation: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 12,
            weight: 'normal',
            color: '#64748b'
        }
    },
    spacing: {
        padding: 24,
        margin: 32,
        legendSpacing: 16,
        axisPadding: 12
    },
    animations: {
        duration: 500,
        easing: 'easeInOut',
        enabled: true
    }
};

// Theme registry for easy access
export const chartThemes = {
    scientific: scientificTheme,
    dark: darkTheme,
    highContrast: highContrastTheme,
    print: printTheme,
    colorBlindSafe: colorBlindSafeTheme,
    presentation: presentationTheme
} as const;

export type ThemeName = keyof typeof chartThemes;

// Theme utility functions
export function getTheme(themeName: ThemeName): ChartTheme {
    return chartThemes[themeName];
}

export function getSignificanceColor(pValue: number, theme: ChartTheme): string {
    if (pValue < 0.001) return theme.colors.significance[3];
    if (pValue < 0.01) return theme.colors.significance[2];
    if (pValue < 0.05) return theme.colors.significance[1];
    if (pValue < 0.1) return theme.colors.significance[0];
    return theme.colors.neutral;
}

export function getIntentionColor(intention: 'high' | 'low' | 'baseline' | null, theme: ChartTheme): string {
    if (!intention || intention === 'baseline') return theme.colors.intention.baseline;
    return theme.colors.intention[intention];
}

// Chart.js theme adapter
export function adaptThemeForChartJs(theme: ChartTheme) {
    return {
        plugins: {
            legend: {
                labels: {
                    font: {
                        family: theme.fonts.legend.family,
                        size: theme.fonts.legend.size,
                        weight: theme.fonts.legend.weight
                    },
                    color: theme.fonts.legend.color,
                    padding: theme.spacing.legendSpacing
                }
            },
            tooltip: {
                titleFont: {
                    family: theme.fonts.title.family,
                    size: theme.fonts.title.size - 2,
                    weight: theme.fonts.title.weight
                },
                bodyFont: {
                    family: theme.fonts.axis.family,
                    size: theme.fonts.axis.size,
                    weight: theme.fonts.axis.weight
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        family: theme.fonts.axis.family,
                        size: theme.fonts.axis.size,
                        weight: theme.fonts.axis.weight
                    },
                    color: theme.fonts.axis.color,
                    padding: theme.spacing.axisPadding
                },
                grid: {
                    color: theme.colors.grid
                }
            },
            y: {
                ticks: {
                    font: {
                        family: theme.fonts.axis.family,
                        size: theme.fonts.axis.size,
                        weight: theme.fonts.axis.weight
                    },
                    color: theme.fonts.axis.color,
                    padding: theme.spacing.axisPadding
                },
                grid: {
                    color: theme.colors.grid
                }
            }
        },
        animation: {
            duration: theme.animations.enabled ? theme.animations.duration : 0,
            easing: theme.animations.easing
        },
        layout: {
            padding: theme.spacing.padding
        }
    };
}