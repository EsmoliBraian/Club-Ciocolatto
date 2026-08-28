# Club Ciocolatto

> Más que clientes, fanáticos.

Programa de fidelización de Ciocolatto: PWA de cliente (puntos, niveles, misiones,
premios, QR, referidos), panel de mostrador para empleados, y panel administrativo
completo (clientes, niveles, misiones, premios, promociones, canjes, auditoría,
configuración). Construido como producto real, no como demo.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives) + **Framer Motion**
- **PostgreSQL** + **Prisma ORM 7** (driver adapter — see [docs/database.md](docs/database.md))
- **Auth.js / NextAuth v5** — credenciales + JWT, RBAC de 4 roles
- **Zod** para validación server-side en cada acción y endpoint
- **Vitest** para lógica de negocio crítica

## Requisitos

- Node.js 20+
- Docker (para Postgres local) o una instancia Postgres propia

## Instalación

```bash
npm install
cp .env.example .env   # completar valores, especialmente SEED_* y AUTH_SECRET
docker compose up -d   # Postgres local en el puerto 5435
npx prisma migrate dev
npm run db:seed
npm run dev
```

La app queda en `http://localhost:3000` (o el próximo puerto libre si el 3000
está ocupado).

### Cuentas de desarrollo (seed)

Definidas por las variables `SEED_*` de tu `.env` — **nunca reutilizar estos
valores en producción**:

| Rol | Email | Password (definir en `.env`) |
|---|---|---|
| Super Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` |
| Empleado | `SEED_EMPLOYEE_EMAIL` | `SEED_EMPLOYEE_PASSWORD` |
| Cliente demo (320 pts, nivel Fan) | `SEED_CUSTOMER_EMAIL` | `SEED_CUSTOMER_PASSWORD` |

## Variables de entorno

Ver [.env.example](.env.example) — están todas documentadas ahí. Las
imprescindibles para levantar el proyecto: `DATABASE_URL`, `AUTH_SECRET`,
`NEXT_PUBLIC_APP_URL`, `SEED_*`.

## Scripts

```bash
npm run dev         # servidor de desarrollo (Turbopack)
npm run build        # build de producción
npm run start        # servir el build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test          # Vitest (requiere Postgres local corriendo — ver nota abajo)
npm run db:seed       # ejecuta prisma/seed.ts
```

### Sobre `npm run test`

Los tests son de integración: corren contra el mismo Postgres de desarrollo
(`docker compose up -d`), ejercitando la capa de servicios real (no mocks de
Prisma) porque la lógica crítica (ledger de puntos, canjes, misiones,
referidos) vive en transacciones reales. Cada test crea y borra sus propios
usuarios de prueba. Para un setup más estricto, lo siguiente sería apuntar
`DATABASE_URL` a una base de datos de test separada — no implementado todavía
por alcance, ver [docs/database.md](docs/database.md).

## Migraciones

```bash
npx prisma migrate dev --name <descripcion>   # nueva migración en desarrollo
npx prisma migrate deploy                      # aplicar migraciones en producción
npx prisma studio                               # explorar la base de datos
```

## Estructura del proyecto

```
prisma/                 schema, migraciones, seed
src/
  app/                   rutas (App Router)
    (auth)/              login, registro
    (customer)/           inicio, misiones, qr, canjear, perfil — PWA del cliente
    admin/                 panel administrativo
    empleado/               panel de mostrador
    api/                    route handlers (NextAuth, integración POS, QR)
  actions/               Server Actions (capa de entrada — valida y delega a services)
  server/
    services/             lógica de negocio (el "motor de reglas")
    repositories/          (reservado — hoy el acceso a datos vive en services vía Prisma directo)
  schemas/                esquemas Zod
  components/
    ui/                    primitivos shadcn/ui
    customer/ employee/ admin/ shared/   componentes por área
  lib/                    Prisma client, auth, RBAC, utilidades
  hooks/                  hooks de React reutilizables
  types/                  tipos compartidos
tests/                   Vitest — lógica crítica (puntos, canjes, misiones, referidos, niveles)
docs/                    arquitectura, base de datos, sistema de fidelización, API
```

## Roles

`CUSTOMER` · `EMPLOYEE` · `ADMIN` · `SUPER_ADMIN` — ver [docs/architecture.md](docs/architecture.md#roles-y-autorización).

## Documentación

- [docs/architecture.md](docs/architecture.md) — decisiones de arquitectura, capas, seguridad
- [docs/database.md](docs/database.md) — modelo de datos, Prisma 7 + driver adapters
- [docs/loyalty-system.md](docs/loyalty-system.md) — motor de puntos, niveles, misiones, métricas
- [docs/api.md](docs/api.md) — endpoints de integración con el POS

## Deploy

Pensado para **Vercel** (frontend + backend) + **Postgres administrado**
(Neon, Supabase o Railway funcionan sin cambios — el adapter es `pg`
estándar). Pasos:

1. Provisionar Postgres y setear `DATABASE_URL`/`DIRECT_URL` en Vercel.
2. Cargar el resto de las variables de `.env.example` en Vercel.
3. `npx prisma migrate deploy` contra la base de producción.
4. `npm run db:seed` **una sola vez**, con contraseñas fuertes y propias (no
   las de desarrollo) para crear el primer Super Admin.
5. Deploy normal de Vercel (`vercel deploy --prod` o vía Git).

`.vercelignore` ya excluye `.env*` para evitar que un `.env` local termine
subido al deploy (ver incidente documentado en memoria del proyecto).

## Integración futura con el POS

La arquitectura ya expone `/api/integrations/{orders,customers,refunds}`
autenticados por API key + idempotencia, listos para que el POS de Ciocolatto
se conecte sin reescribir nada del lado de la app. Ver
[docs/api.md](docs/api.md).
