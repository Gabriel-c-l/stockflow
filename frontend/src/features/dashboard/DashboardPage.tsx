import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Badge } from '../../components/ui/Badge';

const recentMovements = [
  { product: 'Wireless Mouse Pro', sku: 'MOU-0018', type: 'Stock in', quantity: '+ 120', date: 'Today, 09:42', user: 'Ana Silva', status: 'Completed' },
  { product: 'USB-C Hub 7-in-1', sku: 'HUB-0701', type: 'Stock out', quantity: '− 18', date: 'Today, 09:18', user: 'Marcos Lima', status: 'Completed' },
  { product: 'Mechanical Keyboard', sku: 'KEY-0110', type: 'Stock in', quantity: '+ 45', date: 'Yesterday', user: 'Ana Silva', status: 'Completed' },
  { product: '27” Monitor', sku: 'MON-0027', type: 'Stock out', quantity: '− 6', date: 'Yesterday', user: 'Gabriel Costa', status: 'Completed' },
];

export function DashboardPage() {
  return (
    <div className="page-stack">
      <PageHeader eyebrow="WORKSPACE / OVERVIEW" title="Dashboard" description="Here’s what’s happening with your inventory today." actions={<><Button variant="secondary" size="md">Last 30 days <span className="button-chevron">⌄</span></Button><Button leadingIcon={<Icon name="plus" size={16} />}>Add product</Button></>} />

      <section className="stats-grid" aria-label="Inventory overview">
        <StatCard label="Total products" value="1,284" change="8.2%" trend="up" detail="vs. last month" icon={<Icon name="package" size={18} />} tone="blue" />
        <StatCard label="Stock value" value="R$ 84,250" change="4.6%" trend="up" detail="vs. last month" icon={<Icon name="boxes" size={18} />} tone="green" />
        <StatCard label="Low stock items" value="18" detail="5 need attention" icon={<Icon name="alert" size={18} />} tone="amber" />
        <StatCard label="Out of stock" value="06" detail="Review replenishment" icon={<Icon name="activity" size={18} />} tone="violet" />
      </section>

      <section className="dashboard-grid">
        <Card className="chart-card">
          <SectionHeading title="Stock movement" description="Entries vs. exits over time" action={<Button variant="ghost" size="sm">Last 7 days <span className="button-chevron">⌄</span></Button>} />
          <div className="chart-legend"><span><i className="legend-dot legend-in" />Stock in</span><span><i className="legend-dot legend-out" />Stock out</span></div>
          <div className="chart-area" role="img" aria-label="Illustrative stock in and stock out chart for the last seven days">
            <div className="chart-y-labels"><span>300</span><span>200</span><span>100</span><span>0</span></div>
            <div className="chart-plot">
              {[0, 1, 2, 3].map((line) => <div className="chart-gridline" key={line} />)}
              <svg viewBox="0 0 680 190" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="stockInFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3977df" stopOpacity=".18" /><stop offset="100%" stopColor="#3977df" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 130 C35 118 55 105 95 112 S155 82 195 91 S255 49 290 65 S350 72 390 55 S455 68 485 45 S555 38 585 49 S645 20 680 28 L680 190 L0 190Z" fill="url(#stockInFill)" />
                <path d="M0 130 C35 118 55 105 95 112 S155 82 195 91 S255 49 290 65 S350 72 390 55 S455 68 485 45 S555 38 585 49 S645 20 680 28" fill="none" stroke="#3977df" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                <path d="M0 158 C45 145 65 153 95 143 S155 130 195 145 S250 112 290 124 S350 139 390 119 S450 125 485 108 S550 123 585 102 S640 110 680 91" fill="none" stroke="#8da8d8" strokeWidth="2.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
            </div>
          </div>
        </Card>

        <Card className="category-card">
          <SectionHeading title="Inventory by category" description="Product distribution" />
          <div className="category-content"><div className="donut-chart"><div><strong>1,284</strong><span>Products</span></div></div>
            <div className="category-legend">
              {[['Electronics','42%','category-blue'],['Accessories','27%','category-indigo'],['Office','18%','category-purple'],['Other','13%','category-gray']].map(([name, percent, color]) => <div className="category-row" key={name}><span className={`category-dot ${color}`} /><span>{name}</span><strong>{percent}</strong></div>)}
            </div>
          </div>
        </Card>
      </section>

      <Card className="movements-card">
        <SectionHeading title="Recent movements" description="Latest inventory activity across your workspace" action={<Button variant="ghost" size="sm" trailingIcon={<Icon name="arrow-right" size={15} />}>View all</Button>} />
        <div className="table-wrap">
          <table className="data-table"><thead><tr><th>PRODUCT</th><th>TYPE</th><th>QUANTITY</th><th>DATE</th><th>RESPONSIBLE</th><th>STATUS</th></tr></thead>
            <tbody>{recentMovements.map((movement) => <tr key={movement.sku}><td><div className="product-cell"><div className="product-thumb"><Icon name="package" size={16} /></div><div><strong>{movement.product}</strong><span>{movement.sku}</span></div></div></td><td><span className={movement.type === 'Stock in' ? 'movement-in' : 'movement-out'}>{movement.type}</span></td><td className="quantity-cell">{movement.quantity}</td><td>{movement.date}</td><td>{movement.user}</td><td><Badge tone="success">{movement.status}</Badge></td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <div className="prototype-note"><Icon name="trending-up" size={14} /> Dashboard layout preview — figures are sample data and will be replaced by live API responses.</div>
    </div>
  );
}
