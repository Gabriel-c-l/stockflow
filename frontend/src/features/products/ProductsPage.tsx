import { formatDate } from '../../lib/format';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ApiError } from '../../lib/api';
import { stockflowApi } from '../../lib/stockflow-api';
import type { Category, Product, ProductListResponse, ProductUnit } from '../../lib/types';
import { translate, useI18n, UserText, TranslateTree } from '../../lib/i18n';
import { blockNonNumericKey, decimalOnly, digitsOnly } from '../../lib/numeric-input';

type StatusFilter = 'active' | 'inactive' | 'all';
const PAGE_SIZE = 10;
const units: { value: ProductUnit; label: string }[] = [
  { value: 'UN', label: 'Unidade (UN)' }, { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PCT', label: 'Pacote (PCT)' }, { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'G', label: 'Grama (G)' }, { value: 'L', label: 'Litro (L)' },
  { value: 'ML', label: 'Mililitro (ML)' }, { value: 'M', label: 'Metro (M)' },
  { value: 'CM', label: 'Centímetro (CM)' },
];
const errorMessage = (error: unknown) => error instanceof ApiError ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
const dateLabel = (value: string) => formatDate(value);
const unitLabel = (unit: ProductUnit) => units.find((item) => item.value === unit)?.value ?? unit;

export function ProductsPage({ canManage = true }: { canManage?: boolean }) {
  const { language } = useI18n();
  const [result, setResult] = useState<ProductListResponse>({ items: [], pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 } });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoadError, setCategoryLoadError] = useState('');
  const [movementLoadError, setMovementLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('UN');
  const [location, setLocation] = useState('');
  const [minStock, setMinStock] = useState('0');
  const [initialQuantity, setInitialQuantity] = useState('0');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Awaited<ReturnType<typeof stockflowApi.listProductMovements>>>([]);
  const [movementLoading, setMovementLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await stockflowApi.listProducts({ search: search.trim() || undefined, status, page, pageSize: PAGE_SIZE, categoryId: categoryId || undefined });
      setResult(data);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status, page, categoryId]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => {
    stockflowApi.listCategories('active')
      .then((data) => { setCategories(data); setCategoryLoadError(''); })
      .catch((err) => setCategoryLoadError(errorMessage(err)));
  }, []);

  const stats = useMemo(() => ({
    active: result.items.filter((item) => item.isActive).length,
    low: result.items.filter((item) => item.quantity <= item.minStock).length,
  }), [result.items]);

  const resetForm = () => {
    setEditing(null); setSku(''); setName(''); setDescription(''); setPrice('0'); setFormCategoryId('');
    setUnit('UN'); setLocation(''); setMinStock('0'); setInitialQuantity('0'); setFormError('');
  };
  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (product: Product) => {
    setEditing(product); setSku(product.sku); setName(product.name); setDescription(product.description ?? ''); setPrice(String(product.price ?? 0));
    setFormCategoryId(product.categoryId ?? ''); setUnit(product.unit); setLocation(product.location ?? '');
    setMinStock(String(product.minStock)); setInitialQuantity('0'); setFormError(''); setModalOpen(true);
  };
  const closeModal = () => { if (!saving) setModalOpen(false); };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setFormError('');
    const parsedMin = Number(minStock);
    const parsedInitial = Number(initialQuantity);
    if (!sku.trim() || !name.trim()) { setFormError('SKU e nome são obrigatórios.'); return; }
    const parsedPrice = Number(price.replace(',', '.'));
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { setFormError('Informe um preço válido igual ou maior que zero.'); return; }
    if (!Number.isInteger(parsedMin) || parsedMin < 0 || !Number.isInteger(parsedInitial) || parsedInitial < 0) {
      setFormError('Estoque mínimo e quantidade inicial devem ser números inteiros iguais ou maiores que zero.'); return;
    }
    setSaving(true);
    try {
      const input = { sku: sku.trim(), name: name.trim(), description: description.trim() || null, price: parsedPrice, categoryId: formCategoryId || null, unit, location: location.trim() || null, minStock: parsedMin };
      let saved: Product;
      if (editing) {
        saved = await stockflowApi.updateProduct(editing.id, input);
      } else {
        saved = await stockflowApi.createProduct(input);
        if (parsedInitial > 0) {
          await stockflowApi.createStockMovement({ productId: saved.id, type: 'ENTRY', quantity: parsedInitial, notes: 'Estoque inicial do cadastro' });
        }
      }
      setModalOpen(false); setNotice(editing ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.');
      setPage(1); await loadProducts();
    } catch (err) { setFormError(errorMessage(err)); }
    finally { setSaving(false); }
  };

  const deactivate = async (product: Product) => {
    if (!window.confirm(`${translate('Deseja desativar o produto', language)} "${product.name}"?`)) return;
    setNotice('');
    try { await stockflowApi.deactivateProduct(product.id); setNotice('Produto desativado com sucesso.'); await loadProducts(); }
    catch (err) { setError(errorMessage(err)); }
  };

  const openDetails = async (product: Product) => {
    setSelected(product); setMovements([]); setMovementLoadError(''); setMovementLoading(true);
    try { setMovements(await stockflowApi.listProductMovements(product.id)); }
    catch (err) { setMovementLoadError(errorMessage(err)); }
    finally { setMovementLoading(false); }
  };

  return (
    <TranslateTree>
    <div className="page-stack">
      <PageHeader eyebrow="INVENTÁRIO / CATÁLOGO" title="Produtos" description={canManage ? "Cadastre, organize e acompanhe os produtos do seu estoque." : "Consulte os produtos cadastrados e acompanhe os níveis de estoque."}
        actions={canManage ? <Button leadingIcon={<Icon name="plus" size={16} />} onClick={openCreate}>Novo produto</Button> : undefined} />

      {notice && <div className="category-alert category-alert-success" role="status">{notice}</div>}
      <div className="products-summary">
        <Card className="products-mini-stat"><span>Produtos encontrados</span><strong>{result.pagination.total}</strong><small>No filtro atual</small></Card>
        <Card className="products-mini-stat"><span>Ativos nesta página</span><strong>{stats.active}</strong><small>De até {PAGE_SIZE} produtos</small></Card>
        <Card className="products-mini-stat"><span>Estoque baixo nesta página</span><strong className={stats.low ? 'products-stat-warning' : ''}>{stats.low}</strong><small>Quantidade ≤ estoque mínimo</small></Card>
      </div>

      <Card className="category-management-card products-card">
        <div className="products-toolbar">
          <div className="category-search products-search"><Icon name="search" size={16} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome ou SKU..." aria-label="Buscar produtos" /></div>
          <div className="products-filters">
            <label className="category-filter">Categoria
              <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
                <option value="">Todas</option>{categories.map((category) => <option key={category.id} value={category.id} data-i18n-ignore="true">{category.name}</option>)}
              </select>
            </label>
            <label className="category-filter">Status
              <select value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}>
                <option value="active">Ativos</option><option value="inactive">Inativos</option><option value="all">Todos</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? <div className="category-state"><span className="loading-spinner" />Carregando produtos...</div>
          : error ? <div className="category-state category-state-error"><Icon name="alert" size={24} /><strong>Não foi possível carregar os produtos</strong><span>{error}</span><Button variant="secondary" onClick={() => void loadProducts()}>Tentar novamente</Button></div>
          : result.items.length === 0 ? <div className="category-state"><div className="category-empty-icon"><Icon name="package" size={23} /></div><strong>{search || categoryId ? 'Nenhum produto encontrado' : 'Seu catálogo ainda está vazio'}</strong><span>{search || categoryId ? 'Ajuste os filtros ou tente outra busca.' : 'Cadastre seu primeiro produto para começar a controlar o estoque.'}</span>{canManage && status !== 'inactive' && <Button leadingIcon={<Icon name="plus" size={15} />} onClick={openCreate}>Cadastrar produto</Button>}</div>
          : <div className="table-wrap products-table-wrap"><table className="data-table products-table">
            <thead><tr><th>PRODUTO</th><th>CATEGORIA</th><th>PREÇO UNITÁRIO</th><th>ESTOQUE</th><th>LOCALIZAÇÃO</th><th>STATUS</th>{canManage && <th><span className="sr-only">Ações</span></th>}</tr></thead>
            <tbody>{result.items.map((product) => {
              const low = product.quantity <= product.minStock;
              return <tr key={product.id}>
                <td><button className="products-product-button" onClick={() => void openDetails(product)}><span className="category-avatar"><Icon name="package" size={16} /></span><span><UserText as="strong">{product.name}</UserText><UserText as="small">{product.sku}</UserText></span></button></td>
                <td><UserText>{product.category?.name ?? '—'}</UserText></td>
                <td className="products-price-cell">{Number(product.price ?? 0).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td><span className="products-quantity">{product.quantity} {unitLabel(product.unit)}</span>{low && <small className="products-low-label">Estoque baixo</small>}</td>
                <td><UserText>{product.location || '—'}</UserText></td>
                <td><Badge tone={!product.isActive ? 'neutral' : low ? 'warning' : 'success'}>{!product.isActive ? 'Inativo' : low ? 'Estoque baixo' : 'Disponível'}</Badge></td>
                {canManage && <td><div className="category-row-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(product)}>Editar</Button>{product.isActive && <Button size="sm" variant="ghost" onClick={() => void deactivate(product)}>Desativar</Button>}</div></td>}
              </tr>;
            })}</tbody>
          </table></div>}

        <div className="products-footer"><span>{result.pagination.total === 0 ? 'Nenhum registro' : language === 'en' ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, result.pagination.total)} of ${result.pagination.total} products` : `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, result.pagination.total)} de ${result.pagination.total} produtos`}</span>
          <div><Button size="sm" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Anterior</Button><span className="products-page-number">{page} / {Math.max(result.pagination.totalPages, 1)}</span><Button size="sm" variant="secondary" disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div>
        </div>
      </Card>

      {canManage && modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <section className="category-modal products-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
          <div className="category-modal-header"><div><span className="page-eyebrow">CATÁLOGO DE ESTOQUE</span><h2 id="product-form-title">{editing ? 'Editar produto' : 'Novo produto'}</h2><p>Preencha os dados para manter seu catálogo organizado.</p></div><button className="icon-button" type="button" onClick={closeModal} aria-label="Fechar">×</button></div>
          <form onSubmit={(e) => void submitProduct(e)}>
            {categoryLoadError && <div className="category-alert category-alert-warning" role="status">Não foi possível carregar as categorias. Você ainda pode salvar o produto sem categoria. {categoryLoadError}</div>}
            <div className="products-form-grid">
              <label className="category-form-field">SKU <span>*</span><input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex.: ELE-001" maxLength={60} required /></label>
              <label className="category-form-field">Nome do produto <span>*</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Teclado sem fio" maxLength={120} required /></label>
              <label className="category-form-field">Preço unitário (R$)<input type="text" inputMode="decimal" value={price} onKeyDown={(e) => blockNonNumericKey(e, true)} onChange={(e) => setPrice(decimalOnly(e.target.value))} placeholder="0,00"/><small>Preço atual de referência; não altera o custo histórico das entradas.</small></label>
              <label className="category-form-field">Categoria<select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id} data-i18n-ignore="true">{category.name}</option>)}</select></label>
              <label className="category-form-field">Unidade<select value={unit} onChange={(e) => setUnit(e.target.value as ProductUnit)}>{units.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className="category-form-field">Localização<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Prateleira A-03" maxLength={120} /></label>
              <label className="category-form-field">Estoque mínimo<input type="text" inputMode="numeric" value={minStock} onKeyDown={(e) => blockNonNumericKey(e)} onChange={(e) => setMinStock(digitsOnly(e.target.value, 9))} /></label>
              {!editing && <label className="category-form-field">Quantidade inicial<input type="text" inputMode="numeric" value={initialQuantity} onKeyDown={(e) => blockNonNumericKey(e)} onChange={(e) => setInitialQuantity(digitsOnly(e.target.value, 9))} /><small>Será registrada como uma entrada de estoque.</small></label>}
              <label className="category-form-field products-description-field">Descrição<textarea rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Informações adicionais sobre o produto." /></label>
            </div>
            {formError && <div className="category-alert category-alert-error" role="alert">{formError}</div>}
            <div className="category-modal-actions"><Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar produto'}</Button></div>
          </form>
        </section>
      </div>}

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        <section className="category-modal products-detail-modal" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
          <div className="category-modal-header"><div><span className="page-eyebrow">DETALHES DO PRODUTO</span><h2 id="product-detail-title"><UserText>{selected.name}</UserText></h2><p><UserText>{selected.sku}</UserText> · {selected.category?.name ? <UserText>{selected.category.name}</UserText> : 'Sem categoria'}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Fechar">×</button></div>
          <div className="products-detail-grid"><div><span>Preço unitário</span><strong>{Number(selected.price ?? 0).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div><div><span>Estoque atual</span><strong>{selected.quantity} {selected.unit}</strong></div><div><span>Estoque mínimo</span><strong>{selected.minStock} {selected.unit}</strong></div><div><span>Localização</span><strong>{selected.location ? <UserText>{selected.location}</UserText> : 'Não informada'}</strong></div><div><span>Status</span><strong>{selected.isActive ? 'Ativo' : 'Inativo'}</strong></div></div>
          <div className="products-history-heading"><strong>Histórico de movimentações</strong><span>Mais recentes primeiro</span></div>
          {movementLoadError && <div className="category-alert category-alert-error" role="alert">Não foi possível carregar o histórico: {movementLoadError}</div>}
          {movementLoading ? <div className="category-state"><span className="loading-spinner" />Carregando histórico...</div> : movementLoadError ? null : movements.length === 0 ? <div className="products-no-history">Nenhuma movimentação registrada para este produto.</div> : <div className="products-history-list">{movements.slice(0, 8).map((movement) => <div key={movement.id}><span className={movement.type === 'ENTRY' ? 'history-entry' : 'history-exit'}>{movement.type === 'ENTRY' ? 'Entrada' : 'Saída'}</span><strong>{movement.type === 'ENTRY' ? '+' : '−'}{movement.quantity} {selected.unit}</strong><small>{dateLabel(movement.createdAt)}{movement.notes ? <> · <UserText>{movement.notes}</UserText></> : ''}</small></div>)}</div>}
          <div className="category-modal-actions"><Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>{canManage && <Button onClick={() => { setSelected(null); openEdit(selected); }}>Editar produto</Button>}</div>
        </section>
      </div>}
    </div>
    </TranslateTree>
  );
}
