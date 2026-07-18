import { db } from '@/db';
import { usuarios, organizaciones, cursos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link'

export default async function HomePage() {
  // 1. Consultamos los músicos con sus iglesias (El JOIN que ya tenías)
  const musicos = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      rol: usuarios.rol,
      iglesia: organizaciones.nombre,
      estado: organizaciones.estado,
    })
    .from(usuarios)
    .leftJoin(organizaciones, eq(usuarios.organizacionId, organizaciones.id));

  // 2. Consultamos los cursos disponibles para el LMS
  const listaCursos = await db.select().from(cursos);


  return (
    <main className="min-h-screen bg-[#1a1a1a] text-[#f4f0e6] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* CABECERA PRINCIPAL */}
        <header className="border-b border-[#c4a484]/20 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-[#c4a484]">
            Academia S.I.O.N.
          </h1>
          <p className="text-sm text-[#a8a8a8] font-mono mt-2">
            SISTEMA ÍNTEGRO DE ORQUESTACIÓN Y NIVELACIÓN
          </p>
        </header>

        {/* SECCIÓN 1: SECCIÓN ACADÉMICA (LMS) */}
        <section className="space-y-6">
          <div className="border-l-4 border-[#c4a484] pl-4">
            <h2 className="text-2xl font-bold text-[#e4e1d9]">Rutas de Nivelación Disponibles</h2>
            <p className="text-sm text-[#a8a8a8]">Explora los programas de formación técnica y espiritual</p>
          </div>

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
                  <p className="text-sm text-[#b5b5b5] line-clamp-3 leading-relaxed">
                    {curso.descripcion}
                  </p>
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

       

        {/* SECCIÓN 2: CONTROL DE ALUMNOS */}
        <section className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h2 className="text-2xl font-bold text-[#e4e1d9]">Músicos de la Red</h2>
            <p className="text-sm text-[#a8a8a8]">Miembros activos y niveles de acceso asignados</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {musicos.map((musico) => (
              <div 
                key={musico.id} 
                className="bg-[#242424]/60 p-5 rounded-xl border border-[#c4a484]/5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-[#f4f0e6]">{musico.nombre}</h3>
                    <p className="text-xs text-[#b5b5b5] mt-1">
                      ⛪ {musico.iglesia || 'Sin Iglesia'}
                    </p>
                    <p className="text-[10px] text-[#a8a8a8] uppercase font-mono mt-0.5">
                      📍 {musico.estado || 'N/A'}
                    </p>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap ${
                    musico.rol === 'ADMIN' ? 'bg-[#c4a484]/20 text-[#c4a484]' :
                    musico.rol === 'LIDER' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {musico.rol}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}