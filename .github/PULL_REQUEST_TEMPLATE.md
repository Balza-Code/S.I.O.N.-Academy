## Descripción
Breve descripción del cambio.

## Checklist técnico
- [ ] Validación Zod implementada en Server Actions.
- [ ] `requireSession()` usado donde aplica.
- [ ] `requireRole([...])` usado para mutaciones administrativas.
- [ ] No se confía en `usuarioId` enviado por el cliente.
- [ ] Selects explícitos en consultas (no `SELECT *`).
- [ ] Tests unitarios agregados/actualizados (Vitest) para lógica crítica.
- [ ] Seed/migration guard añadido cuando aplica.
- [ ] Logging y errores mapeados a `ActionResponse` amigable.

## Notas de seguridad
- Indica si la PR requiere revisión por un `ADMIN` debido a cambios en RBAC o esquemas de datos.
 - Si usas `rbac:allow` para suprimir una advertencia, añade una explicación breve aquí (por qué, validaciones adicionales, referencia de requisito o enlace a issue/PR).

## Cómo probar
Instrucciones de prueba manual o automatizada.
