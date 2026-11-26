import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Icon } from '../../components/ui/Icon';
import { stockflowApi } from '../../lib/stockflow-api';
import type { Product, StockMovement, StockMovementType } from '../../lib/types';

type MovementRow = StockMovement & {
  product: Pick<Product, 'id' | 'sku' | 'name' | 'unit'>;
  performedBy: { id: string; name: string; email: string } | null;
};

const unitLabels: Record<string, string> = { UN: 'un', CX: 'cx', PCT: 'pct', KG: 'kg', G: 'g', L: 'L', ML: 'ml', M: 'm', CM: 'cm' };
const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function StockMovementsPage() {
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | StockMovementType>('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<StockMovementType>('ENTRY');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [movementData, productData] = await Promise.all([
        stockflowApi.listStockMovements(),
        stockflowApi.listProducts({ status: 'active', pageSize: 100 }),
      ]);
      setMovements(movementData as MovementRow[]);
      setProducts(productData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as movimentações.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => movements.filter((item) => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const matchesSearch = !term || item.product.name.toLocaleLowerCase('pt-BR').includes(term) || item.product.sku.toLocaleLowerCase('pt-BR').includes(term) || (item.performedBy?.name ?? '').toLocaleLowerCase('pt-BR').includes(term);
    return matchesSearch && (typeFilter === 'ALL' || item.type === typeFilter) && (productFilter === 'ALL' || item.productId === productFilter);
  }), [movements, search, typeFilter, productFilter]);

  const openModal = () => {
    setProductId(products[0]?.id ?? ''); setType('ENTRY'); setQuantity('1'); setNotes(''); setFormError(''); setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setFormError('');
    const amount = Number(quantity);
    if (!productId) { setFormError('Selecione um produto.'); return; }
    if (!Number.isSafeInteger(amount) || amount <= 0) { setFormError('Informe uma quantidade inteira maior que zero.'); return; }
    const selected = products.find((item) => item.id === productId);
    if (type === 'EXIT' && selected && amount > selected.quantity) { setFormError(`Estoque insuficiente. Disponível: ${selected.quantity} ${unitLabels[selected.unit] ?? selected.unit}.`); return; }
    setSaving(true);
    try {
      await stockflowApi.createStockMovement({ productId, type, quantity: amount, ...(notes.trim() ? { notes: notes.trim() } : {}) });
      setModalOpen(false); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Não foi possível registrar a movimentação.'); }
    finally { setSaving(false); }
  };

  const totalEntries = movements.filter((item) => item.type === 'ENTRY').length;
  const totalExits = movements.filter((item) => item.type === 'EXIT').length;

  return <div className="page-stack stock-movements-page">
    <PageHeader eyebrow="INVENTÁRIO" title="Movimentações de estoque" description="Registre entradas e saídas e acompanhe o histórico do estoque."
      actions={<Button onClick={openModal} leadingIcon={<Icon name="plus" size={15} />}>Nova movimentação</Button>} />
    <div className="stats-grid stock-movement-stats">
      <Card className="stat-card"><div className="stat-label">Total de movimentações</div><div className="stat-value">{movements.length}</div><div className="stat-detail">Registros no histórico</div></Card>
      <Card className="stat-card"><div className="stat-label">Entradas</div><div className="stat-value stock-stat-entry">{totalEntries}</div><div className="stat-detail">Reposições e recebimentos</div></Card>
      <Card className="stat-card"><div className="stat-label">Saídas</div><div className="stat-value stock-stat-exit">{totalExits}</div><div className="stat-detail">Retiradas e consumo</div></Card>
    </div>
    <Card className="stock-movements-card">
      <div className="stock-movement-toolbar">
        <label className="stock-filter-search"><Icon name="search" size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto, SKU ou responsável..." /></label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} aria-label="Filtrar tipo"><option value="ALL">Todos os tipos</option><option value="ENTRY">Entradas</option><option value="EXIT">Saídas</option></select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} aria-label="Filtrar produto"><option value="ALL">Todos os produtos</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>Atualizar</Button>
      </div>
      {error && <div className="category-alert category-alert-error">{error}</div>}
      {loading ? <div className="stock-empty-state">Carregando movimentações...</div> : filtered.length === 0 ? <div className="stock-empty-state"><Icon name="boxes" size={28}/><strong>Nenhuma movimentação encontrada</strong><span>Registre uma entrada ou saída para começar.</span></div> :
        <div className="table-wrap"><table className="data-table stock-movement-table"><thead><tr><th>PRODUTO</th><th>TIPO</th><th>QUANTIDADE</th><th>RESPONSÁVEL</th><th>DATA</th><th>OBSERVAÇÃO</th></tr></thead><tbody>
          {filtered.map((item) => <tr key={item.id}>
            <td><div className="product-cell"><div className="product-thumb"><Icon name="package" size={15}/></div><div><strong>{item.product.name}</strong><span>{item.product.sku}</span></div></div></td>
            <td><span className={`stock-movement-type ${item.type === 'ENTRY' ? 'stock-type-entry' : 'stock-type-exit'}`}>{item.type === 'ENTRY' ? '↑ Entrada' : '↓ Saída'}</span></td>
            <td className="quantity-cell">{item.quantity} {unitLabels[item.product.unit] ?? item.product.unit}</td>
            <td>{item.performedBy?.name ?? '—'}</td><td>{dateLabel(item.createdAt)}</td><td className="stock-notes-cell">{item.notes || '—'}</td>
          </tr>)}
        </tbody></table></div>}
      <div className="stock-results-footer">Exibindo {filtered.length} de {movements.length} movimentações</div>
    </Card>
    {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}>
      <section className="category-modal stock-movement-modal" role="dialog" aria-modal="true" aria-labelledby="stock-movement-modal-title">
        <div className="category-modal-header"><div><span className="page-eyebrow">ESTOQUE</span><h2 id="stock-movement-modal-title">Nova movimentação</h2><p>Informe os dados para atualizar o saldo do produto.</p></div><button className="icon-button" type="button" onClick={() => setModalOpen(false)} disabled={saving} aria-label="Fechar">×</button></div>
        <form onSubmit={submit}>
          <div className="stock-movement-form">
            <label className="category-form-field">Produto<select value={productId} onChange={(e) => setProductId(e.target.value)} required><option value="">Selecione um produto</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.sku} (saldo: {p.quantity} {unitLabels[p.unit] ?? p.unit})</option>)}</select></label>
            <label className="category-form-field">Tipo<select value={type} onChange={(e) => setType(e.target.value as StockMovementType)}><option value="ENTRY">Entrada</option><option value="EXIT">Saída</option></select></label>
            <label className="category-form-field">Quantidade<input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></label>
            <label className="category-form-field">Observação (opcional)<textarea rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: Compra, reposição, consumo..." /></label>
          </div>
          {formError && <div className="category-alert category-alert-error" role="alert">{formError}</div>}
          <div className="category-modal-actions"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving || products.length === 0}>{saving ? 'Registrando...' : 'Registrar movimentação'}</Button></div>
        </form>
      </section>
    </div>}
  </div>;
}
