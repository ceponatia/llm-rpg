import { describe, it, expect, vi } from 'vitest';

// Need fresh import per test when mutating process.env
async function fresh(): Promise<typeof import('../src/config/flags.js')> {
  return await import('../src/config/flags.js?update=' + Date.now());
}

describe('flags module', () => {
  it('provides defaults when env unset', async () => {
    delete process.env.CHAT_ECHO_MODE;
    delete process.env.ENABLE_CHAT_API;
    const mod = await fresh();
    expect(mod.FLAGS.CHAT_ECHO_MODE).toBe(false);
    expect(mod.isEnabled('ENABLE_CHAT_API')).toBe(true);
  });

  it('parses boolean true', async () => {
    process.env.CHAT_ECHO_MODE = 'true';
    const mod = await fresh();
    expect(mod.FLAGS.CHAT_ECHO_MODE).toBe(true);
  });

  it('logs non-default flags', async () => {
    process.env.CHAT_ECHO_MODE = 'true';
    const mod = await fresh();
    const logger = { info: vi.fn() };
    mod.logNonDefaultFlags(logger as any);
    const calls = (logger.info as any).mock.calls;
    expect(calls.length).toBe(1);
    expect(JSON.stringify(calls[0][1])).toMatch(/CHAT_ECHO_MODE/);
  });

  it('assertRequired throws for missing', async () => {
    const mod = await fresh();
    expect(() => mod.assertRequired(['VAR_DOES_NOT_EXIST_TEST'])).toThrow(/Missing required/);
  });

  it('unknown flag passthrough does not throw', async () => {
    process.env.SOME_UNKNOWN_FLAG_ABCD = 'value';
    const mod = await fresh();
    expect(mod.getRaw('SOME_UNKNOWN_FLAG_ABCD')).toBe('value');
  });
});
