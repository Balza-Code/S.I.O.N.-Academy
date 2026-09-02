import { obtenerSesion, SessionPayload } from './sessions';
import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new HttpError('Unauthorized', 401);
  return sesion;
}

export async function requireRole(roles: string[] = []): Promise<SessionPayload> {
  const sesion = await requireSession();
  const [usuario] = await db
    .select({ rol: usuarios.rol })
    .from(usuarios)
    .where(eq(usuarios.id, sesion.userId));

  if (!usuario || !roles.includes(usuario.rol)) {
    throw new HttpError('Forbidden', 403);
  }

  return { ...sesion, rol: usuario.rol };
}
