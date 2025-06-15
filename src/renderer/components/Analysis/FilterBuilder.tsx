import React, { useState, useCallback } from 'react';
import {
    AnalysisConfig,
    FilterCriteria,
    TemporalFilter,
    ExperimentFilter,
    StatisticalFilter,
    QualityFilter,
    CustomFilter
} from '../../../shared/analysis-types';
import { ExperimentSession } from '../../../shared/types';
import './FilterBuilder.css';

interface FilterBuilderProps {
    config: AnalysisConfig;
    onConfigChange: (updates: Partial<AnalysisConfig>) => void;
    sessions: ExperimentSession[];
}

interface FilterBuilderState {
    isExpanded: boolean;
    activeFilterType: FilterType;
    tempFilters: FilterCriteria;
}

type FilterType = 'temporal' | 'experimental' | 'statistical' | 'quality' | 'custom';

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
    config,
    onConfigChange,
    sessions
}) => {
    const [state, setState] = useState<FilterBuilderState>({
        isExpanded: false,
        activeFilterType: 'temporal',
        tempFilters: {
            temporal: {},
            experimental: {
                sessionTypes: [],
                intentionTypes: []
            },
            statistical: {},
            quality: {
                minCompleteness: 0.8,
                minConsistency: 0.7,
                maxErrorRate: 0.05,
                randomnessTest: true
            },
            custom: []
        }
    });

    const toggleExpanded = useCallback(() => {
        setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
    }, []);

    const setActiveFilterType = useCallback((type: FilterType) => {
        setState(prev => ({ ...prev, activeFilterType: type }));
    }, []);

    const updateTimeRange = useCallback((startTime: number, endTime: number) => {
        onConfigChange({
            timeRange: {
                startTime,
                endTime,
                label: `${new Date(startTime).toLocaleDateString()} - ${new Date(endTime).toLocaleDateString()}`
            }
        });
    }, [onConfigChange]);

    const updateSessionFilter = useCallback((updates: Partial<typeof config.sessionFilter>) => {
        onConfigChange({
            sessionFilter: { ...config.sessionFilter, ...updates }
        });
    }, [config.sessionFilter, onConfigChange]);

    const applyPreset = useCallback((preset: FilterPreset) => {
        const now = Date.now();
        let startTime: number;
        let label: string;

        switch (preset) {
            case 'last7days':
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                label = 'Last 7 Days';
                break;
            case 'last30days':
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                label = 'Last 30 Days';
                break;
            case 'last90days':
                startTime = now - 90 * 24 * 60 * 60 * 1000;
                label = 'Last 90 Days';
                break;
            case 'lastYear':
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                label = 'Last Year';
                break;
            case 'allTime':
                startTime = 0;
                label = 'All Time';
                break;
            default:
                return;
        }

        onConfigChange({
            timeRange: {
                startTime,
                endTime: now,
                label
            }
        });
    }, [onConfigChange]);

    const renderQuickFilters = () => (
        <div className="quick-filters">
            <div className="filter-group">
                <label>Time Range</label>
                <div className="preset-buttons">
                    {([
                        { key: 'last7days', label: '7 Days' },
                        { key: 'last30days', label: '30 Days' },
                        { key: 'last90days', label: '90 Days' },
                        { key: 'lastYear', label: '1 Year' },
                        { key: 'allTime', label: 'All Time' }
                    ] as const).map(preset => (
                        <button
                            key={preset.key}
                            className={`preset-button ${config.timeRange.label === preset.label ? 'active' : ''}`}
                            onClick={() => applyPreset(preset.key as FilterPreset)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <label>Intention Types</label>
                <div className="checkbox-group">
                    {['high', 'low', 'baseline'].map(intention => (
                        <label key={intention} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.sessionFilter.intentionTypes.includes(intention)}
                                onChange={(e) => {
                                    const intentionTypes = e.target.checked
                                        ? [...config.sessionFilter.intentionTypes, intention]
                                        : config.sessionFilter.intentionTypes.filter(t => t !== intention);
                                    updateSessionFilter({ intentionTypes });
                                }}
                            />
                            <span className="checkbox-text">{intention.charAt(0).toUpperCase() + intention.slice(1)}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <label>Session Status</label>
                <div className="checkbox-group">
                    {['completed', 'running', 'stopped'].map(status => (
                        <label key={status} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.sessionFilter.status?.includes(status) || false}
                                onChange={(e) => {
                                    const currentStatus = config.sessionFilter.status || [];
                                    const status_arr = e.target.checked
                                        ? [...currentStatus, status]
                                        : currentStatus.filter(s => s !== status);
                                    updateSessionFilter({ status: status_arr });
                                }}
                            />
                            <span className="checkbox-text">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAdvancedFilters = () => (
        <div className="advanced-filters">
            <div className="filter-tabs">
                {([
                    { key: 'temporal', label: 'Temporal', icon: '🕒' },
                    { key: 'experimental', label: 'Experimental', icon: '🧪' },
                    { key: 'statistical', label: 'Statistical', icon: '📊' },
                    { key: 'quality', label: 'Quality', icon: '✅' },
                    { key: 'custom', label: 'Custom', icon: '⚙️' }
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        className={`filter-tab ${state.activeFilterType === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveFilterType(tab.key as FilterType)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="filter-content">
                {state.activeFilterType === 'temporal' && renderTemporalFilters()}
                {state.activeFilterType === 'experimental' && renderExperimentalFilters()}
                {state.activeFilterType === 'statistical' && renderStatisticalFilters()}
                {state.activeFilterType === 'quality' && renderQualityFilters()}
                {state.activeFilterType === 'custom' && renderCustomFilters()}
            </div>
        </div>
    );

    const renderTemporalFilters = () => (
        <div className="temporal-filters">
            <div className="filter-section">
                <h4>Date Range</h4>
                <div className="date-inputs">
                    <div className="input-group">
                        <label>Start Date</label>
                        <input
                            type="datetime-local"
                            value={new Date(config.timeRange.startTime).toISOString().slice(0, 16)}
                            onChange={(e) => {
                                const startTime = new Date(e.target.value).getTime();
                                updateTimeRange(startTime, config.timeRange.endTime);
                            }}
                        />
                    </div>
                    <div className="input-group">
                        <label>End Date</label>
                        <input
                            type="datetime-local"
                            value={new Date(config.timeRange.endTime).toISOString().slice(0, 16)}
                            onChange={(e) => {
                                const endTime = new Date(e.target.value).getTime();
                                updateTimeRange(config.timeRange.startTime, endTime);
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="filter-section">
                <h4>Time of Day</h4>
                <div className="time-range-inputs">
                    <div className="input-group">
                        <label>From</label>
                        <input type="time" />
                    </div>
                    <div className="input-group">
                        <label>To</label>
                        <input type="time" />
                    </div>
                </div>
            </div>

            <div className="filter-section">
                <h4>Day of Week</h4>
                <div className="day-checkboxes">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <label key={day} className="checkbox-label">
                            <input type="checkbox" />
                            <span className="checkbox-text">{day}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderExperimentalFilters = () => (
        <div className="experimental-filters">
            <div className="filter-section">
                <h4>Duration Range</h4>
                <div className="range-inputs">
                    <div className="input-group">
                        <label>Min Duration (minutes)</label>
                        <input
                            type="number"
                            min="0"
                            value={config.sessionFilter.minDuration ? Math.round(config.sessionFilter.minDuration / 60000) : ''}
                            onChange={(e) => {
                                const minutes = parseInt(e.target.value);
                                updateSessionFilter({
                                    minDuration: minutes > 0 ? minutes * 60000 : undefined
                                });
                            }}
                        />
                    </div>
                    <div className="input-group">
                        <label>Max Duration (minutes)</label>
                        <input
                            type="number"
                            min="0"
                            value={config.sessionFilter.maxDuration ? Math.round(config.sessionFilter.maxDuration / 60000) : ''}
                            onChange={(e) => {
                                const minutes = parseInt(e.target.value);
                                updateSessionFilter({
                                    maxDuration: minutes > 0 ? minutes * 60000 : undefined
                                });
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="filter-section">
                <h4>Trial Count Range</h4>
                <div className="range-inputs">
                    <div className="input-group">
                        <label>Min Trials</label>
                        <input
                            type="number"
                            min="0"
                            value={config.sessionFilter.minTrials || ''}
                            onChange={(e) => {
                                const minTrials = parseInt(e.target.value);
                                updateSessionFilter({
                                    minTrials: minTrials > 0 ? minTrials : undefined
                                });
                            }}
                        />
                    </div>
                    <div className="input-group">
                        <label>Max Trials</label>
                        <input
                            type="number"
                            min="0"
                            value={config.sessionFilter.maxTrials || ''}
                            onChange={(e) => {
                                const maxTrials = parseInt(e.target.value);
                                updateSessionFilter({
                                    maxTrials: maxTrials > 0 ? maxTrials : undefined
                                });
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStatisticalFilters = () => (
        <div className="statistical-filters">
            <div className="filter-section">
                <h4>Significance Level</h4>
                <div className="input-group">
                    <select>
                        <option value="0.05">p < 0.05</option>
                        <option value="0.01">p < 0.01</option>
                        <option value="0.001">p < 0.001</option>
                    </select>
                </div>
            </div>

            <div className="filter-section">
                <h4>Effect Size Range</h4>
                <div className="range-inputs">
                    <div className="input-group">
                        <label>Min Effect Size</label>
                        <input type="number" step="0.001" />
                    </div>
                    <div className="input-group">
                        <label>Max Effect Size</label>
                        <input type="number" step="0.001" />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderQualityFilters = () => (
        <div className="quality-filters">
            <div className="filter-section">
                <h4>Minimum Quality Thresholds</h4>
                <div className="quality-sliders">
                    <div className="slider-group">
                        <label>Completeness: {(state.tempFilters.quality.minCompleteness * 100).toFixed(0)}%</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={state.tempFilters.quality.minCompleteness}
                            onChange={(e) => {
                                setState(prev => ({
                                    ...prev,
                                    tempFilters: {
                                        ...prev.tempFilters,
                                        quality: {
                                            ...prev.tempFilters.quality,
                                            minCompleteness: parseFloat(e.target.value)
                                        }
                                    }
                                }));
                            }}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Consistency: {(state.tempFilters.quality.minConsistency * 100).toFixed(0)}%</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={state.tempFilters.quality.minConsistency}
                            onChange={(e) => {
                                setState(prev => ({
                                    ...prev,
                                    tempFilters: {
                                        ...prev.tempFilters,
                                        quality: {
                                            ...prev.tempFilters.quality,
                                            minConsistency: parseFloat(e.target.value)
                                        }
                                    }
                                }));
                            }}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Max Error Rate: {(state.tempFilters.quality.maxErrorRate * 100).toFixed(1)}%</label>
                        <input
                            type="range"
                            min="0"
                            max="0.2"
                            step="0.001"
                            value={state.tempFilters.quality.maxErrorRate}
                            onChange={(e) => {
                                setState(prev => ({
                                    ...prev,
                                    tempFilters: {
                                        ...prev.tempFilters,
                                        quality: {
                                            ...prev.tempFilters.quality,
                                            maxErrorRate: parseFloat(e.target.value)
                                        }
                                    }
                                }));
                            }}
                        />
                    </div>
                </div>

                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={state.tempFilters.quality.randomnessTest}
                            onChange={(e) => {
                                setState(prev => ({
                                    ...prev,
                                    tempFilters: {
                                        ...prev.tempFilters,
                                        quality: {
                                            ...prev.tempFilters.quality,
                                            randomnessTest: e.target.checked
                                        }
                                    }
                                }));
                            }}
                        />
                        <span className="checkbox-text">Require randomness test pass</span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderCustomFilters = () => (
        <div className="custom-filters">
            <div className="filter-section">
                <h4>Custom Filter Rules</h4>
                <p className="help-text">
                    Add custom filter conditions using field names and operators.
                </p>
                <div className="custom-filter-builder">
                    <button className="add-filter-button">
                        + Add Custom Filter
                    </button>
                </div>
            </div>
        </div>
    );

    const getFilterSummary = () => {
        const parts = [];

        if (config.timeRange.label) {
            parts.push(config.timeRange.label);
        }

        if (config.sessionFilter.intentionTypes.length > 0) {
            parts.push(`${config.sessionFilter.intentionTypes.length} intention types`);
        }

        if (config.sessionFilter.status && config.sessionFilter.status.length > 0) {
            parts.push(`${config.sessionFilter.status.length} status types`);
        }

        return parts.length > 0 ? parts.join(', ') : 'No filters applied';
    };

    return (
        <div className="filter-builder">
            <div className="filter-header">
                <div className="filter-info">
                    <h3>Data Filters</h3>
                    <p className="filter-summary">{getFilterSummary()}</p>
                    <p className="session-count">
                        {sessions.length} total sessions • Results will be filtered
                    </p>
                </div>
                <button
                    className={`expand-button ${state.isExpanded ? 'expanded' : ''}`}
                    onClick={toggleExpanded}
                    aria-label="Toggle filter options"
                >
                    {state.isExpanded ? '▲ Collapse' : '▼ Expand'}
                </button>
            </div>

            {renderQuickFilters()}

            {state.isExpanded && renderAdvancedFilters()}
        </div>
    );
};

type FilterPreset = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime';

export default FilterBuilder;