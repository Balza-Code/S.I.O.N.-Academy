import FormularioRegistro from '@/components/FormularioRegistro';
import { organizaciones } from '@/db/schema';
import LoginForm from '@/components/LoginForm';
import { db } from '@/db'

// Esta es la forma correcta: una función que retorna el componente
export default async function RegisterPage() {
  const listaOrganizaciones = await db
    .select({ id: organizaciones.id, nombre: organizaciones.nombre, estado: organizaciones.estado })
    .from(organizaciones);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1>Registrate</h1>
       <section className="py-6 border-t border-[#333]">
          <FormularioRegistro iglesias={listaOrganizaciones} />
        </section>
    </main>
  );
}