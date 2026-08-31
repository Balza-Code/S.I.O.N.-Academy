import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'clave_secreta_super_segura_para_academia_sion_2026'
);

const COOKIE_NAME = 'sion-session';

const RUTAS_PUBLICAS = ['/', '/login', '/registro'];
const PREFIJOS_PROTEGIDOS = ['/dashboard', '/cursos', '/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value;

  let sessionPayload = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      });
      sessionPayload = payload;
    } catch (error) {
      console.warn('Fallo de verificación de token en Middleware:', error);
    }
  }

  const estaAutenticado = Boolean(sessionPayload);
  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) => pathname === ruta || pathname.startsWith(ruta + '/'));
  const esRutaProtegida = PREFIJOS_PROTEGIDOS.some((prefijo) => pathname === prefijo || pathname.startsWith(prefijo + '/'));

  // Si el usuario está autenticado y visita las páginas de login/registro, redirigir al dashboard
  const estaEnLoginRegistro = ['/login', '/registro'].some((r) => pathname.startsWith(r));
  if (estaAutenticado && estaEnLoginRegistro) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si no está autenticado y visita una ruta protegida, enviar al login y preservar redirectTo
  if (!estaAutenticado && esRutaProtegida) {
    const urlLogin = new URL('/login', request.url);
    // Preserve full path + query
    const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
    urlLogin.searchParams.set('redirectTo', redirectTo);
    return NextResponse.redirect(urlLogin);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};