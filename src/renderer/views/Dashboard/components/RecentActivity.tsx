/**
 * Recent Activity Component
 * Timeline of recent actions and events
 */

import React from 'react';
import { useAppContext } from '@/store/AppContext';
import Card from '@/components/Common/Card';
import Badge from '@/components/Common/Badge';

interface ActivityItem {
  id: string;
  type: 'session' | 'calibration' | 'system' | 'analysis';
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'failed' | 'in-progress';
}

const RecentActivity: React.FC = () => {
  const { state } = useAppContext();

  // Mock recent activity data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'session',
      title: 'HIGH Intention Session',
      description: 'Completed 1000 trials with positive deviation',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      status: 'completed'
    },
    {
      id: '2',
      type: 'calibration',
      title: 'RNG Calibration',
      description: 'Baseline calibration check completed successfully',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'completed'
    },
    {
      id: '3',
      type: 'system',
      title: 'Database Backup',
      description: 'Automatic backup completed',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      status: 'completed'
    },
    {
      id: '4',
      type: 'session',
      title: 'LOW Intention Session',
      description: 'Completed 500 trials with expected variance',
      timestamp: new Date(Date.now() - 10800000), // 3 hours ago
      status: 'completed'
    },
    {
      id: '5',
      type: 'analysis',
      title: 'Statistical Analysis',
      description: 'Weekly analysis report generated',
      timestamp: new Date(Date.now() - 86400000), // 24 hours ago
      status: 'completed'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return '🎯';
      case 'calibration':
        return '⚙️';
      case 'system':
        return '🔧';
      case 'analysis':
        return '🔬';
      default:
        return '📝';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="small">Completed</Badge>;
      case 'failed':
        return <Badge variant="error" size="small">Failed</Badge>;
      case 'in-progress':
        return <Badge variant="primary" size="small" pulse>In Progress</Badge>;
      default:
        return <Badge variant="neutral" size="small">Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card title="Recent Activity" padding="medium">
      <div className="recent-activity__list">
        {activities.map((activity) => (
          <div key={activity.id} className="recent-activity__item">
            <div className="recent-activity__icon">
              {getActivityIcon(activity.type)}
            </div>

            <div className="recent-activity__content">
              <div className="recent-activity__header">
                <h4 className="recent-activity__title">{activity.title}</h4>
                {getStatusBadge(activity.status)}
              </div>

              <p className="recent-activity__description">
                {activity.description}
              </p>

              <div className="recent-activity__timestamp">
                {formatTimestamp(activity.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="recent-activity__empty">
          <p>No recent activity</p>
        </div>
      )}
    </Card>
  );
};

export default RecentActivity;