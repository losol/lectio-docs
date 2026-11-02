import type { LectioPlugin } from './types.js';

export type { JsonValue, LectioPlugin, ResolvedPlugin } from './types.js';
export { resolvePlugins } from './resolve.js';
export { generatePluginModule } from './codegen.js';
export type { GeneratePluginModuleOptions } from './codegen.js';

/** Type helper for a plugin's config half, like `defineDocsConfig`. */
export function definePlugin(plugin: LectioPlugin): LectioPlugin {
  return plugin;
}
