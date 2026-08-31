import Link from 'next/link';
import { obtenerSesion } from '@/lib/sessions';
// Feed moved to dashboard; keep landing minimal for now

export default async function HomePage() {
  const sesion = await obtenerSesion();

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#f4f0e6]">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold text-[#c4a484]">Academia S.I.O.N.</h1>
        <div className="space-x-3">
          {sesion ? (
            <Link href="/dashboard" className="bg-[#c4a484] text-[#1a1a1a] px-4 py-2 rounded-md font-bold">Ir a mi Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-md border border-[#c4a484]/20">Iniciar Sesión</Link>
              <Link href="/registro" className="bg-[#c4a484] text-[#1a1a1a] px-4 py-2 rounded-md font-bold">Comenzar Ahora</Link>
            </>
          )}
        </div>
      </nav>

      <section className="max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-4xl font-extrabold text-[#e4e1d9]">Bienvenido a Academia S.I.O.N.</h2>
        <p className="mt-4 text-[#a8a8a8]">Plataforma de formación y nivelación musical.</p>
        <div className="mt-8">
          {sesion ? (
            <Link href="/dashboard" className="bg-[#c4a484] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold">Ir a mi Dashboard</Link>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Link href="/login" className="px-6 py-3 rounded-lg border border-[#c4a484]/20">Iniciar Sesión</Link>
              <Link href="/registro" className="bg-[#c4a484] text-[#1a1a1a] px-6 py-3 rounded-lg font-bold">Comenzar Ahora</Link>
            </div>
          )}
        </div>
      </section>

      {/* Feed de evidencias recientes */}
      <section className="max-w-6xl mx-auto p-8">
        <h3 className="text-2xl font-bold text-[#e4e1d9] mb-4">Feed - Evidencias recientes</h3>
        <div className="space-y-6">
          {/* Server-side fetch: últimas 10 evidencias activas */}
          {/** fetch data inside component render */}
          <RecentEvidencias />
        </div>
      </section>
    </main>
  );
}

async function RecentEvidencias() {
  const items = await db
    .select()
    .from(evidenciasLeccion)
    .where(evidenciasLeccion.activo.equals(1))
    .orderBy(desc(evidenciasLeccion.createdAt))
    .limit(10);

  const userIds = Array.from(new Set(items.map((i) => i.usuarioId))).filter(Boolean) as number[];
  const users = userIds.length > 0
    ? await db.select().from(usuarios).where(inArray(usuarios.id, userIds))
    : [];
  const usersById = new Map(users.map((u) => [u.id, u]));

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
            <span>Por: {usersById.get(ev.usuarioId)?.nombre ?? `Usuario ${ev.usuarioId}`}</span>
            <span>{new Date(ev.createdAt).toLocaleString()}</span>
          </div>
        </article>
      ))}
    </div>
  );
}