**Documento Maestro de Arquitectura y Desarrollo: Academia S.I.O.N.**
Este documento funge como el criterio maestro de ingeniería para el diseño, implementación y validación de la plataforma Academia S.I.O.N. (Sistema Íntegro de Orquestación y Nivelación). Está estructurado bajo los estándares de la ingeniería de software moderna y la filosofía de desarrollo AI-First, sirviendo como guía de referencia estricta para garantizar la escalabilidad, mantenibilidad y robustez del sistema.

## 1. Filosofía de Desarrollo AI-First Software Engineering
El desarrollo de la Academia S.I.O.N. se ejecuta bajo un paradigma AI-First, donde las herramientas de inteligencia artificial actúan como copilotos estratégicos de ingeniería. Los pilares de este enfoque son:

- Generación Guiada por Contexto: Suministrar esquemas estrictos de bases de datos y tipos de TypeScript a la IA para evitar alucinaciones en la lógica de negocio.
- Validación Cruzada Inversa: Utilizar la IA para revisar el código generado en busca de brechas de seguridad, cuellos de botella en consultas SQL y optimizaciones de renderizado.
- Depuración Basada en Logs Semánticos: Analizar los mensajes de error del compilador y del motor de base de datos de manera integral, tratando los errores como desviaciones en los planos arquitectónicos y no como parches aislados.

## 2. Arquitectura Tecnológica y Stack de Producción
La plataforma se cimienta sobre una arquitectura monolítica modular de alto rendimiento, optimizada para sub-segundo load times y SEO técnico.

### Capa de Software

| Tecnología Seleccionada | Propósito Arquitectónico |
|---|---|
| Next.js (App Router) | Server Components para consultas directas y Server Actions para mutaciones sin APIs intermedias. |
| Drizzle ORM | ORM agnóstico y de tipo seguro con rendimiento similar a SQL nativo sin sobrecarga en tiempo de ejecución. |
| PostgreSQL | Base de datos relacional robusta con soporte estricto para integridad referencial y enums nativos. |
| Zod | Validación de esquemas declarativos en el cliente y duplicada de forma obligatoria en el servidor. |

## 3. Cronograma de Fases de Desarrollo (Actualizado)

- **Fase 1: Infraestructura Base y Persistencia Relacional** — Estatus: Completada.
  - Establecimiento del entorno de ejecución local, interconexión de Drizzle con PostgreSQL, y modelado de organizaciones, iglesias y usuarios.
- **Fase 2: Gestión de Entidades e Integridad de Datos** — Estatus: En Ejecución.
  - Formularios interactivos controlados, procesados vía Server Actions con validación Zod y revalidación de caché bajo demanda vía `revalidatePath()`.
- **Fase 3: Núcleo Académico y Enrutamiento Dinámico (LMS)** — Estatus: En Ejecución / Siguiente Sprint.
  - Modelado de módulos y lecciones. Rutas dinámicas `/cursos/[id]/page.tsx` con selección explícita de campos y reproductores de video embebidos.
- **Fase 3.5: Módulo Social, Evidencias en Video y Retroalimentación Comunitaria (Social LMS)** — Estatus: Planificada.
  - Implementación del sistema participativo donde aprendices de distintas congregaciones y distritos publican ejecuciones en video como evidencia práctica de cada lección. Muro comunitario de retroalimentación, revisiones por parte de líderes/profesores y feed de actividad en tiempo real.
- **Fase 4: Autenticación, Control de Acceso y Seguridad (RBAC)** — Estatus: Planificada.
  - Sistema de sesiones seguro (Bcrypt), Middleware global y RBAC estricto donde un `APRENDIZ` solo puede publicar evidencias y comentar, mientras que `LIDER` y `ADMIN` pueden evaluar y auditar.
- **Fase 5: Estrategia de Testing y Despliegue Continuo (CI/CD)** — Estatus: Planificada.
  - Pruebas unitarias (Vitest), integración (Testcontainers) y E2E (Playwright).

## 4. Diseño del Modelo Relacional de Datos (Ampliado)
El diseño sigue estrictamente la Tercera Forma Normal (3FN). Se integran las nuevas entidades para soportar la capa social:

- `organizaciones`: Almacena las entidades macro (iglesias y distritos geográficos).
- `usuarios`: Entidad de miembros vinculada a una organización vía `organizacion_id` (integer). Posee un enum nativo de Postgres para restringir los roles válidos a `'ADMIN'`, `'LIDER'` o `'APRENDIZ'`.
- `cursos`: Rutas formativas divididas por el campo estricto de instrumento.
- `lecciones`: Hijos relacionales de un curso específico vinculados mediante `curso_id` (integer) con política de borrado en cascada (`onDelete: 'cascade'`). Controla su secuencialidad mediante `orden`.
- `evidencias_leccion` (NUEVO): Almacena las ejecuciones prácticas en video subidas por los aprendices para validar una lección.
- `comentarios_evidencia` (NUEVO): Retroalimentación y soporte comunitario entre hermanos y líderes en las evidencias publicadas.
- `reacciones_evidencia` (NUEVO): Sistema simplificado de aliento entre estudiantes de la comunidad.

## 5. Estándares de Validación y Robustez del Código (Actualizado)

1. Defensa en Capas (Double-Gate Validation): Las validaciones HTML/JS de cliente son puramente UX. Ninguna evidencia en video o comentario se procesa sin pasar por el esquema Zod en la Server Action.

Ejemplo de esquema para subir evidencia:

```ts
export const subirEvidenciaSchema = z.object({
  leccionId: z.number().int().positive(),
  videoUrl: z.string().url().refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com'),
    { message: 'La URL debe ser un enlace válido de YouTube o Vimeo.' }
  ),
  descripcion: z.string().max(500, 'La descripción no puede exceder los 500 caracteres.').optional(),
});
```

2. Blindaje de Entornos: Todos los scripts destructivos incorporan el cortacircuito de entorno `process.env.NODE_ENV === 'production'`.
3. Tipado Estricto de Extremo a Extremo: Cero uso de `any`. Toda mutación social o consulta infiere sus tipos vía Drizzle u ORM (`z.infer`).

## 7. Física del Tráfico y Concurrencia (Serverless-First) (Ampliado)

- Connection Pooling para Entornos Serverless: Uso obligatorio de poolers en Modo Transacción o HTTP/WebSockets para prevenir el colapso por peticiones concurrentes de la comunidad.
- Rate Limiting (Limitación de Tasa en la Capa Social): Las Server Actions de publicación de comentarios y subida de evidencias tendrán limitación de tasa por IP/Usuario (ej. máximo 3 videos por hora y 10 comentarios por minuto) para evitar spam o abusos en la plataforma.
- Optimización de Payload y Carga Diferida (Lazy Loading): Se prohíbe `SELECT *`. Las listas de comentarios y el feed comunitario se cargarán mediante paginación o Server Components diferidos (`<Suspense>`) para no penalizar el tiempo de carga del reproductor principal de la lección.

## 8. Estrategia Global de Manejo de Errores y Timeouts (Error Handling)

- Timeouts Estrictos en Server Actions (5-8 segundos): Toda mutación (incluyendo la publicación de evidencias) expira si excede 8s usando `Promise.race`.
- Cero Fugas de Infraestructura: Errores de BD capturados en `try/catch` y transformados en mensajes amigables al usuario.
- Contrato de Respuesta Estándar `ActionResponse<T>`:

```ts
export type ActionResponse<T> =
  | { success: true; data?: T }
  | { success: false; errors?: Record<string, string[]>; message?: string };
```

- Límites de Error (Error Boundaries) en Módulos Sociales: El muro de evidencias de la comunidad y la caja de comentarios estarán aislados en sus propios componentes con `error.tsx`. Si la carga de comentarios de la comunidad falla, el reproductor de la lección sigue funcionando ininterrumpidamente.

## 9. Idempotencia y Mutaciones de Alta Velocidad (Ampliado)

- Prevenimos doble publicación de videos: Los botones de envío de tareas en video se deshabilitan optimistamente al primer clic (`disabled={pending}`) usando `useFormStatus` / `useTransition`.
- Restricciones Únicas: Un aprendiz solo puede tener una evidencia activa por lección o una sola reacción por video mediante restricciones `unique()` en la base de datos.

## 10. Observabilidad y Trazabilidad (Monitoreo AI-First)

- Logging Estructurado: Los `console.log()` simples quedan descartados para el entorno de producción. Se implementará un logger estructurado en formato JSON (ej. Pino o Winston) que registre el contexto de la acción (ID del usuario, latencia de la consulta, ruta).
- Trazabilidad de Base de Datos: Se habilitará la opción de logueo interno de Drizzle (`logger: true`) en entornos de desarrollo y staging para auditar visualmente las sentencias SQL generadas, permitiendo identificar tempranamente consultas ineficientes (N+1 queries).
- Monitoreo de Core Web Vitals: Se integrará la analítica de Vercel (o similar) para medir continuamente el First Contentful Paint (FCP) y el Cumulative Layout Shift (CLS), asegurando que los componentes interactivos mantengan una experiencia premium y fluida.

---
Fecha: 2026-08-31
