import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db, auth and rateLimiter modules
vi.mock('@/db', () => ({
  db: {
    insert: () => ({
      values: () => ({ returning: async () => [{ id: 42 }] }),
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  evidenciasLeccion: { id: 'id', leccionId: 'leccion_id', usuarioId: 'usuario_id', videoUrl: 'video_url' },
  comentariosEvidencia: { id: 'id', evidenciaId: 'evidencia_id', usuarioId: 'usuario_id', contenido: 'contenido', createdAt: 'created_at' },
  reaccionesEvidencia: { evidenciaId: 'evidencia_id', usuarioId: 'usuario_id' },
}));

vi.mock('@/types/social.schema', () => ({
  subirEvidenciaSchema: {
    safeParse: (x: any) => {
      if (!x || typeof x.videoUrl !== 'string' || !x.videoUrl.startsWith('http')) {
        return { success: false, error: { flatten: () => ({ fieldErrors: { videoUrl: ['Invalid url'] } }) } };
      }
      return { success: true, data: x };
    },
  },
  comentarEvidenciaSchema: {
    safeParse: (x: any) => {
      if (!x || typeof x.contenido !== 'string' || x.contenido.trim() === '') {
        return { success: false, error: { flatten: () => ({ fieldErrors: { contenido: ['Required'] } }) } };
      }
      return { success: true, data: x };
    },
  },
  reaccionEvidenciaSchema: {
    safeParse: (x: any) => ({ success: true, data: x }),
  },
}));

vi.mock('@/lib/actionHelpers', () => ({
  runActionResponse: (fn: any) => fn(),
  runWithTimeout: async (p: any) => p,
}));

vi.mock('@/lib/auth', () => ({
  requireSession: async () => ({ userId: 123 }),
}));

vi.mock('@/lib/rateLimiter', () => ({
  consumeRateLimit: () => true,
  checkIdempotency: () => true,
}));

import { subirEvidenciaAction, comentarEvidenciaAction, reaccionEvidenciaAction } from '../social';

describe('Social Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subirEvidenciaAction rejects invalid URL', async () => {
    const res = await subirEvidenciaAction({ leccionId: 1, videoUrl: 'not-a-url' } as any);
    expect(res.success).toBe(false);
  });

  it('subirEvidenciaAction succeeds with valid payload', async () => {
    const res = await subirEvidenciaAction({ leccionId: 1, videoUrl: 'https://www.youtube.com/watch?v=abc123' });
    expect(res.success).toBe(true);
    expect((res as any).data?.evidenciaId).toBe(42);
  });

  it('comentarEvidenciaAction validates input and succeeds', async () => {
    const invalid = await comentarEvidenciaAction({ evidenciaId: 1, contenido: '' } as any);
    expect(invalid.success).toBe(false);

    const ok = await comentarEvidenciaAction({ evidenciaId: 1, contenido: 'Buen trabajo' });
    expect(ok.success).toBe(true);
    expect((ok as any).data?.comentarioId).toBe(42);
  });

  it('reaccionEvidenciaAction accepts a reaction', async () => {
    const res = await reaccionEvidenciaAction({ evidenciaId: 1, tipo: 'LIKE' });
    expect(res.success).toBe(true);
  });
});
