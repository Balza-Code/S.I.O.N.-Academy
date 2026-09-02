import { db } from '@/db';
import { cursos, lecciones, organizaciones, usuarios } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { HttpError, requireRole } from '@/lib/auth';
import {
  createCursoAction,
  createLeccionAction,
  deleteCursoAction,
  deleteLeccionAction,
  updateCursoAction,
  updateLeccionAction,
  updateUserRoleAction,
  createOrganizacionAction,
  deleteOrganizacionAction,
  updateOrganizacionAction,
} from '@/app/actions';

async function createCurso(formData: FormData) {
  'use server';
  await createCursoAction(formData);
}

async function createLeccion(formData: FormData) {
  'use server';
  await createLeccionAction(formData);
}

async function updateCurso(formData: FormData) {
  'use server';
  await updateCursoAction(formData);
}

async function updateLeccion(formData: FormData) {
  'use server';
  await updateLeccionAction(formData);
}

async function deleteCurso(formData: FormData) {
  'use server';
  await deleteCursoAction(formData);
}

async function deleteLeccion(formData: FormData) {
  'use server';
  await deleteLeccionAction(formData);
}

async function updateUserRole(formData: FormData) {
  'use server';
  await updateUserRoleAction(formData);
}

async function createOrganizacion(formData: FormData) {
  'use server';
  await createOrganizacionAction(formData);
}

async function updateOrganizacion(formData: FormData) {
  'use server';
  await updateOrganizacionAction(formData);
}

async function deleteOrganizacion(formData: FormData) {
  'use server';
  await deleteOrganizacionAction(formData);
}

export default async function AdminPage() {
  let usuarioPuedeGestionarOrganizaciones = false;

  try {
    const session = await requireRole(['ADMIN', 'LIDER']);
    usuarioPuedeGestionarOrganizaciones = session.rol === 'ADMIN';
  } catch (error: unknown) {
    if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
      redirect('/dashboard');
    }

    throw error;
  }

  const listaCursos = await db
    .select({
      id: cursos.id,
      titulo: cursos.titulo,
      descripcion: cursos.descripcion,
      instrumento: cursos.instrumento,
    })
    .from(cursos);

  const listaLecciones = await db
    .select({
      id: lecciones.id,
      cursoId: lecciones.cursoId,
      titulo: lecciones.titulo,
      descripcion: lecciones.descripcion,
      videoUrl: lecciones.videoUrl,
      orden: lecciones.orden,
    })
    .from(lecciones)
    .orderBy(asc(lecciones.cursoId), asc(lecciones.orden));

  const listaUsuarios = await db
    .select({ id: usuarios.id, nombre: usuarios.nombre, email: usuarios.email, rol: usuarios.rol })
    .from(usuarios);

  const listaOrganizaciones = await db
    .select({ id: organizaciones.id, nombre: organizaciones.nombre, estado: organizaciones.estado })
    .from(organizaciones);

  return (
    <main className="min-h-screen bg-[#151515] px-6 py-10 text-[#f4f0e6]">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#c4a484]/20 pb-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#c4a484]">Administración académica</p>
            <h1 className="mt-2 text-3xl font-bold">Contenido de la academia</h1>
            <p className="mt-2 text-sm text-[#a8a8a8]">Gestiona las rutas y sus lecciones desde un único espacio.</p>
          </div>
          <a href="/dashboard" className="text-sm text-[#c4a484] hover:text-[#e4e1d9]">Volver al dashboard</a>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="border border-[#333] bg-[#202020] p-6">
            <h2 className="text-xl font-bold">Crear curso</h2>
            <p className="mt-1 text-sm text-[#a8a8a8]">Define la ruta principal de aprendizaje.</p>
            <form action={createCurso} className="mt-5 space-y-3">
              <input name="titulo" required placeholder="Título del curso" className="admin-input" />
              <input name="instrumento" required placeholder="Instrumento" className="admin-input" />
              <textarea name="descripcion" required placeholder="Descripción del curso" className="admin-input min-h-28" />
              <button type="submit" className="admin-button">Crear curso</button>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Cursos y lecciones</h2>
            {listaCursos.length === 0 ? (
              <p className="text-sm text-[#a8a8a8]">Todavía no hay cursos creados.</p>
            ) : listaCursos.map((curso) => {
              const cursoLecciones = listaLecciones.filter((leccion) => leccion.cursoId === curso.id);

              return (
                <article key={curso.id} className="border border-[#333] bg-[#202020] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#c4a484]">{curso.instrumento}</p>
                      <h3 className="mt-1 text-lg font-bold">{curso.titulo}</h3>
                      <p className="mt-1 text-sm text-[#a8a8a8]">{curso.descripcion}</p>
                    </div>
                    <form action={deleteCurso}>
                      <input type="hidden" name="id" defaultValue={curso.id ?? ""} />
                      <button type="submit" className="text-xs text-red-300 hover:text-red-200">Eliminar curso</button>
                    </form>
                  </div>

                  <form action={updateCurso} className="mt-5 grid gap-2 md:grid-cols-4">
                    <input type="hidden" name="id" defaultValue={curso.id} />
                    <input name="titulo" defaultValue={curso.titulo} className="admin-input md:col-span-2" />
                    <input name="instrumento" defaultValue={curso.instrumento} className="admin-input" />
                    <button type="submit" className="admin-button">Guardar curso</button>
                    <textarea name="descripcion" defaultValue={curso.descripcion} className="admin-input min-h-20 md:col-span-4" />
                  </form>

                  <div className="mt-6 border-t border-[#333] pt-5">
                    <h4 className="text-sm font-bold text-[#e4e1d9]">Lecciones ({cursoLecciones.length})</h4>
                    <div className="mt-3 space-y-3">
                      {cursoLecciones.map((leccion) => (
                        <div key={leccion.id} className="border-l-2 border-[#c4a484]/40 pl-4">
                          <form action={updateLeccion} className="grid gap-2 md:grid-cols-6">
                            <input type="hidden" name="id" defaultValue={leccion.id} />
                            <input type="hidden" name="cursoId" defaultValue={curso.id} />
                            <input name="titulo" defaultValue={leccion.titulo} className="admin-input md:col-span-2" />
                            <input name="orden" type="number" min="1" defaultValue={leccion.orden} className="admin-input" />
                            <input name="videoUrl" defaultValue={leccion.videoUrl} className="admin-input md:col-span-2" />
                            <button type="submit" className="admin-button">Guardar</button>
                            <textarea name="descripcion" defaultValue={leccion.descripcion ?? ''} className="admin-input min-h-16 md:col-span-5" />
                            <button formAction={deleteLeccion} type="submit" className="text-xs text-red-300 hover:text-red-200">Eliminar</button>
                          </form>
                        </div>
                      ))}
                    </div>

                    <form action={createLeccion} className="mt-5 grid gap-2 md:grid-cols-6">
                      <input type="hidden" name="cursoId" defaultValue={curso.id} />
                      <input name="titulo" required placeholder="Nueva lección" className="admin-input md:col-span-2" />
                      <input name="orden" required type="number" min="1" placeholder="Orden" className="admin-input" />
                      <input name="videoUrl" required placeholder="URL YouTube o Vimeo" className="admin-input md:col-span-2" />
                      <button type="submit" className="admin-button">Añadir lección</button>
                      <textarea name="descripcion" placeholder="Descripción de la lección" className="admin-input min-h-16 md:col-span-5" />
                    </form>
                  </div>
                </article>
              );
            })}

            {usuarioPuedeGestionarOrganizaciones && (
              <section className="border border-[#333] bg-[#202020] p-5">
                <h2 className="text-xl font-bold">Roles de usuarios</h2>
                <p className="mt-1 text-sm text-[#a8a8a8]">La promoción de roles requiere una decisión administrativa explícita.</p>
                <div className="mt-4 space-y-3">
                  {listaUsuarios.map((usuario) => (
                    <form key={usuario.id} action={updateUserRole} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#333] pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-sm font-bold">{usuario.nombre}</p>
                        <p className="text-xs text-[#a8a8a8]">{usuario.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="hidden" name="usuarioId" defaultValue={usuario.id} />
                        <select name="rol" defaultValue={usuario.rol} className="admin-input min-w-32">
                          <option value="APRENDIZ">Aprendiz</option>
                          <option value="LIDER">Líder</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button type="submit" className="admin-button">Guardar rol</button>
                      </div>
                    </form>
                  ))}
                </div>
              </section>
            )}

            {usuarioPuedeGestionarOrganizaciones && (
              <section className="border border-[#333] bg-[#202020] p-5">
                <h2 className="text-xl font-bold">Organizaciones</h2>
                <p className="mt-1 text-sm text-[#a8a8a8]">Administra las iglesias y distritos disponibles en el registro.</p>
                <form action={createOrganizacion} className="mt-4 grid gap-2 md:grid-cols-3">
                  <input name="nombre" required placeholder="Nombre de la organización" className="admin-input" />
                  <input name="estado" required placeholder="Estado o distrito" className="admin-input" />
                  <button type="submit" className="admin-button">Crear organización</button>
                </form>
                <div className="mt-5 space-y-3">
                  {listaOrganizaciones.map((organizacion) => (
                    <div key={organizacion.id} className="border-b border-[#333] pb-3 last:border-b-0 last:pb-0">
                      <form action={updateOrganizacion} className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                        <input type="hidden" name="id" defaultValue={organizacion.id} />
                        <input name="nombre" defaultValue={organizacion.nombre} className="admin-input" />
                        <input name="estado" defaultValue={organizacion.estado} className="admin-input" />
                        <button type="submit" className="admin-button">Guardar</button>
                        <button formAction={deleteOrganizacion} type="submit" className="text-xs text-red-300 hover:text-red-200">Eliminar</button>
                      </form>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
