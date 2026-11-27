import { formatDate } from '../../lib/format';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ApiError } from '../../lib/api';
import { stockflowApi } from '../../lib/stockflow-api';
import type { User, UserRole } from '../../lib/types';
import { translate, useI18n, UserText, TranslateTree } from '../../lib/i18n';

type StatusFilter = 'active' | 'inactive' | 'all';
type RoleFilter = 'all' | UserRole;
type UserForm = { name: string; email: string; password: string; role: UserRole };

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  OPERATOR: 'Operador',
};

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  return 'Não foi possível concluir a operação. Tente novamente.';
};

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

const dateLabel = (value: string) => formatDate(value);

const emptyForm = (): UserForm => ({ name: '', email: '', password: '', role: 'OPERATOR' });

export function UsersPage({ currentUser }: { currentUser: User }) {
  const { language } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [role, setRole] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await stockflowApi.listUsers());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const visibleUsers = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');
    return users.filter((user) => {
      const matchesStatus = status === 'all' || (status === 'active' ? user.isActive : !user.isActive);
      const matchesRole = role === 'all' || user.role === role;
      const matchesSearch = !normalized
        || user.name.toLocaleLowerCase('pt-BR').includes(normalized)
        || user.email.toLocaleLowerCase('pt-BR').includes(normalized);
      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [users, status, role, search]);

  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    admins: users.filter((user) => user.isActive && user.role === 'ADMIN').length,
    managers: users.filter((user) => user.isActive && user.role === 'MANAGER').length,
  }), [users]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (name.length < 2) { setFormError('O nome deve ter pelo menos 2 caracteres.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFormError('Informe um endereço de e-mail válido.'); return; }
    if (!editing && form.password.length < 12) { setFormError('A senha deve ter pelo menos 12 caracteres.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await stockflowApi.updateUser(editing.id, { name, email, role: form.role });
        setNotice('Usuário atualizado com sucesso.');
      } else {
        await stockflowApi.createUser({ name, email, password: form.password, role: form.role });
        setNotice('Usuário criado com sucesso.');
      }
      setModalOpen(false);
      setEditing(null);
      await loadUsers();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    if (user.id === currentUser.id && user.isActive) return;
    const confirmation = user.isActive ? 'Deseja desativar a conta de' : 'Deseja reativar a conta de';
    if (!window.confirm(`${translate(confirmation, language)} "${user.name}"?`)) return;
    setChangingId(user.id);
    setNotice('');
    setError('');
    try {
      if (user.isActive) await stockflowApi.deactivateUser(user.id);
      else await stockflowApi.updateUser(user.id, { isActive: true });
      setNotice(user.isActive ? 'Usuário desativado com sucesso.' : 'Usuário reativado com sucesso.');
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setChangingId(null);
    }
  };

  if (currentUser.role !== 'ADMIN') {
    return <TranslateTree><div className="page-stack">
      <PageHeader eyebrow="ADMINISTRAÇÃO / ACESSOS" title="Usuários e acessos" description="Gerencie os membros e os níveis de acesso do workspace." />
      <Card className="users-access-denied"><Icon name="alert" size={24} /><strong>Acesso restrito</strong><span>Somente administradores podem gerenciar usuários.</span></Card>
    </div></TranslateTree>;
  }

  return <TranslateTree><div className="page-stack users-page">
    <PageHeader eyebrow="ADMINISTRAÇÃO / WORKSPACE" title="Usuários e acessos" description="Gerencie os membros do StockFlow, seus perfis e o acesso ao sistema."
      actions={<Button leadingIcon={<Icon name="plus" size={16} />} onClick={openCreate}>Novo usuário</Button>} />

    {notice && <div className="category-alert category-alert-success" role="status">{notice}</div>}
    {error && <div className="category-alert category-alert-error" role="alert">{error}<Button size="sm" variant="secondary" onClick={() => void loadUsers()}>Tentar novamente</Button></div>}

    <div className="users-stats-grid">
      <Card className="users-stat-card"><span className="users-stat-icon users-stat-blue"><Icon name="users" size={17}/></span><span className="users-stat-label">Usuários cadastrados</span><strong>{counts.total}</strong><small>Contas no workspace</small></Card>
      <Card className="users-stat-card"><span className="users-stat-icon users-stat-green"><Icon name="activity" size={17}/></span><span className="users-stat-label">Contas ativas</span><strong>{counts.active}</strong><small>Acesso habilitado</small></Card>
      <Card className="users-stat-card"><span className="users-stat-icon users-stat-violet"><Icon name="command" size={17}/></span><span className="users-stat-label">Administradores</span><strong>{counts.admins}</strong><small>Perfil com acesso total</small></Card>
      <Card className="users-stat-card"><span className="users-stat-icon users-stat-amber"><Icon name="users" size={17}/></span><span className="users-stat-label">Gerentes ativos</span><strong>{counts.managers}</strong><small>Gestão operacional</small></Card>
    </div>

    <Card className="category-management-card users-management-card">
      <div className="category-toolbar users-toolbar">
        <div className="category-search"><Icon name="search" size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou e-mail..." aria-label="Buscar usuários"/></div>
        <div className="category-filter"><label htmlFor="users-role">Perfil</label><select id="users-role" value={role} onChange={(event) => setRole(event.target.value as RoleFilter)}><option value="all">Todos</option><option value="ADMIN">Administrador</option><option value="MANAGER">Gerente</option><option value="OPERATOR">Operador</option></select></div>
        <div className="category-filter"><label htmlFor="users-status">Status</label><select id="users-status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="all">Todos</option></select></div>
      </div>

      {loading ? <div className="category-state"><span className="loading-spinner"/>Carregando usuários...</div>
        : !error && visibleUsers.length === 0 ? <div className="category-state"><div className="category-empty-icon"><Icon name="users" size={23}/></div><strong>{search ? 'Nenhum usuário encontrado' : 'Nenhum usuário nesta visualização'}</strong><span>{search ? 'Tente buscar por outro nome ou e-mail.' : 'Ajuste os filtros ou cadastre um novo usuário.'}</span>{!search && status !== 'inactive' && <Button leadingIcon={<Icon name="plus" size={15}/>} onClick={openCreate}>Cadastrar usuário</Button>}</div>
        : !error && <div className="table-wrap category-table-wrap users-table-wrap"><table className="data-table category-table users-table"><thead><tr><th>USUÁRIO</th><th>PERFIL DE ACESSO</th><th>STATUS</th><th>CADASTRADO EM</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
          {visibleUsers.map((user) => <tr key={user.id}>
            <td><div className="category-name-cell"><span className="category-avatar users-avatar">{initials(user.name)}</span><div className="users-name-cell"><strong><UserText>{user.name}</UserText>{user.id === currentUser.id && <span className="users-you-label">Você</span>}</strong><UserText as="small">{user.email}</UserText></div></div></td>
            <td><Badge tone={user.role === 'ADMIN' ? 'info' : user.role === 'MANAGER' ? 'warning' : 'neutral'}>{roleLabels[user.role]}</Badge></td>
            <td><Badge tone={user.isActive ? 'success' : 'neutral'}>{user.isActive ? 'Ativo' : 'Inativo'}</Badge></td>
            <td>{dateLabel(user.createdAt)}</td>
            <td><div className="category-row-actions"><Button size="sm" variant="secondary" onClick={() => openEdit(user)}>Editar</Button>{user.id === currentUser.id ? <span className="users-current-note">Conta atual</span> : <Button size="sm" variant={user.isActive ? 'ghost' : 'secondary'} disabled={changingId === user.id} onClick={() => void toggleActive(user)}>{changingId === user.id ? 'Aguarde...' : user.isActive ? 'Desativar' : 'Reativar'}</Button>}</div></td>
          </tr>)}
        </tbody></table></div>}
      {!loading && !error && <div className="category-table-footer"><span>{language === 'en' ? `${visibleUsers.length} of ${users.length} users` : `${visibleUsers.length} de ${users.length} ${users.length === 1 ? 'usuário' : 'usuários'}`}</span><Button size="sm" variant="ghost" onClick={() => void loadUsers()} leadingIcon={<Icon name="activity" size={14}/>}>Atualizar</Button></div>}
    </Card>

    <Card className="users-roles-card">
      <div className="section-heading"><div><h2>Perfis e permissões</h2><p>Resumo dos níveis de acesso definidos para o StockFlow.</p></div></div>
      <div className="users-role-grid">
        <div><span className="users-role-symbol users-role-admin"><Icon name="command" size={17}/></span><strong>Administrador</strong><p>Acesso total ao sistema, incluindo gerenciamento de usuários e configurações.</p></div>
        <div><span className="users-role-symbol users-role-manager"><Icon name="activity" size={17}/></span><strong>Gerente</strong><p>Gerencia produtos, categorias e fornecedores, registra movimentações e consulta relatórios.</p></div>
        <div><span className="users-role-symbol users-role-operator"><Icon name="package" size={17}/></span><strong>Operador</strong><p>Consulta o inventário e registra entradas e saídas de estoque.</p></div>
      </div>
    </Card>

    {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
      <section className="category-modal users-modal" role="dialog" aria-modal="true" aria-labelledby="users-form-title">
        <div className="category-modal-header"><div><span className="page-eyebrow">GERENCIAMENTO DE ACESSO</span><h2 id="users-form-title">{editing ? 'Editar usuário' : 'Novo usuário'}</h2><p>{editing ? 'Atualize os dados e o perfil de acesso.' : 'Cadastre uma pessoa para acessar o StockFlow.'}</p></div><button className="icon-button" type="button" onClick={closeModal} disabled={saving} aria-label="Fechar">×</button></div>
        <form onSubmit={(event) => void submit(event)}>
          <div className="users-form-grid">
            <label className="category-form-field users-field-wide">Nome completo <span>*</span><input autoFocus maxLength={120} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Maria Oliveira" required/></label>
            <label className="category-form-field users-field-wide">E-mail <span>*</span><input type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="nome@empresa.com" required/></label>
            {!editing && <label className="category-form-field users-field-wide">Senha inicial <span>*</span><input type="password" minLength={12} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Mínimo de 12 caracteres" required/><small>A senha deve ter entre 12 e 128 caracteres.</small></label>}
            <label className="category-form-field users-field-wide">Perfil de acesso <span>*</span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}><option value="OPERATOR">Operador</option><option value="MANAGER">Gerente</option><option value="ADMIN">Administrador</option></select><small>As permissões são aplicadas pelo servidor de acordo com o perfil.</small></label>
          </div>
          {formError && <div className="category-alert category-alert-error" role="alert">{formError}</div>}
          <div className="category-modal-actions"><Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar usuário'}</Button></div>
        </form>
      </section>
    </div>}
  </div></TranslateTree>;
}
