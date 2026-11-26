import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ApiError } from '../../lib/api';
import { stockflowApi } from '../../lib/stockflow-api';
import type { Category } from '../../lib/types';

type StatusFilter = 'active' | 'inactive' | 'all';

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  return 'Não foi possível concluir a operação. Tente novamente.';
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await stockflowApi.listCategories(status));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  const visibleCategories = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return categories;
    return categories.filter((category) =>
      category.name.toLocaleLowerCase('pt-BR').includes(normalized)
      || (category.description ?? '').toLocaleLowerCase('pt-BR').includes(normalized),
    );
  }, [categories, search]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setActionError('');
    setNotice('');
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? '');
    setActionError('');
    setNotice('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setActionError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setActionError('Informe o nome da categoria.');
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      const input = { name: trimmedName, description: description.trim() || null };
      if (editing) await stockflowApi.updateCategory(editing.id, input);
      else await stockflowApi.createCategory(input);
      setFormOpen(false);
      setEditing(null);
      setNotice(editing ? 'Categoria atualizada com sucesso.' : 'Categoria criada com sucesso.');
      await loadCategories();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (category: Category) => {
    const confirmed = window.confirm(`Deseja desativar a categoria "${category.name}"?`);
    if (!confirmed) return;
    setActionError('');
    setNotice('');
    try {
      await stockflowApi.deactivateCategory(category.id);
      setNotice('Categoria desativada com sucesso.');
      await loadCategories();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="INVENTÁRIO / ORGANIZAÇÃO"
        title="Categorias"
        description="Organize seus produtos em categorias para facilitar a consulta e o controle do estoque."
        actions={<Button leadingIcon={<Icon name="plus" size={16} />} onClick={openCreate}>Nova categoria</Button>}
      />

      {notice && <div className="category-alert category-alert-success" role="status">{notice}</div>}
      {actionError && !formOpen && <div className="category-alert category-alert-error" role="alert">{actionError}</div>}

      <Card className="category-management-card">
        <div className="category-toolbar">
          <div className="category-search">
            <Icon name="search" size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar categoria..." aria-label="Buscar categoria" />
          </div>
          <div className="category-filter">
            <label htmlFor="category-status">Exibir</label>
            <select id="category-status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="category-state"><span className="loading-spinner" />Carregando categorias...</div>
        ) : error ? (
          <div className="category-state category-state-error">
            <Icon name="alert" size={24} />
            <strong>Não foi possível carregar as categorias</strong>
            <span>{error}</span>
            <Button variant="secondary" onClick={() => void loadCategories()}>Tentar novamente</Button>
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="category-state">
            <div className="category-empty-icon"><Icon name="boxes" size={23} /></div>
            <strong>{search ? 'Nenhuma categoria encontrada' : 'Ainda não há categorias aqui'}</strong>
            <span>{search ? 'Tente buscar por outro termo.' : 'Crie sua primeira categoria para começar a organizar os produtos.'}</span>
            {!search && status !== 'inactive' && <Button leadingIcon={<Icon name="plus" size={15} />} onClick={openCreate}>Criar categoria</Button>}
          </div>
        ) : (
          <div className="table-wrap category-table-wrap">
            <table className="data-table category-table">
              <thead><tr><th>CATEGORIA</th><th>DESCRIÇÃO</th><th>STATUS</th><th>CRIADA EM</th><th><span className="sr-only">Ações</span></th></tr></thead>
              <tbody>
                {visibleCategories.map((category) => (
                  <tr key={category.id}>
                    <td><div className="category-name-cell"><span className="category-avatar"><Icon name="boxes" size={16} /></span><strong>{category.name}</strong></div></td>
                    <td className="category-description">{category.description || '—'}</td>
                    <td><Badge tone={category.isActive ? 'success' : 'neutral'}>{category.isActive ? 'Ativa' : 'Inativa'}</Badge></td>
                    <td>{new Intl.DateTimeFormat('pt-BR').format(new Date(category.createdAt))}</td>
                    <td><div className="category-row-actions">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(category)}>Editar</Button>
                      {category.isActive && <Button size="sm" variant="ghost" onClick={() => void handleDeactivate(category)}>Desativar</Button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && <div className="category-table-footer"><span>{visibleCategories.length} {visibleCategories.length === 1 ? 'categoria' : 'categorias'}</span><Button size="sm" variant="ghost" onClick={() => void loadCategories()} leadingIcon={<Icon name="activity" size={14} />}>Atualizar</Button></div>}
      </Card>

      {formOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section className="category-modal" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
            <div className="category-modal-header">
              <div><span className="page-eyebrow">GERENCIAMENTO</span><h2 id="category-form-title">{editing ? 'Editar categoria' : 'Nova categoria'}</h2><p>Preencha as informações abaixo.</p></div>
              <button className="icon-button" type="button" onClick={closeForm} aria-label="Fechar">×</button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <label className="category-form-field">Nome da categoria <span>*</span>
                <input autoFocus maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Eletrônicos" required />
                <small>Até 100 caracteres.</small>
              </label>
              <label className="category-form-field">Descrição
                <textarea maxLength={1000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva quais produtos pertencem a esta categoria." />
                <small>Opcional · até 1.000 caracteres.</small>
              </label>
              {actionError && <div className="category-alert category-alert-error" role="alert">{actionError}</div>}
              <div className="category-modal-actions">
                <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar categoria'}</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
