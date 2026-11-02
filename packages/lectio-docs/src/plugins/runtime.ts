/**
 * The browser half of the plugin contract, with no framework in it.
 *
 * A plugin's client module renders a fenced block into a plain element it is
 * handed. Each host adapts that to its own components: give a fence an element
 * the framework leaves alone, call {@link mountFence} when it appears and the
 * returned dispose when it goes. Nothing here touches the DOM at import time,
 * so it is safe to import during a server render.
 */

/** Undoes what a renderer did, e.g. removes listeners or observers. */
export type Cleanup = () => void;

export interface FenceContext {
  /** The fence's language, lowercased: `'mermaid'`. */
  language: string;
}

/**
 * Renders one fenced block into `target`, which the renderer owns until its
 * cleanup runs. `source` is the code inside the fence.
 */
export type FenceRenderer = (
  target: HTMLElement,
  source: string,
  context: FenceContext,
) => void | Cleanup | Promise<void | Cleanup>;

/** What a plugin's client module produces. */
export interface PluginClient {
  /** A renderer per fence language the plugin claims. */
  fences?: Record<string, FenceRenderer>;
}

/**
 * The default export of a plugin's client module. Called once, with the
 * options from the docs config, the first time one of its fences renders, so
 * heavy setup can wait until then.
 */
export type PluginClientFactory<Options = Record<string, unknown>> = (
  options: Options,
) => PluginClient | Promise<PluginClient>;

/** One plugin, as `createPluginRuntime` takes it. `generatePluginModule` writes these. */
export interface PluginRuntimeEntry {
  name: string;
  fences?: readonly string[];
  options?: unknown;
  /**
   * Imports the client module: `() => import('…/client')`. Typed with `any`
   * options so a client typed with its own options still fits.
   */
  load?: () => Promise<{ default: PluginClientFactory<any> }>;
}

export interface PluginRuntime {
  /** Every fence language some plugin claims, lowercased. */
  readonly fences: readonly string[];

  /**
   * Whether a plugin renders this fence language. Synchronous and loads
   * nothing, so a server render can use it to choose what to output.
   */
  hasFence(language: string): boolean;

  /**
   * The renderer for a fence language, loading its plugin's client module on
   * first use. Resolves to `undefined` when no plugin claims the language.
   */
  loadFence(language: string): Promise<FenceRenderer | undefined>;
}

export function createPluginRuntime(entries: readonly PluginRuntimeEntry[]): PluginRuntime {
  const owners = new Map<string, PluginRuntimeEntry>();
  for (const entry of entries) {
    for (const fence of entry.fences ?? []) {
      const language = fence.toLowerCase();
      const owner = owners.get(language);
      if (owner) {
        throw new Error(`The "${language}" fence is claimed by both "${owner.name}" and "${entry.name}"`);
      }
      owners.set(language, entry);
    }
  }

  const clients = new Map<PluginRuntimeEntry, Promise<PluginClient>>();
  const clientOf = (entry: PluginRuntimeEntry): Promise<PluginClient> => {
    let client = clients.get(entry);
    if (!client) {
      const { load } = entry;
      if (!load) {
        return Promise.reject(new Error(`Plugin "${entry.name}" claims fences but has no client module`));
      }
      client = load().then((module) => module.default(entry.options ?? {}));
      clients.set(entry, client);
      // Forget a failed load (a network blip, say) so the next fence retries.
      client.catch(() => clients.delete(entry));
    }
    return client;
  };

  return {
    fences: [...owners.keys()],

    hasFence: (language) => owners.has(language.toLowerCase()),

    async loadFence(language) {
      const key = language.toLowerCase();
      const entry = owners.get(key);
      if (!entry) return undefined;

      const client = await clientOf(entry);
      const renderer = Object.entries(client.fences ?? {}).find(([name]) => name.toLowerCase() === key)?.[1];
      if (!renderer) {
        throw new Error(`Plugin "${entry.name}" claims the "${key}" fence, but its client has no renderer for it`);
      }
      return renderer;
    },
  };
}

export interface MountFenceOptions {
  language: string;
  /** The code inside the fence. */
  source: string;
  /** Called once the plugin has rendered, e.g. to hide a fallback. */
  onRendered?: () => void;
  /**
   * Called when loading or rendering fails. Keep showing the fallback.
   * Defaults to `console.error`.
   */
  onError?: (error: unknown) => void;
}

/**
 * Render a fenced block into `target` with the plugin that claims its
 * language, and return a function that disposes of it.
 *
 * Call the dispose function when the block goes away. It is safe to call
 * before rendering has finished: a load that resolves afterwards renders
 * nothing, and a render that finishes afterwards is cleaned up at once. That
 * race is the part every framework adapter would otherwise get wrong on its
 * own. Does nothing when no plugin claims the language.
 */
export function mountFence(runtime: PluginRuntime, target: HTMLElement, options: MountFenceOptions): () => void {
  const { language, source, onRendered, onError = (error: unknown) => console.error(error) } = options;
  let disposed = false;
  let cleanup: Cleanup | undefined;

  void (async () => {
    try {
      const render = await runtime.loadFence(language);
      if (disposed || !render) return;

      const result = await render(target, source, { language: language.toLowerCase() });
      if (disposed) {
        if (typeof result === 'function') result();
        return;
      }
      if (typeof result === 'function') cleanup = result;
      onRendered?.();
    } catch (error) {
      if (!disposed) onError(error);
    }
  })();

  return () => {
    disposed = true;
    cleanup?.();
    cleanup = undefined;
  };
}
