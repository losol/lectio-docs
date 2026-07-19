export { Search } from './Search.js';
export { useDocsSearch } from './use-docs-search.js';
export type { UseDocsSearchOptions, UseDocsSearchResult } from './use-docs-search.js';

// Re-exported for convenience so consumers of the React bindings don't also
// have to reach into `@eventuras/lectio-docs/search` for the provider contract.
export type { SearchProvider, SearchResult } from '@eventuras/lectio-docs/search';
