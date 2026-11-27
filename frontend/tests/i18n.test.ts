import { describe, expect, it } from 'vitest';
import { translate } from '../src/lib/i18n';

describe('StockFlow interface translations reported in the language audit', () => {
  it('translates the dashboard low-stock detail and supplier description to English', () => {
    expect(translate('Acima de zero, no mínimo ou abaixo', 'en'))
      .toBe('Above zero and at or below the minimum stock level');
    expect(translate('Mantenha os dados dos fornecedores organizados para vincular recebimentos e acompanhar a origem das entradas.', 'en'))
      .toBe('Keep supplier information organized to link receipts and track the source of stock entries.');
  });

  it('keeps the dashboard and inventory table headings in Portuguese in pt-BR', () => {
    for (const heading of ['PRODUTO', 'TIPO', 'QUANTIDADE', 'DATA', 'RESPONSÁVEL', 'STATUS', 'CATEGORIA', 'PREÇO UNITÁRIO', 'ESTOQUE', 'LOCALIZAÇÃO']) {
      expect(translate(heading, 'pt-BR')).toBe(heading);
    }
  });

  it('translates all reported table headings to English', () => {
    const cases: Array<[string, string]> = [
      ['PRODUTO', 'PRODUCT'], ['TIPO', 'TYPE'], ['QUANTIDADE', 'QUANTITY'],
      ['DATA', 'DATE'], ['RESPONSÁVEL', 'PERFORMED BY'], ['STATUS', 'STATUS'],
      ['CATEGORIA', 'CATEGORY'], ['PREÇO UNITÁRIO', 'UNIT PRICE'],
      ['ESTOQUE', 'STOCK'], ['LOCALIZAÇÃO', 'LOCATION'], ['DESCRIÇÃO', 'DESCRIPTION'],
      ['CRIADA EM', 'CREATED AT'], ['FORNECEDOR / DESTINATÁRIO', 'SUPPLIER / RECIPIENT'],
      ['CUSTO UNITÁRIO', 'UNIT COST'], ['OBSERVAÇÃO', 'OBSERVATION'],
      ['FORNECEDOR', 'SUPPLIER'], ['CPF / CNPJ', 'CPF / CNPJ'], ['CONTATO', 'CONTACT'],
      ['CADASTRADO EM', 'REGISTERED AT'], ['USUÁRIO', 'USER'],
      ['PERFIL DE ACESSO', 'ACCESS ROLE'],
    ];
    for (const [source, expected] of cases) expect(translate(source, 'en')).toBe(expected);
  });

  it('keeps login copy English in en and translates it in pt-BR', () => {
    const loginCopy: Array<[string, string]> = [
      ['Welcome back', 'Bem-vindo de volta'],
      ['Sign in to continue to your workspace.', 'Entre para continuar no seu workspace.'],
      ['Everything in its place.', 'Tudo em seu devido lugar.'],
      ['Keep inventory, people and operations', 'Mantenha estoque, pessoas e operações'],
      ['connected in one workspace.', 'conectados em um único workspace.'],
      ['Inventory status', 'Status do inventário'],
      ['Healthy and up to date', 'Em dia e atualizado'],
      ['LIVE', 'AO VIVO'],
      ['STOCKFLOW · INVENTORY MANAGEMENT', 'STOCKFLOW · GESTÃO DE ESTOQUE'],
      ['EMAIL ADDRESS', 'E-MAIL'],
      ['PASSWORD', 'SENHA'],
    ];

    for (const [source, portuguese] of loginCopy) {
      expect(translate(source, 'en')).toBe(source);
      expect(translate(source, 'pt-BR')).toBe(portuguese);
    }
  });

  it('translates the global search placeholder only in pt-BR', () => {
    expect(translate('Search anything...', 'en')).toBe('Search anything...');
    expect(translate('Search anything...', 'pt-BR')).toBe('Pesquisar em tudo...');
  });
});


describe('login theme toggle labels', () => {
  it('provides localized accessible labels for the light and dark theme actions', () => {
    expect(translate('Mudar para modo escuro', 'en')).toBe('Switch to dark mode');
    expect(translate('Mudar para modo claro', 'en')).toBe('Switch to light mode');
    expect(translate('Mudar para modo escuro', 'pt-BR')).toBe('Mudar para modo escuro');
    expect(translate('Mudar para modo claro', 'pt-BR')).toBe('Mudar para modo claro');
  });
});
