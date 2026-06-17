import { useState } from 'react';
import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';
import { CollectionCardSkeleton } from './CollectionCardSkeleton';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTheme } from '../../../hooks/useTheme';

interface CollectionPickerProps {
  collections: CollectionSummary[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
}

function getCategory(collection: CollectionSummary): 'local' | 'state' | 'federal' | 'international' {
  if (collection.tier === 'federal') return 'federal';
  if (collection.tier === 'state') return 'state';
  if (collection.tier === 'international') return 'international';
  return 'local';
}

const GROUP_LABELS: Record<string, string> = {
  local:         'Local',
  state:         'State',
  federal:       'Federal',
  international: 'International',
};

export function CollectionPicker({ collections, selectedId, loading, onSelect }: CollectionPickerProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150);
  const { C, darkMode } = useTheme();
  const isFiltering = debouncedQuery.trim().length > 0;
  const filtered = isFiltering
    ? collections.filter(c => c.name.toLowerCase().includes(debouncedQuery.trim().toLowerCase()))
    : [];

  if (!loading && collections.length === 0) return null;

  const grouped = (['local', 'state', 'federal', 'international'] as const)
    .map((category) => ({
      category,
      label: GROUP_LABELS[category],
      collections: collections
        .filter((c) => getCategory(c) === category)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.collections.length > 0);

  return (
    <div>
      {/* Section heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <span style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.10em',
          fontSize: '12px',
          color: C.muted,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase' as const,
        }}>
          CHOOSE YOUR COLLECTION
        </span>
        <div style={{ flex: 1, borderTop: `1px solid ${C.rule}` }} />
      </div>

      {loading ? (
        <div className="flex flex-col sm:flex-row gap-3 pb-2">
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
        </div>
      ) : (
        <div>
          <input
            type="search"
            placeholder="Search collections..."
            aria-label="Search collections"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box' as const,
              padding: '8px 12px',
              fontFamily: "'Manrope', sans-serif",
              fontSize: '14px',
              color: C.ink,
              background: darkMode ? '#0D1C2C' : '#FFFFFF',
              border: '1px solid #B8A020',
              borderRadius: '3px',
              outline: 'none',
              marginBottom: '20px',
            }}
          />

          {isFiltering ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
              {filtered.length === 0 ? (
                <p style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: C.mutedFg,
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '14px',
                  padding: '20px 0',
                  margin: 0,
                }}>
                  No collections match &ldquo;{debouncedQuery}&rdquo;
                </p>
              ) : (
                filtered.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    isSelected={selectedId === collection.id}
                    onSelect={onSelect}
                  />
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '8px' }}>
              {grouped.map(({ category, label, collections: group }) => (
                <div key={category}>
                  {/* Category label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      fontSize: '11px',
                      color: C.mutedFg,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase' as const,
                    }}>
                      {label}
                    </span>
                    <div style={{ flex: 1, borderTop: `1px solid ${C.ruleLight}` }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '12px' }}>
                    {group.map((collection) => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                        isSelected={selectedId === collection.id}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
