/**
 * Quick Stats Component
 * Numerical summaries for dashboard overview
 */

import React from 'react';
import { useAppContext } from '@/store/AppContext';
import Card from '@/components/Common/Card';

const QuickStats: React.FC = () => {
  const { state } = useAppContext();

  const stats = [
    {
      label: 'Trials Today',
      value: state.trialCount.toLocaleString(),
      change: '+12%',
      positive: true
    },
    {
      label: 'Current Rate',
      value: state.rngEngineStatus?.currentRate.toFixed(3) + ' Hz' || '0.000 Hz',
      change: state.rngEngineStatus?.currentRate ?
        (((state.rngEngineStatus.currentRate / state.rngEngineStatus.targetRate) - 1) * 100).toFixed(1) + '%' :
        '0.0%',
      positive: state.rngEngineStatus ? state.rngEngineStatus.currentRate >= state.rngEngineStatus.targetRate : true
    },
    {
      label: 'Memory Usage',
      value: state.rngEngineStatus?.memoryUsage.current.toFixed(1) + ' MB' || '0.0 MB',
      change: 'Peak: ' + (state.rngEngineStatus?.memoryUsage.peak.toFixed(1) || '0.0') + ' MB',
      positive: true
    },
    {
      label: 'DB Size',
      value: (state.databaseStatus?.size || 0) + ' MB',
      change: 'Growing',
      positive: true
    }
  ];

  return (
    <Card title="Quick Statistics" padding="medium">
      <div className="quick-stats__grid">
        {stats.map((stat, index) => (
          <div key={index} className="quick-stats__item">
            <div className="quick-stats__value">{stat.value}</div>
            <div className="quick-stats__label">{stat.label}</div>
            <div className={`quick-stats__change quick-stats__change--${stat.positive ? 'positive' : 'negative'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default QuickStats;