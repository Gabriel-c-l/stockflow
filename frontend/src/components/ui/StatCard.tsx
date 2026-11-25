import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Card } from './Card';

type Trend = 'up' | 'down' | 'neutral';
export function StatCard({ label, value, detail, trend, change, icon, tone = 'blue' }: { label: string; value: string; detail: string; trend?: Trend; change?: string; icon: ReactNode; tone?: 'blue' | 'green' | 'amber' | 'violet' }) {
  return (
    <Card className="stat-card">
      <div className="stat-card-top"><span className="stat-label">{label}</span><span className={`stat-icon stat-icon-${tone}`}>{icon}</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        {change && <span className={`stat-change stat-change-${trend ?? 'neutral'}`}><Icon name={trend === 'down' ? 'arrow-down-right' : 'arrow-up-right'} size={14} />{change}</span>}
        <span className="stat-detail">{detail}</span>
      </div>
    </Card>
  );
}
