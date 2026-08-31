import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { organizaciones, usuarios, cursos, lecciones, evidenciasLeccion, comentariosEvidencia, reaccionesEvidencia } from './schema';

// Cargamos el .env.local de forma ultra segura para Windows
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está configurada en .env.local');
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log('🌱 Iniciando el sembrado de datos (Seeding)...');

  // 🛡️ El Escudo de Seguridad para Producción que diseñamos
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ¡PELIGRO! Intentaste correr el seed en PRODUCCIÓN. Operación abortada.');
    return;
  }

  // Limpieza total en orden de dependencias para evitar violaciones de llaves foráneas
  console.log('🧹 Limpiando tablas anteriores...');
  await db.delete(lecciones);
  await db.delete(cursos);
  await db.delete(usuarios);
  await db.delete(organizaciones);

  // 1. Insertar Iglesias
  console.log('⛪ Insertando iglesias...');
  const [orgKm8, orgKm11, orgValencia] = await db.insert(organizaciones).values([
    { nombre: 'Iglesia de Caracas Km 8', estado: 'Distrito Capital' },
    { nombre: 'Iglesia de Caracas Km 11', estado: 'Distrito Capital' },
    { nombre: 'Iglesia Fundación Cap Valencia', estado: 'Carabobo' }
  ]).returning();

  // 2. Insertar Usuarios
  console.log('👥 Insertando usuarios...');
  const [adminUser, liderUser, aprendizUser] = await db.insert(usuarios).values([
    {
      nombre: 'Cristian Balza',
      email: 'cristian@sion.com',
      password: 'hash_seguro_aqui',
      rol: 'ADMIN',
      organizacionId: orgKm8.id
    },
    {
      nombre: 'Enderson',
      email: 'enderson@sion.com',
      password: 'hash_seguro_aqui',
      rol: 'LIDER',
      organizacionId: orgKm11.id
    },
    {
      nombre: 'Nicol',
      email: 'nicol@sion.com',
      password: 'hash_seguro_aqui',
      rol: 'APRENDIZ',
      organizacionId: orgKm8.id
    }
  ]).returning({ id: usuarios.id });

  // 3. Insertar Cursos (La columna instrumento ayuda a segmentar las rutas)
  console.log('🎸 Insertando cursos académicos...');
  const [cursoGuitarra, cursoPiano] = await db.insert(cursos).values([
    {
      titulo: 'Fundamentos de la Guitarra Acústica',
      descripcion: 'Aprende desde la postura correcta, círculos armónicos básicos hasta la ejecución de tus primeras cadenas de adoración.',
      instrumento: 'Guitarra'
    },
    {
      titulo: 'Técnica de Piano Contemporáneo',
      descripcion: 'Domina la independencia de manos, inversión de acordes y acompañamientos fluidos para el servicio de alabanza.',
      instrumento: 'Piano'
    }
  ]).returning();

  // 4. Insertar Lecciones indexadas por Curso
  console.log('📖 Insertando lecciones de nivelación...');
  const [guitarraL1, guitarraL2, pianoL1, pianoL2] = await db.insert(lecciones).values([
    // Lecciones de Guitarra
    {
      titulo: 'Postura, Afinación y Primeros Acordes (G, C, D)',
      descripcion: 'En esta lección aprenderás a usar el afinador cromático y las posiciones de los acordes mayores principales.',
      videoUrl: 'https://www.youtube.com/embed/ejemplo_video_1',
      orden: 1,
      cursoId: cursoGuitarra.id
    },
    {
      titulo: 'El Rasgueo de Adoración 4/4',
      descripcion: 'Desglose del patrón rítmico fundamental para baladas y cantos congregacionales lentos.',
      videoUrl: 'https://www.youtube.com/embed/ejemplo_video_2',
      orden: 2,
      cursoId: cursoGuitarra.id
    },
    // Lecciones de Piano
    {
      titulo: 'Configuración del Teclado e Independencia de Manos',
      descripcion: 'Ejercicios de digitación básicos (Hanon) para activar la agilidad en los dedos de ambas manos de forma simétrica.',
      videoUrl: 'https://www.youtube.com/embed/ejemplo_video_3',
      orden: 1,
      cursoId: cursoPiano.id
    },
    {
      titulo: 'Inversiones de Acordes y Voicings Modernos',
      descripcion: 'Cómo conectar acordes de forma elegante sin tener que saltar bruscamente a lo largo del teclado.',
      orden: 2,
      cursoId: cursoPiano.id,
      videoUrl: 'https://www.youtube.com/embed/ejemplo_video_4'
    }
  ]).returning({ id: lecciones.id });
  
  

  // 5. Insertar evidencias de lección de ejemplo
  console.log('🎞️ Insertando evidencias de lección...');
  // Asegurar que las tablas sociales existen (creación ligera para entornos locales)
  await client`
    CREATE TABLE IF NOT EXISTS evidencias_leccion (
      id serial PRIMARY KEY,
      usuario_id integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      leccion_id integer NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
      video_url text NOT NULL,
      descripcion text,
      activo integer NOT NULL DEFAULT 1,
      created_at timestamp without time zone DEFAULT now()
    );
  `;

  await client`
    CREATE TABLE IF NOT EXISTS comentarios_evidencia (
      id serial PRIMARY KEY,
      evidencia_id integer NOT NULL REFERENCES evidencias_leccion(id) ON DELETE CASCADE,
      usuario_id integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      contenido text NOT NULL,
      created_at timestamp without time zone DEFAULT now()
    );
  `;

  await client`
    CREATE TABLE IF NOT EXISTS reacciones_evidencia (
      evidencia_id integer NOT NULL REFERENCES evidencias_leccion(id) ON DELETE CASCADE,
      usuario_id integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      tipo text NOT NULL,
      created_at timestamp without time zone DEFAULT now(),
      PRIMARY KEY (evidencia_id, usuario_id)
    );
  `;
  const [evidencia1] = await db.insert(evidenciasLeccion).values([
    {
      usuarioId: aprendizUser.id,
      leccionId: guitarraL1.id,
      videoUrl: 'https://www.youtube.com/watch?v=ejemplo_evidencia_1',
      descripcion: 'Ejecución de práctica - Primeros acordes en G'
    }
  ]).returning();

  // 6. Insertar un comentario de ejemplo por un LIDER
  console.log('💬 Insertando comentarios...');
  await db.insert(comentariosEvidencia).values([
    {
      evidenciaId: evidencia1.id,
      usuarioId: liderUser.id,
      contenido: 'Buen progreso, trabaja la posición del pulgar en la mano derecha.'
    }
  ]);

  // 7. Insertar una reacción de ejemplo por un ADMIN
  console.log('👏 Insertando reacciones...');
  await db.insert(reaccionesEvidencia).values([
    {
      evidenciaId: evidencia1.id,
      usuarioId: adminUser.id,
      tipo: 'LIKE'
    }
  ]);

  console.log('✅ ¡Base de datos sembrada con éxito y blindada!');
  await client.end();
}

main().catch((err) => {
  console.error('❌ Error fatal en el proceso de seeding:', err);
  process.exit(1);
});