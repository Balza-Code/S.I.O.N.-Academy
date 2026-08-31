import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'clave_secreta_super_segura_para_academia_sion_2026'
);

const COOKIE_NAME = 'sion-session';

export interface SessionPayload {
  userId: number;
  rol: string;
}



export async function crearSesion(userId: number, rol: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ userId, rol})
  .setProtectedHeader({ alg: 'HS256'})
  .setIssuedAt()
  .setExpirationTime('7d')
  .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  }); 
  
} 

export async function obtenerSesion(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: [ 'HS256' ],
      });
      return payload as unknown as SessionPayload;
    } catch (error) {
      console.error(' Sesion inváldida o expirada:', error);
      return null
    }
  }

export async function borrarSesion() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  }