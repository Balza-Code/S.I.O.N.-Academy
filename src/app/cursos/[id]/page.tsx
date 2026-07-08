import { db } from '@/db';
import { cursos, lecciones, progresoLecciones } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation'; 
import Link from 'next/link';
import { marcarLeccionCompletadaAction } from '@/app/actions';

export default async function CursoPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Extraemos el ID de la URL y lo convertimos a número
  const { id } = await params
  const cursoId = Number(id);
  const USUARIO_SIMULADO_ID = 24;

  if(isNaN(cursoId)){
    notFound();
  }

  // 2. Buscamos el curso específico
  const [curso] = await db.select().from(cursos).where(eq(cursos.id, cursoId));



  // Si se pone un id que no existe damos la respuesta logica
  if(!curso){
    notFound()
  }


  // 3. Buscamos las lecciones de este curso y las ordenamos por su campo 'orden'
  const listaLecciones = await db
    .select()
    .from(lecciones)
    .where(eq(lecciones.cursoId, cursoId))
    .orderBy(asc(lecciones.orden));

    const progresoUsuario = await db
    .select({ leccionId: progresoLecciones.leccionId })
    .from(progresoLecciones)
    .where(eq(progresoLecciones.usuarioId, USUARIO_SIMULADO_ID));

    const leccionesCompletadasIds = new Set(progresoUsuario.map(p => p.leccionId))

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#f4f0e6] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <nav className="flex items-center gap-4 text-sm font-mono text-[#a8a8a8]">
          <Link href="/" className="hover:text-[#c4a484] transition-colors">← Volver al Panel</Link>
          <span>/</span>
          <span className="text-[#c4a484] uppercase">{curso.instrumento}</span>
        </nav>

        <header className="border-b border-[#333] pb-6">
          <h1 className="text-3xl font-bold text-[#e4e1d9] mb-2">{curso.titulo}</h1>
          <p className="text-[#b5b5b5] max-w-3xl">{curso.descripcion}</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <section className="lg:col-span-2 space-y-4">
            {listaLecciones.length > 0 ? (
              <>
                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-[#333]">
                  <iframe 
                    width="100%" height="100%" src={listaLecciones[0].videoUrl} 
                    title="Reproductor de clase" frameBorder="0" allowFullScreen
                  ></iframe>
                </div>
                
                <div className="bg-[#242424] p-6 rounded-xl border border-[#c4a484]/10 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-[#c4a484] mb-2">
                      Lección {listaLecciones[0].orden}: {listaLecciones[0].titulo}
                    </h2>
                    <p className="text-[#b5b5b5] text-sm">{listaLecciones[0].descripcion}</p>
                  </div>

                  {/* FORMULARIO DE MUTACIÓN SEGURO (Server Action) */}
                  <form action={marcarLeccionCompletadaAction}>
                    <input type="hidden" name="usuarioId" value={USUARIO_SIMULADO_ID} />
                    <input type="hidden" name="leccionId" value={listaLecciones[0].id} />
                    <input type="hidden" name="cursoId" value={curso.id} />
                    
                    {leccionesCompletadasIds.has(listaLecciones[0].id) ? (
                      <button disabled className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                        ✓ Clase Completada
                      </button>
                    ) : (
                      <button type="submit" className="bg-[#c4a484] text-[#1a1a1a] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#b39374] transition-colors">
                        Marcar como completada
                      </button>
                    )}
                  </form>
                </div>
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
              {listaLecciones.map((leccion, index) => {
                const completada = leccionesCompletadasIds.has(leccion.id);
                return (
                  <button 
                    key={leccion.id}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors flex gap-3 items-start ${
                      index === 0 ? 'bg-[#c4a484]/10 border border-[#c4a484]/30' : 'hover:bg-[#333]'
                    }`}
                  >
                    <span className={`font-mono font-bold mt-0.5 ${completada ? 'text-emerald-400' : 'text-[#a8a8a8]'}`}>
                      {completada ? '✓' : `${leccion.orden}.`}
                    </span>
                    <span className={completada ? 'text-[#e4e1d9]' : 'text-[#a8a8a8]'}>
                      {leccion.titulo}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}