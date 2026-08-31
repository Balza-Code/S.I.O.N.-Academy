'use server';

import { db } from '@/db';
import { progresoLecciones } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth';

export async function marcarLeccionCompletadaAction(formData: FormData): Promise<void> {
  // Require authenticated session and use the session userId instead of trusting client input
  const sesion = await requireSession();
  const usuarioId = sesion.userId;
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
    return;
  } catch (error) {
    console.error('Error en marcarLeccionCompletadaAction:', error);
    return;
  }
}