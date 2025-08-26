/* eslint-disable @typescript-eslint/unbound-method -- Fastify dynamic imports & logger methods are safe to call directly in this context */
import type { FastifyInstance } from 'fastify';
import { buildAdminRuntimeConfig } from './adminConfig.js';

interface StaticAdminOptions {
  serve: boolean;
}

interface SetupResult {
  served: boolean;
  rootDir?: string;
  basePath?: string;
  error?: string;
}

// Resolve and register static admin dashboard if enabled.
export async function setupStaticAdmin(fastify: FastifyInstance, opts: StaticAdminOptions): Promise<SetupResult> {
  if (!opts.serve) {return { served: false };}
  try {
  const staticMod = await import('@fastify/static');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve, isAbsolute, join } = await import('path');
  const fs = await import('fs/promises');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

  const baseEnv = process.env.ADMIN_BASE_PATH;
  const rawBase = (typeof baseEnv === 'string' && baseEnv.length > 0) ? baseEnv : '/admin/';
    const ensureBasePath = (p: string): string => {
      let out = p.startsWith('/') ? p : '/' + p;
      if (!out.endsWith('/')) {out += '/';}
      return out;
    };
    const basePath = ensureBasePath(rawBase);

  const explicitDir = process.env.ADMIN_STATIC_DIR;
  const candidates: Array<string> = [];
  if (typeof explicitDir === 'string' && explicitDir !== '') {candidates.push(explicitDir);}
    candidates.push('../../admin-dashboard/dist');
    candidates.push('../../frontend/dist'); // legacy

    let chosen: string | null = null;
    for (const c of candidates) {
      const abs = isAbsolute(c) ? c : resolve(__dirname, c);
      try { await fs.access(abs); chosen = abs; break; } catch { /* ignore */ }
    }
    if (chosen === null) {
      fastify.log.warn('[static-admin] assets not found. Checked: ' + candidates.join(', '));
      return { served: false, error: 'assets_not_found' };
    }

    await fastify.register(staticMod.default, { root: chosen, prefix: basePath, decorateReply: false });

    // Runtime config (Phase 1 task) – built once at startup
    const builtConfig = buildAdminRuntimeConfig(basePath);
    fastify.get(basePath + 'config.json', async (req, reply) => {
      const ifNoneMatchHeader = req.headers['if-none-match'];
      if (typeof ifNoneMatchHeader === 'string') {
        const unquoted = ifNoneMatchHeader.replace(/W\/"?([^"]+)"?/, '$1');
        if (unquoted === builtConfig.etag) {
        reply.code(304);
        return reply.send();
        }
      }
      reply.header('Cache-Control', 'no-cache');
      reply.header('Content-Type', 'application/json');
      reply.header('ETag', `W/"${builtConfig.etag}"`);
      reply.header('x-admin-config-version', builtConfig.config.configVersion);
      return reply.send(builtConfig.json);
    });

    // Security / gating for HTML (Task 7). Assets (hashed files) are always public to leverage caching unless ADMIN_PUBLIC=strict in future.
  const isHtmlRequest = (url: string): boolean => !/\.[a-zA-Z0-9]{2,5}$/.test(url); // heuristic: no extension -> HTML route (SPA)

  fastify.get(basePath + '*', async (req, reply) => {
      const url = req.raw.url ?? '';
      if (isHtmlRequest(url)) {
        if (process.env.ADMIN_PUBLIC !== 'true') {
          const provided = req.headers['x-admin-key'];
          const expected = process.env.ADMIN_API_KEY;
          if (typeof expected === 'string' && expected !== '' && provided !== expected) {
            return reply.code(401).send({ error: 'Unauthorized' });
          }
        }
        reply.header('Cache-Control', 'no-cache');
        if ('sendFile' in reply && typeof (reply as { sendFile?: unknown }).sendFile === 'function') {
          (reply as { sendFile: (p: string) => void }).sendFile('index.html');
        } else {
          const html = await fs.readFile(join(chosen, 'index.html'), 'utf-8');
          reply.type('text/html').send(html);
        }
      } else {
        // let static plugin handle asset (served earlier in lifecycle)
        reply.callNotFound(); // triggers fastify-static handling
      }
    });

    // Add onSend hook to set long cache headers for hashed static assets (simple heuristic)
  fastify.addHook('onSend', async (req, reply, payload) => {
      try {
  const url = req.raw.url ?? '';
        if (url.startsWith(basePath)) {
          if (/\.[a-f0-9]{8,}\.(js|css|png|jpg|svg|woff2?)$/i.test(url)) {
            reply.header('Cache-Control', 'public, max-age=86400, immutable');
          }
        }
      } catch { /* ignore */ }
      return payload;
    });

    fastify.log.info(`[static-admin] Serving from ${chosen} at ${basePath}`);
    fastify.log.info(`[static-admin] config hash=${builtConfig.hash} version=${builtConfig.config.configVersion}`);
    return { served: true, rootDir: chosen, basePath };
  } catch (e) {
    fastify.log.warn('[static-admin] setup failed: ' + (e as Error).message);
    return { served: false, error: (e as Error).message };
  }
}
