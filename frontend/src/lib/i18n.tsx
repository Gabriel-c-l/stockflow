import { createContext, useContext, useMemo, type ReactNode, type ReactElement } from 'react';
import { cloneElement, isValidElement } from 'react';
import { updatePreferences, usePreferences, type Language, type DateFormat } from './preferences';
export type { Language, DateFormat } from './preferences';

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
};
const I18nContext = createContext<I18nContextValue | null>(null);
const ptToEn: Record<string, string> = {
  'Painel': 'Dashboard', 'Inventário': 'Inventory', 'Categorias': 'Categories',
  'Movimentações de estoque': 'Stock movements', 'Movimentações': 'Stock movements',
  'Fornecedores': 'Suppliers', 'Usuários e acessos': 'Users & access', 'Configurações': 'Settings',
  'Ajuda e suporte': 'Help & support', 'Visão geral': 'Overview', 'Workspace': 'Workspace',
  'INVENTÁRIO': 'INVENTORY', 'ADMINISTRAÇÃO': 'ADMINISTRATION',
  'WORKSPACE': 'WORKSPACE', 'GESTÃO DE ESTOQUE': 'INVENTORY MANAGEMENT',
  'Navegação principal': 'Main navigation', 'Menu da conta': 'Account menu',
  'Notificações': 'Notifications', 'Abrir navegação': 'Open navigation',
  'Fechar navegação': 'Close navigation', 'Fechar menu': 'Close menu',
  'Pesquisar...': 'Search...', 'Sair da conta': 'Sign out',
  'Organize seus produtos em categorias para facilitar o controle do estoque.': 'Organize your products into categories to make inventory management easier.',
  'Registre entradas e saídas e acompanhe o histórico do estoque.': 'Record stock entries and exits and track inventory history.',
  'Gerencie seus produtos e acompanhe os níveis de estoque.': 'Manage your products and monitor stock levels.',
  'Gerencie seus fornecedores e mantenha os dados de contato organizados.': 'Manage your suppliers and keep contact information organized.',
  'Gerencie os membros do StockFlow, seus perfis e o acesso ao sistema.': 'Manage StockFlow members, their roles, and system access.',
  'Novo produto': 'New product', 'Editar produto': 'Edit product', 'Cadastrar produto': 'Create product',
  'Buscar produto, SKU ou responsável...': 'Search product, SKU, or assignee...',
  'Buscar por nome ou SKU...': 'Search by name or SKU...', 'Buscar categoria...': 'Search categories...',
  'Buscar fornecedor...': 'Search suppliers...', 'Buscar por nome ou e-mail...': 'Search by name or email...',
  'Todas': 'All', 'Todos': 'All', 'Todos os tipos': 'All types', 'Todos os produtos': 'All products',
  'Ativos': 'Active', 'Inativos': 'Inactive', 'Ativo': 'Active', 'Inativo': 'Inactive',
  'Disponível': 'Available', 'Estoque baixo': 'Low stock', 'Estoque baixo nesta página': 'Low stock on this page',
  'Produtos encontrados': 'Products found', 'Ativos nesta página': 'Active on this page',
  'Quantidade ≤ estoque mínimo': 'Quantity ≤ minimum stock', 'No filtro atual': 'In current filter',
  'De até 10 produtos': 'Up to 10 products', 'Preço unitário': 'Unit price', 'Estoque': 'Stock',
  'Localização': 'Location', 'Produto': 'Product', 'Categoria': 'Category', 'Status': 'Status',
  'Ações': 'Actions', 'Editar': 'Edit', 'Desativar': 'Deactivate', 'Reativar': 'Reactivate',
  'Atualizar': 'Refresh', 'Salvar': 'Save', 'Salvar alterações': 'Save changes',
  'Cancelar': 'Cancel', 'Excluir': 'Delete', 'Criar': 'Create', 'Cadastrar': 'Register',
  'Nova categoria': 'New category', 'Editar categoria': 'Edit category', 'Nome da categoria': 'Category name',
  'Descrição': 'Description', 'Criada em': 'Created at', 'Nenhuma categoria encontrada': 'No categories found',
  'Nenhum resultado encontrado': 'No results found', 'Nenhum produto encontrado': 'No products found',
  'Nenhum fornecedor encontrado': 'No suppliers found', 'Carregando...': 'Loading...',
  'Carregando produtos...': 'Loading products...', 'Carregando categorias...': 'Loading categories...',
  'Carregando fornecedores...': 'Loading suppliers...', 'Carregando usuários...': 'Loading users...',
  'Tentar novamente': 'Try again', 'Entrada': 'Entry', 'Saída': 'Exit', 'Entradas': 'Entries',
  'Saídas': 'Exits', 'Tipo': 'Type', 'Quantidade': 'Quantity', 'Fornecedor / Destinatário': 'Supplier / Recipient',
  'Fornecedor': 'Supplier', 'Destinatário': 'Recipient', 'Responsável': 'Performed by', 'Data': 'Date',
  'Observação': 'Note', 'Observações': 'Notes', 'Custo unitário': 'Unit cost',
  'Registrar movimentação': 'Record movement', 'Nova movimentação': 'New movement',
  'Histórico de movimentações': 'Movement history', 'Total de movimentações': 'Total movements',
  'Registros no histórico': 'Records in history', 'Reposições e recebimentos': 'Restocks and receipts',
  'Retiradas e consumo': 'Withdrawals and usage', 'Administrador': 'Administrator',
  'Gerente': 'Manager', 'Operador': 'Operator', 'Perfil de acesso': 'Access role',
  'Nome completo': 'Full name', 'E-mail': 'Email', 'Senha': 'Password', 'Senha inicial': 'Initial password',
  'Novo usuário': 'New user', 'Editar usuário': 'Edit user', 'Criar usuário': 'Create user',
  'Usuário atualizado com sucesso.': 'User updated successfully.', 'Usuário criado com sucesso.': 'User created successfully.',
  'Conta atual': 'Current account', 'Você': 'You', 'Usuários cadastrados': 'Registered users',
  'Contas ativas': 'Active accounts', 'Administradores': 'Administrators', 'Gerentes ativos': 'Active managers',
  'Perfis e permissões': 'Roles and permissions', 'Resumo dos níveis de acesso definidos para o StockFlow.': 'Summary of access levels defined for StockFlow.',
  'Acesso restrito': 'Restricted access', 'Somente administradores podem gerenciar usuários.': 'Only administrators can manage users.',
  'Tema': 'Theme', 'Claro': 'Light', 'Escuro': 'Dark', 'Tamanho do texto': 'Text size',
  'Mudar para modo claro': 'Switch to light mode',
  'Mudar para modo escuro': 'Switch to dark mode',
  'Padrão': 'Default', 'Grande': 'Large', 'Muito grande': 'Extra large', 'Idioma': 'Language',
  'Formato de data': 'Date format', 'Dia / mês / ano': 'Day / month / year', 'Mês / dia / ano': 'Month / day / year',
  'Aparência': 'Appearance', 'Preferências': 'Preferences',
  'Personalize a aparência e as preferências da sua experiência no StockFlow.': 'Customize the appearance and preferences of your StockFlow experience.',
  'Escolha como o StockFlow será exibido.': 'Choose how StockFlow is displayed.',
  'Define a preferência de idioma neste navegador.': 'Sets the language preference in this browser.',
  'Preferências salvas neste navegador.': 'Preferences saved in this browser.',
  'Sair': 'Sign out', 'Pesquisar': 'Search',
  'Fundação pronta': 'Foundation ready', 'Este módulo será implementado em breve': 'This module is coming next',
  'A estrutura compartilhada do aplicativo e os componentes de design estão prontos. Esta tela será implementada quando o contrato da API e o escopo do recurso estiverem definidos.': 'The shared application layout and design components are in place. This screen will be implemented when its API contract and feature scope are ready.',
  'Não foi possível concluir a operação. Tente novamente.': 'Could not complete the operation. Please try again.',
  'Não foi possível carregar os dados.': 'Could not load the data.',
  'Informe seu e-mail e sua senha para continuar.': 'Enter your email and password to continue.',
  'E-mail ou senha inválidos. Confira seus dados e tente novamente.': 'Invalid email or password. Check your details and try again.',
  'Entrar': 'Sign in', 'Acessar': 'Sign in', 'Bem-vindo de volta': 'Welcome back',
  'Esqueceu sua senha?': 'Forgot password?', 'Criar uma conta': 'Create an account',
  'Nome': 'Name', 'Telefone': 'Phone', 'Endereço': 'Address', 'Documento': 'Tax ID',
  'Razão social': 'Business name', 'Novo fornecedor': 'New supplier', 'Editar fornecedor': 'Edit supplier',
  'Cadastrar fornecedor': 'Add supplier', 'Nenhum usuário encontrado': 'No users found',
  'Nenhum usuário nesta visualização': 'No users in this view',
  'Ajuste os filtros ou cadastre um novo usuário.': 'Adjust the filters or create a new user.',
  'Ajuste os filtros ou cadastre um novo produto.': 'Adjust the filters or create a new product.',
  'Ajuste os filtros ou cadastre uma nova categoria.': 'Adjust the filters or create a new category.',
  'Ajuste os filtros ou cadastre um novo fornecedor.': 'Adjust the filters or create a new supplier.',
  'Deseja desativar a conta de': 'Do you want to deactivate the account of',
  'Deseja reativar a conta de': 'Do you want to reactivate the account of',
  'Aguarde...': 'Please wait...',
  'Unidade': 'Unit', 'Caixa': 'Box', 'Pacote': 'Pack', 'Quilograma': 'Kilogram',
  'Grama': 'Gram', 'Litro': 'Liter', 'Mililitro': 'Milliliter', 'Metro': 'Meter', 'Centímetro': 'Centimeter',
};

Object.assign(ptToEn, {
  'Carregando movimentações...': 'Loading stock movements...',
  'unidades recebidas': 'units received', 'unidades retiradas': 'units withdrawn',
  'Nenhum produto cadastrado.': 'No products registered.',
  'Carregando histórico...': 'Loading history...',
  'Concluída': 'Completed', 'Nenhuma movimentação registrada ainda.': 'No movements recorded yet.',
  'Não foi possível carregar os produtos': 'Could not load products',
  'Não foi possível carregar as categorias': 'Could not load categories',
  'Não foi possível carregar os fornecedores': 'Could not load suppliers',
  'Anterior': 'Previous', 'Próxima': 'Next', 'CATÁLOGO DE ESTOQUE': 'INVENTORY CATALOG',
  'Preencha os dados para manter seu catálogo organizado.': 'Fill in the details to keep your catalog organized.',
  'Preço unitário (R$)': 'Unit price (R$)',
  'Preço atual de referência; não altera o custo histórico das entradas.': 'Current reference price; does not change the historical cost of entries.',
  'Será registrada como uma entrada de estoque.': 'It will be recorded as a stock entry.',
  'DETALHES DO PRODUTO': 'PRODUCT DETAILS', 'Estoque atual': 'Current stock',
  'Mais recentes primeiro': 'Newest first', 'Nenhuma movimentação registrada para este produto.': 'No movements recorded for this product.',
  'Exibir': 'Show', 'Ativas': 'Active', 'Não foi possível carregar as movimentações': 'Could not load stock movements',
  'GERENCIAMENTO': 'MANAGEMENT', 'Preencha as informações abaixo.': 'Fill in the information below.',
  'Até 100 caracteres.': 'Up to 100 characters.', 'Opcional · até 1.000 caracteres.': 'Optional · up to 1,000 characters.',
  'Nenhuma movimentação encontrada': 'No movements found',
  'Registre uma entrada ou saída para começar.': 'Record an entry or exit to get started.',
  'Informe os dados para atualizar o saldo do produto.': 'Enter the details to update the product stock.',
  'Selecione um produto': 'Select a product', 'Fornecedor (opcional)': 'Supplier (optional)',
  'Não informado': 'Not provided', 'Custo unitário de aquisição (R$)': 'Unit acquisition cost (R$)',
  'Valor histórico desta entrada.': 'Historical value of this entry.',
  'Observação (opcional)': 'Note (optional)', 'Acesso total ao sistema, incluindo gerenciamento de usuários e configurações.': 'Full system access, including user and settings management.',
  'Gerencia produtos, categorias e fornecedores, registra movimentações e consulta relatórios.': 'Manages products, categories, and suppliers, records stock movements, and views reports.',
  'Consulta o inventário e registra entradas e saídas de estoque.': 'Views inventory and records stock entries and exits.',
});

Object.assign(ptToEn, {
  'Resumo do estoque': 'Inventory summary', 'Produtos ativos': 'Active products',
  'Produtos cadastrados': 'Registered products', 'Saldo atual somado': 'Total current stock value',
  'Sem estoque': 'Out of stock', 'Produtos ativos com saldo zero': 'Active products with zero stock',
  'Produtos por categoria': 'Products by category', 'Distribuição dos produtos ativos': 'Distribution of active products',
  'Últimas movimentações': 'Latest stock movements', 'Movimentações recentes': 'Recent movements',
  'Ver todas': 'View all', 'Ver detalhes': 'View details', 'Nenhuma movimentação encontrada': 'No movements found',
  'Não foi possível carregar o dashboard.': 'Could not load the dashboard.',
  'Não foi possível carregar os produtos.': 'Could not load products.',
  'Não foi possível carregar as categorias.': 'Could not load categories.',
  'Não foi possível carregar os fornecedores.': 'Could not load suppliers.',
  'Não foi possível carregar as movimentações.': 'Could not load stock movements.',
  'Não foi possível carregar os usuários.': 'Could not load users.',
  'Produto atualizado com sucesso.': 'Product updated successfully.',
  'Produto cadastrado com sucesso.': 'Product created successfully.',
  'Categoria atualizada com sucesso.': 'Category updated successfully.',
  'Categoria criada com sucesso.': 'Category created successfully.',
  'Fornecedor atualizado com sucesso.': 'Supplier updated successfully.',
  'Fornecedor cadastrado com sucesso.': 'Supplier created successfully.',
  'Movimentação registrada com sucesso.': 'Stock movement recorded successfully.',
  'Informe um nome válido.': 'Enter a valid name.',
  'O nome deve ter pelo menos 2 caracteres.': 'The name must contain at least 2 characters.',
  'Informe um endereço de e-mail válido.': 'Enter a valid email address.',
  'A senha deve ter pelo menos 12 caracteres.': 'The password must contain at least 12 characters.',
  'Exibir': 'Show', 'Perfil': 'Role', 'Buscar': 'Search', 'Filtros': 'Filters',
  'Nome do produto': 'Product name', 'SKU': 'SKU', 'Preço': 'Price', 'Preço de custo': 'Cost price',
  'Estoque mínimo': 'Minimum stock', 'Unidade de medida': 'Unit of measure',
  'Selecione uma categoria': 'Select a category', 'Selecione um produto': 'Select a product',
  'Selecione um fornecedor': 'Select a supplier', 'Sem categoria': 'No category',
  'Sem fornecedor': 'No supplier', 'Sem observações': 'No notes',
  'Ex.: ELE-001': 'e.g. ELE-001', 'Ex.: Teclado sem fio': 'e.g. Wireless keyboard',
  'Ex.: Prateleira A-03': 'e.g. Shelf A-03', 'Ex.: Maria Oliveira': 'e.g. Maria Oliveira',
  'Nome da categoria': 'Category name', 'Nome do fornecedor': 'Supplier name',
  'CPF ou CNPJ': 'Tax ID', '11 dígitos para CPF ou 14 para CNPJ.': '11 digits for CPF or 14 for CNPJ.',
  'Compras': 'Purchases', 'Contato': 'Contact', 'Informações de contato': 'Contact information',
  'Registrar entrada': 'Record entry', 'Registrar saída': 'Record exit',
  'Tipo de movimentação': 'Movement type', 'Produto movimentado': 'Product',
  'Quantidade movimentada': 'Movement quantity', 'Selecione o tipo': 'Select type',
  'Estoque inicial do cadastro': 'Initial stock from product registration',
  'Ajuste os filtros e tente novamente.': 'Adjust the filters and try again.',
  'Nenhum produto nesta visualização': 'No products in this view',
  'Nenhuma categoria nesta visualização': 'No categories in this view',
  'Nenhum fornecedor nesta visualização': 'No suppliers in this view',
  'Nenhuma movimentação nesta visualização': 'No movements in this view',
  'Gerencie os produtos e acompanhe os níveis de estoque.': 'Manage products and monitor stock levels.',
  'Gerencie as categorias utilizadas para organizar seus produtos.': 'Manage the categories used to organize your products.',
  'Gerencie os fornecedores e mantenha seus contatos atualizados.': 'Manage suppliers and keep their contact details up to date.',
  'Acompanhe entradas, saídas e o histórico das movimentações de estoque.': 'Track entries, exits, and stock movement history.',
  'Informações gerais': 'General information', 'Dados do produto': 'Product details',
  'Dados do fornecedor': 'Supplier details', 'Dados da categoria': 'Category details',
  'Detalhes do produto': 'Product details', 'Histórico': 'History',
  'Total de produtos': 'Total products', 'Total de categorias': 'Total categories',
  'Total de fornecedores': 'Total suppliers', 'Estoque disponível': 'Available stock',
  'Unidades': 'Units', 'unidades': 'units', 'produtos': 'products', 'categorias': 'categories',
  'fornecedores': 'suppliers', 'usuários': 'users', 'movimentações': 'movements',
  'produto': 'product', 'categoria': 'category', 'fornecedor': 'supplier', 'usuário': 'user',
  'Nenhum': 'None', 'Todos os status': 'All statuses', 'Todos os perfis': 'All roles',
  'Ativos': 'Active', 'Inativos': 'Inactive', 'Todos os usuários': 'All users',
  'WORKSPACE / VISÃO GERAL': 'WORKSPACE / OVERVIEW',
  'INVENTÁRIO / CATÁLOGO': 'INVENTORY / CATALOG',
  'INVENTÁRIO / ORGANIZAÇÃO': 'INVENTORY / ORGANIZATION',
  'INVENTÁRIO / RELACIONAMENTOS': 'INVENTORY / RELATIONSHIPS',
  'ADMINISTRAÇÃO / ACESSOS': 'ADMINISTRATION / ACCESS',
  'ADMINISTRAÇÃO / WORKSPACE': 'ADMINISTRATION / WORKSPACE',
  'Atualize os dados e o perfil de acesso.': 'Update the details and access role.',
  'Cadastre uma pessoa para acessar o StockFlow.': 'Create an account to access StockFlow.',
  'Ajuste os filtros ou cadastre um novo usuário.': 'Adjust the filters or create a new user.',
  'Ajuste os filtros ou cadastre um novo produto.': 'Adjust the filters or create a new product.',
  'Ajuste os filtros ou cadastre uma nova categoria.': 'Adjust the filters or create a new category.',
  'Ajuste os filtros ou cadastre um novo fornecedor.': 'Adjust the filters or create a new supplier.',
  'Deseja desativar a conta de': 'Do you want to deactivate the account of',
  'Deseja reativar a conta de': 'Do you want to reactivate the account of',
  ' desativado com sucesso.': ' deactivated successfully.',
  ' reativado com sucesso.': ' reactivated successfully.',
  'Estoque baixo nesta página': 'Low stock on this page',
  'Acesso habilitado': 'Access enabled', 'Contas no workspace': 'Workspace accounts',
  'Perfil com acesso total': 'Full access role', 'Gestão operacional': 'Operations management',
  'As permissões são aplicadas pelo servidor de acordo com o perfil.': 'Permissions are enforced by the server according to the assigned role.',
  'A senha deve ter entre 12 e 128 caracteres.': 'The password must be between 12 and 128 characters.',
  'Senha inicial': 'Initial password', 'Mínimo de 12 caracteres': 'At least 12 characters',
  'Ajuste os filtros ou tente outra busca.': 'Adjust the filters or try another search.',
  'No filtro atual': 'In current filter', 'Data de cadastro': 'Created date',
  'Data da movimentação': 'Movement date', 'Data de criação': 'Created date',
  'Ação': 'Action', 'Entrada de estoque': 'Stock entry', 'Saída de estoque': 'Stock exit',
  'Todas as categorias': 'All categories', 'Todas as unidades': 'All units',
  'Sem resultados': 'No results', 'Fechar': 'Close', 'Abrir': 'Open',
  'Carregando seu ambiente...': 'Loading your workspace...',
  'Show password': 'Show password', 'Hide password': 'Hide password',
  'Password': 'Password', 'Email': 'Email',
});

const enToPt: Record<string, string> = Object.fromEntries(Object.entries(ptToEn).map(([pt, en]) => [en, pt]));
enToPt['Stock movements'] = 'Movimentações de estoque';
enToPt['Users & access'] = 'Usuários e acessos';
enToPt['Help & support'] = 'Ajuda e suporte';
enToPt['Search anything...'] = 'Pesquisar em tudo...';
enToPt['Foundation ready'] = 'Estrutura pronta';
enToPt['This module is coming next'] = 'Este módulo será implementado em breve';
enToPt['The shared application layout and design components are in place. This screen will be implemented when its API contract and feature scope are ready.'] = 'A estrutura compartilhada do aplicativo e os componentes de design estão prontos. Esta tela será implementada quando o contrato da API e o escopo do recurso estiverem definidos.';
enToPt['Overview'] = 'Visão geral';
enToPt['Settings'] = 'Configurações';
enToPt['Inventory management, made clearer.'] = 'Gestão de estoque, de forma mais clara.';
enToPt['Welcome back'] = 'Bem-vindo de volta';
enToPt['Forgot password?'] = 'Esqueceu sua senha?';
enToPt['Create an account'] = 'Criar uma conta';
enToPt['Signing in...'] = 'Entrando...';
enToPt['Sign in'] = 'Entrar';
enToPt['New to StockFlow?'] = 'Novo no StockFlow?';
enToPt['By continuing, you agree to the Terms of Service and Privacy Policy.'] = 'Ao continuar, você concorda com os Termos de Serviço e a Política de Privacidade.';
enToPt['Password recovery is not configured yet. Contact your workspace administrator to reset your password.'] = 'A recuperação de senha ainda não está configurada. Entre em contato com o administrador do workspace para redefinir sua senha.';
enToPt['Account creation is managed by your workspace administrator. Contact them to request access.'] = 'A criação de contas é gerenciada pelo administrador do workspace. Entre em contato para solicitar acesso.';

Object.assign(enToPt, Object.fromEntries(Object.entries(ptToEn).map(([pt, en]) => [en, pt])));
Object.assign(enToPt, { 'INVENTORY MANAGEMENT': 'GESTÃO DE ESTOQUE', 'WORKSPACE': 'WORKSPACE', 'Main navigation': 'Navegação principal', 'Account menu': 'Menu da conta', 'Notifications': 'Notificações', 'Open navigation': 'Abrir navegação', 'Close navigation': 'Fechar navegação', 'Close menu': 'Fechar menu', 'Search...': 'Pesquisar...', 'Sign out': 'Sair da conta' });
Object.assign(enToPt, {
  'Low stock on this page': 'Estoque baixo nesta página',
  'Search product, SKU, or assignee...': 'Buscar produto, SKU ou responsável...',
  'e.g. ELE-001': 'Ex.: ELE-001', 'e.g. Wireless keyboard': 'Ex.: Teclado sem fio',
  'e.g. Shelf A-03': 'Ex.: Prateleira A-03', 'Please wait...': 'Aguarde...',
  'Could not complete the operation. Please try again.': 'Não foi possível concluir a operação. Tente novamente.',
  'Current account': 'Conta atual', 'Stock movements': 'Movimentações de estoque',
});


// Expanded module vocabulary: keep all interface copy explicit and symmetric.
Object.assign(ptToEn, {
  'Acompanhe o que está acontecendo no seu estoque.': 'Monitor what is happening in your inventory.',
  'Atualizando...': 'Refreshing...',
  'Resumo do estoque': 'Inventory overview',
  'Produtos ativos': 'Active products',
  'Unidades em estoque': 'Units in stock',
  'Saldo atual somado': 'Combined current balance',
  'Produtos ativos com saldo zero': 'Active products with zero stock',
  'Quantidade movimentada nos últimos 7 dias': 'Quantity moved over the last 7 days',
  'Produtos por categoria': 'Products by category',
  'Distribuição dos produtos ativos': 'Active product distribution',
  'Movimentações recentes': 'Recent movements',
  'Entradas': 'Entries',
  'Saídas': 'Exits',
  'Cadastre, organize e acompanhe os produtos do seu estoque.': 'Create, organize, and track your inventory products.',
  'Consulte os produtos cadastrados e acompanhe os níveis de estoque.': 'Browse registered products and monitor stock levels.',
  'Buscar produtos': 'Search products',
  'Nenhum produto encontrado': 'No products found',
  'Seu catálogo ainda está vazio': 'Your catalog is empty',
  'Ajuste os filtros ou tente outra busca.': 'Adjust the filters or try another search.',
  'Cadastre seu primeiro produto para começar a controlar o estoque.': 'Add your first product to start tracking inventory.',
  'Produto atualizado com sucesso.': 'Product updated successfully.',
  'Produto cadastrado com sucesso.': 'Product created successfully.',
  'Produto desativado com sucesso.': 'Product deactivated successfully.',
  'SKU e nome são obrigatórios.': 'SKU and name are required.',
  'Informe um preço válido igual ou maior que zero.': 'Enter a valid price greater than or equal to zero.',
  'Estoque mínimo e quantidade inicial devem ser números inteiros iguais ou maiores que zero.': 'Minimum stock and initial quantity must be whole numbers greater than or equal to zero.',
  'Deseja desativar o produto': 'Do you want to deactivate product',
  'Preço unitário (R$)': 'Unit price (R$)',
  'Estoque mínimo': 'Minimum stock',
  'Quantidade inicial': 'Initial quantity',
  'Unidade de medida': 'Unit of measure',
  'Código SKU': 'SKU code',
  'Código do produto': 'Product code',
  'Categoria': 'Category',
  'Selecione uma categoria': 'Select a category',
  'Localização no estoque': 'Storage location',
  'Ex.: Eletrônicos': 'e.g. Electronics',
  'Descreva quais produtos pertencem a esta categoria.': 'Describe which products belong to this category.',
  'Informe o nome da categoria.': 'Enter the category name.',
  'Categoria atualizada com sucesso.': 'Category updated successfully.',
  'Categoria criada com sucesso.': 'Category created successfully.',
  'Categoria desativada com sucesso.': 'Category deactivated successfully.',
  'Deseja desativar a categoria': 'Do you want to deactivate category',
  'Organize seus produtos em categorias para facilitar a consulta e o controle do estoque.': 'Organize your products into categories for easier browsing and inventory control.',
  'Consulte as categorias utilizadas para organizar os produtos do estoque.': 'Browse the categories used to organize inventory products.',
  'Buscar categoria': 'Search categories',
  'Nenhuma categoria encontrada': 'No categories found',
  'Ainda não há categorias aqui': 'There are no categories here yet',
  'Tente buscar por outro termo.': 'Try searching for another term.',
  'Crie sua primeira categoria para começar a organizar os produtos.': 'Create your first category to start organizing products.',
  'Ativa': 'Active',
  'Inativa': 'Inactive',
  'CRIADA EM': 'CREATED AT',
  'INVENTÁRIO / ORGANIZAÇÃO': 'INVENTORY / ORGANIZATION',
  'Registre entradas e saídas e acompanhe o histórico do estoque.': 'Record stock entries and exits and track inventory history.',
  'Buscar produto, SKU ou responsável...': 'Search product, SKU, or person in charge...',
  'Filtrar tipo': 'Filter by type',
  'Filtrar produto': 'Filter by product',
  'Total de movimentações': 'Total movements',
  'Registros no histórico': 'Records in history',
  'Reposições e recebimentos': 'Restocks and receipts',
  'Retiradas e consumo': 'Withdrawals and usage',
  'Selecione um produto.': 'Select a product.',
  'Informe uma quantidade inteira maior que zero.': 'Enter a whole quantity greater than zero.',
  'Informe um custo unitário válido, igual ou maior que zero.': 'Enter a valid unit cost greater than or equal to zero.',
  'Informe o destinatário da saída.': 'Enter the exit recipient.',
  'Não foi possível registrar a movimentação.': 'Could not record the stock movement.',
  'Não foi possível carregar as movimentações.': 'Could not load stock movements.',
  'Carregando movimentações...': 'Loading stock movements...',
  'Nenhuma movimentação encontrada': 'No movements found',
  'Nenhuma movimentação registrada ainda.': 'No movements have been recorded yet.',
  'Registre uma entrada ou saída para começar.': 'Record an entry or exit to get started.',
  'Tipo': 'Type',
  'Quantidade': 'Quantity',
  'Fornecedor / Destinatário': 'Supplier / Recipient',
  'Responsável': 'Performed by',
  'Data': 'Date',
  'Observação': 'Note',
  'Custo unitário': 'Unit cost',
  'Entrada': 'Entry',
  'Saída': 'Exit',
  'INVENTÁRIO / RELACIONAMENTOS': 'INVENTORY / RELATIONSHIPS',
  'Gerencie seus fornecedores e mantenha os dados de contato organizados.': 'Manage suppliers and keep contact information organized.',
  'Buscar por nome, CPF/CNPJ, e-mail ou telefone...': 'Search by name, tax ID, email, or phone...',
  'Buscar fornecedores': 'Search suppliers',
  'Nenhum fornecedor encontrado': 'No suppliers found',
  'Ainda não há fornecedores': 'There are no suppliers yet',
  'Cadastre fornecedores para registrar a origem das entradas de estoque.': 'Add suppliers to record the source of stock entries.',
  'Endereço não informado': 'Address not provided',
  'Informe o nome do fornecedor.': 'Enter the supplier name.',
  'CPF/CNPJ deve conter apenas números. Confira o documento informado.': 'Tax ID must contain numbers only. Check the document entered.',
  'E-mail inválido. Use um formato como nome@empresa.com.': 'Invalid email. Use a format such as name@company.com.',
  'Telefone inválido. Informe DDD e número, com 10 a 15 dígitos.': 'Invalid phone number. Enter the area code and number, with 10 to 15 digits.',
  'Fornecedor atualizado com sucesso.': 'Supplier updated successfully.',
  'Fornecedor cadastrado com sucesso.': 'Supplier created successfully.',
  'Fornecedor desativado com sucesso.': 'Supplier deactivated successfully.',
  'Deseja desativar o fornecedor': 'Do you want to deactivate supplier',
  'Razão social': 'Business name',
  'CPF/CNPJ': 'Tax ID',
  'Telefone': 'Phone',
  'Endereço': 'Address',
  'Observações': 'Notes',
  'ADMINISTRAÇÃO / ACESSOS': 'ADMINISTRATION / ACCESS',
  'ADMINISTRAÇÃO / WORKSPACE': 'ADMINISTRATION / WORKSPACE',
  'Gerencie os membros e os níveis de acesso do workspace.': 'Manage workspace members and access levels.',
  'Gerencie os membros do StockFlow, seus perfis e o acesso ao sistema.': 'Manage StockFlow members, their roles, and system access.',
  'Usuários cadastrados': 'Registered users',
  'Contas ativas': 'Active accounts',
  'Administradores': 'Administrators',
  'Gerentes ativos': 'Active managers',
  'Buscar por nome ou e-mail...': 'Search by name or email...',
  'Buscar usuários': 'Search users',
  'Perfil': 'Role',
  'Todos': 'All',
  'Todos os tipos': 'All types',
  'Ativos': 'Active',
  'Inativos': 'Inactive',
  'Nenhum usuário encontrado': 'No users found',
  'Nenhum usuário nesta visualização': 'No users in this view',
  'Ajuste os filtros ou cadastre um novo usuário.': 'Adjust the filters or create a new user.',
  'O nome deve ter pelo menos 2 caracteres.': 'Name must contain at least 2 characters.',
  'Informe um endereço de e-mail válido.': 'Enter a valid email address.',
  'A senha deve ter pelo menos 12 caracteres.': 'Password must contain at least 12 characters.',
  'Usuário atualizado com sucesso.': 'User updated successfully.',
  'Usuário criado com sucesso.': 'User created successfully.',
  'Usuário desativado com sucesso.': 'User deactivated successfully.',
  'Usuário reativado com sucesso.': 'User reactivated successfully.',
  'Deseja desativar a conta de': 'Do you want to deactivate the account of',
  'Deseja reativar a conta de': 'Do you want to reactivate the account of',
  'A senha deve ter entre 12 e 128 caracteres.': 'Password must be between 12 and 128 characters.',
  'As permissões são aplicadas pelo servidor de acordo com o perfil.': 'Permissions are enforced by the server according to the assigned role.',
  'Somente administradores podem gerenciar usuários.': 'Only administrators can manage users.',
  'Perfis e permissões': 'Roles and permissions',
  'Resumo dos níveis de acesso definidos para o StockFlow.': 'Summary of access levels defined for StockFlow.',
  'Acesso total ao sistema, incluindo gerenciamento de usuários e configurações.': 'Full system access, including user management and settings.',
  'Gerencia produtos, categorias e fornecedores, registra movimentações e consulta relatórios.': 'Manages products, categories, and suppliers, records stock movements, and views reports.',
  'Consulta o inventário e registra entradas e saídas de estoque.': 'Views inventory and records stock entries and exits.',
  'Sobre o StockFlow': 'About StockFlow',
  'Informe seu e-mail e sua senha para continuar.': 'Enter your email and password to continue.',
  'E-mail ou senha inválidos. Confira seus dados e tente novamente.': 'Invalid email or password. Check your details and try again.',
  'Muitas tentativas de acesso. Aguarde um pouco antes de tentar novamente.': 'Too many sign-in attempts. Please wait before trying again.',
  'Não foi possível entrar. Tente novamente.': 'Unable to sign in. Please try again.',
  'Bem-vindo de volta': 'Welcome back',
  'Digite suas credenciais para acessar seu workspace.': 'Enter your credentials to access your workspace.',
  'Senha': 'Password',
  'E-mail': 'Email',
  'Entrando...': 'Signing in...',
  'Entrar': 'Sign in',
  'Esqueceu sua senha?': 'Forgot password?',
  'Ocultar senha': 'Hide password',
  'Mostrar senha': 'Show password',
  'A criação de contas é gerenciada pelo administrador do workspace. Entre em contato para solicitar acesso.': 'Account creation is managed by your workspace administrator. Contact them to request access.',
  'A recuperação de senha ainda não está configurada. Entre em contato com o administrador do workspace para redefinir sua senha.': 'Password recovery is not configured yet. Contact your workspace administrator to reset your password.',
  'Workspace': 'Workspace',
  'INVENTÁRIO / CATÁLOGO': 'INVENTORY / CATALOG',
  'PREFERÊNCIAS / WORKSPACE': 'PREFERENCES / WORKSPACE',
  'PREFERÊNCIAS': 'PREFERENCES',
  'Escolha como o StockFlow será exibido.': 'Choose how StockFlow is displayed.',
  'Aumenta somente as letras para facilitar a leitura, sem ampliar os componentes.': 'Enlarges text only for easier reading without scaling interface components.',
  'Define a preferência de idioma neste navegador.': 'Sets the preferred language in this browser.',
  'Escolha como as datas serão exibidas em todo o sistema.': 'Choose how dates are displayed throughout the system.',
  'Preferências salvas neste navegador.': 'Preferences are saved in this browser.',
  'Claro': 'Light',
  'Escuro': 'Dark',
  'Padrão': 'Default',
  'Grande': 'Large',
  'Muito grande': 'Extra large',
  'Dia / mês / ano': 'Day / month / year',
  'Mês / dia / ano': 'Month / day / year',
  'Abrir navegação': 'Open navigation',
  'Fechar navegação': 'Close navigation',
  'Fechar menu': 'Close menu',
  'Expand sidebar': 'Expand sidebar',
  'Collapse sidebar': 'Collapse sidebar',
  'Notificações': 'Notifications',
  'Pesquisar...': 'Search...',
  'Atualizar': 'Refresh',
  'Tentar novamente': 'Try again',
  'Carregando seu ambiente...': 'Loading your workspace...',
  'Ajuda e suporte': 'Help & support',
  'Sair da conta': 'Sign out',
});
Object.assign(enToPt, Object.fromEntries(Object.entries(ptToEn).map(([pt, en]) => [en, pt])));
Object.assign(enToPt, { 'INVENTORY MANAGEMENT': 'GESTÃO DE ESTOQUE', 'WORKSPACE': 'WORKSPACE', 'Main navigation': 'Navegação principal', 'Account menu': 'Menu da conta', 'Notifications': 'Notificações', 'Open navigation': 'Abrir navegação', 'Close navigation': 'Fechar navegação', 'Close menu': 'Fechar menu', 'Search...': 'Pesquisar...', 'Sign out': 'Sair da conta' });



// Missing page-level copy and system vocabulary found during the full UI audit.
Object.assign(ptToEn, {
  'CATEGORIA': 'CATEGORY', 'DESCRIÇÃO': 'DESCRIPTION', 'DATA': 'DATE',
  'PRODUTO': 'PRODUCT', 'QUANTIDADE': 'QUANTITY', 'RESPONSÁVEL': 'PERFORMED BY',
  'TIPO': 'TYPE', 'ESTOQUE': 'STOCK', 'LOCALIZAÇÃO': 'LOCATION',
  'PREÇO UNITÁRIO': 'UNIT PRICE', 'CUSTO UNITÁRIO': 'UNIT COST',
  'FORNECEDOR / DESTINATÁRIO': 'SUPPLIER / RECIPIENT', 'OBSERVAÇÃO': 'NOTE',
  'CADASTRADO EM': 'CREATED AT', 'CADASTRO DE PARCEIROS': 'SUPPLIER REGISTRATION',
  'CONTATO': 'CONTACT', 'CPF / CNPJ': 'TAX ID', 'FORNECEDOR': 'SUPPLIER',
  'GERENCIAMENTO DE ACESSO': 'ACCESS MANAGEMENT', 'PERFIL DE ACESSO': 'ACCESS ROLE',
  'USUÁRIO': 'USER', 'Criar categoria': 'Create category', 'Inativas': 'Inactive',
  'Produtos': 'Products', 'Dados atualizados diretamente da API do StockFlow. O resumo de movimentações considera os últimos 7 dias.': 'Data updated directly from the StockFlow API. The movement summary covers the last 7 days.',
  'De até': 'Up to',
  'Não foi possível carregar as categorias. Você ainda pode salvar o produto sem categoria.': 'Could not load categories. You can still save the product without a category.',
  'Não foi possível carregar o histórico:': 'Could not load history:',
  'Exibindo': 'Showing',
  'Informe os dados de identificação e contato.': 'Enter identification and contact details.',
  'Nome / Razão social': 'Name / Business name',
  'Cadastrar usuário': 'Create user',
  'Unidade (UN)': 'Unit (UN)', 'Caixa (CX)': 'Box (CX)', 'Pacote (PCT)': 'Pack (PCT)',
  'Quilograma (KG)': 'Kilogram (KG)', 'Grama (G)': 'Gram (G)', 'Litro (L)': 'Liter (L)',
  'Mililitro (ML)': 'Milliliter (ML)', 'Metro (M)': 'Meter (M)', 'Centímetro (CM)': 'Centimeter (CM)',
  'Ativa': 'Active', 'Inativa': 'Inactive',
  'Criada em': 'Created at', 'Criado em': 'Created at',
  'Confira os campos informados.': 'Check the fields you entered.',
  'Não foi possível concluir a operação.': 'Could not complete the operation.',
  'Já existe um fornecedor cadastrado com este CPF/CNPJ.': 'A supplier with this tax ID is already registered.',
  'Fornecedor não encontrado ou inativo.': 'Supplier not found or inactive.',
  'Já existe um produto cadastrado com este SKU.': 'A product with this SKU is already registered.',
  'Já existe uma categoria com esse nome.': 'A category with this name already exists.',
  'Estoque insuficiente para realizar esta saída.': 'Insufficient stock for this exit.',
  'O registro solicitado não foi encontrado.': 'The requested record was not found.',
  'O filtro de status informado é inválido.': 'The selected status filter is invalid.',
  'Informe um valor de texto.': 'Enter a text value.',
  'Informe um número válido.': 'Enter a valid number.',
  'Selecione uma opção válida.': 'Select a valid option.',
  'Este campo é obrigatório.': 'This field is required.',
  'O valor informado excede o limite permitido.': 'The entered value exceeds the allowed limit.',
  'Informe CPF com 11 dígitos ou CNPJ com 14 dígitos.': 'Enter an 11-digit CPF or a 14-digit CNPJ.',
  'O valor não pode ser negativo.': 'The value cannot be negative.',
  'Informe um valor maior que zero.': 'Enter a value greater than zero.',
  'Informe pelo menos um campo para atualizar.': 'Enter at least one field to update.',
  'Há um campo não reconhecido no formulário.': 'The form contains an unrecognized field.',
  'Verifique o valor informado.': 'Check the entered value.',
  'Itens por página': 'Items per page', 'Dados': 'Data', 'Tipo de movimentação': 'Movement type',
  'Preço': 'Price', 'Página': 'Page',
});
Object.assign(enToPt, {
  'By continuing, you agree to the Terms of Service and Privacy Policy.': 'Ao continuar, você concorda com os Termos de Serviço e a Política de Privacidade.',
  'New to StockFlow?': 'Novo no StockFlow?',
  'Sign in to continue to your workspace.': 'Entre para continuar no seu workspace.',
  'Enter your account details below.': 'Informe os dados da sua conta abaixo.',
  'EMAIL ADDRESS': 'E-MAIL', 'PASSWORD': 'SENHA',
  'Hide password': 'Ocultar senha', 'Show password': 'Mostrar senha',
  'Enter your password': 'Digite sua senha', 'About StockFlow': 'Sobre o StockFlow',
  'Everything in its place.': 'Tudo em seu devido lugar.',
  'Keep inventory, people and operations': 'Mantenha estoque, pessoas e operações',
  'connected in one workspace.': 'conectados em um único workspace.',
  'Inventory status': 'Status do inventário',
  'Healthy and up to date': 'Em dia e atualizado',
  'Inventory management, made clearer.': 'Gestão de estoque, de forma mais clara.',
  'Reports': 'Relatórios',
  'Inventory reporting will be connected when the backend module is available.': 'Os relatórios de estoque serão conectados quando o módulo de backend estiver disponível.',
  'WORKSPACE / REPORTS': 'WORKSPACE / RELATÓRIOS',
});
Object.assign(enToPt, Object.fromEntries(Object.entries(ptToEn).map(([pt, en]) => [en, pt])));


Object.assign(enToPt, {
  'Invalid email or password.': 'E-mail ou senha inválidos.',
  'Too many login attempts. Try again later.': 'Muitas tentativas de acesso. Tente novamente mais tarde.',
  'Invalid request data.': 'Dados da solicitação inválidos.',
  'Invalid login data.': 'Dados de acesso inválidos.',
  'Authentication required.': 'Autenticação necessária.',
  'Invalid language preference.': 'Preferência de idioma inválida.',
  'Invalid status.': 'Status inválido.',
  'Invalid user data.': 'Dados do usuário inválidos.',
  'Invalid user ID.': 'ID de usuário inválido.',
  'You do not have permission to perform this action.': 'Você não tem permissão para realizar esta ação.',
  'SKU already exists.': 'Este SKU já está cadastrado.',
  'Product not found.': 'Produto não encontrado.',
  'A category with this name already exists.': 'Já existe uma categoria com esse nome.',
  'Category not found.': 'Categoria não encontrada.',
  'Move active products to another category before deactivating this category.': 'Mova os produtos ativos para outra categoria antes de desativar esta categoria.',
  'Active category not found.': 'Categoria ativa não encontrada.',
  'A supplier with this tax ID already exists.': 'Já existe um fornecedor com este CPF/CNPJ.',
  'Supplier not found.': 'Fornecedor não encontrado.',
  'Active supplier not found.': 'Fornecedor ativo não encontrado.',
  'Insufficient stock.': 'Estoque insuficiente.',
  'A user with this email already exists.': 'Já existe um usuário com este e-mail.',
  'User not found.': 'Usuário não encontrado.',
  'You cannot deactivate your own account.': 'Você não pode desativar sua própria conta.',
  'The last active administrator cannot be deactivated or demoted.': 'O último administrador ativo não pode ser desativado ou rebaixado.',
  'Supplier and unit cost can only be provided for ENTRY movements.': 'Fornecedor e custo unitário só podem ser informados em movimentações de entrada.',
  'Recipient can only be provided for EXIT movements.': 'O destinatário só pode ser informado em movimentações de saída.',
  'Invalid request origin.': 'Origem da solicitação inválida.',
  'Request origin is required.': 'A origem da solicitação é obrigatória.',
});


Object.assign(ptToEn, {
  'Últimas operações registradas no estoque': 'Latest stock operations',
  'Informações adicionais sobre o produto.': 'Additional product information.',
  'Pessoa, setor ou unidade que recebeu': 'Person, department, or unit that received it',
  'Ex.: Compra, reposição, consumo...': 'e.g. Purchase, restock, usage...',
  'Registrando...': 'Recording...',
  '↑ Entrada': '↑ Entry', '↓ Saída': '↓ Exit',
  'Consulte os fornecedores vinculados às entradas do estoque.': 'View suppliers linked to stock entries.',
  'Digite somente números': 'Enter numbers only',
  'Ex.: Distribuidora Central Ltda.': 'e.g. Central Distribution Ltd.',
  'Informações adicionais sobre o fornecedor.': 'Additional supplier information.',
  'Rua, número, cidade...': 'Street, number, city...',
  'Somente números': 'Numbers only',
  'Telefone não informado': 'Phone not provided',
  'Tente buscar por outro nome ou e-mail.': 'Try searching for another name or email.',
  'Atualizar dados': 'Refresh data',
  'Nenhum registro': 'No records', 'Não informada': 'Not provided',
});
Object.assign(enToPt, Object.fromEntries(Object.entries(ptToEn).map(([pt, en]) => [en, pt])));
Object.assign(enToPt, {
  'Password recovery is not configured yet. Contact your workspace administrator to reset your password.': 'A recuperação de senha ainda não está configurada. Entre em contato com o administrador do workspace para redefinir sua senha.',
  'Account creation is managed by your workspace administrator. Contact them to request access.': 'A criação de contas é gerenciada pelo administrador do workspace. Entre em contato para solicitar acesso.',
});

// Explicit corrections for strings that are authored in English or Portuguese
// in the UI. Keep the two directions separate: ptToEn is Portuguese -> English,
// while enToPt is English -> Portuguese. Older dictionary additions accidentally
// mixed both directions, which caused mixed-language screens and reversed headers.
const englishSourceKeysThatMustNotBeInPtToEn = [
  'Sign in to continue to your workspace.',
  'Everything in its place.',
  'Keep inventory, people and operations',
  'connected in one workspace.',
  'Inventory status',
  'Healthy and up to date',
  'LIVE',
  'STOCKFLOW · INVENTORY MANAGEMENT',
  'Enter your account details below.',
  'EMAIL ADDRESS',
  'PASSWORD',
  'PRODUCT',
  'CATEGORY',
  'UNIT PRICE',
  'STOCK',
  'LOCATION',
  'STATUS',
  'DESCRIPTION',
  'CREATED AT',
  'SUPPLIER',
  'TYPE',
  'QUANTITY',
  'SUPPLIER / RECIPIENT',
  'UNIT COST',
  'PERFORMED BY',
  'DATE',
  'NOTES',
  'USER',
  'ACCESS ROLE',
  'REGISTERED AT',
  'Welcome back',
  'Search anything...',
];
for (const key of englishSourceKeysThatMustNotBeInPtToEn) delete ptToEn[key];

// Dashboard and supplier copy that was missing from the Portuguese -> English map.
Object.assign(ptToEn, {
  'Acima de zero, no mínimo ou abaixo': 'Above zero and at or below the minimum stock level',
  'Mantenha os dados dos fornecedores organizados para vincular recebimentos e acompanhar a origem das entradas.':
    'Keep supplier information organized to link receipts and track the source of stock entries.',
});

// Table headings are authored in Portuguese. Their Portuguese rendering must
// remain untouched, while the English locale receives the matching English label.
Object.assign(ptToEn, {
  'PRODUTO': 'PRODUCT',
  'TIPO': 'TYPE',
  'QUANTIDADE': 'QUANTITY',
  'DATA': 'DATE',
  'RESPONSÁVEL': 'PERFORMED BY',
  'STATUS': 'STATUS',
  'CATEGORIA': 'CATEGORY',
  'PREÇO UNITÁRIO': 'UNIT PRICE',
  'ESTOQUE': 'STOCK',
  'LOCALIZAÇÃO': 'LOCATION',
  'DESCRIÇÃO': 'DESCRIPTION',
  'CRIADA EM': 'CREATED AT',
  'FORNECEDOR / DESTINATÁRIO': 'SUPPLIER / RECIPIENT',
  'CUSTO UNITÁRIO': 'UNIT COST',
  'OBSERVAÇÃO': 'OBSERVATION',
  'FORNECEDOR': 'SUPPLIER',
  'CPF / CNPJ': 'CPF / CNPJ',
  'CONTATO': 'CONTACT',
  'CADASTRADO EM': 'REGISTERED AT',
  'USUÁRIO': 'USER',
  'PERFIL DE ACESSO': 'ACCESS ROLE',
});

// Remove the accidentally reversed Portuguese keys from the English -> Portuguese
// map. In pt-BR, Portuguese table headings should simply stay as authored.
for (const key of [
  'PRODUTO', 'TIPO', 'QUANTIDADE', 'DATA', 'RESPONSÁVEL', 'STATUS',
  'CATEGORIA', 'PREÇO UNITÁRIO', 'ESTOQUE', 'LOCALIZAÇÃO', 'DESCRIÇÃO',
  'CRIADA EM', 'FORNECEDOR / DESTINATÁRIO', 'CUSTO UNITÁRIO', 'OBSERVAÇÃO',
  'FORNECEDOR', 'CPF / CNPJ', 'CONTATO', 'CADASTRADO EM', 'USUÁRIO',
  'PERFIL DE ACESSO',
]) delete enToPt[key];

// Login and global search are written in English in the components. Translate
// them only for pt-BR; English must keep the original copy unchanged.
Object.assign(enToPt, {
  'Welcome back': 'Bem-vindo de volta',
  'Sign in to continue to your workspace.': 'Entre para continuar no seu workspace.',
  'Enter your account details below.': 'Informe os dados da sua conta abaixo.',
  'Everything in its place.': 'Tudo em seu devido lugar.',
  'Keep inventory, people and operations': 'Mantenha estoque, pessoas e operações',
  'connected in one workspace.': 'conectados em um único workspace.',
  'Inventory status': 'Status do inventário',
  'Healthy and up to date': 'Em dia e atualizado',
  'LIVE': 'AO VIVO',
  'STOCKFLOW · INVENTORY MANAGEMENT': 'STOCKFLOW · GESTÃO DE ESTOQUE',
  'EMAIL ADDRESS': 'E-MAIL',
  'PASSWORD': 'SENHA',
  'Search anything...': 'Pesquisar em tudo...',
});

function replacePhrases(input: string, dictionary: Record<string, string>) {
  // Translate complete UI phrases while preserving JSX whitespace. Never rewrite
  // arbitrary user-entered names, descriptions, SKUs, or notes.
  const leading = input.match(/^\s*/)?.[0] ?? '';
  const trailing = input.match(/\s*$/)?.[0] ?? '';
  const key = input.trim().replace(/\s+/g, ' ');
  const translated = dictionary[key];
  return translated === undefined ? input : `${leading}${translated}${trailing}`;
}
export function translate(input: string, language: Language) {
  return language === 'en' ? replacePhrases(input, ptToEn) : replacePhrases(input, enToPt);
}
export function I18nProvider({ children }: { children: ReactNode }) {
  const preferences = usePreferences();
  const value = useMemo<I18nContextValue>(() => ({
    language: preferences.language,
    setLanguage: (next) => updatePreferences({ language: next }),
    dateFormat: preferences.dateFormat,
    setDateFormat: (next) => updatePreferences({ dateFormat: next }),
  }), [preferences.language, preferences.dateFormat]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
const translatableProps = new Set(['placeholder', 'title', 'aria-label', 'alt', 'label', 'description', 'eyebrow', 'detail', 'helperText', 'emptyMessage']);
function translateNode(node: ReactNode, language: Language): ReactNode {
  if (typeof node === 'string') return translate(node, language);
  if (Array.isArray(node)) return node.map((child) => translateNode(child, language));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.type === UserText) return node;
  if (element.props['data-i18n-ignore'] === true || element.props['data-i18n-ignore'] === 'true' || element.props.translate === 'no') return node;
  const nextProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(element.props)) {
    if (key === 'children') nextProps.children = translateNode(value as ReactNode, language);
    else if (translatableProps.has(key) && typeof value === 'string') nextProps[key] = translate(value, language);
    else if (Array.isArray(value) || isValidElement(value)) nextProps[key] = translateNode(value as ReactNode, language);
    else nextProps[key] = value;
  }
  return cloneElement(element, nextProps);
}
export function TranslateTree({ children }: { children: ReactNode }) {
  const { language } = useI18n();
  return <>{translateNode(children, language)}</>;
}

/** Render database/user-provided text without passing it through the UI translator. */
export function UserText({ children, as = 'span' }: { children: ReactNode; as?: 'span' | 'strong' | 'small' | 'em' | 'p' }) {
  const Element = as;
  return <Element data-i18n-ignore="true">{children}</Element>;
}
