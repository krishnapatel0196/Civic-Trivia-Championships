import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';
import { CollectionCardSkeleton } from './CollectionCardSkeleton';

interface CollectionPickerProps {
  collections: CollectionSummary[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
}

function getCategory(slug: string): 'local' | 'state' | 'federal' {
  if (slug === 'federal') return 'federal';
  if (slug.endsWith('-state')) return 'state';
  return 'local';
}

const GROUP_LABELS: Record<string, string> = {
  local: 'Local',
  state: 'State',
  federal: 'Federal',
};

export function CollectionPicker({ collections, selectedId, loading, onSelect }: CollectionPickerProps) {
  // Don't render if empty and not loading
  if (!loading && collections.length === 0) {
    return null;
  }

  // Group and sort collections by category
  const grouped = (['local', 'state', 'federal'] as const)
    .map((category) => ({
      category,
      label: GROUP_LABELS[category],
      collections: collections
        .filter((c) => getCategory(c.slug) === category)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.collections.length > 0);

  return (
    <div>
      {/* Section heading */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Choose Your Collection
      </h2>

      {loading ? (
        /* Skeleton placeholders during loading */
        <div className="flex flex-col sm:flex-row gap-3 pb-2">
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
        </div>
      ) : (
        /* Grouped rows: Local → State → Federal */
        <div className="flex flex-col gap-6 pb-2">
          {grouped.map(({ category, label, collections: group }) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {label}
              </h3>
              <div className="flex flex-wrap gap-3">
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
