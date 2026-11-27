import { getPreferences } from './preferences';
import { translate } from './i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const GET_CACHE_TTL_MS = 15_000;
const getCache = new Map<string, { expiresAt: number; value: unknown }>();
const getInFlight = new Map<string, Promise<unknown>>();

export type ApiValidationIssue = {
  path?: Array<string | number>;
  message?: string;
  code?: string;
};

const fieldLabels: Record<string, string> = {
  name: 'Nome', sku: 'SKU', description: 'Descrição', price: 'Preço', minStock: 'Estoque mínimo',
  categoryId: 'Categoria', unit: 'Unidade', location: 'Localização', taxId: 'CPF/CNPJ',
  email: 'E-mail', phone: 'Telefone', address: 'Endereço', notes: 'Observações',
  productId: 'Produto', type: 'Tipo de movimentação', quantity: 'Quantidade', supplierId: 'Fornecedor',
  recipient: 'Destinatário', unitCost: 'Custo unitário', status: 'Status', page: 'Página', pageSize: 'Itens por página',
};

function translateIssue(issue: ApiValidationIssue): { field: string; message: string } {
  const field = issue.path?.length ? fieldLabels[String(issue.path[0])] ?? String(issue.path[0]) : 'Dados';
  const raw = issue.message ?? '';
  let message = raw;
  if (/expected string/i.test(raw)) message = 'Informe um valor de texto.';
  else if (/expected number/i.test(raw)) message = 'Informe um número válido.';
  else if (/invalid uuid/i.test(raw) || /valid uuid/i.test(raw)) message = 'Selecione uma opção válida.';
  else if (/invalid email/i.test(raw)) message = 'Informe um endereço de e-mail válido.';
  else if (/too small/i.test(raw) || /at least 1/i.test(raw)) message = 'Este campo é obrigatório.';
  else if (/too big/i.test(raw)) message = 'O valor informado excede o limite permitido.';
  else if (/tax id must contain/i.test(raw)) message = 'Informe CPF com 11 dígitos ou CNPJ com 14 dígitos.';
  else if (/cannot be negative/i.test(raw)) message = 'O valor não pode ser negativo.';
  else if (/greater than zero/i.test(raw)) message = 'Informe um valor maior que zero.';
  else if (/at least one field/i.test(raw)) message = 'Informe pelo menos um campo para atualizar.';
  else if (/unrecognized key/i.test(raw)) message = 'Há um campo não reconhecido no formulário.';
  else if (!raw) message = 'Verifique o valor informado.';
  return { field, message };
}

function translateServerMessage(message: string | undefined, status: number): string {
  if (!message || message === 'Invalid request data.') return status === 400 ? 'Confira os campos informados.' : 'Não foi possível concluir a operação.';
  const normalized = message.toLowerCase();
  if (normalized.includes('supplier with this tax id already exists')) return 'Já existe um fornecedor cadastrado com este CPF/CNPJ.';
  if (normalized.includes('supplier not found') || normalized.includes('active supplier not found')) return 'Fornecedor não encontrado ou inativo.';
  if (normalized.includes('duplicate sku')) return 'Já existe um produto cadastrado com este SKU.';
  if (normalized.includes('category') && normalized.includes('already exists')) return 'Já existe uma categoria com esse nome.';
  if (normalized.includes('insufficient stock')) return 'Estoque insuficiente para realizar esta saída.';
  if (normalized.includes('not found')) return 'O registro solicitado não foi encontrado.';
  if (normalized.includes('invalid status')) return 'O filtro de status informado é inválido.';
  return message;
}

export class ApiError extends Error {
  public readonly details: ApiValidationIssue[];

  constructor(message: string, public readonly status: number, details: ApiValidationIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;
  const cacheable = method === 'GET';
  if (cacheable) {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    const pending = getInFlight.get(cacheKey);
    if (pending) return pending as Promise<T>;
  } else {
    getCache.clear();
    getInFlight.clear();
  }

  const request = (async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string; details?: ApiValidationIssue[] } | null;
      const details = Array.isArray(payload?.details) ? payload.details : [];
      const language = getPreferences().language;
      const issues = details.map(translateIssue);
      const baseMessage = translate(translateServerMessage(payload?.error, response.status), language);
      const localizedIssues = issues.map((item) => `${translate(item.field, language)}: ${translate(item.message, language)}`);
      const message = localizedIssues.length
        ? `${baseMessage}\n${localizedIssues.map((item) => `• ${item}`).join('\n')}`
        : baseMessage;
      throw new ApiError(message, response.status, details);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  })();

  if (cacheable) {
    getInFlight.set(cacheKey, request);
    try {
      const value = await request;
      getCache.set(cacheKey, { expiresAt: Date.now() + GET_CACHE_TTL_MS, value });
      return value;
    } finally {
      getInFlight.delete(cacheKey);
    }
  }
  return request;
}
