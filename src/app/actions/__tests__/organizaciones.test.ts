import { describe, it, expect, vi, beforeEach } from 'vitest';

const role = { value: 'ADMIN' as 'ADMIN' | 'LIDER' };
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    insert: (table: unknown) => {
      insertMock(table);
      return { values: () => ({ returning: async () => [{ id: 21 }] }) };
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
  organizaciones: { id: 'id', nombre: 'nombre', estado: 'estado' },
}));

vi.mock('@/lib/auth', () => ({
  requireRole: async () => {
    if (role.value === 'LIDER') throw new Error('Forbidden');
    return { userId: 7, rol: 'ADMIN' };
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { createOrganizacionAction, updateOrganizacionAction, deleteOrganizacionAction } from '../organizaciones';

describe('CRUD de organizaciones con RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    role.value = 'ADMIN';
  });

  it('crea una organización con nombre y estado válidos', async () => {
    const result = await createOrganizacionAction({ nombre: 'Iglesia Central', estado: 'Valencia' });

    expect(result.success).toBe(true);
    expect(insertMock).toHaveBeenCalled();
  });

  it('rechaza datos incompletos antes de escribir', async () => {
    const result = await createOrganizacionAction({ nombre: 'A', estado: '' });

    expect(result.success).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('permite actualizar y eliminar a un administrador', async () => {
    const updated = await updateOrganizacionAction({ id: 21, nombre: 'Iglesia Renovada' });
    const deleted = await deleteOrganizacionAction({ id: 21 });

    expect(updated.success).toBe(true);
    expect(deleted.success).toBe(true);
    expect(updateMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalled();
  });

  it('bloquea organizaciones para roles no administrativos', async () => {
    role.value = 'LIDER';

    const result = await createOrganizacionAction({ nombre: 'Iglesia Central', estado: 'Valencia' });

    expect(result.success).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
