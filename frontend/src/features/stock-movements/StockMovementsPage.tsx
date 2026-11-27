import { formatDateTime } from '../../lib/format';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Icon } from '../../components/ui/Icon';
import { stockflowApi } from '../../lib/stockflow-api';
import type { Product, StockMovement, StockMovementType, Supplier } from '../../lib/types';
import { UserText, TranslateTree, useI18n } from '../../lib/i18n';
import { blockNonNumericKey, decimalOnly, digitsOnly } from '../../lib/numeric-input';

type MovementRow = StockMovement & {
  product: Pick<Product, 'id' | 'sku' | 'name' | 'unit'>;
  performedBy: { id: string; name: string; email: string } | null;
  supplier: Pick<Supplier, 'id' | 'name' | 'taxId'> | null;
};

const unitLabels: Record<string, string> = { UN: 'un', CX: 'cx', PCT: 'pct', KG: 'kg', G: 'g', L: 'L', ML: 'ml', M: 'm', CM: 'cm' };
const dateLabel = (value: string) => formatDateTime(value);

export function StockMovementsPage() {
  const { language } = useI18n();
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | StockMovementType>('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<StockMovementType>('ENTRY');
  const [quantity, setQuantity] = useState('1');
  const [supplierId, setSupplierId] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [movementData, productData, supplierData] = await Promise.all([
        stockflowApi.listStockMovements(),
        stockflowApi.listProducts({ status: 'active', pageSize: 100 }),
        stockflowApi.listSuppliers('active'),
      ]);
      setMovements(movementData as MovementRow[]);
      setProducts(productData.items);
      setSuppliers(supplierData);
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
    setProductId(products[0]?.id ?? ''); setType('ENTRY'); setQuantity('1'); setSupplierId(''); setUnitCost(''); setRecipient(''); setNotes(''); setFormError(''); setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setFormError('');
    const amount = Number(quantity);
    if (!productId) { setFormError('Selecione um produto.'); return; }
    if (!Number.isSafeInteger(amount) || amount <= 0) { setFormError('Informe uma quantidade inteira maior que zero.'); return; }
    const selected = products.find((item) => item.id === productId);
    if (type === 'EXIT' && selected && amount > selected.quantity) { setFormError(language === 'en' ? `Insufficient stock. Available: ${selected.quantity} ${unitLabels[selected.unit] ?? selected.unit}.` : `Estoque insuficiente. Disponível: ${selected.quantity} ${unitLabels[selected.unit] ?? selected.unit}.`); return; }
    const parsedUnitCost = unitCost.trim() ? Number(unitCost.replace(',', '.')) : undefined;
    if (type === 'ENTRY' && parsedUnitCost !== undefined && (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0)) { setFormError('Informe um custo unitário válido, igual ou maior que zero.'); return; }
    if (type === 'EXIT' && !recipient.trim()) { setFormError('Informe o destinatário da saída.'); return; }
    setSaving(true);
    try {
      await stockflowApi.createStockMovement({ productId, type, quantity: amount, ...(type === 'ENTRY' && supplierId ? { supplierId } : {}), ...(type === 'ENTRY' && parsedUnitCost !== undefined ? { unitCost: parsedUnitCost } : {}), ...(type === 'EXIT' && recipient.trim() ? { recipient: recipient.trim() } : {}), ...(notes.trim() ? { notes: notes.trim() } : {}) });
      setModalOpen(false); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Não foi possível registrar a movimentação.'); }
    finally { setSaving(false); }
  };

  const totalEntries = movements.filter((item) => item.type === 'ENTRY').length;
  const totalExits = movements.filter((item) => item.type === 'EXIT').length;

  return <TranslateTree><div className="page-stack stock-movements-page">
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
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} aria-label="Filtrar produto"><option value="ALL">Todos os produtos</option>{products.map((p) => <option key={p.id} value={p.id} data-i18n-ignore="true">{p.name}</option>)}</select>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>Atualizar</Button>
      </div>
      {error && <div className="category-alert category-alert-error">{error}</div>}
      {loading ? <div className="stock-empty-state">Carregando movimentações...</div> : filtered.length === 0 ? <div className="stock-empty-state"><Icon name="boxes" size={28}/><strong>Nenhuma movimentação encontrada</strong><span>Registre uma entrada ou saída para começar.</span></div> :
        <div className="table-wrap"><table className="data-table stock-movement-table"><thead><tr><th>PRODUTO</th><th>TIPO</th><th>QUANTIDADE</th><th>FORNECEDOR / DESTINATÁRIO</th><th>CUSTO UNITÁRIO</th><th>RESPONSÁVEL</th><th>DATA</th><th>OBSERVAÇÃO</th></tr></thead><tbody>
          {filtered.map((item) => <tr key={item.id}>
            <td><div className="product-cell"><div className="product-thumb"><Icon name="package" size={15}/></div><div><UserText as="strong">{item.product.name}</UserText><UserText as="span">{item.product.sku}</UserText></div></div></td>
            <td><span className={`stock-movement-type ${item.type === 'ENTRY' ? 'stock-type-entry' : 'stock-type-exit'}`}>{item.type === 'ENTRY' ? '↑ Entrada' : '↓ Saída'}</span></td>
            <td className="quantity-cell">{item.quantity} {unitLabels[item.product.unit] ?? item.product.unit}</td>
            <td><UserText>{item.type === 'ENTRY' ? item.supplier?.name ?? '—' : item.recipient ?? '—'}</UserText></td><td>{item.unitCost == null ? '—' : Number(item.unitCost).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: 'BRL' })}</td><td><UserText>{item.performedBy?.name ?? '—'}</UserText></td><td>{dateLabel(item.createdAt)}</td><td className="stock-notes-cell"><UserText>{item.notes || '—'}</UserText></td>
          </tr>)}
        </tbody></table></div>}
      <div className="stock-results-footer">{language === 'en' ? `Showing ${filtered.length} of ${movements.length} movements` : `Exibindo ${filtered.length} de ${movements.length} movimentações`}</div>
    </Card>
    {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}>
      <section className="category-modal stock-movement-modal" role="dialog" aria-modal="true" aria-labelledby="stock-movement-modal-title">
        <div className="category-modal-header"><div><span className="page-eyebrow">ESTOQUE</span><h2 id="stock-movement-modal-title">Nova movimentação</h2><p>Informe os dados para atualizar o saldo do produto.</p></div><button className="icon-button" type="button" onClick={() => setModalOpen(false)} disabled={saving} aria-label="Fechar">×</button></div>
        <form onSubmit={submit}>
          <div className="stock-movement-form">
            <label className="category-form-field">Produto<select value={productId} onChange={(e) => setProductId(e.target.value)} required><option value="">Selecione um produto</option>{products.map((p) => <option key={p.id} value={p.id} data-i18n-ignore="true">{p.name} — {p.sku} ({language === 'en' ? 'stock' : 'saldo'}: {p.quantity} {unitLabels[p.unit] ?? p.unit})</option>)}</select></label>
            <label className="category-form-field">Tipo<select value={type} onChange={(e) => setType(e.target.value as StockMovementType)}><option value="ENTRY">Entrada</option><option value="EXIT">Saída</option></select></label>
            <label className="category-form-field">Quantidade<input type="text" inputMode="numeric" value={quantity} onKeyDown={(e) => blockNonNumericKey(e)} onChange={(e) => setQuantity(digitsOnly(e.target.value, 9))} required /></label>
            {type === 'ENTRY' ? <>
              <label className="category-form-field">Fornecedor (opcional)<select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Não informado</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id} data-i18n-ignore="true">{supplier.name}</option>)}</select></label>
              <label className="category-form-field">Custo unitário de aquisição (R$)<input type="text" inputMode="decimal" value={unitCost} onKeyDown={(e) => blockNonNumericKey(e, true)} onChange={(e) => setUnitCost(decimalOnly(e.target.value))} placeholder="0,00"/><small>Valor histórico desta entrada.</small></label>
            </> : <label className="category-form-field">Destinatário <input maxLength={160} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Pessoa, setor ou unidade que recebeu" required /></label>}
            <label className="category-form-field">Observação (opcional)<textarea rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: Compra, reposição, consumo..." /></label>
          </div>
          {formError && <div className="category-alert category-alert-error" role="alert">{formError}</div>}
          <div className="category-modal-actions"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving || products.length === 0}>{saving ? 'Registrando...' : 'Registrar movimentação'}</Button></div>
        </form>
      </section>
    </div>}
  </div></TranslateTree>;
}
