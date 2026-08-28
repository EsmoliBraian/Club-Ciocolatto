# API de integración con el POS

Los únicos endpoints REST reales de la app son los de integración externa —
todo lo demás (login, compras registradas por un empleado, canjes,
misiones, dashboard) se resuelve con Server Components y Server Actions de
Next.js, sin necesidad de una capa REST propia.

## Autenticación

Cada request debe incluir una API key:

```
Authorization: Bearer <key>
```

(también se acepta el header `X-Api-Key`). Las keys se generan desde
`/admin/configuracion` → "Integración POS" (solo visible para `SUPER_ADMIN`).
Al crearla se muestra **una sola vez** el valor en texto plano — solo se
guarda su hash SHA-256. Cada key tiene *scopes* (`orders:write`,
`customers:read`, `customers:write`, `refunds:write`) — un request sin el
scope necesario recibe `401`.

Firma opcional adicional: si el caller envía `X-Signature`, debe ser el
HMAC-SHA256 (hex) del body crudo bajo `POS_WEBHOOK_SECRET`. Es aditivo — un
caller que no lo envía sigue autenticado solo con la API key.

## Idempotencia

- `POST /api/integrations/orders` es idempotente por su propio
  `externalReference` (el id de ticket del POS) — reintentar el mismo pedido
  nunca otorga puntos dos veces, sin necesidad de ningún header extra.
- El resto de los endpoints soportan el header genérico `Idempotency-Key`:
  si se reenvía la misma key, se devuelve la respuesta original guardada, sin
  volver a ejecutar el efecto.

## `POST /api/integrations/orders`

Registra una venta y otorga los puntos correspondientes.

```json
{
  "customer": { "qrToken": "…" },        // o { "email": "…" } o { "phone": "…" }
  "externalReference": "TICKET-10291",     // obligatorio — clave de idempotencia
  "totalAmount": 5000,                       // opcional si se envían items
  "paymentMethod": "tarjeta",
  "items": [
    { "externalSku": "SKU-CAFE", "name": "Café", "quantity": 1, "unitPrice": 2500 }
  ]
}
```

`externalSku` se resuelve contra `Product.externalSku` para aplicar el
multiplicador/bonus de puntos de ese producto — si no matchea ningún
producto, el ítem igual se registra pero sin multiplicador (`1x`).

Respuesta `201`: `{ "orderId": "...", "pointsEarned": 5, "alreadyProcessed": false }`.
Si el `externalReference` ya existía: `200` con `alreadyProcessed: true`.

## `GET /api/integrations/customers?email=|phone=|qrToken=`

Busca un cliente existente. `404` si no se encuentra.

## `POST /api/integrations/customers`

Crea un cliente si no existe (busca primero por email/teléfono). Las cuentas
creadas desde el POS reciben una contraseña aleatoria — **no se manda ningún
email de bienvenida todavía** (no hay proveedor de email conectado, ver
[docs/loyalty-system.md](loyalty-system.md#limitaciones-conocidas--próximos-pasos)),
así que hoy este flujo deja al cliente sin forma de loguearse hasta que se
conecte un proveedor de email con flujo de "recuperar contraseña". Antes de
usar este endpoint en producción, resolver ese paso.

## `POST /api/integrations/refunds`

```json
{ "externalReference": "TICKET-10291", "reason": "Producto en mal estado" }
```

Revierte los puntos otorgados por esa orden (transacción `REFUND`, monto
negativo) y marca la orden como `REFUNDED`. Si el cliente ya gastó esos
puntos en otro canje, la reversión falla (`INSUFFICIENT_POINTS`) — es un
límite conocido: hoy hace falta una corrección manual del admin
(`ADJUSTMENT`) para esos casos, en vez de permitir que el saldo quede
negativo.

## Endpoints internos de la PWA

- `GET /api/customer/qr` — devuelve el QR del cliente logueado como PNG.
  Requiere sesión de `CUSTOMER`.
- `GET/POST /api/auth/*` — manejados por Auth.js.

## Endpoints que **no** existen como REST

Conceptos como "registrar compra", "canjear premio" o "ver dashboard" no
tienen una ruta `/api/*` propia — son Server Actions (`src/actions/`) o
Server Components que consultan la base directamente. Es la forma
recomendada por Next.js para una app que no necesita servir a un cliente
externo en esos casos, y evita mantener dos capas (API + UI) sincronizadas
para la misma lógica.
