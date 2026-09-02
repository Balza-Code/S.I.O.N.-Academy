'use server';

import { z } from 'zod';
import { db } from '@/db';
import { cursos, progresoLecciones } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { requireRole, requireSession } from '@/lib/auth';
import type { ActionResponse } from '@/types/api';

const createCursoSchema = z.object({
  titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres'),
  descripcion: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres'),
  instrumento: z.string().trim().min(2, 'El instrumento es obligatorio'),
});

const updateCursoSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido'),
  titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').optional(),
  descripcion: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres').optional(),
  instrumento: z.string().trim().min(2, 'El instrumento es obligatorio').optional(),
});

const deleteCursoSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido'),
});

function normalizePayload(payload: FormData | Record<string, unknown> | unknown): Record<string, unknown> {
  if (payload instanceof FormData) {
    return Object.fromEntries(payload.entries());
  }

  if (payload && typeof payload === 'object') {
    return payload as Record<string, unknown>;
  }

  return {};
}

export async function createCursoAction(payload: FormData | Record<string, unknown>): Promise<ActionResponse<{ cursoId: number }>> {
  try {
    await requireRole(['ADMIN', 'LIDER']);

    const normalized = normalizePayload(payload);
    const parsed = createCursoSchema.safeParse(normalized);

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return {
        success: false,
        errors: fieldErrors,
        message: 'Datos del curso inválidos',
      };
    }

    const [curso] = await db.insert(cursos)
      .values({
        titulo: parsed.data.titulo.trim(),
        descripcion: parsed.data.descripcion.trim(),
        instrumento: parsed.data.instrumento.trim(),
      })
      .returning({ id: cursos.id });

    revalidatePath('/dashboard');
    return { success: true, data: { cursoId: curso.id } };
  } catch (error) {
    const message = error instanceof Error && /Forbidden|No autorizado|Unauthorized/i.test(error.message)
      ? 'No autorizado para realizar esta acción.'
      : 'Error interno del servidor';

    return { success: false, message };
  }
}

export async function updateCursoAction(payload: FormData | Record<string, unknown>): Promise<ActionResponse<{ cursoId: number }>> {
  try {
    await requireRole(['ADMIN', 'LIDER']);

    const normalized = normalizePayload(payload);
    const parsed = updateCursoSchema.safeParse(normalized);

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return {
        success: false,
        errors: fieldErrors,
        message: 'Datos del curso inválidos',
      };
    }

    const { id, ...updates } = parsed.data;
    const payloadToUpdate = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(payloadToUpdate).length === 0) {
      return { success: false, message: 'No hay cambios para guardar.' };
    }

    await db.update(cursos)
      .set(payloadToUpdate)
      .where(eq(cursos.id, id));

    revalidatePath('/dashboard');
    revalidatePath(`/cursos/${id}`);

    return { success: true, data: { cursoId: id } };
  } catch (error) {
    const message = error instanceof Error && /Forbidden|No autorizado|Unauthorized/i.test(error.message)
      ? 'No autorizado para realizar esta acción.'
      : 'Error interno del servidor';

    return { success: false, message };
  }
}

export async function deleteCursoAction(payload: FormData | Record<string, unknown>): Promise<ActionResponse<{ cursoId: number }>> {
  try {
    await requireRole(['ADMIN', 'LIDER']);

    const normalized = normalizePayload(payload);
    const parsed = deleteCursoSchema.safeParse(normalized);

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return {
        success: false,
        errors: fieldErrors,
        message: 'ID del curso inválido',
      };
    }

    const { id } = parsed.data;
    await db.delete(cursos).where(eq(cursos.id, id));

    revalidatePath('/dashboard');
    return { success: true, data: { cursoId: id } };
  } catch (error) {
    const message = error instanceof Error && /Forbidden|No autorizado|Unauthorized/i.test(error.message)
      ? 'No autorizado para realizar esta acción.'
      : 'Error interno del servidor';

    return { success: false, message };
  }
}

export async function marcarLeccionCompletadaAction(formData: FormData): Promise<void> {
  const sesion = await requireSession();
  const usuarioId = sesion.userId;
  const leccionId = Number(formData.get('leccionId'));
  const cursoId = Number(formData.get('cursoId'));

  try {
    await db.insert(progresoLecciones)
      .values({
        usuarioId,
        leccionId,
      })
      .onConflictDoNothing();

    revalidatePath(`/cursos/${cursoId}`);
    return;
  } catch (error) {
    console.error('Error en marcarLeccionCompletadaAction:', error);
    return;
  }
}