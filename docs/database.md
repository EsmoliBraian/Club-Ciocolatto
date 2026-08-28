# Base de datos

PostgreSQL + Prisma ORM 7. El esquema completo está en
[`prisma/schema.prisma`](../prisma/schema.prisma); este documento explica las
decisiones que no son obvias leyendo el archivo.

## Prisma 7 y el driver adapter

Prisma 7 eliminó el campo `url` del bloque `datasource` en `schema.prisma`. La
URL de conexión ahora vive en dos lugares distintos, a propósito:

- **`prisma.config.ts`** — usado por la *CLI* (migraciones, `prisma studio`,
  seed). Lee `DATABASE_URL` vía `dotenv/config`.
- **`src/lib/prisma.ts`** — usado por el *runtime de la app*. Instancia un
  `PrismaClient` con un **driver adapter** (`@prisma/adapter-pg`, sobre el
  paquete `pg`) en lugar de dejar que Prisma abra la conexión internamente.
  Esto es obligatorio en Prisma 7 — no es opcional — y es la pieza que
  permite después migrar a otros entornos (edge runtimes, otros drivers)
  cambiando solo ese archivo.

```ts
// src/lib/prisma.ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

## Entidades principales

| Modelo | Para qué |
|---|---|
| `User` / `CustomerProfile` | Identidad separada de perfil de fidelización — así las cuentas de `EMPLOYEE`/`ADMIN` nunca cargan campos de cliente que no usan. |
| `LoyaltyTier` | Niveles 100% configurables (sin hardcodear Amigo/Fan/Fanático en código). |
| `PointTransaction` | El ledger — ver [docs/loyalty-system.md](loyalty-system.md). Nunca se edita `CustomerProfile.pointsBalance` directamente. |
| `Mission` / `MissionProgress` | Definición de misión + una fila de progreso por cliente y por "ciclo" (ver más abajo). |
| `Reward` / `RewardRedemption` | Catálogo de premios y cada canje individual, con código único y estado. |
| `Product` / `Order` / `OrderItem` | Catálogo y ventas — con `Order.externalReference` único para idempotencia con el POS. |
| `Referral` | Una fila por relación padrino→invitado. `refereeId` es `@unique`: un invitado nunca puede tener más de un padrino, a nivel de esquema. |
| `Promotion` | Campañas de multiplicador/bonus/descuento, con vigencia y segmentación. |
| `Notification` / `AuditLog` | Notificaciones in-app y trazabilidad de cada acción sensible. |
| `LoyaltyConfig` | Fila única (`id = "singleton"`) con cada parámetro configurable del programa. |
| `ApiKey` / `IdempotencyKey` | Soporte para la integración con el POS — ver [docs/api.md](api.md). |

## Por qué `lifetimePoints` es distinto de `pointsBalance`

- `pointsBalance` — saldo gastable. Baja al canjear un premio.
- `lifetimePoints` — base para el nivel. **No baja al canjear.** Un cliente
  que gastó puntos en un café no debería bajar de nivel por eso — su nivel
  refleja lo que ganó históricamente, no lo que le queda. Sí baja si un admin
  hace un `ADJUSTMENT` negativo (corrección manual) o si una compra se
  reembolsa (`REFUND`).

Ambos son *cachés* reconstruibles: `reconcileCustomerBalance()` en
`loyalty-service.ts` los recalcula desde cero sumando `PointTransaction`, para
poder auditar o reparar cualquier drift.

## `MissionProgress.cycleKey`

Una misión puede ser de una sola vez o repetirse (ej. "visitá 3 veces este
mes", todos los meses). En vez de un campo `period` separado, se deriva:

- Si la misión tiene `startAt`/`endAt` → es una campaña acotada, un solo
  ciclo (`cycleKey = mission.id`).
- Si es abierta y `perUserLimit > 1` → se interpreta como mensual
  (`cycleKey = "2026-08"`, etc.).
- Si es abierta y `perUserLimit = 1` → una sola vez en la vida del cliente
  (`cycleKey = "once"`).

La restricción `@@unique([missionId, customerProfileId, cycleKey])` es lo que
hace que esto sea seguro: no puede haber dos filas de progreso para el mismo
ciclo.

## Índices

Los índices siguen los patrones de consulta reales del admin y de la PWA:
`PointTransaction` por `(customerProfileId, createdAt)` para el historial;
`Order` igual; `RewardRedemption` por `(status, expiresAt)` para el job de
vencimiento (no implementado como cron todavía, ver limitaciones); `AuditLog`
por `(entityType, entityId)` y por `(actorId, createdAt)`.

## Tests contra la base real

`tests/` corre contra el mismo Postgres de desarrollo (no hay mocks de
Prisma) porque gran parte de lo que se prueba es el comportamiento de las
transacciones reales (ej. que un canje con saldo insuficiente no deja
ninguna fila creada). Cada test crea sus propios usuarios/misiones/premios
con nombres únicos (`crypto.randomUUID()`) y los borra en `afterEach`. Los
tests de nivel usan tiers con umbrales muy altos (10.000+ puntos) para nunca
colisionar con los tiers reales del seed.

**Limitación conocida**: correr los tests contra la base de *desarrollo*
(en vez de una base de test dedicada) es una simplificación válida para el
tamaño actual del proyecto, pero no es lo ideal a largo plazo — lo correcto
sería un `DATABASE_URL` de test separado (ej. otro contenedor o schema) para
que correr tests nunca dependa de, ni afecte, los datos de desarrollo.
