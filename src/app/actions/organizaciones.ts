'use server';

import { z } from 'zod';
import { db } from '@/db';
import { organizaciones } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import type { ActionResponse } from '@/types/api';

const createOrganizacionSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  estado: z.string().trim().min(2, 'El estado debe tener al menos 2 caracteres'),
});

const updateOrganizacionSchema = createOrganizacionSchema.partial().extend({
  id: z.coerce.number().int().positive('ID inválido'),
});

const deleteOrganizacionSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido'),
});

type OrganizacionPayload = FormData | Record<string, unknown>;

function normalizePayload(payload: OrganizacionPayload): Record<string, unknown> {
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

export async function createOrganizacionAction(payload: OrganizacionPayload): Promise<ActionResponse<{ organizacionId: number }>> {
  try {
    await requireRole(['ADMIN']);
    const parsed = createOrganizacionSchema.safeParse(normalizePayload(payload));

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return { success: false, errors: fieldErrors };
    }

    const [organizacion] = await db.insert(organizaciones)
      .values({
        nombre: parsed.data.nombre,
        estado: parsed.data.estado,
      })
      .returning({ id: organizaciones.id });

    revalidatePath('/admin');
    revalidatePath('/register');
    revalidatePath('/registro');
    return { success: true, data: { organizacionId: organizacion.id } };
  } catch (error: unknown) {
    return unauthorizedResponse(error);
  }
}

export async function updateOrganizacionAction(payload: OrganizacionPayload): Promise<ActionResponse<{ organizacionId: number }>> {
  try {
    await requireRole(['ADMIN']);
    const parsed = updateOrganizacionSchema.safeParse(normalizePayload(payload));

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

    await db.update(organizaciones)
      .set(values as Partial<typeof organizaciones.$inferInsert>)
      .where(eq(organizaciones.id, id));

    revalidatePath('/admin');
    revalidatePath('/register');
    revalidatePath('/registro');
    return { success: true, data: { organizacionId: id } };
  } catch (error: unknown) {
    return unauthorizedResponse(error);
  }
}

export async function deleteOrganizacionAction(payload: OrganizacionPayload): Promise<ActionResponse<{ organizacionId: number }>> {
  try {
    await requireRole(['ADMIN']);
    const parsed = deleteOrganizacionSchema.safeParse(normalizePayload(payload));

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return { success: false, errors: fieldErrors };
    }

    await db.delete(organizaciones).where(eq(organizaciones.id, parsed.data.id));
    revalidatePath('/admin');
    revalidatePath('/register');
    revalidatePath('/registro');
    return { success: true, data: { organizacionId: parsed.data.id } };
  } catch (error: unknown) {
    return unauthorizedResponse(error);
  }
}
