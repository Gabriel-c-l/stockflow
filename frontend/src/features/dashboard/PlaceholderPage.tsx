import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return <div className="page-stack"><PageHeader eyebrow={`WORKSPACE / ${title.toUpperCase()}`} title={title} description={description} /><Card className="placeholder-card"><div className="placeholder-icon"><Icon name="construction" size={22} /></div><Badge tone="info">Foundation ready</Badge><h2>This module is coming next</h2><p>The shared application layout and design components are in place. This screen will be implemented when its API contract and feature scope are ready.</p></Card></div>;
}
