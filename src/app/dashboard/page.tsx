import { db } from '@/db';
import { usuarios, organizaciones, cursos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { obtenerSesion } from '@/lib/sessions';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { evidenciasLeccion } from '@/db/schema';
import { desc, inArray } from 'drizzle-orm';

export default async function DashboardPage() {
  const sesion = await obtenerSesion();

  if (!sesion) {
    redirect('/login?redirectTo=/dashboard');
  }

  // Obtener datos del usuario para saludo
  const usuarioRows = await db
    .select({ id: usuarios.id, nombre: usuarios.nombre, rol: usuarios.rol })
    .from(usuarios)
    .where(eq(usuarios.id, sesion!.userId));

  const usuario = usuarioRows?.[0] ?? { nombre: 'Usuario', rol: sesion!.rol };

  // Cursos disponibles (select explícito para optimizar payload)
  const listaCursos = await db
    .select({ id: cursos.id, titulo: cursos.titulo, descripcion: cursos.descripcion, instrumento: cursos.instrumento })
    .from(cursos);

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#f4f0e6] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-[#c4a484]/20 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#c4a484]">Academia S.I.O.N.</h1>
            <p className="text-sm text-[#a8a8a8]">Bienvenido a tu panel</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">Hola, {usuario.nombre}</p>
            <p className="text-xs text-[#a8a8a8]">Rol: {usuario.rol}</p>
            {(usuario.rol === 'ADMIN' || usuario.rol === 'LIDER') && (
              <Link href="/admin" className="mt-2 inline-block text-xs font-bold text-[#c4a484] hover:text-[#e4e1d9]">
                Administrar contenido
              </Link>
            )}
            <form action={logoutAction} className="mt-2">
              <button type="submit" className="text-xs font-bold text-[#a8a8a8] hover:text-red-300">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#e4e1d9]">Rutas de Nivelación Disponibles</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {listaCursos.map((curso) => (
              <div
                key={curso.id}
                className="bg-[#242424] rounded-2xl p-6 border border-[#c4a484]/10 flex flex-col justify-between hover:shadow-xl hover:shadow-black/30 transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono bg-[#c4a484]/10 text-[#c4a484] px-3 py-1 rounded-full font-bold uppercase">
                      🎸 {curso.instrumento}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#f4f0e6] mb-2">{curso.titulo}</h3>
                  <p className="text-sm text-[#b5b5b5] line-clamp-3 leading-relaxed">{curso.descripcion}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#333] flex justify-between items-center">
                  <span className="text-xs text-[#a8a8a8]">Plan de estudio premium</span>
                  <Link href={`/cursos/${curso.id}`} className="bg-[#c4a484] text-[#1a1a1a] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#b39374] transition-colors">
                    Ver Lecciones
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feed - evidencias recientes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#e4e1d9]">Feed - Evidencias recientes</h2>
          <RecentEvidencias />
        </section>
      </div>
    </main>
  );
}

async function RecentEvidencias() {
  const items = await db
    .select()
    .from(evidenciasLeccion)
    .where(eq(evidenciasLeccion.activo, 1))
    .orderBy(desc(evidenciasLeccion.createdAt))
    .limit(8);

  if (items.length === 0) {
    return <div className="text-sm text-[#a8a8a8]">Aún no hay evidencias públicas.</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {items.map((ev) => (
        <article key={ev.id} className="bg-[#1f1f1f] p-4 rounded-lg border border-[#333]">
          <div className="aspect-video mb-3 rounded overflow-hidden">
            <iframe src={ev.videoUrl} width="100%" height="100%" frameBorder="0" allowFullScreen />
          </div>
          <p className="text-sm text-[#b5b5b5] mb-2">{ev.descripcion ?? 'Sin descripción'}</p>
          <div className="flex items-center justify-between text-sm text-[#a8a8a8]">
            <span>Por: Usuario {ev.usuarioId}</span>
            <span>{new Date(ev.createdAt).toLocaleString()}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
