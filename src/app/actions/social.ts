 'use server'
import { db } from '@/db';
import { evidenciasLeccion, comentariosEvidencia, reaccionesEvidencia } from '@/db/schema';
import { subirEvidenciaSchema, comentarEvidenciaSchema, reaccionEvidenciaSchema } from '@/types/social.schema';
import { requireSession } from '@/lib/auth';
import { runActionResponse } from '@/lib/actionHelpers';
import { revalidatePath } from 'next/cache';
import { consumeRateLimit, checkIdempotency } from '@/lib/rateLimiter';
import type { ActionResponse } from '@/types/api';

function normalizeFormData(payload: FormData | unknown): Record<string, unknown> {
  if (payload instanceof FormData) {
    return Object.fromEntries(payload.entries());
  }

  if (payload && typeof payload === 'object') {
    return payload as Record<string, unknown>;
  }

  return {};
}

export async function subirEvidenciaAction(payload: FormData | unknown) {
  const normalized = normalizeFormData(payload);

  return runActionResponse<{ evidenciaId: number }>(async () => {
    try {
      const parsed = subirEvidenciaSchema.safeParse(normalized);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors ?? {};
        return { success: false, errors: fieldErrors, message: 'Entrada inválida' } as ActionResponse<{ evidenciaId: number }>;
      }

      const session = await requireSession();

      const idempotencyKey = (normalized as { idempotencyKey?: string }).idempotencyKey;
      if (!(await checkIdempotency(session.userId, idempotencyKey))) {
        return { success: true, data: { evidenciaId: -1 } } as ActionResponse<{ evidenciaId: number }>;
      }

      // Rate limiting: max 3 uploads per hour per user
      if (!(await consumeRateLimit(`upload:${session.userId}`, 3, 1000 * 60 * 60))) {
        return { success: false, errors: {}, message: 'Límite de subidas alcanzado. Intenta más tarde.' } as ActionResponse<{ evidenciaId: number }>;
      }

      const [row] = await db.insert(evidenciasLeccion).values({
        usuarioId: session.userId,
        leccionId: parsed.data.leccionId,
        videoUrl: parsed.data.videoUrl,
        descripcion: parsed.data.descripcion ?? null,
      }).returning();

      // Revalidate homepage and let frontend fetch updated evidence lists
      try { revalidatePath('/'); } catch (e: unknown) {}

      return { success: true, data: { evidenciaId: row.id } } as ActionResponse<{ evidenciaId: number }>;
    } catch (err: unknown) {
      return { success: false, errors: {}, message: 'Error interno del servidor' } as ActionResponse<{ evidenciaId: number }>;
    }
  });
}

export async function comentarEvidenciaAction(payload: FormData | unknown) {
  const normalized = normalizeFormData(payload);

  return runActionResponse<{ comentarioId: number }>(async () => {
    try {
      const parsed = comentarEvidenciaSchema.safeParse(normalized);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors ?? {};
        return { success: false, errors: fieldErrors, message: 'Entrada inválida' } as ActionResponse<{ comentarioId: number }>;
      }

      const session = await requireSession();

      // Rate limiting: max 10 comments per minute per user
      if (!(await consumeRateLimit(`comment:${session.userId}`, 10, 1000 * 60))) {
        return { success: false, errors: {}, message: 'Límite de comentarios alcanzado. Intenta más tarde.' } as ActionResponse<{ comentarioId: number }>;
      }

      const [row] = await db.insert(comentariosEvidencia).values({
        evidenciaId: parsed.data.evidenciaId,
        usuarioId: session.userId,
        contenido: parsed.data.contenido,
      }).returning();

      try { revalidatePath('/'); } catch (e: unknown) {}

      return { success: true, data: { comentarioId: row.id } } as ActionResponse<{ comentarioId: number }>;
    } catch (err: unknown) {
      return { success: false, errors: {}, message: 'Error interno del servidor' } as ActionResponse<{ comentarioId: number }>;
    }
  });
}

export async function reaccionEvidenciaAction(payload: FormData | unknown) {
  const normalized = normalizeFormData(payload);

  return runActionResponse<{ ok: boolean }>(async () => {
    try {
      const parsed = reaccionEvidenciaSchema.safeParse(normalized);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors ?? {};
        return { success: false, errors: fieldErrors, message: 'Entrada inválida' } as ActionResponse<{ ok: boolean }>;
      }

      const session = await requireSession();

      // Rate limit reactions lightly (60 per hour)
      if (!(await consumeRateLimit(`react:${session.userId}`, 60, 1000 * 60 * 60))) {
        return { success: false, errors: {}, message: 'Límite de reacciones alcanzado. Intenta más tarde.' } as ActionResponse<{ ok: boolean }>;
      }

      // Upsert-like behavior: try insert, if conflict do nothing.
      // Cast through unknown to satisfy both Drizzle's real insert builder and the lightweight test mocks.
      const insertQuery = db.insert(reaccionesEvidencia).values({
        evidenciaId: parsed.data.evidenciaId,
        usuarioId: session.userId,
        tipo: parsed.data.tipo,
      }) as unknown as {
        onConflictDoNothing?: (opts: { target: readonly unknown[] }) => Promise<unknown>;
        returning?: () => Promise<unknown>;
      };

      if (typeof insertQuery.onConflictDoNothing === 'function') {
        await insertQuery.onConflictDoNothing({
          target: [reaccionesEvidencia.evidenciaId, reaccionesEvidencia.usuarioId],
        });
      } else if (typeof insertQuery.returning === 'function') {
        await insertQuery.returning();
      }

      try { revalidatePath('/'); } catch (e: unknown) {}

      return { success: true, data: { ok: true } } as ActionResponse<{ ok: boolean }>;
    } catch (err: unknown) {
      return { success: false, errors: {}, message: 'Error interno del servidor' } as ActionResponse<{ ok: boolean }>;
    }
  });
}
