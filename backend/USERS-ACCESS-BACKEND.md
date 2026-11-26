# Users & Access — backend

## Authorization matrix

- ADMIN: full access; only ADMIN can manage users.
- MANAGER: read dashboard and inventory; create/update/deactivate products, categories and suppliers; register stock movements.
- OPERATOR: read dashboard and inventory; register stock movements; cannot manage products, categories, suppliers or users.

Authorization is enforced by Express middleware, not by frontend visibility.

## Endpoints (all require an authenticated ADMIN)

- `GET /users` — list users (password hashes are never selected).
- `POST /users` — create user. Body: `{ "name", "email", "password", "role" }`; password must contain 12–128 characters.
- `PATCH /users/:id` — update `name`, `email`, `role`, and/or `isActive`.
- `DELETE /users/:id` — deactivate user and revoke active sessions.

The API prevents self-deactivation and prevents deactivating/demoting the last active administrator. Deactivation revokes all sessions belonging to that account.

No database migration is required: the existing `User`, `Session`, and `UserRole` schema supports these features.
