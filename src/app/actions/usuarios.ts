'use server';

import { z } from 'zod';
import { db } from '@/db';
import { usuarios } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import type { ActionResponse } from '@/types/api';

const updateUserRoleSchema = z.object({
  usuarioId: z.coerce.number().int().positive('ID de usuario inválido'),
  rol: z.enum(['ADMIN', 'LIDER', 'APRENDIZ'], {
    message: 'Rol inválido',
  }),
});

export async function updateUserRoleAction(
  payload: FormData | Record<string, unknown>,
): Promise<ActionResponse<{ usuarioId: number; rol: 'ADMIN' | 'LIDER' | 'APRENDIZ' }>> {
  try {
    const session = await requireRole(['ADMIN']);
    const normalized = payload instanceof FormData
      ? Object.fromEntries(payload.entries())
      : payload;
    const parsed = updateUserRoleSchema.safeParse(normalized);

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return { success: false, errors: fieldErrors };
    }

    if (session.userId === parsed.data.usuarioId && parsed.data.rol !== 'ADMIN') {
      return {
        success: false,
        message: 'No puedes quitarte tu propio rol de administrador.',
      };
    }

    await db.update(usuarios)
      .set({ rol: parsed.data.rol })
      .where(eq(usuarios.id, parsed.data.usuarioId));

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, data: parsed.data };
  } catch (error: unknown) {
    if (error instanceof Error && /Forbidden|Unauthorized|No autorizado/i.test(error.message)) {
      return { success: false, message: 'No autorizado para realizar esta acción.' };
    }

    return { success: false, message: 'Error interno del servidor' };
  }
}
