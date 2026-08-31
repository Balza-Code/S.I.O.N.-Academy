import { describe, it, expect } from 'vitest';
import { loginSchema } from '../auth.schema';

describe('loginSchema', () => {
  it('validates a correct shape', () => {
    const res = loginSchema.safeParse({ email: 'test@example.com', password: 'secret123' });
    expect(res.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const res = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(res.success).toBe(false);
  });
});
