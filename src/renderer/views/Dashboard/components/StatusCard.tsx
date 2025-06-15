/**
 * Status Card Component
 * Individual status display for dashboard metrics
 */

import React from 'react';
import Card from '@/components/Common/Card';
import Badge from '@/components/Common/Badge';

export interface StatusCardProps {
  title: string;
  status: 'running' | 'stopped' | 'connected' | 'disconnected' | 'info' | 'error';
  value: string;
  subtitle?: string;
  details?: Record<string, string>;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  value,
  subtitle,
  details
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge variant="success" size="small" pulse>Running</Badge>;
      case 'stopped':
        return <Badge variant="warning" size="small">Stopped</Badge>;
      case 'connected':
        return <Badge variant="success" size="small">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="error" size="small">Disconnected</Badge>;
      case 'info':
        return <Badge variant="info" size="small">Active</Badge>;
      case 'error':
        return <Badge variant="error" size="small">Error</Badge>;
      default:
        return <Badge variant="neutral" size="small">Unknown</Badge>;
    }
  };

  return (
    <Card
      title={title}
      actions={getStatusBadge()}
      padding="medium"
    >
      <div className="status-card__content">
        <div className="status-card__value">{value}</div>
        {subtitle && <div className="status-card__subtitle">{subtitle}</div>}

        {details && Object.keys(details).length > 0 && (
          <div className="status-card__details">
            {Object.entries(details).map(([key, detailValue]) => (
              <div key={key} className="status-card__detail">
                <span className="status-card__detail-label">{key}:</span>
                <span className="status-card__detail-value">{detailValue}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatusCard;