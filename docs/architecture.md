# Arquitectura

## Capas

```
app/ (rutas, Server Components)
  → actions/ (Server Actions: parsean FormData, validan con Zod, chequean rol)
    → server/services/ (lógica de negocio, transacciones Prisma)
      → prisma (acceso a datos)
```

- **`app/`** — solo composición de UI y fetch de datos vía servicios. Ninguna
  regla de negocio vive acá.
- **`actions/`** — el único lugar que lee `FormData` cruda. Valida con los
  esquemas de `schemas/`, resuelve el actor autenticado vía `lib/rbac.ts`, y
  delega toda la lógica a `server/services/`. Nunca accede a Prisma directamente.
- **`server/services/`** — el "motor de reglas" (puntos, niveles, misiones,
  premios, referidos, pedidos, auditoría, notificaciones). Cada función acepta
  un cliente `Db` (`PrismaClient` o una transacción `Prisma.TransactionClient`)
  para que un flujo completo (ej. registrar una compra) pueda componerse
  dentro de una única transacción atómica.
- **API routes** (`app/api/`) — solo para consumidores externos (NextAuth, el
  POS, el QR del cliente). El resto de la app usa Server Components/Actions,
  no fetch a una API propia — ver la nota de la sección 55 del prompt original
  sobre no inventar una capa REST donde Next ya resuelve el problema.

## Motor de reglas — flujo de una compra

`registerOrder` (en `order-service.ts`) es el orquestador central. Dentro de
**una sola transacción** (`prisma.$transaction`):

1. Idempotencia: si `externalReference` ya existe, devuelve el resultado
   original sin tocar nada más (protege contra doble entrega del POS).
2. Calcula puntos: base (`monto / amountPerPoint * pointsPerAmount`) +
   multiplicador/bonus por producto + promociones activas.
3. Crea la `Order` (+ `OrderItem[]` si hay productos).
4. Actualiza los totales cacheados del `CustomerProfile`.
5. Otorga los puntos vía `awardPoints` (crea la fila en `PointTransaction`,
   la única fuente de verdad — ver [docs/loyalty-system.md](loyalty-system.md)).
6. Si es la primera compra, otorga el bono de primera compra (transacción de
   puntos separada, para mantener el ledger legible).
7. Avanza las misiones aplicables (`evaluateMissionsForOrder`) y, si alguna
   se completa, otorga su recompensa.
8. Completa el referido pendiente del cliente, si lo tenía (solo en su
   primera compra).

Si cualquier paso falla, la transacción entera se revierte — nunca queda una
orden registrada sin sus puntos, o puntos otorgados sin su orden.

## Roles y autorización

`CUSTOMER` · `EMPLOYEE` · `ADMIN` · `SUPER_ADMIN`, definidos en el enum
`Role` de Prisma.

- **Proxy** (`src/proxy.ts`, antes "middleware") hace un chequeo **rápido y
  basado solo en la cookie de sesión** (sin tocar la base de datos): redirige
  a `/login` si falta sesión, y a `/` si el rol no corresponde a la sección
  (`/admin`, `/empleado`, o las rutas del cliente). Esto es solo una primera
  barrera de UX.
- **Cada Server Action y cada Server Component vuelve a verificar** rol vía
  `requireRole`/`requireUser` (`src/lib/rbac.ts`) — siguiendo la recomendación
  de Next.js de no depender únicamente del Proxy como límite de seguridad
  (una acción de servidor puede invocarse sin pasar por el árbol de rutas que
  el Proxy protege).
- Diferenciación `ADMIN` vs `SUPER_ADMIN`: ambos tienen acceso al panel
  administrativo; **solo `SUPER_ADMIN`** puede crear/revocar API keys de
  integración con el POS y restar puntos manualmente (un `EMPLOYEE` solo
  puede sumar).

## Seguridad

- Contraseñas: `bcryptjs`, nunca texto plano.
- Sesiones: JWT firmado (`AUTH_SECRET`), cookies `HttpOnly`/`Secure` (manejadas
  por Auth.js).
- QR del cliente: token opaco criptográficamente aleatorio (`crypto.randomBytes`,
  no CUID — ver `src/lib/codes.ts`), sin datos personales embebidos.
- Códigos de canje: alfabeto sin ambigüedades (sin 0/O/1/I), un solo uso,
  vencimiento configurable.
- Idempotencia en dos capas: `Order.externalReference` (único a nivel de
  esquema) para pedidos, y una tabla `IdempotencyKey` genérica para el resto
  de los endpoints de integración (via header `Idempotency-Key`).
- API keys del POS: se almacena solo el hash (SHA-256 — son de alta entropía,
  no necesitan el costo de bcrypt), con prefijo visible en el admin para
  identificarlas sin exponerlas. Firma HMAC opcional (`X-Signature`) sobre el
  body crudo.
- Todas las modificaciones manuales de puntos y envíos de premios por un
  admin/empleado exigen motivo y quedan en `AuditLog`.
- Ninguna validación de negocio confía solo en el cliente: cada Server Action
  vuelve a validar con Zod y a chequear el rol, incluso si la UI ya lo hizo.

## Decisiones documentadas

- **Prisma 7 + `@prisma/adapter-pg`**: ver [docs/database.md](database.md).
- **Sin `@auth/prisma-adapter`**: la app usa `Credentials` + sesión JWT
  exclusivamente (no hay login social todavía), así que no hace falta
  persistir `Account`/`Session` en la base — más simple y con menos tablas.
  Agregar un proveedor OAuth más adelante no requiere el adapter tampoco,
  siempre que se mantenga la estrategia JWT.
- **`react-hooks` "purity" rules (React Compiler-era)**: varios diálogos de
  administración originalmente cerraban el modal con
  `useEffect(() => { if (state.success) setOpen(false) })`, un patrón común
  con `useActionState` pero que el linter moderno marca como setState
  síncrono dentro de un efecto. Se reemplazó por `useDialogFormAction`
  (`src/hooks/use-dialog-form-action.ts`), que espera la Server Action dentro
  de una `useTransition` y cierra el modal como consecuencia directa del
  evento, no de un efecto reaccionando a un cambio de estado.
