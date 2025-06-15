import React, { useState, useEffect } from 'react';
import { TimelinePoint, IntentionPeriod, SignificantEvent, TimeRange } from '../../../shared/types';

interface ContinuousTimelineProps {
  data: TimelinePoint[];
  intentionPeriods: IntentionPeriod[];
  significantEvents: SignificantEvent[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onPeriodSelect: (period: IntentionPeriod) => void;
}

export const ContinuousTimeline: React.FC<ContinuousTimelineProps> = ({
  data,
  intentionPeriods,
  significantEvents,
  timeRange,
  onTimeRangeChange,
  onPeriodSelect
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<IntentionPeriod | null>(null);

  const handlePeriodClick = (period: IntentionPeriod) => {
    setSelectedPeriod(period);
    onPeriodSelect(period);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <div className="continuous-timeline">
      <div className="timeline-header">
        <div className="timeline-title">
          <h3>Continuous Data Timeline</h3>
          <span className="timeline-range">
            {formatDate(timeRange.start)} - {formatDate(timeRange.end)}
          </span>
        </div>

        <div className="timeline-controls">
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
                onTimeRangeChange({ start, end: now });
              }}
            >
              24H
            </button>
            <button
              className="zoom-btn"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
                onTimeRangeChange({ start, end: now });
              }}
            >
              7D
            </button>
            <button
              className="zoom-btn"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
                onTimeRangeChange({ start, end: now });
              }}
            >
              30D
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-content">
        <div className="timeline-legend">
          <div className="legend-item">
            <div className="legend-color data-point"></div>
            <span>Data Points</span>
          </div>
          <div className="legend-item">
            <div className="legend-color intention-period"></div>
            <span>Intention Periods</span>
          </div>
          <div className="legend-item">
            <div className="legend-color significant-event"></div>
            <span>Significant Events</span>
          </div>
        </div>

        <div className="timeline-chart">
          {/* Data visualization would go here */}
          <div className="chart-placeholder">
            <div className="chart-info">
              <p>Timeline Chart Visualization</p>
              <div className="chart-stats">
                <span>Data Points: {data.length}</span>
                <span>Intention Periods: {intentionPeriods.length}</span>
                <span>Significant Events: {significantEvents.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-events">
          <h4>Recent Events</h4>
          <div className="events-list">
            {significantEvents.slice(0, 5).map((event, index) => (
              <div key={index} className={`event-item ${event.type}`}>
                <div className="event-time">
                  {formatTime(event.timestamp)}
                </div>
                <div className="event-content">
                  <div className="event-type">{event.type.toUpperCase()}</div>
                  <div className="event-description">{event.description}</div>
                  {event.metadata && (
                    <div className="event-metadata">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <span key={key} className="metadata-item">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="timeline-periods">
          <h4>Active Intention Periods</h4>
          <div className="periods-list">
            {intentionPeriods.slice(0, 10).map((period) => (
              <div
                key={period.id}
                className={`period-item ${selectedPeriod?.id === period.id ? 'selected' : ''}`}
                onClick={() => handlePeriodClick(period)}
              >
                <div className="period-time">
                  {formatTime(period.startTime)} - {period.endTime ? formatTime(period.endTime) : 'Active'}
                </div>
                <div className="period-note">
                  {period.note || 'No note'}
                </div>
                <div className="period-stats">
                  <span>Trials: {period.trials.length}</span>
                  {period.analysis && (
                    <span>Z-Score: {period.analysis.zScore.toFixed(3)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hoveredPoint && (
        <div className="timeline-tooltip">
          <div className="tooltip-time">
            {formatTime(hoveredPoint.timestamp)}
          </div>
          <div className="tooltip-value">
            Value: {hoveredPoint.value.toFixed(4)}
          </div>
          <div className="tooltip-cumulative">
            Cumulative: {hoveredPoint.cumulativeDeviation.toFixed(4)}
          </div>
        </div>
      )}

      <style>{`
        .continuous-timeline {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .timeline-title h3 {
          margin: 0 0 4px 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
        }

        .timeline-range {
          color: #94a3b8;
          font-size: 14px;
        }

        .timeline-controls {
          display: flex;
          gap: 12px;
        }

        .zoom-controls {
          display: flex;
          gap: 8px;
        }

        .zoom-btn {
          background: rgba(37, 99, 235, 0.2);
          border: 1px solid rgba(37, 99, 235, 0.3);
          color: #3b82f6;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .zoom-btn:hover {
          background: rgba(37, 99, 235, 0.3);
          border-color: rgba(37, 99, 235, 0.5);
        }

        .timeline-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .timeline-legend {
          display: flex;
          gap: 20px;
          justify-content: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.data-point {
          background: #3b82f6;
        }

        .legend-color.intention-period {
          background: #10b981;
        }

        .legend-color.significant-event {
          background: #f59e0b;
        }

        .chart-placeholder {
          height: 300px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed rgba(255, 255, 255, 0.2);
        }

        .chart-info {
          text-align: center;
          color: #94a3b8;
        }

        .chart-stats {
          display: flex;
          gap: 20px;
          margin-top: 8px;
          font-size: 14px;
        }

        .timeline-events, .timeline-periods {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 16px;
        }

        .timeline-events h4, .timeline-periods h4 {
          color: #ffffff;
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .events-list, .periods-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .event-item {
          display: flex;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }

        .event-item.anomaly {
          border-left-color: #f59e0b;
        }

        .event-item.significance {
          border-left-color: #10b981;
        }

        .event-time {
          color: #94a3b8;
          font-size: 12px;
          font-family: 'SF Mono', Monaco, monospace;
          min-width: 60px;
        }

        .event-content {
          flex: 1;
        }

        .event-type {
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .event-description {
          color: #e2e8f0;
          font-size: 13px;
          margin-top: 2px;
        }

        .event-metadata {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .metadata-item {
          color: #94a3b8;
          font-size: 11px;
        }

        .period-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .period-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .period-item.selected {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.5);
        }

        .period-time {
          color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .period-note {
          color: #e2e8f0;
          font-size: 12px;
          margin: 4px 0;
        }

        .period-stats {
          display: flex;
          gap: 12px;
          color: #94a3b8;
          font-size: 11px;
        }

        .timeline-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 8px 12px;
          color: #ffffff;
          font-size: 12px;
          z-index: 1000;
          pointer-events: none;
        }

        @media (min-width: 768px) {
          .timeline-content {
            grid-template-columns: 1fr 300px;
          }

          .chart-placeholder {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
};