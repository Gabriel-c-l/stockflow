
## Products API

`GET /products` accepts `search`, `status` (`active`, `inactive`, `all`), `page` and `pageSize` (1–100). The response is `{ items, pagination }`.

`PATCH /products/:id` updates SKU, name, description and minimum stock. Stock quantity is intentionally not editable through this endpoint; use stock movements instead.

`DELETE /products/:id` performs a soft deactivation (`isActive = false`) and preserves the product and its movement history.
