import { describe, it, expect } from 'vitest';
import { runWithTimeout } from '../actionHelpers';

describe('runWithTimeout', () => {
  it('resolves when function is fast', async () => {
    const r = await runWithTimeout(() => Promise.resolve(42), 1000);
    expect(r).toBe(42);
  });

  it('rejects on timeout', async () => {
    await expect(() => runWithTimeout(() => new Promise((res) => setTimeout(() => res(1), 200)), 50)).rejects.toThrow();
  });
});
