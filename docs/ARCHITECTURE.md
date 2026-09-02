# Guía de estructura de software

## 1. Propósito

Academia S.I.O.N. es un LMS para formación musical en comunidades e iglesias. La aplicación permite:

- autenticación de usuarios mediante sesión JWT
- consulta de cursos y lecciones
- seguimiento de progreso por aprendiz
- publicación de evidencias en video
- comentarios y reacciones sobre evidencias
- administración protegida de cursos, lecciones y roles

Esta guía describe la estructura que existe actualmente y las reglas que deben seguir los próximos cambios.

## 2. Stack y responsabilidades

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Aplicación web | Next.js 16 App Router | Rutas, Server Components y Server Actions |
| Interfaz | React 19 + Tailwind CSS | Formularios, navegación y presentación |
| Persistencia | PostgreSQL | Datos relacionales e integridad referencial |
| Acceso a datos | Drizzle ORM | Consultas tipadas y mutaciones SQL |
| Validación | Zod | Validación de entrada en el servidor y UX en cliente |
| Sesiones | `jose` + cookies HTTP-only | Identidad autenticada |
| Contraseñas | `bcryptjs` | Hash y verificación de credenciales |
| Rate limiting | Upstash Redis con fallback en memoria | Límites de acciones sociales |
| Pruebas | Vitest | Tests unitarios y de actions |

## 3. Estructura de carpetas

```text
src/
  middleware.ts                 Protección temprana de rutas por sesión
  app/
    page.tsx                    Inicio y feed público
    login/                      Inicio de sesión
    register/                   Registro de usuarios
    dashboard/                  Panel del usuario autenticado
    admin/                      Panel de administración académica
    cursos/[id]/                Reproductor y progreso de un curso
    actions/
      auth.ts                   Login, registro y logout
      cursos.ts                 Progreso y CRUD de cursos
      lecciones.ts              CRUD de lecciones
      usuarios.ts               Gestión de roles
      social.ts                 Evidencias, comentarios y reacciones
      index.ts                  Barrel de Server Actions
      __tests__/                Tests de comportamiento de las actions
    components/                 Componentes de interfaz reutilizables
  db/
    index.ts                    Cliente Drizzle/PostgreSQL
    schema.ts                   Tablas, enums, claves y relaciones
    seed.ts                     Datos locales de desarrollo
  lib/
    auth.ts                     requireSession y requireRole
    sessions.ts                 Crear, leer y borrar JWT
    actionHelpers.ts            Timeout y contrato de respuestas
    rateLimiter.ts              Rate limiting e idempotencia
    redis.ts                    Cliente Redis opcional
  types/
    api.ts                      ActionResponse
    *.schema.ts                 Esquemas y tipos de entrada
```

## 4. Flujo de lectura

Las páginas protegidas son Server Components. El flujo normal es:

1. la petición llega a `middleware.ts`
2. el middleware verifica la cookie `sion-session`
3. una página obtiene la sesión con `obtenerSesion()` o exige acceso con `requireSession()`
4. la página consulta PostgreSQL mediante Drizzle
5. se seleccionan campos explícitos cuando la consulta está en código de aplicación
6. React renderiza la respuesta en el servidor

Ejemplo: `/dashboard` obtiene el usuario actual y los cursos disponibles. `/cursos/[id]` obtiene el curso, sus lecciones, el progreso del usuario y las evidencias de la lección activa.

## 5. Flujo de mutación

Las mutaciones usan Server Actions. El patrón es:

```text
Formulario
  -> Server Action
  -> normalización de FormData
  -> safeParse() con Zod
  -> requireSession() / requireRole()
  -> mutación Drizzle
  -> revalidatePath()
  -> ActionResponse o retorno de formulario
```

Reglas obligatorias:

- nunca confiar en un `usuarioId` enviado por el cliente para identificar al actor
- validar los datos dentro de la Server Action aunque el cliente ya valide
- devolver mensajes amigables y no errores crudos de PostgreSQL
- revalidar solo las rutas afectadas después de una mutación correcta
- aplicar autorización antes de escribir en tablas administrativas

## 6. Autenticación y RBAC

### Sesión

`sessions.ts` crea un JWT firmado con `JWT_SECRET` y lo guarda en la cookie HTTP-only `sion-session`. La cookie dura siete días. `requireSession()` lanza `HttpError(401)` cuando no existe una sesión válida.

### Roles

Los roles válidos son `ADMIN`, `LIDER` y `APRENDIZ`.

- `APRENDIZ`: consume cursos, marca progreso, publica evidencias y participa en comentarios/reacciones
- `LIDER`: administra cursos y lecciones y puede revisar contenido académico
- `ADMIN`: además gestiona roles de usuarios

`requireRole()` consulta el rol actual en la base de datos usando el `userId` de la sesión. Esto permite que un cambio de rol sea efectivo sin depender de un JWT antiguo.

La autorización se aplica en dos niveles:

1. la interfaz muestra u oculta accesos según el rol
2. la Server Action vuelve a comprobar el rol en el servidor

El segundo nivel es la garantía de seguridad.

## 7. Mutaciones administrativas actuales

| Action | Roles | Tabla | Propósito |
| --- | --- | --- | --- |
| `createCursoAction` | `ADMIN`, `LIDER` | `cursos` | Crear una ruta académica |
| `updateCursoAction` | `ADMIN`, `LIDER` | `cursos` | Editar una ruta |
| `deleteCursoAction` | `ADMIN`, `LIDER` | `cursos` | Eliminar una ruta |
| `createLeccionAction` | `ADMIN`, `LIDER` | `lecciones` | Crear contenido dentro de un curso |
| `updateLeccionAction` | `ADMIN`, `LIDER` | `lecciones` | Editar contenido y orden |
| `deleteLeccionAction` | `ADMIN`, `LIDER` | `lecciones` | Eliminar contenido |
| `updateUserRoleAction` | `ADMIN` | `usuarios` | Promover o degradar usuarios |
| `createOrganizacionAction` | `ADMIN` | `organizaciones` | Crear una iglesia o distrito |
| `updateOrganizacionAction` | `ADMIN` | `organizaciones` | Editar una organización |
| `deleteOrganizacionAction` | `ADMIN` | `organizaciones` | Eliminar una organización |

El panel de estas operaciones está en `/admin`. El acceso se presenta en el dashboard solo para `ADMIN` y `LIDER`, pero la ruta y las actions mantienen su propia protección.

## 8. Modelo de datos

- `organizaciones`: iglesias o distritos
- `usuarios`: identidad, credenciales, rol y organización
- `cursos`: rutas formativas
- `lecciones`: contenido ordenado dentro de un curso; se eliminan en cascada con el curso
- `progreso_lecciones`: relación usuario-lección con clave primaria compuesta para evitar duplicados
- `evidencias_leccion`: videos enviados por aprendices
- `comentarios_evidencia`: retroalimentación de la comunidad
- `reacciones_evidencia`: una reacción por usuario y evidencia mediante clave primaria compuesta

El esquema fuente es `src/db/schema.ts`. Las migraciones y el estado de PostgreSQL deben mantenerse sincronizados con ese archivo.

## 9. Pruebas y auditorías

Comandos principales:

```bash
npm test -- --run
npm run check:rbac
npm run build
```

Los tests actuales cubren:

- validación de autenticación
- contrato y timeout de actions
- evidencias, comentarios y reacciones
- CRUD de cursos con RBAC
- CRUD de lecciones con RBAC
- gestión segura de roles

`check:rbac` audita las Server Actions que mutan `usuarios`, `cursos`, `lecciones` u `organizaciones`. Una excepción pública, como el registro, debe documentarse con `rbac:allow`.

## 10. Entorno local

Variables esperadas:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=un-secreto-largo-y-aleatorio
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Redis es opcional en desarrollo: cuando no está configurado, el rate limiter usa memoria local. Para producción debe usarse un servicio Redis compartido.

El seed de desarrollo no debe ejecutarse en producción. Antes de usarlo, verifica `NODE_ENV` y la conexión de base de datos.

## 11. Deuda técnica conocida

Estas áreas todavía requieren trabajo y no deben considerarse cerradas:

- feedback visible de éxito/error y estado pendiente en formularios administrativos
- pruebas E2E con Playwright
- pruebas de integración contra PostgreSQL real
- error boundaries específicos para el módulo social
- revisión de nombres de rutas heredados (`/register` y referencias antiguas a `/registro`)
- revisión de tipos restantes y eliminación progresiva de casts o `any` heredados
- migraciones formales para las tablas sociales, en lugar de depender de creación ligera en seed

## 12. Regla para nuevos módulos

Antes de añadir una feature nueva:

1. identificar la tabla y el dueño del dominio
2. definir el esquema Zod de entrada
3. escribir primero el test de comportamiento y autorización
4. implementar la Server Action con `ActionResponse`
5. añadir la UI después de verificar el backend
6. ejecutar tests, `check:rbac` y build
7. actualizar esta guía y el roadmap si cambia la arquitectura

## 13. Ruta de aprendizaje recomendada

Para entender el proyecto, sigue una feature desde fuera hacia dentro:

1. empieza en una página de `src/app/` y localiza qué datos renderiza
2. identifica la Server Action que recibe el formulario
3. lee el esquema Zod para conocer el contrato de entrada
4. revisa `requireSession()` o `requireRole()` para entender quién puede ejecutar la operación
5. observa la consulta Drizzle y la llamada a `revalidatePath()`
6. ejecuta el test de la action y cambia mentalmente cada condición para comprobar qué debería ocurrir

El patrón de una feature completa en este proyecto es:

```text
modelo de datos -> action validada -> test de comportamiento -> UI protegida
```

La base de datos garantiza relaciones e idempotencia; Zod garantiza la forma de los datos; RBAC garantiza quién puede mutar; los tests documentan el comportamiento esperado. Ninguna capa sustituye a las otras.

### Ejemplo de razonamiento

Para cambiar el rol de un usuario:

- el modelo define un enum cerrado de roles
- la action acepta solo esos tres valores mediante Zod
- `requireRole(['ADMIN'])` limita el actor
- la action evita que el administrador se auto-degrade
- el test verifica autorización, rechazo y mutación
- el panel ofrece el selector, pero no es la frontera de seguridad

Este mismo razonamiento se reutiliza para cursos, lecciones, organizaciones y futuras evaluaciones.
