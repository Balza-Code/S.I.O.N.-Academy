import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno');
}


// Para la aplicación , usamos un pool de conexiones (por defecto)
const client = postgres(connectionString);
export const db = drizzle(client);