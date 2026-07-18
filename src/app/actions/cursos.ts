'use server';

import { db } from '@/db';
import { progresoLecciones } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function marcarLeccionCompletadaAction(formData: FormData) {
  const usuarioId = parseInt(formData.get('usuarioId') as string);
  const leccionId = parseInt(formData.get('leccionId') as string);
  const cursoId = parseInt(formData.get('cursoId') as string);  

  try {
    await db.insert(progresoLecciones)
      .values({
        usuarioId,
        leccionId,
      })
      .onConflictDoNothing();

    revalidatePath(`/curso/${cursoId}`);

    return { success: true };
  } catch (error) {
    console.error('Error en marcarLeccionCompletadaAction:', error);
    return { 
      success: false,
      errors: { _form: ['Ocurrió un error al guardar tu progreso.'] },
    };
  }
}