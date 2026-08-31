import type { ActionResponse } from '@/types/api';
import { logger } from './logger';

export async function runWithTimeout<T>(fn: () => Promise<T>, ms = 5000): Promise<T> {
  let timer: NodeJS.Timeout;
  return await Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Timeout')), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function runActionResponse<T>(fn: () => Promise<ActionResponse<T>>, ms = 5000): Promise<ActionResponse<T>> {
  try {
    const result = await runWithTimeout(fn, ms);
    return result;
  } catch (err: any) {
    if (err?.message === 'Timeout') {
      logger.warn({ msg: 'Server Action timeout', ms }, 'action_timeout');
      return { success: false, message: 'La operación tardó demasiado. Intenta de nuevo.' } as ActionResponse<T>;
    }
    logger.error({ err }, 'Server Action error');
    return { success: false, message: 'Error interno del servidor' } as ActionResponse<T>;
  }
}
