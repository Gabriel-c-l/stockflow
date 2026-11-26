import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Badge } from '../../components/ui/Badge';
import { stockflowApi } from '../../lib/stockflow-api';
import type { DashboardSummary } from '../../lib/types';

const number = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const dayLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(`${value}T12:00:00Z`)).replace('.', '');
const unitLabels: Record<string, string> = { UN: 'un', CX: 'cx', PCT: 'pct', KG: 'kg', G: 'g', L: 'L', ML: 'ml', M: 'm', CM: 'cm' };

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setData(await stockflowApi.getDashboardSummary()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível carregar o dashboard.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const maxMovement = useMemo(() => Math.max(1, ...(data?.movementSeries.flatMap((day) => [day.entries, day.exits]) ?? [])), [data]);
  const categoryTotal = data ? data.categoryBreakdown.reduce((sum, item) => sum + item.productCount, 0) + data.uncategorizedProducts : 0;
  const categoryColors = ['#3977df', '#7899d3', '#a99bd6', '#d9a66a', '#9aa6b2', '#74b49b'];
  const categoryGradient = data && categoryTotal > 0 ? (() => {
    const values = [...data.categoryBreakdown.map((item) => item.productCount), data.uncategorizedProducts].filter((value) => value > 0);
    let cursor = 0;
    const stops = values.map((value, index) => { const start = cursor; cursor += value / categoryTotal * 100; return `${categoryColors[index % categoryColors.length]} ${start}% ${cursor}%`; });
    return `conic-gradient(${stops.join(', ')})`;
  })() : 'conic-gradient(#e9edf2 0% 100%)';

  return <div className="page-stack dashboard-live">
    <PageHeader eyebrow="WORKSPACE / VISÃO GERAL" title="Dashboard" description="Acompanhe o que está acontecendo no seu estoque." actions={<Button variant="secondary" onClick={() => void load()} disabled={loading} leadingIcon={<Icon name="activity" size={15} />}>{loading ? 'Atualizando...' : 'Atualizar dados'}</Button>} />
    {error && <div className="category-alert category-alert-error" role="alert">{error} <button type="button" onClick={() => void load()}>Tentar novamente</button></div>}
    <section className="stats-grid" aria-label="Resumo do estoque">
      <StatCard label="Produtos ativos" value={loading && !data ? '—' : number(data?.totalProducts ?? 0)} detail="Produtos cadastrados" icon={<Icon name="package" size={18} />} tone="blue" />
      <StatCard label="Unidades em estoque" value={loading && !data ? '—' : number(data?.totalUnits ?? 0)} detail="Saldo atual somado" icon={<Icon name="boxes" size={18} />} tone="green" />
      <StatCard label="Estoque baixo" value={loading && !data ? '—' : number(data?.lowStockProducts ?? 0)} detail="Acima de zero, no mínimo ou abaixo" icon={<Icon name="alert" size={18} />} tone="amber" />
      <StatCard label="Sem estoque" value={loading && !data ? '—' : number(data?.outOfStockProducts ?? 0)} detail="Produtos ativos com saldo zero" icon={<Icon name="activity" size={18} />} tone="violet" />
    </section>

    <section className="dashboard-grid">
      <Card className="chart-card">
        <SectionHeading title="Movimentações de estoque" description="Quantidade movimentada nos últimos 7 dias" />
        <div className="chart-legend"><span><i className="legend-dot legend-in" />Entradas</span><span><i className="legend-dot legend-out" />Saídas</span></div>
        {loading && !data ? <div className="dashboard-chart-empty">Carregando movimentações...</div> : <div className="dashboard-bars">
          {data?.movementSeries.map((day) => <div className="dashboard-bar-group" key={day.date}>
            <div className="dashboard-bars-pair">
              <div className="dashboard-bar dashboard-bar-entry" style={{ height: `${Math.max(day.entries > 0 ? 4 : 0, day.entries / maxMovement * 100)}%` }} title={`Entradas: ${day.entries}`} />
              <div className="dashboard-bar dashboard-bar-exit" style={{ height: `${Math.max(day.exits > 0 ? 4 : 0, day.exits / maxMovement * 100)}%` }} title={`Saídas: ${day.exits}`} />
            </div><span>{dayLabel(day.date)}</span>
          </div>)}
        </div>}
        <div className="dashboard-period-summary"><span><strong>{number(data?.movementSummary.entryQuantity ?? 0)}</strong> unidades recebidas</span><span><strong>{number(data?.movementSummary.exitQuantity ?? 0)}</strong> unidades retiradas</span></div>
      </Card>

      <Card className="category-card">
        <SectionHeading title="Produtos por categoria" description="Distribuição dos produtos ativos" />
        <div className="category-content">
          <div className="donut-chart" style={{ background: categoryGradient }}><div><strong>{number(data?.totalProducts ?? 0)}</strong><span>Produtos</span></div></div>
          <div className="category-legend dashboard-category-legend">
            {loading && !data ? <span>Carregando categorias...</span> : <>{data?.categoryBreakdown.filter((item) => item.productCount > 0).map((item, index) => <div className="category-row" key={item.id}><span className="category-dot" style={{ background: categoryColors[index % categoryColors.length] }} /><span>{item.name}</span><strong>{categoryTotal ? `${Math.round(item.productCount / categoryTotal * 100)}%` : '0%'}</strong></div>)}
              {(data?.uncategorizedProducts ?? 0) > 0 && <div className="category-row"><span className="category-dot" style={{ background: '#9aa6b2' }} /><span>Sem categoria</span><strong>{categoryTotal ? `${Math.round((data?.uncategorizedProducts ?? 0) / categoryTotal * 100)}%` : '0%'}</strong></div>}
              {categoryTotal === 0 && <span>Nenhum produto cadastrado.</span>}</>}
          </div>
        </div>
      </Card>
    </section>

    <Card className="movements-card">
      <SectionHeading title="Movimentações recentes" description="Últimas operações registradas no estoque" action={<Button variant="ghost" size="sm" onClick={() => { window.location.assign('/stock-movements'); }} trailingIcon={<Icon name="arrow-right" size={15} />}>Ver todas</Button>} />
      {loading && !data ? <div className="dashboard-table-empty">Carregando histórico...</div> : data?.recentMovements.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>PRODUTO</th><th>TIPO</th><th>QUANTIDADE</th><th>DATA</th><th>RESPONSÁVEL</th><th>STATUS</th></tr></thead><tbody>
        {data.recentMovements.map((movement) => <tr key={movement.id}><td><div className="product-cell"><div className="product-thumb"><Icon name="package" size={16} /></div><div><strong>{movement.product.name}</strong><span>{movement.product.sku}</span></div></div></td><td><span className={movement.type === 'ENTRY' ? 'movement-in' : 'movement-out'}>{movement.type === 'ENTRY' ? 'Entrada' : 'Saída'}</span></td><td className="quantity-cell">{movement.type === 'ENTRY' ? '+' : '−'} {number(movement.quantity)} {unitLabels[movement.product.unit] ?? movement.product.unit}</td><td>{dateLabel(movement.createdAt)}</td><td>{movement.performedBy?.name ?? '—'}</td><td><Badge tone="success">Concluída</Badge></td></tr>)}
      </tbody></table></div> : <div className="dashboard-table-empty">Nenhuma movimentação registrada ainda.</div>}
    </Card>
    <div className="prototype-note"><Icon name="activity" size={14} /> Dados atualizados diretamente da API do StockFlow. O resumo de movimentações considera os últimos 7 dias.</div>
  </div>;
}
