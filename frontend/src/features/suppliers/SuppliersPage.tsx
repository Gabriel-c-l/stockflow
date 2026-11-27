import { formatDate } from '../../lib/format';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ApiError } from '../../lib/api';
import { stockflowApi } from '../../lib/stockflow-api';
import type { Supplier } from '../../lib/types';
import { translate, useI18n, UserText, TranslateTree } from '../../lib/i18n';
import { blockNonNumericKey, digitsOnly } from '../../lib/numeric-input';

type StatusFilter = 'active' | 'inactive' | 'all';
const errorMessage = (error: unknown) => error instanceof ApiError ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
const dateLabel = (value: string) => formatDate(value);
const onlyDigits = digitsOnly;
const formatDocument = (value: string) => {
  const digits = onlyDigits(value, 14);
  if (digits.length <= 11) return digits.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4').replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
};
const formatPhone = (value: string) => {
  const digits = onlyDigits(value, 15);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return digits.replace(/^(\d{2})(\d+)/, '($1) $2');
  if (digits.length <= 11) return digits.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, (_, ddd, prefix, suffix) => `(${ddd}) ${prefix}${suffix ? `-${suffix}` : ''}`);
  return digits;
};

export function SuppliersPage({ canManage = true }: { canManage?: boolean }) {
  const { language } = useI18n();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setSuppliers(await stockflowApi.listSuppliers(status)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return suppliers;
    return suppliers.filter((item) => [item.name, item.taxId ?? '', item.email ?? '', item.phone ?? ''].some((value) => value.toLocaleLowerCase('pt-BR').includes(term)));
  }, [suppliers, search]);

  const reset = () => { setEditing(null); setName(''); setTaxId(''); setEmail(''); setPhone(''); setAddress(''); setNotes(''); setFormError(''); };
  const openCreate = () => { reset(); setModalOpen(true); };
  const openEdit = (supplier: Supplier) => {
    setEditing(supplier); setName(supplier.name); setTaxId(onlyDigits(supplier.taxId ?? '', 14)); setEmail(supplier.email ?? '');
    setPhone(onlyDigits(supplier.phone ?? '', 15)); setAddress(supplier.address ?? ''); setNotes(supplier.notes ?? ''); setFormError(''); setModalOpen(true);
  };
  const close = () => { if (!saving) setModalOpen(false); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setFormError('');
    if (!name.trim()) { setFormError('Informe o nome do fornecedor.'); return; }
    const digits = taxId.replace(/\D/g, '');
    if (taxId.trim() && digits.length === 0) { setFormError('CPF/CNPJ deve conter apenas números. Confira o documento informado.'); return; }
    if (digits && digits.length !== 11 && digits.length !== 14) { setFormError(`Documento incompleto ou inválido: foram encontrados ${digits.length} dígitos. CPF exige 11 e CNPJ exige 14.`); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setFormError('E-mail inválido. Use um formato como nome@empresa.com.'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phone.trim() && (phoneDigits.length < 10 || phoneDigits.length > 15)) { setFormError('Telefone inválido. Informe DDD e número, com 10 a 15 dígitos.'); return; }
    setSaving(true);
    try {
      const input = { name: name.trim(), taxId: digits || undefined, email: email.trim() || undefined, phone: onlyDigits(phone, 15) || undefined, address: address.trim() || undefined, notes: notes.trim() || undefined };
      if (editing) await stockflowApi.updateSupplier(editing.id, input);
      else await stockflowApi.createSupplier(input);
      setModalOpen(false); setNotice(editing ? 'Fornecedor atualizado com sucesso.' : 'Fornecedor cadastrado com sucesso.'); await load();
    } catch (err) { setFormError(errorMessage(err)); }
    finally { setSaving(false); }
  };

  const deactivate = async (supplier: Supplier) => {
    if (!window.confirm(`${translate('Deseja desativar o fornecedor', language)} "${supplier.name}"?`)) return;
    setNotice('');
    try { await stockflowApi.deactivateSupplier(supplier.id); setNotice('Fornecedor desativado com sucesso.'); await load(); }
    catch (err) { setError(errorMessage(err)); }
  };

  return <TranslateTree><div className="page-stack">
    <PageHeader eyebrow="INVENTÁRIO / RELACIONAMENTOS" title="Fornecedores" description={canManage ? "Mantenha os dados dos fornecedores organizados para vincular recebimentos e acompanhar a origem das entradas." : "Consulte os fornecedores vinculados às entradas do estoque."}
      actions={canManage ? <Button leadingIcon={<Icon name="plus" size={16} />} onClick={openCreate}>Novo fornecedor</Button> : undefined} />
    {notice && <div className="category-alert category-alert-success" role="status">{notice}</div>}
    <Card className="category-management-card supplier-management-card">
      <div className="category-toolbar">
        <div className="category-search"><Icon name="search" size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..." aria-label="Buscar fornecedores"/></div>
        <div className="category-filter"><label htmlFor="supplier-status">Exibir</label><select id="supplier-status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="all">Todos</option></select></div>
      </div>
      {loading ? <div className="category-state"><span className="loading-spinner"/>Carregando fornecedores...</div>
        : error ? <div className="category-state category-state-error"><Icon name="alert" size={24}/><strong>Não foi possível carregar os fornecedores</strong><span>{error}</span><Button variant="secondary" onClick={() => void load()}>Tentar novamente</Button></div>
        : visible.length === 0 ? <div className="category-state"><div className="category-empty-icon"><Icon name="truck" size={23}/></div><strong>{search ? 'Nenhum fornecedor encontrado' : 'Ainda não há fornecedores'}</strong><span>{search ? 'Tente buscar por outro termo.' : 'Cadastre fornecedores para registrar a origem das entradas de estoque.'}</span>{canManage && !search && status !== 'inactive' && <Button leadingIcon={<Icon name="plus" size={15}/>} onClick={openCreate}>Cadastrar fornecedor</Button>}</div>
        : <div className="table-wrap category-table-wrap"><table className="data-table category-table supplier-table"><thead><tr><th>FORNECEDOR</th><th>CPF / CNPJ</th><th>CONTATO</th><th>STATUS</th><th>CADASTRADO EM</th>{canManage && <th><span className="sr-only">Ações</span></th>}</tr></thead><tbody>
          {visible.map((supplier) => <tr key={supplier.id}>
            <td><div className="category-name-cell"><span className="category-avatar supplier-avatar"><Icon name="truck" size={16}/></span><div className="supplier-name"><UserText as="strong">{supplier.name}</UserText><small>{supplier.address ? <UserText>{supplier.address}</UserText> : 'Endereço não informado'}</small></div></div></td>
            <td><UserText>{supplier.taxId || '—'}</UserText></td><td><div className="supplier-contact"><UserText as="strong">{supplier.email || '—'}</UserText><small>{supplier.phone ? <UserText>{supplier.phone}</UserText> : 'Telefone não informado'}</small></div></td>
            <td><Badge tone={supplier.isActive ? 'success' : 'neutral'}>{supplier.isActive ? 'Ativo' : 'Inativo'}</Badge></td><td>{dateLabel(supplier.createdAt)}</td>
            {canManage && <td><div className="category-row-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(supplier)}>Editar</Button>{supplier.isActive && <Button size="sm" variant="ghost" onClick={() => void deactivate(supplier)}>Desativar</Button>}</div></td>}
          </tr>)}
        </tbody></table></div>}
      {!loading && !error && <div className="category-table-footer"><span>{visible.length} {visible.length === 1 ? 'fornecedor' : 'fornecedores'}</span><Button size="sm" variant="ghost" onClick={() => void load()} leadingIcon={<Icon name="activity" size={14}/>}>Atualizar</Button></div>}
    </Card>
    {canManage && modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="category-modal supplier-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
        <div className="category-modal-header"><div><span className="page-eyebrow">CADASTRO DE PARCEIROS</span><h2 id="supplier-form-title">{editing ? 'Editar fornecedor' : 'Novo fornecedor'}</h2><p>Informe os dados de identificação e contato.</p></div><button className="icon-button" type="button" onClick={close} disabled={saving} aria-label="Fechar">×</button></div>
        <form onSubmit={(event) => void submit(event)}>
          <div className="supplier-form-grid">
            <label className="category-form-field supplier-field-wide">Nome / Razão social <span>*</span><input autoFocus maxLength={160} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Distribuidora Central Ltda." required/></label>
            <label className="category-form-field">CPF / CNPJ<input inputMode="numeric" autoComplete="off" maxLength={18} value={formatDocument(taxId)} onKeyDown={(event) => blockNonNumericKey(event)} onChange={(event) => setTaxId(onlyDigits(event.target.value, 14))} placeholder="Digite somente números"/><small>11 dígitos para CPF ou 14 para CNPJ.</small></label>
            <label className="category-form-field">E-mail<input type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="compras@empresa.com"/></label>
            <label className="category-form-field">Telefone<input inputMode="numeric" autoComplete="tel" maxLength={16} value={formatPhone(phone)} onKeyDown={(event) => blockNonNumericKey(event)} onChange={(event) => setPhone(onlyDigits(event.target.value, 11))} placeholder="Somente números"/></label>
            <label className="category-form-field">Endereço<input maxLength={240} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Rua, número, cidade..."/></label>
            <label className="category-form-field supplier-field-wide">Observações<textarea rows={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Informações adicionais sobre o fornecedor."/></label>
          </div>
          {formError && <div className="category-alert category-alert-error" role="alert">{formError}</div>}
          <div className="category-modal-actions"><Button type="button" variant="secondary" onClick={close} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar fornecedor'}</Button></div>
        </form>
      </section>
    </div>}
  </div></TranslateTree>;
}
