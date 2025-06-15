/**
 * Scientific Theme System for RNG Consciousness Research Application
 * Minimal, professional design optimized for research environments
 */

export interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: {
        primary: string;
        secondary: string;
        muted: string;
    };
    chart: {
        baseline: string;
        positive: string;
        negative: string;
        intention: string;
    };
    border: string;
    shadow: string;
}

export interface ThemeSpacing {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
}

export interface ThemeTypography {
    heading: string;
    body: string;
    monospace: string;
    sizes: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
    };
    weights: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
    };
}

export interface Theme {
    colors: ThemeColors;
    spacing: ThemeSpacing;
    typography: ThemeTypography;
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
    transitions: {
        fast: string;
        medium: string;
        slow: string;
    };
}

export const theme: Theme = {
    colors: {
        primary: '#2563eb',      // Professional blue
        secondary: '#64748b',    // Neutral gray
        success: '#059669',      // Green for positive results
        warning: '#d97706',      // Orange for warnings
        error: '#dc2626',        // Red for errors
        background: '#ffffff',   // Clean white
        surface: '#f8fafc',      // Light gray surface
        text: {
            primary: '#0f172a',    // Dark text
            secondary: '#475569',  // Medium gray
            muted: '#94a3b8'       // Light gray
        },
        chart: {
            baseline: '#94a3b8',   // Gray for zero line
            positive: '#059669',   // Green for positive deviation
            negative: '#dc2626',   // Red for negative deviation
            intention: '#2563eb'   // Blue for intention periods
        },
        border: '#e2e8f0',       // Light border
        shadow: 'rgba(0, 0, 0, 0.1)' // Subtle shadow
    },
    spacing: {
        xs: '0.25rem',    // 4px
        sm: '0.5rem',     // 8px
        md: '1rem',       // 16px
        lg: '1.5rem',     // 24px
        xl: '2rem',       // 32px
        xxl: '3rem'       // 48px
    },
    typography: {
        heading: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        monospace: 'Monaco, "Cascadia Code", "JetBrains Mono", Consolas, monospace',
        sizes: {
            xs: '0.75rem',    // 12px
            sm: '0.875rem',   // 14px
            md: '1rem',       // 16px
            lg: '1.125rem',   // 18px
            xl: '1.25rem',    // 20px
            xxl: '1.5rem'     // 24px
        },
        weights: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
        }
    },
    borderRadius: {
        sm: '0.25rem',    // 4px
        md: '0.5rem',     // 8px
        lg: '0.75rem'     // 12px
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    transitions: {
        fast: '150ms ease-in-out',
        medium: '300ms ease-in-out',
        slow: '500ms ease-in-out'
    }
};

// CSS custom properties for runtime theme switching
export const generateCSSVariables = (theme: Theme): string => {
    return `
    :root {
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-success: ${theme.colors.success};
      --color-warning: ${theme.colors.warning};
      --color-error: ${theme.colors.error};
      --color-background: ${theme.colors.background};
      --color-surface: ${theme.colors.surface};
      --color-text-primary: ${theme.colors.text.primary};
      --color-text-secondary: ${theme.colors.text.secondary};
      --color-text-muted: ${theme.colors.text.muted};
      --color-chart-baseline: ${theme.colors.chart.baseline};
      --color-chart-positive: ${theme.colors.chart.positive};
      --color-chart-negative: ${theme.colors.chart.negative};
      --color-chart-intention: ${theme.colors.chart.intention};
      --color-border: ${theme.colors.border};
      --color-shadow: ${theme.colors.shadow};

      --spacing-xs: ${theme.spacing.xs};
      --spacing-sm: ${theme.spacing.sm};
      --spacing-md: ${theme.spacing.md};
      --spacing-lg: ${theme.spacing.lg};
      --spacing-xl: ${theme.spacing.xl};
      --spacing-xxl: ${theme.spacing.xxl};

      --font-heading: ${theme.typography.heading};
      --font-body: ${theme.typography.body};
      --font-monospace: ${theme.typography.monospace};

      --font-size-xs: ${theme.typography.sizes.xs};
      --font-size-sm: ${theme.typography.sizes.sm};
      --font-size-md: ${theme.typography.sizes.md};
      --font-size-lg: ${theme.typography.sizes.lg};
      --font-size-xl: ${theme.typography.sizes.xl};
      --font-size-xxl: ${theme.typography.sizes.xxl};

      --font-weight-normal: ${theme.typography.weights.normal};
      --font-weight-medium: ${theme.typography.weights.medium};
      --font-weight-semibold: ${theme.typography.weights.semibold};
      --font-weight-bold: ${theme.typography.weights.bold};

      --border-radius-sm: ${theme.borderRadius.sm};
      --border-radius-md: ${theme.borderRadius.md};
      --border-radius-lg: ${theme.borderRadius.lg};

      --shadow-sm: ${theme.shadows.sm};
      --shadow-md: ${theme.shadows.md};
      --shadow-lg: ${theme.shadows.lg};

      --transition-fast: ${theme.transitions.fast};
      --transition-medium: ${theme.transitions.medium};
      --transition-slow: ${theme.transitions.slow};
    }
  `;
};

export default theme;