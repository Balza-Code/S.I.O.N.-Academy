'use server';

import { z } from 'zod';
import { db } from '@/db';
import { lecciones } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import type { ActionResponse } from '@/types/api';

const videoUrlSchema = z.string().url('La URL del video no es válida').refine(
  (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname === 'youtube.com'
        || hostname.endsWith('.youtube.com')
        || hostname === 'youtu.be'
        || hostname === 'vimeo.com'
        || hostname.endsWith('.vimeo.com');
    } catch {
      return false;
    }
  },
  'El video debe pertenecer a YouTube o Vimeo',
);

const createLeccionSchema = z.object({
  cursoId: z.coerce.number().int().positive('El curso es obligatorio'),
  titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres'),
  descripcion: z.string().trim().max(1000, 'La descripción no puede exceder 1000 caracteres').optional(),
  videoUrl: videoUrlSchema,
  orden: z.coerce.number().int().positive('El orden debe ser un entero positivo'),
});

const updateLeccionSchema = createLeccionSchema.partial().extend({
  id: z.coerce.number().int().positive('ID inválido'),
});

const deleteLeccionSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido'),
  cursoId: z.coerce.number().int().positive('El curso es obligatorio'),
});

type LeccionPayload = FormData | Record<string, unknown>;

function normalizePayload(payload: LeccionPayload): Record<string, unknown> {
  if (payload instanceof FormData) {
    return Object.fromEntries(payload.entries());
  }

  return payload;
}

function unauthorizedResponse<T>(error: unknown): ActionResponse<T> {
  if (error instanceof Error && /Forbidden|Unauthorized|No autorizado/i.test(error.message)) {
    return { success: false, message: 'No autorizado para realizar esta acción.' };
  }

  return { success: false, message: 'Error interno del servidor' };
}

export async function createLeccionAction(payload: LeccionPayload): Promise<ActionResponse<{ leccionId: number }>> {
  try {
    await requireRole(['ADMIN', 'LIDER']);
    const parsed = createLeccionSchema.safeParse(normalizePayload(payload));

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return { success: false, errors: fieldErrors };
    }

    const [leccion] = await db.insert(lecciones)
      .values({
        cursoId: parsed.data.cursoId,
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion ?? null,
        videoUrl: parsed.data.videoUrl,
        orden: parsed.data.orden,
      })
      .returning({ id: lecciones.id });

    revalidatePath(`/cursos/${parsed.data.cursoId}`);
    revalidatePath('/dashboard');
    return { success: true, data: { leccionId: leccion.id } };
  } catch (error: unknown) {
    return unauthorizedResponse(error);
  }
}

export async function updateLeccionAction(payload: LeccionPayload): Promise<ActionResponse<{ leccionId: number }>> {
  try {
    await requireRole(['ADMIN', 'LIDER']);
    const parsed = updateLeccionSchema.safeParse(normalizePayload(payload));

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return { success: false, errors: fieldErrors };
    }

    const { id, ...changes } = parsed.data;
    const values = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(values).length === 0) {
      return { success: false, message: 'No hay cambios para guardar.' };
    }

    await db.update(lecciones)
      .set(values as Partial<typeof lecciones.$inferInsert>)
      .where(eq(lecciones.id, id));

    revalidatePath('/dashboard');
    revalidatePath(`/cursos/${id}`);
    return { success: true, data: { leccionId: id } };
  } catch (error: unknown) {
    return unauthorizedResponse(error);
  }
}

export async function deleteLeccionAction(payload: LeccionPayload): Promise<ActionResponse<{ leccionId: number }>> {
  try {
    await requireRole(['ADMIN', 'LIDER']);
    const parsed = deleteLeccionSchema.safeParse(normalizePayload(payload));

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return { success: false, errors: fieldErrors };
    }

    await db.delete(lecciones).where(eq(lecciones.id, parsed.data.id));
    revalidatePath(`/cursos/${parsed.data.cursoId}`);
    revalidatePath('/dashboard');
    return { success: true, data: { leccionId: parsed.data.id } };
  } catch (error: unknown) {
    return unauthorizedResponse(error);
  }
}
