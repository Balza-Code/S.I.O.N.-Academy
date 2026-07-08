import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { organizaciones, usuarios, cursos, lecciones } from './schema';

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
  await db.insert(usuarios).values([
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
  ]);

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
  await db.insert(lecciones).values([
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
  ]);

  console.log('✅ ¡Base de datos sembrada con éxito y blindada!');
  await client.end();
}

main().catch((err) => {
  console.error('❌ Error fatal en el proceso de seeding:', err);
  process.exit(1);
});