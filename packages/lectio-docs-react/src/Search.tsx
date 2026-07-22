'use client';

import {
  CommandPalette,
  type CommandPaletteItem,
} from '@eventuras/ratio-ui/core/CommandPalette';

import type { SearchProvider, SearchResult } from '@eventuras/lectio-docs/search';
import { useDocsSearch } from './use-docs-search.js';

interface SearchProps {
  /** Search provider instance (e.g. OramaProvider) */
  provider: SearchProvider;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Custom navigation handler for SPA routers (e.g. Next.js router.push) */
  onNavigate?: (url: string) => void;
}

function toItems(results: SearchResult[]): CommandPaletteItem[] {
  return results.map((r) => ({
    id: r.url,
    title: r.title,
    descriptionHtml: r.excerptHtml,
  }));
}

/**
 * Full-text search rendered via the ratio-ui CommandPalette.
 *
 * A thin wrapper over {@link useDocsSearch} — swap this component to render the
 * same search logic with a different design system.
 */
export function Search({ provider, placeholder = 'Search...', onNavigate }: Readonly<SearchProps>) {
  const { results, error, onQueryChange, onSelect } = useDocsSearch({ provider, onNavigate });

  return (
    <>
      <CommandPalette
        items={toItems(results)}
        onSelect={(item) => onSelect(item.id)}
        onQueryChange={onQueryChange}
        placeholder={placeholder}
      />
      {/* Surface provider failures so a broken index is distinguishable from a
          query with no matches — same contract as the hook's error field. The
          message makes failures diagnosable without opening the console. */}
      {error && (
        <p role="alert">
          {error.message ? `Search is unavailable: ${error.message}` : 'Search is unavailable.'}
        </p>
      )}
    </>
  );
}
