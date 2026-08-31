import { obtenerSesion, SessionPayload } from './sessions';

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
  if (!roles.includes(sesion.rol)) {
    throw new HttpError('Forbidden', 403);
  }
  return sesion;
}
