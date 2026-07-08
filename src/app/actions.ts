'use server';


import { success, z } from 'zod';
import { db } from '@/db';
import { usuarios, progresoLecciones } from '@/db/schema';
import { registroUsuarioSchema } from '@/lib/schema';
import { revalidatePath } from 'next/cache';


export async function registrarUsuarioAction(formData: FormData){
// 1. Extraemos los datos del formulario nativo
const rawData = {
  nombre: formData.get('nombre'),
  email: formData.get('email'),
  password: formData.get('password'),
  rol: formData.get('rol'),
  organizacionId: formData.get('organizacionId'),
};

// 2. Validamos con Zod de lado del servidor (capa de seguridad obligatoria)
const validacion = registroUsuarioSchema.safeParse(rawData);

if (!validacion.success) {
  const { fieldErrors } = z.flattenError(validacion.error)
  // Si falla, devolvemos los errores estructurados a la interfaz
  return{
    success: false,
    errors: fieldErrors
  }
}

const datosValidados = validacion.data;

try{
  // 3. Insertamos en PostgreSQL
  await db.insert(usuarios).values({
    nombre: datosValidados.nombre,
    email: datosValidados.email,
    password: datosValidados.password, // A la contraseña la convertiremos en hash con bcrypt
    rol: datosValidados.rol,
    organizacionId: parseInt(datosValidados.organizacionId) // Lo convertimos en numeros para postgres
  });

  // 4. Refrescamos la página automáticamente para ver el nuevo músico en la lista
  revalidatePath('/');

  return{ success: true };
} catch (error) {
  console.error('Error al registrar el usuario', error);
  return{
    success: false,
    error: { _form: ['El correo electrónico ya está registrado o hubo un error interno.' ]},
  };
}
} 

export async function marcarLeccionCompletadaAction(formData: FormData) {
  const usuarioId = parseInt(formData.get('usuarioId') as string);
  const leccionId = parseInt(formData.get('leccionId') as string);
  const cursoId = parseInt(formData.get('cursoId') as string);  

  try {
    // Aplicamos Idempotencia: Si ya existe el registro ( choca con la pk ), no hace nada
    await db.insert(progresoLecciones)
    .values({
      usuarioId,
      leccionId,
    })
    .onConflictDoNothing();

    // Revalidamos la ruta dinámica del curso para que la UI se actualice al instante
    revalidatePath(`/curso/${cursoId}`);

    return { succes: true }
  } catch (error) {
    console.error('Error al registrar el progreso:', error);
    return { 
      succes: false,
      errors: { _form: ['Ocurrio un error al guardar tu progreso.'] },
    };
  }
}