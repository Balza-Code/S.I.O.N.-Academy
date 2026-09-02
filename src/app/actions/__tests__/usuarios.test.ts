import { describe, it, expect, vi, beforeEach } from 'vitest';

const role = { value: 'ADMIN' as 'ADMIN' | 'APRENDIZ' };
const updateMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    update: (table: unknown) => {
      updateMock(table);
      return { set: () => ({ where: async () => undefined }) };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  usuarios: { id: 'id', rol: 'rol' },
}));

vi.mock('@/lib/auth', () => ({
  requireRole: async () => {
    if (role.value === 'APRENDIZ') throw new Error('Forbidden');
    return { userId: 7, rol: 'ADMIN' };
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { updateUserRoleAction } from '../usuarios';

describe('Gestión de roles de usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    role.value = 'ADMIN';
  });

  it('permite a un administrador cambiar el rol de otro usuario', async () => {
    const result = await updateUserRoleAction({ usuarioId: 8, rol: 'LIDER' });

    expect(result.success).toBe(true);
    expect(updateMock).toHaveBeenCalled();
  });

  it('bloquea la gestión de roles para aprendices', async () => {
    role.value = 'APRENDIZ';

    const result = await updateUserRoleAction({ usuarioId: 8, rol: 'LIDER' });

    expect(result.success).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('impide que un administrador se quite su propio rol', async () => {
    const result = await updateUserRoleAction({ usuarioId: 7, rol: 'APRENDIZ' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/propio rol/i);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
