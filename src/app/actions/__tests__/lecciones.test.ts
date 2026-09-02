import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRole = { value: 'ADMIN' as 'ADMIN' | 'LIDER' | 'APRENDIZ' };
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    insert: (table: unknown) => {
      insertMock(table);
      return { values: () => ({ returning: async () => [{ id: 11 }] }) };
    },
    update: (table: unknown) => {
      updateMock(table);
      return { set: () => ({ where: async () => undefined }) };
    },
    delete: (table: unknown) => {
      deleteMock(table);
      return { where: async () => undefined };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  lecciones: {
    id: 'id',
    titulo: 'titulo',
    descripcion: 'descripcion',
    videoUrl: 'video_url',
    orden: 'orden',
    cursoId: 'curso_id',
  },
}));

vi.mock('@/lib/auth', () => ({
  requireRole: async () => {
    if (mockRole.value === 'APRENDIZ') throw new Error('Forbidden');
    return { userId: 7, rol: mockRole.value };
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { createLeccionAction, updateLeccionAction, deleteLeccionAction } from '../lecciones';

describe('CRUD de lecciones con RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole.value = 'ADMIN';
  });

  it('crea una lección con contenido válido', async () => {
    const result = await createLeccionAction({
      cursoId: 1,
      titulo: 'Postura y afinación',
      descripcion: 'Aprende la postura inicial y la afinación.',
      videoUrl: 'https://www.youtube.com/watch?v=lesson-1',
      orden: 1,
    });

    expect(result.success).toBe(true);
    expect(insertMock).toHaveBeenCalled();
  });

  it('rechaza una URL que no pertenece a YouTube o Vimeo', async () => {
    const result = await createLeccionAction({
      cursoId: 1,
      titulo: 'Lección válida',
      descripcion: 'Descripción suficientemente larga.',
      videoUrl: 'https://example.com/video',
      orden: 1,
    });

    expect(result.success).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('impide crear lecciones a un aprendiz', async () => {
    mockRole.value = 'APRENDIZ';

    const result = await createLeccionAction({
      cursoId: 1,
      titulo: 'Postura y afinación',
      descripcion: 'Aprende la postura inicial y la afinación.',
      videoUrl: 'https://vimeo.com/12345',
      orden: 1,
    });

    expect(result.success).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('actualiza y elimina lecciones con permiso', async () => {
    const updated = await updateLeccionAction({ id: 11, titulo: 'Afinación actualizada' });
    const deleted = await deleteLeccionAction({ id: 11, cursoId: 1 });

    expect(updated.success).toBe(true);
    expect(deleted.success).toBe(true);
    expect(updateMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalled();
  });
});
