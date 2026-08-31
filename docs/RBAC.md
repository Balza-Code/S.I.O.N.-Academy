# RBAC — Reglas y Guía de Implementación

Este documento define las reglas mínimas para aplicar Control de Acceso Basado en Roles (RBAC) en la plataforma Academia S.I.O.N.

Principios
- Todas las mutaciones que crean/actualizan/eliminan recursos sensiblemente administrativos (usuarios, cursos, lecciones, organizaciones) deben comprobar la sesión y el rol del solicitante.
- La verificación de sesión se realiza con `requireSession()` y la verificación de rol con `requireRole(roles: string[])`.
- Las acciones de auto-registro (`/registro`) y de autenticación (`/login`) deben permanecer públicas.

Helpers disponibles
- `src/lib/auth.ts`
  - `requireSession(): Promise<SessionPayload>` — lanza `HttpError('Unauthorized', 401)` si no hay sesión.
  - `requireRole(roles: string[]): Promise<SessionPayload>` — lanza `HttpError('Forbidden', 403)` si el rol no está en la lista.

Patrón recomendado para Server Actions

```ts
import { requireSession, requireRole } from '@/lib/auth';

export async function createCursoAction(formData: FormData) {
  // Requiere sesión y rol de administrador o líder
  const session = await requireRole(['ADMIN','LIDER']);

  // Ahora proceder con la mutación usando session.userId cuando sea necesario
}
```

Checklist de implementación para cada Server Action que muta datos
- [ ] Validación Zod en el servidor (`safeParse`).
- [ ] `requireSession()` usado para acciones que requieren autenticación.
- [ ] `requireRole([...])` aplicado para mutaciones administrativas.
- [ ] No confiar en `usuarioId` enviado por el cliente — usar `session.userId`.
- [ ] Envolver la lógica en try/catch y mapear errores DB a `ActionResponse` amigables.
- [ ] Timeouts aplicados (AbortController) para consultas/mutaciones largas.

Cómo auditar
- Ejecuta `npm run check:rbac` en tu máquina para hallar Server Actions que muten tablas críticas y verificar si usan `requireRole()`.

Notas
- RBAC debe mezclarse con políticas a nivel de UI (botones ocultos/deshabilitados) pero la verdadera seguridad se aplica en el servidor.

Suppressiones intencionales (`rbac:allow`)
---------------------------------------

En algunos casos válidos (p. ej. la acción pública de registro de usuarios) una Server Action necesita mutar una tabla sensible sin exigir `requireRole()` porque la mutación es explícitamente pública o está protegida por otras validaciones. Para permitir esto sin generar ruido en las auditorías automáticas, el repositorio soporta la convención de comentario `rbac:allow`.

Formas de uso:
- Archivo entero: añadir `// rbac:allow` en la cabecera del archivo para suprimir todas las advertencias de ese archivo.
- Función concreta: añadir `// rbac:allow:functionName` justo antes de la función para suprimir solamente esa función. Ejemplo:

```ts
// rbac:allow:registerAction
export async function registerAction(...) {
  // registro público
}
```

Buenas prácticas:
- Usa `rbac:allow` solo cuando la mutación sea segura y revisada.
- Documenta en la PR la razón para la supresión (referencia a requisito, validación adicional o flujo UX).
- Prefiere la supresión a nivel de función en lugar de archivo cuando sea posible.

El script de auditoría `scripts/check-rbac.js` reconoce estas anotaciones y reportará las entradas como `SUPP` en lugar de `WARN`.
