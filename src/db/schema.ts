import { table } from 'console';
import { create } from 'domain';
import { pgTable, serial, text, timestamp, pgEnum, integer, primaryKey } from 'drizzle-orm/pg-core';

// 1. Definimos el enum moderno para los roles de Seguridad yjerarquía
// Esto evita que un usuario tenga un rol que no existe e el sistema

export const roleEnum = pgEnum('user_role', ['ADMIN', 'LIDER', 'APRENDIZ']);

// 2. Tabla de Organizaciones, las Iglesias o los distritos
export const organizaciones = pgTable('organizaciones', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  estado: text('estado').notNull(), //El estado geografico
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Tabla de evidencias de lección (videos subidos por aprendices)
export const evidenciasLeccion = pgTable('evidencias_leccion', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'cascade' }).notNull(),
  leccionId: integer('leccion_id').references(() => lecciones.id, { onDelete: 'cascade' }).notNull(),
  videoUrl: text('video_url').notNull(),
  descripcion: text('descripcion'),
  activo: integer('activo').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Tabla de comentarios sobre las evidencias
export const comentariosEvidencia = pgTable('comentarios_evidencia', {
  id: serial('id').primaryKey(),
  evidenciaId: integer('evidencia_id').references(() => evidenciasLeccion.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'cascade' }).notNull(),
  contenido: text('contenido').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Tabla de reacciones (un usuario puede reaccionar una vez por evidencia)
export const reaccionesEvidencia = pgTable('reacciones_evidencia', {
  evidenciaId: integer('evidencia_id').references(() => evidenciasLeccion.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'cascade' }).notNull(),
  tipo: text('tipo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.evidenciaId, t.usuarioId] }),
]);

// 3. Tabla de usuarios
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(), //Almanecaremos el hash seguro
  rol: roleEnum('rol').default('APRENDIZ').notNull(),

  // Esta es la llave foranea que conecta al usuario con su iglesia
  organizacionId: integer('organizacionId').references(() => organizaciones.id),

  createAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Tabla de Cursos (Rutas de aprendizaje principales, ej: Guitarra nivel 1, piano Básico)
export const cursos = pgTable('cursos', {
  id: serial('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion').notNull(),
  instrumento: text('instrumento').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Tabla de lecciones (Contenido individual dentro de cada curso)
export const lecciones = pgTable('lecciones', {
  id: serial('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  videoUrl: text('video_url').notNull(),
  orden: integer('orden').notNull(), //Para controlar que lección va primero, segundo etc.

  cursoId: integer('curso_id').references(() => cursos.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Tabla pivote de Progreso (relación muchos a muchos: usuarios <-> Lecciones)
export const progresoLecciones = pgTable('progreso_lecciones', {
  // Llaves foráneas apuntando a los IDs 
  usuarioId: integer('usuario_id')
    .references(() =>  usuarios.id, { onDelete: 'cascade'})
    .notNull(),
  leccionId: integer('leccion_id')
    .references(() => lecciones.id, { onDelete: 'cascade'})
    .notNull(),

  completadoEn: timestamp('completado_en').defaultNow().notNull(),
}, (tabla) => [
  
    // Idempotencia a nivel BD: Llave primaria Compuesta 
    // Esto garantiza matemáticamente que un usuario no pueda registrar
    // La misma lección cómo completado más de una vez
     primaryKey({ columns: [tabla.usuarioId, tabla.leccionId]}),
  
]);


