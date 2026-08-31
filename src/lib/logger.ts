import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let transport: unknown = undefined;
if (!isProd && !isTest) {
  try {
    // Try to resolve pino-pretty; if it isn't available or cannot be
    // resolved in this runtime (Next/Turbopack), fall back to no transport.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call
    // `require.resolve` is safe to use here for resolution check.
    // @ts-ignore
    require.resolve('pino-pretty');
    transport = { target: 'pino-pretty' };
  } catch (err) {
    transport = undefined;
  }
}

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: transport as any,
});

export default logger;
