import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';
import { CollectionCardSkeleton } from './CollectionCardSkeleton';

interface CollectionPickerProps {
  collections: CollectionSummary[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
}

function getCategory(collection: CollectionSummary): 'local' | 'state' | 'federal' {
  if (collection.tier === 'federal') return 'federal';
  if (collection.tier === 'state') return 'state';
  return 'local';
}

const GROUP_LABELS: Record<string, string> = {
  local:   'Local',
  state:   'State',
  federal: 'Federal',
};

export function CollectionPicker({ collections, selectedId, loading, onSelect }: CollectionPickerProps) {
  if (!loading && collections.length === 0) return null;

  const grouped = (['local', 'state', 'federal'] as const)
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
          fontFamily: "'Bebas Neue', sans-serif",
          letterSpacing: '0.22em',
          fontSize: '14px',
          color: '#7A6A5A',
          whiteSpace: 'nowrap',
        }}>
          CHOOSE YOUR COLLECTION
        </span>
        <div style={{ flex: 1, borderTop: '1px solid #C8BAA6' }} />
      </div>

      {loading ? (
        <div className="flex flex-col sm:flex-row gap-3 pb-2">
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '8px' }}>
          {grouped.map(({ category, label, collections: group }) => (
            <div key={category}>
              {/* Category label with rule */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.18em',
                  fontSize: '13px',
                  color: '#9A8878',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
                <div style={{ flex: 1, borderTop: '1px solid #DDD5C3' }} />
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
  );
}
