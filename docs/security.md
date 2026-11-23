# Segurança do StockFlow

## Autenticação e sessões

- Login por e-mail e senha; o e-mail é normalizado para minúsculas.
- Senhas armazenadas com Argon2id usando salt aleatório de 16 bytes, memória de 64 MiB, três passagens e paralelismo 1.
- Comparação do resultado derivado com `timingSafeEqual`.
- Sessões persistidas no PostgreSQL; somente o hash SHA-256 do token é armazenado.
- Token de sessão gerado com 32 bytes aleatórios.
- Cookie `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção.
- Expiração padrão de 24 horas, configurável por `SESSION_TTL_HOURS` (limite máximo de 720 horas).
- Sessões expiradas, revogadas ou associadas a usuários inativos são recusadas.

## Proteções HTTP

- Rotas de produtos e movimentações exigem sessão autenticada.
- Requisições que alteram estado (`POST`, `PUT`, `PATCH`, `DELETE`) exigem `Origin` ou `Referer` correspondente a uma origem listada em `CORS_ORIGINS`.
- Login possui limite local de 5 tentativas por endereço IP em uma janela de 15 minutos, retornando HTTP 429 e `Retry-After` ao exceder o limite. O registro em memória é limitado a 10.000 clientes para evitar crescimento sem limite; ao atingir o teto, a entrada mais antiga é removida.
- O cookie de sessão não é acessível por JavaScript.

## Primeiro administrador

O primeiro administrador é criado somente pelo script explícito `npm run auth:bootstrap`, com dados fornecidos por variáveis de ambiente; a senha deve ter de 12 a 128 caracteres. A operação usa transação e advisory lock do PostgreSQL e não cria outro administrador quando já existe um. Não existe rota pública de criação de administrador.

## Limitações e cuidados operacionais

- O limitador de login usa memória do processo. Em implantação com múltiplas instâncias, deve ser substituído por armazenamento compartilhado (por exemplo, Redis) para que o limite seja global.
- O backend requer Node.js 24.12.0 ou superior por utilizar a API nativa Argon2 assíncrona de `node:crypto`.
- Configure `CORS_ORIGINS` com as origens reais da aplicação; não use curingas com cookies.
- Não versionar `.env`, credenciais, tokens ou dumps de banco.
- As migrations devem ser aplicadas somente após backup e conferência do banco de destino.
- A matriz de autorização por perfil (ADMIN, MANAGER e OPERATOR) ainda é uma etapa separada; nesta etapa, as rotas de estoque exigem autenticação, mas não aplicam permissões diferentes por função.
