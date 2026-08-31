'use server'
import { db } from '@/db';
import { evidenciasLeccion, comentariosEvidencia, reaccionesEvidencia } from '@/db/schema';
import { SubirEvidenciaInput, subirEvidenciaSchema, ComentarEvidenciaInput, comentarEvidenciaSchema, ReaccionEvidenciaInput, reaccionEvidenciaSchema } from '@/types/social.schema';
import { requireSession } from '@/lib/auth';
import { runActionResponse } from '@/lib/actionHelpers';
import { revalidatePath } from 'next/cache';
import { consumeRateLimit, checkIdempotency } from '@/lib/rateLimiter';

export async function subirEvidenciaAction(payload: SubirEvidenciaInput) {
  return runActionResponse(async () => {
    const validated = subirEvidenciaSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, errors: (validated.error.flatten?.() || {}).fieldErrors ?? {} };
    }

    const session = await requireSession();

    // Idempotency: optional idempotencyKey in payload
    // @ts-ignore
    const idempotencyKey = (payload as any).idempotencyKey as string | undefined;
    if (!(await checkIdempotency(session.userId, idempotencyKey))) {
      return { success: true, message: 'Duplicate submission suppressed' };
    }

    // Rate limiting: max 3 uploads per hour per user
    if (!(await consumeRateLimit(`upload:${session.userId}`, 3, 1000 * 60 * 60))) {
      return { success: false, message: 'Límite de subidas alcanzado. Intenta más tarde.' };
    }

    const [row] = await db.insert(evidenciasLeccion).values({
      usuarioId: session.userId,
      leccionId: validated.data.leccionId,
      videoUrl: validated.data.videoUrl,
      descripcion: validated.data.descripcion ?? null,
    }).returning();

    // Revalidate homepage and let frontend fetch updated evidence lists
    try { revalidatePath('/'); } catch (e) {}

    return { success: true, data: { evidenciaId: row.id } };
  });
}

export async function comentarEvidenciaAction(payload: ComentarEvidenciaInput) {
  return runActionResponse(async () => {
    const validated = comentarEvidenciaSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, errors: (validated.error.flatten?.() || {}).fieldErrors ?? {} };
    }

    const session = await requireSession();

    // Rate limiting: max 10 comments per minute per user
    if (!(await consumeRateLimit(`comment:${session.userId}`, 10, 1000 * 60))) {
      return { success: false, message: 'Límite de comentarios alcanzado. Intenta más tarde.' };
    }

    const [row] = await db.insert(comentariosEvidencia).values({
      evidenciaId: validated.data.evidenciaId,
      usuarioId: session.userId,
      contenido: validated.data.contenido,
    }).returning();

    try { revalidatePath('/'); } catch (e) {}

    return { success: true, data: { comentarioId: row.id } };
  });
}

export async function reaccionEvidenciaAction(payload: ReaccionEvidenciaInput) {
  return runActionResponse(async () => {
    const validated = reaccionEvidenciaSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, errors: (validated.error.flatten?.() || {}).fieldErrors ?? {} };
    }

    const session = await requireSession();

    // Rate limit reactions lightly (60 per hour)
    if (!(await consumeRateLimit(`react:${session.userId}`, 60, 1000 * 60 * 60))) {
      return { success: false, message: 'Límite de reacciones alcanzado. Intenta más tarde.' };
    }

    // Upsert-like behavior: try insert, if conflict do nothing
    await db.insert(reaccionesEvidencia).values({
      evidenciaId: validated.data.evidenciaId,
      usuarioId: session.userId,
      tipo: validated.data.tipo,
    }).onConflictDoNothing({ target: [reaccionesEvidencia.evidenciaId, reaccionesEvidencia.usuarioId] });

    try { revalidatePath('/'); } catch (e) {}

    return { success: true };
  });
}
