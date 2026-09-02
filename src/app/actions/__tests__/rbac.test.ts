import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSessionRole = { value: 'ADMIN' as 'ADMIN' | 'LIDER' | 'APRENDIZ' };
const dbInsertMock = vi.fn();
const dbUpdateMock = vi.fn();
const dbDeleteMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    insert: (table: unknown) => {
      dbInsertMock(table);
      return {
        values: () => ({
          returning: async () => [{ id: 42 }],
        }),
      };
    },
    update: (table: unknown) => {
      dbUpdateMock(table);
      return {
        set: () => ({
          where: async () => undefined,
        }),
      };
    },
    delete: (table: unknown) => {
      dbDeleteMock(table);
      return {
        where: async () => undefined,
      };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  cursos: { id: 'id', titulo: 'titulo', descripcion: 'descripcion', instrumento: 'instrumento' },
  organizaciones: { id: 'id', nombre: 'nombre', estado: 'estado' },
}));

vi.mock('@/lib/auth', () => ({
  requireRole: async (roles: string[]) => {
    if (mockSessionRole.value === 'APRENDIZ') {
      const error = new Error('Forbidden');
      (error as Error & { status?: number }).status = 403;
      throw error;
    }

    if (!roles.includes('ADMIN') && !roles.includes('LIDER')) {
      const error = new Error('Forbidden');
      (error as Error & { status?: number }).status = 403;
      throw error;
    }

    return { userId: 7, rol: 'ADMIN' };
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createCursoAction, deleteCursoAction, updateCursoAction } from '../cursos';

describe('RBAC для mutaciones críticas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionRole.value = 'ADMIN';
  });

  it('permite crear cursos con rol administrativo', async () => {
    const res = await createCursoAction({ titulo: 'Guitarra I', descripcion: 'Curso inicial', instrumento: 'Guitarra' });

    expect(res.success).toBe(true);
    expect(dbInsertMock).toHaveBeenCalled();
  });

  it('bloquea la creación de cursos para aprendices', async () => {
    mockSessionRole.value = 'APRENDIZ';

    const res = await createCursoAction({ titulo: 'Guitarra I', descripcion: 'Curso inicial', instrumento: 'Guitarra' });

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/No autorizado|Forbidden|autoriz/i);
  });

  it('actualiza cursos solo con permisos de administración', async () => {
    const res = await updateCursoAction({ id: 1, titulo: 'Guitarra II', descripcion: 'Curso intermedio', instrumento: 'Guitarra' });

    expect(res.success).toBe(true);
    expect(dbUpdateMock).toHaveBeenCalled();
  });

  it('elimina cursos con permisos de administración', async () => {
    const res = await deleteCursoAction({ id: 1 });

    expect(res.success).toBe(true);
    expect(dbDeleteMock).toHaveBeenCalled();
  });
});
