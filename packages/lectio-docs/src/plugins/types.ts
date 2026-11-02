/** A value that survives JSON — what plugin options are limited to. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * A plugin, as declared in the docs config.
 *
 * The config is read in Node; rendering happens wherever the host renders,
 * often in a bundled browser app. Functions can't cross that line, so a plugin
 * is plain data: the fence languages it renders, and the module specifier of
 * its browser half. The host imports that module like any other, which also
 * lets its bundler split it out of pages that don't need it.
 *
 * Nothing here is tied to a framework. The browser half renders into a plain
 * element (see `@eventuras/lectio-docs/plugins/runtime`), and each host adapts
 * that to its own components.
 */
export interface LectioPlugin {
  /** Unique among the configured plugins, e.g. `'mermaid'`. */
  name: string;

  /**
   * Fenced code block languages this plugin renders: `['mermaid']` claims
   * every block fenced as mermaid. Matched case-insensitively. Two plugins
   * may not claim the same language.
   */
  fences?: string[];

  /** The browser half. Required when the plugin claims any fences. */
  client?: {
    /**
     * Module specifier the host imports, e.g.
     * `'@eventuras/lectio-plugin-mermaid/client'`. Its default export is a
     * `PluginClientFactory`, called once with `options`.
     */
    module: string;

    /**
     * Passed to the client factory. Copied from the config into generated
     * code, so it must survive JSON: strings, numbers, booleans, null, arrays
     * and plain objects. Properties set to `undefined` are dropped.
     */
    options?: object;
  };
}

/** A plugin after {@link resolvePlugins}: validated, normalized, serializable. */
export interface ResolvedPlugin {
  name: string;
  /** Lowercased, without duplicates. */
  fences: string[];
  client?: {
    module: string;
    options: { [key: string]: JsonValue };
  };
}
