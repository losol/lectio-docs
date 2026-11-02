import type { JsonValue, LectioPlugin, ResolvedPlugin } from './types.js';

/**
 * Validate the configured plugins and normalize them into plain data.
 *
 * Throws on anything that would otherwise fail later and far from its cause:
 * a missing or duplicate name, two plugins claiming the same fence, fences
 * with no client to render them, or options that wouldn't survive being
 * copied into generated code (a function, a Date, a circular reference).
 */
export function resolvePlugins(plugins: readonly LectioPlugin[] | undefined): ResolvedPlugin[] {
  if (plugins === undefined) return [];
  if (!Array.isArray(plugins)) {
    throw new Error(`"plugins" must be an array, got ${describe(plugins)}`);
  }

  const names = new Set<string>();
  const fenceOwners = new Map<string, string>();

  return plugins.map((plugin, index) => {
    if (!isPlainObject(plugin)) {
      throw new Error(`plugins[${index}] must be an object, got ${describe(plugin)}`);
    }

    const { name } = plugin;
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error(`plugins[${index}] needs a "name"`);
    }
    if (names.has(name)) {
      throw new Error(`Two plugins are named "${name}"`);
    }
    names.add(name);
    const label = `Plugin "${name}"`;

    const fences = resolveFences(plugin.fences, label);
    for (const fence of fences) {
      const owner = fenceOwners.get(fence);
      if (owner !== undefined) {
        throw new Error(`The "${fence}" fence is claimed by both "${owner}" and "${name}"`);
      }
      fenceOwners.set(fence, name);
    }

    const client = resolveClient(plugin.client, label);
    if (fences.length > 0 && client === undefined) {
      throw new Error(`${label} claims fences (${fences.join(', ')}) but has no client module to render them`);
    }

    return client === undefined ? { name, fences } : { name, fences, client };
  });
}

function resolveFences(fences: unknown, label: string): string[] {
  if (fences === undefined) return [];
  if (!Array.isArray(fences)) {
    throw new Error(`${label}: "fences" must be an array of languages, got ${describe(fences)}`);
  }

  const resolved = new Set<string>();
  for (const fence of fences) {
    // A fence's language is the first word of its info string, so whitespace
    // can never match.
    if (typeof fence !== 'string' || !/^\S+$/.test(fence)) {
      throw new Error(`${label}: fence languages must be single words, got ${describe(fence)}`);
    }
    resolved.add(fence.toLowerCase());
  }
  return [...resolved];
}

function resolveClient(client: unknown, label: string): ResolvedPlugin['client'] {
  if (client === undefined) return undefined;
  if (!isPlainObject(client)) {
    throw new Error(`${label}: "client" must be an object, got ${describe(client)}`);
  }

  const { module, options } = client;
  if (typeof module !== 'string' || module.trim() === '') {
    throw new Error(`${label}: "client.module" must name a module`);
  }
  if (options !== undefined && !isPlainObject(options)) {
    throw new Error(`${label}: "client.options" must be a plain object, got ${describe(options)}`);
  }

  const json = options === undefined ? {} : toJson(options, `${label}: client.options`, new Set());
  return { module, options: json as { [key: string]: JsonValue } };
}

/** Deep-copy `value` as JSON, or throw naming the first part that isn't. */
function toJson(value: unknown, path: string, ancestors: Set<object>): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw notJson(path, String(value));
    return value;
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    if (ancestors.has(value)) throw notJson(path, 'a circular reference');
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        return value.map((item, i) => toJson(item, `${path}[${i}]`, ancestors));
      }
      const copy: { [key: string]: JsonValue } = {};
      for (const [key, item] of Object.entries(value)) {
        if (item === undefined) continue; // what JSON.stringify does too
        copy[key] = toJson(item, `${path}.${key}`, ancestors);
      }
      return copy;
    } finally {
      ancestors.delete(value);
    }
  }

  throw notJson(path, describe(value));
}

function notJson(path: string, what: string): Error {
  return new Error(
    `${path} is ${what}. Plugin options are copied into generated code, so they must be ` +
      'JSON: strings, numbers, booleans, null, arrays and plain objects.',
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return 'a function';
  if (Array.isArray(value)) return 'an array';
  if (typeof value === 'object') {
    const name = (value as { constructor?: { name?: string } }).constructor?.name;
    return name && name !== 'Object' ? `a ${name}` : 'an object';
  }
  if (typeof value === 'string') return JSON.stringify(value);
  return `a ${typeof value}`;
}
