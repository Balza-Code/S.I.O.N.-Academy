import { db } from '@/db';
import { cursos, lecciones, progresoLecciones, evidenciasLeccion, comentariosEvidencia, reaccionesEvidencia } from '@/db/schema';
import { eq, asc, inArray, and } from 'drizzle-orm';
import { notFound } from 'next/navigation'; 
import Link from 'next/link';
import { marcarLeccionCompletadaAction } from '@/app/actions/cursos';
import { subirEvidenciaAction, comentarEvidenciaAction, reaccionEvidenciaAction } from '@/app/actions';

export default async function CursoPage({
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ leccion?: string }>; 
}) {
  // 1. Extraemos los parámetros de la URL
  const { id } = await params;
  const { leccion: leccionParamId } = await searchParams;

  const cursoId = Number(id);
  const USUARIO_SIMULADO_ID = 24;

  if (isNaN(cursoId)) {
    notFound();
  }

  // 2. Buscamos el curso específico
  const [curso] = await db
    .select()
    .from(cursos)
    .where(eq(cursos.id, cursoId));

  if (!curso) {
    notFound();
  }

  // 3. Buscamos las lecciones de este curso ordenadas
  const listaLecciones = await db
    .select()
    .from(lecciones)
    .where(eq(lecciones.cursoId, cursoId))
    .orderBy(asc(lecciones.orden));

  // 4. Determinamos la lección activa
  let leccionActiva = listaLecciones[0]; 

  if (leccionParamId) {
    const leccionEncontrada = listaLecciones.find(
      (l) => l.id === Number(leccionParamId)
    );
    if (leccionEncontrada) {
      leccionActiva = leccionEncontrada;
    }
  }

  // 5. Consultamos únicamente el progreso del usuario para ESTE curso
  const idsLeccionesCurso = listaLecciones.map((l) => l.id);

  const progresoUsuario = idsLeccionesCurso.length > 0
    ? await db
        .select({ leccionId: progresoLecciones.leccionId })
        .from(progresoLecciones)
        .where(
          and(
            eq(progresoLecciones.usuarioId, USUARIO_SIMULADO_ID),
            inArray(progresoLecciones.leccionId, idsLeccionesCurso)
          )
        )
    : [];

  // 6. Creamos la estructura en memoria O(1)
  const leccionesCompletadasIds = new Set(
    progresoUsuario.map((p) => p.leccionId)
  );

  // 7. Cargar evidencias y comentarios para la lección activa
  const evidencias = await db
    .select()
    .from(evidenciasLeccion)
    .where(eq(evidenciasLeccion.leccionId, leccionActiva.id));

  // Map comments per evidencia
  const evidenciaIds = evidencias.map((e) => e.id);
  const comentarios = evidenciaIds.length > 0
    ? await db.select().from(comentariosEvidencia).where(inArray(comentariosEvidencia.evidenciaId, evidenciaIds)).orderBy(asc(comentariosEvidencia.createdAt))
    : [];


  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#f4f0e6] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <nav className="flex items-center gap-4 text-sm font-mono text-[#a8a8a8]">
          <Link href="/dashboard" className="hover:text-[#c4a484] transition-colors">
            ← Volver al Panel
          </Link>
          <span>/</span>
          <span className="text-[#c4a484] uppercase">{curso.instrumento}</span>
        </nav>

        <header className="border-b border-[#333] pb-6">
          <h1 className="text-3xl font-bold text-[#e4e1d9] mb-2">{curso.titulo}</h1>
          <p className="text-[#b5b5b5] max-w-3xl">{curso.descripcion}</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <section className="lg:col-span-2 space-y-4">
            {listaLecciones.length > 0 && leccionActiva ? (
              <>
                {/* REPRODUCTOR DINÁMICO */}
                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-[#333]">
                  <iframe 
                    key={leccionActiva.id}
                    width="100%" 
                    height="100%" 
                    src={leccionActiva.videoUrl} 
                    title="Reproductor de clase" 
                    frameBorder="0" 
                    allowFullScreen
                  />
                </div>
                
                <div className="bg-[#242424] p-6 rounded-xl border border-[#c4a484]/10 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-[#c4a484] mb-2">
                      Lección {leccionActiva.orden}: {leccionActiva.titulo}
                    </h2>
                    <p className="text-[#b5b5b5] text-sm">{leccionActiva.descripcion}</p>
                  </div>

                  {/* FORMULARIO DE MUTACIÓN */}
                  <form action={marcarLeccionCompletadaAction}>
                    <input type="hidden" name="usuarioId" value={USUARIO_SIMULADO_ID} />
                    <input type="hidden" name="leccionId" value={leccionActiva.id} />
                    <input type="hidden" name="cursoId" value={curso.id} />
                    
                    {leccionesCompletadasIds.has(leccionActiva.id) ? (
                      <button 
                        type="button"
                        disabled 
                        className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-not-allowed"
                      >
                        ✓ Clase Completada
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        className="bg-[#c4a484] text-[#1a1a1a] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#b39374] transition-colors"
                      >
                        Marcar como completada
                      </button>
                    )}
                  </form>
                </div>
                
                {/* EVIDENCIAS Y COMENTARIOS */}
                <section className="mt-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#e4e1d9]">Evidencias de la lección</h3>

                  <div className="space-y-6">
                    {evidencias.length === 0 ? (
                      <div className="text-sm text-[#a8a8a8]">Aún no hay evidencias para esta lección.</div>
                    ) : (
                      evidencias.map((ev) => (
                        <div key={ev.id} className="bg-[#1f1f1f] p-4 rounded-lg border border-[#333]">
                          <div className="aspect-video mb-3 rounded overflow-hidden">
                            <iframe src={ev.videoUrl} width="100%" height="100%" frameBorder="0" allowFullScreen />
                          </div>
                          <p className="text-sm text-[#b5b5b5] mb-2">{ev.descripcion}</p>

                          <div className="flex items-center gap-3">
                            <form action={reaccionEvidenciaAction} className="inline">
                              <input type="hidden" name="evidenciaId" value={ev.id} />
                              <input type="hidden" name="tipo" value="LIKE" />
                              <button className="px-3 py-1 bg-[#c4a484] text-[#1a1a1a] rounded">Like</button>
                            </form>
                          </div>

                          <div className="mt-3">
                            <h4 className="text-sm font-bold text-[#e4e1d9] mb-2">Comentarios</h4>
                            <div className="space-y-2">
                              {comentarios.filter(c => c.evidenciaId === ev.id).map((c) => (
                                <div key={c.id} className="text-sm text-[#b5b5b5]">{c.contenido}</div>
                              ))}
                            </div>

                            <form action={comentarEvidenciaAction} className="mt-3 flex gap-2">
                              <input type="hidden" name="evidenciaId" value={ev.id} />
                              <input name="contenido" placeholder="Escribe un comentario..." className="flex-1 rounded px-3 py-2 bg-[#111] border border-[#333] text-sm" />
                              <button className="px-3 py-2 bg-[#c4a484] text-[#1a1a1a] rounded">Comentar</button>
                            </form>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 bg-[#171717] p-4 rounded">
                    <h4 className="font-bold text-sm mb-2">Subir evidencia (URL)</h4>
                    <form action={subirEvidenciaAction} className="flex flex-col gap-2">
                      <input type="hidden" name="leccionId" value={leccionActiva.id} />
                      <input name="videoUrl" placeholder="https://youtube.com/..." className="px-3 py-2 rounded bg-[#0f0f0f] border border-[#333] text-sm" />
                      <textarea name="descripcion" placeholder="Descripción (opcional)" className="px-3 py-2 rounded bg-[#0f0f0f] border border-[#333] text-sm" />
                      <button className="w-max px-4 py-2 bg-[#c4a484] text-[#1a1a1a] rounded">Subir evidencia</button>
                    </form>
                  </div>
                </section>
              </>
            ) : (
              <div className="p-12 text-center bg-[#242424] rounded-xl border border-[#333]">
                <p className="text-[#a8a8a8]">Aún no hay lecciones grabadas para este módulo.</p>
              </div>
            )}
          </section>

          <aside className="bg-[#242424] border border-[#333] rounded-xl p-6 h-fit">
            <h3 className="font-bold text-lg mb-4 text-[#e4e1d9]">Temario de Nivelación</h3>
            <div className="space-y-3">
              {listaLecciones.map((leccion) => {
                const completada = leccionesCompletadasIds.has(leccion.id);
                const esActiva = leccionActiva.id === leccion.id;
                
                return (
                  <Link 
                    href={`/cursos/${curso.id}?leccion=${leccion.id}`}
                    key={leccion.id}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors flex gap-3 items-start ${
                      esActiva 
                        ? 'bg-[#c4a484]/10 border border-[#c4a484]/30' 
                        : 'hover:bg-[#333]'
                    }`}
                  >
                    <span className={`font-mono font-bold mt-0.5 ${completada ? 'text-emerald-400' : 'text-[#a8a8a8]'}`}>
                      {completada ? '✓' : `${leccion.orden}.`}
                    </span>
                    <span className={completada ? 'text-[#e4e1d9]' : (esActiva ? 'text-[#c4a484] font-bold' : 'text-[#a8a8a8]')}>
                      {leccion.titulo}
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}