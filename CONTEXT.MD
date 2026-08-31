# Academia S.I.O.N. Context

This repository implements a high-performance Learning Management System (LMS) for musician training in local churches.

## Architecture and Conventions

- Framework: Next.js App Router using React Server Components for queries and Server Actions for mutations.
- Language: Strict TypeScript with no `any` usage.
- Styling: Tailwind CSS with dark theme and gold/earth accents.
- Database: PostgreSQL with normalized schema and strict referential integrity.
- ORM: Drizzle ORM for type-safe database access.
- Validation: Zod for double-gate validation.
- Security: `bcryptjs` for password hashing and `jose` for JWT session management in HTTP-only cookies (`sion-session`).
- Idempotency: Redis/Upstash for execution key validation when needed.

## File Organization

- `src/app/actions/` - Modular server actions by domain.
- `src/app/(auth)/` - Authentication route group.
- `src/components/` - Pure client-side UI components.
- `src/db/` - Database initialization and Drizzle schema definitions.
- `src/lib/` - Shared utilities and validation schemas.
- `src/types/` - Action response contracts and schema-derived types.

## Engineering Rules

1. Double-Gate Validation
   - All server actions validate input with `zodSchema.safeParse()`.
   - Parse errors must be flattened using `.flatten()` and returned as a flat `fieldErrors` object.
   - No runtime `any`.

2. Serverless and Database Access
   - Use serverless-optimized database drivers or an external pooler.
   - Avoid `SELECT *`; Drizzle queries must explicitly select fields.

3. Error Handling and Timeouts
   - Wrap actions in a 5-8 second timeout via `AbortController` or `Promise.race()`.
   - Never expose raw database errors to clients.
   - Use a unified action contract:
     - `{ success: true; data?: T }`
     - `{ success: false; errors: Record<string, string[]>; message?: string }`

4. Idempotency and Concurrency
   - Enforce unique constraints at the database level.
   - Use Redis/Upstash for sensitive mutation idempotency keys with 24-hour TTL.
   - Disable UI buttons during pending mutations.

5. Business Rules and Access Control
   - Self-registration through `/registro` must assign the `APRENDIZ` role.
   - Role escalation is manual and restricted to admin flows.
   - Use `revalidatePath()` only when needed after successful data mutations.

6. Environment Protection
   - Seed, migration, or destructive scripts must abort in production with:
     ```ts
     if (process.env.NODE_ENV === 'production') {
       throw new Error('Operation safely aborted.');
     }
     ```

## Purpose of This File

This `CONTEXT.MD` file should be read by any agent or collaborator opening the repository to understand the core architecture, conventions, and engineering constraints.

## Roadmap

Se añadió un roadmap accionable y paso-a-paso en: [docs/ROADMAP.md](docs/ROADMAP.md)
Mantener este `CONTEXT.MD` sincronizado con el roadmap — los agentes deben actualizar aquí los checkpoints diarios.

## Seguridad y RBAC

Se añadió documentación y checklist para RBAC en: [docs/RBAC.md](docs/RBAC.md)

Antes de abrir una PR que haga mutaciones de `usuarios`, `cursos`, `lecciones` u `organizaciones`, ejecuta `npm run check:rbac` y completa la plantilla de PR (`.github/PULL_REQUEST_TEMPLATE.md`).

Nota: si aplicas una supresión `rbac:allow` en el código, documenta en la descripción de la PR la razón para la supresión (qué validaciones cubren la mutación, referencia a requisito o issue, y por qué no aplicar `requireRole()` aquí). Esto ayuda a la revisión de seguridad y auditoría futura.
