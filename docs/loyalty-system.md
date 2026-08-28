# Sistema de fidelización

## Puntos

Configurables desde `/admin/configuracion` (tabla `LoyaltyConfig`, fila única):

- `amountPerPoint` / `pointsPerAmount` — ej. `$1.000 = 1 punto` es
  `amountPerPoint = 1000, pointsPerAmount = 1`. Fórmula:
  `puntos = floor(monto / amountPerPoint * pointsPerAmount)`.
- `registrationPoints`, `firstPurchasePoints`, `birthdayPoints`,
  `referralSponsorPoints`, `referralRefereePoints` — puntos fijos por evento.
- `pointsExpireAfterDays` — reservado en el esquema; el *cálculo* de
  vencimiento no está implementado como job automático todavía (ver
  limitaciones al final).
- `redemptionCodeExpiryHours` — vigencia del código que se genera al canjear
  un premio.

Un producto puede tener su propio `pointsMultiplier` (ej. `1.5x` en productos
estratégicos) y `bonusPoints` fijos — se aplican por ítem, no sobre el total
del pedido, para que el cálculo sea correcto en pedidos mixtos.

Las promociones (`Promotion`) se evalúan encima del cálculo base: el
multiplicador más alto que aplique (por categoría, producto, o toda la
tienda) y la suma de todos los bonos fijos vigentes.

## El ledger (`PointTransaction`)

Nunca se escribe `CustomerProfile.pointsBalance` a mano. Todo pasa por
`awardPoints()` en `loyalty-service.ts`, que:

1. Lee el saldo actual del cliente.
2. Si el `amount` (puede ser negativo) dejaría el saldo por debajo de cero,
   lanza `INSUFFICIENT_POINTS` y no escribe nada — ni la transacción, ni el
   nuevo saldo. Probado en `tests/loyalty-service.test.ts`.
3. Crea la fila de `PointTransaction` con `balanceAfter` ya calculado.
4. Actualiza el caché (`pointsBalance`, `lifetimePoints`, `tierId`).
5. Dispara las notificaciones correspondientes (`+X puntos`, y si cambió de
   nivel, la de "¡Felicitaciones!").

El saldo es, por construcción, la suma de `amount` de todas las transacciones
del cliente — `reconcileCustomerBalance()` lo demuestra reconstruyéndolo desde
cero.

## Niveles

Ver [docs/database.md](database.md#por-qué-lifetimepoints-es-distinto-de-pointsbalance)
para la diferencia entre saldo y base de nivel. La resolución de nivel
(`resolveTierForPoints` en `tier-service.ts`) es una función pura: dado un
`lifetimePoints` y la lista de tiers activos, devuelve el de mayor
`minimumPoints` que el cliente ya alcanzó. Sin tiers hardcodeados — el seed
crea Amigo/Fan/Fanático, pero un admin puede agregar, editar o desactivar
niveles libremente desde `/admin/niveles`.

## Cumpleaños

Se pide la bebida favorita del cliente (`User.favoriteDrink`, lista fija en
`src/lib/constants.ts`) en el registro y en "Mis datos". Durante la ventana
de cumpleaños (`isBirthdayWindowActive`, ±7 días), `/inicio` muestra un
banner — al reclamarlo (`claimBirthdayReward`), una sola vez por año:

1. Otorga `config.birthdayPoints` (bono de puntos).
2. Crea un `RewardRedemption` real (código de un solo uso, mismo vencimiento
   que cualquier canje) para el reward oculto sembrado como
   `BIRTHDAY_COFFEE_REWARD_ID` — no puntos simbólicos, un café gratis
   canjeable de verdad, con `pointsSpent: 0`.

Ese reward tiene `hidden: true`, así que nunca aparece en `/canjear` — solo
se otorga por este flujo o manualmente desde "Enviar beneficio" en el admin.
El mostrador ve la bebida a preparar al validar el código
(`validateRedemptionAction` incluye `user.favoriteDrink`).

## Misiones

`evaluateMissionsForOrder()` corre dentro de la misma transacción que
registra la compra. Por cada misión activa y aplicable al tipo de evento
(`PURCHASE_COUNT`, `VISIT_COUNT`, `SPEND_AMOUNT`, `PRODUCT_PURCHASE`,
`CATEGORY_PURCHASE`), calcula el incremento y actualiza (o crea) la fila de
`MissionProgress` de ese ciclo. Al llegar al objetivo, otorga la recompensa
en puntos **una sola vez** (el estado pasa a `REWARD_CLAIMED` y eventos
posteriores del mismo ciclo no vuelven a evaluarla).

`REFERRAL` es la excepción: no se rastrea vía `MissionProgress` — se resuelve
en vivo contra `referral-service.ts` (cantidad de referidos completados),
porque el evento que la completa (la primera compra del invitado) ya tiene su
propio flujo de recompensas independiente. `SPECIAL_DATE`/`RAINY_DAY`/`CUSTOM`
quedan en el esquema para gestión manual desde el admin — no hay integración
automática con un servicio de clima ni un calendario de fechas especiales
todavía (ver limitaciones).

## Premios y canjes

`redeemReward()` valida, en orden: que el premio esté activo y vigente, que
el nivel del cliente alcance (si el premio lo requiere), que tenga saldo
suficiente, que no haya superado su límite personal de canjes, y — con un
`updateMany` atómico con `WHERE stock > 0` — que quede stock. Ese último
punto es lo que evita sobreventa bajo canjes concurrentes: si dos canjes
simultáneos compiten por la última unidad, solo uno de los dos `updateMany`
afecta una fila.

El código de canje usa un alfabeto de 32 símbolos sin ambigüedades (sin
`0/O/1/I`) — 8 caracteres da ~10^12 combinaciones, de un solo uso y con
vencimiento configurable.

## Referidos

- Código personal por cliente (`CustomerProfile.referralCode`), generado al
  registrarse.
- Auto-referido bloqueado comparando email/teléfono contra el dueño del
  código, **antes** de crear la cuenta.
- Un invitado nunca puede tener más de un padrino: `Referral.refereeId` es
  `@unique` a nivel de base de datos, no solo a nivel de aplicación.
- El referido queda `PENDING` hasta la primera compra del invitado —recién
  ahí se otorgan los puntos a ambos (`completeReferralOnFirstPurchase`,
  llamado desde `registerOrder`), y solo una vez: compras siguientes no
  vuelven a completarlo.

## Métricas (`/admin`, sección "Fidelización")

Documentadas explícitamente porque no son obvias de nombre:

- **Cliente activo** = compró en los últimos 30 días.
- **Ticket promedio** = promedio de `Order.totalAmount` sobre pedidos
  completados.
- **Frecuencia promedio** = promedio, por cliente con al menos un pedido, de
  `totalOrders / meses desde su primera compra` (mínimo 1 mes para evitar
  dividir por un período casi nulo).
- **Ratio de canje** = puntos canjeados (lifetime) / puntos otorgados
  (lifetime).
- **Puntos por cobrar (points liability)** = suma de los saldos gastables
  actuales de todos los clientes — el "pasivo" en puntos que el negocio le
  debe a sus clientes.
- **CLV**: no se implementó un cálculo dedicado — `totalSpent` por cliente ya
  está disponible y es la aproximación más simple; un CLV proyectado (con
  retención/margen) queda fuera de este alcance.

## Limitaciones conocidas / próximos pasos

- **Vencimiento de puntos** (`pointsExpireAfterDays`): el campo existe y se
  puede configurar, pero no hay un job programado que efectivamente expire
  puntos viejos — haría falta un cron (ej. Vercel Cron) que recorra
  transacciones vencidas y emita `EXPIRATION`.
- **Vencimiento de canjes pendientes**: mismo caso — `RewardRedemption`
  vencidos no se marcan `EXPIRED` automáticamente hasta que alguien intenta
  usarlos (`markRedemptionUsed` sí lo detecta en ese momento).
- **`RAINY_DAY`**: el tipo de misión existe en el esquema pero no hay
  integración con una API de clima que la dispare automáticamente.
- **Comunicaciones masivas** (email/WhatsApp/push): la arquitectura de
  notificaciones (`notification-service.ts`) ya está pensada para
  enchufar proveedores por canal sin tocar el resto de la app
  (`channelDispatchers`), pero ningún proveedor está conectado todavía —
  hoy todas las notificaciones son in-app.
