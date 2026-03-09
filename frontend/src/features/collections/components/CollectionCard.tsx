import { useState } from 'react';
import type { CollectionSummary } from '../types';
import { useAuthStore } from '../../../store/authStore';
import { useTierColor } from '../../../hooks/useTierColor';

interface CollectionCardProps {
  collection: CollectionSummary;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function CollectionCard({ collection, isSelected, onSelect }: CollectionCardProps) {
  const user       = useAuthStore((state) => state.user);
  const isAdmin    = user?.tier === 'empowered';
  const [isHovered, setIsHovered] = useState(false);
  const tierColor  = useTierColor();

  const borderColor = isSelected
    ? tierColor
    : isHovered
    ? '#8B7A65'
    : '#C8BAA6';

  const shadow = isSelected
    ? `0 4px 20px ${tierColor}30`
    : isHovered
    ? '0 2px 10px rgba(23,18,14,0.08)'
    : '0 1px 4px rgba(23,18,14,0.06)';

  return (
    <button
      onClick={() => onSelect(collection.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isSelected}
      aria-label={`${collection.name}${isAdmin ? `, ${collection.questionCount} questions` : ''}${isSelected ? ', selected' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        flexShrink: 0,
        textAlign: 'left',
        background: 'none',
        padding: 0,
        cursor: 'pointer',
        outline: 'none',
        borderRadius: '3px',
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        boxShadow: shadow,
        transform: isSelected ? 'scale(1.03)' : isHovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
      }}
      className=""
    >
      {/* Banner image */}
      <div
        style={{
          height: '112px',
          overflow: 'hidden',
          backgroundColor: collection.themeColor,
        }}
      >
        <img
          src={`/images/collections/${collection.slug}.jpg`}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
          loading="lazy"
        />
      </div>

      {/* Card body */}
      <div style={{
        background: '#F5EDD8',
        padding: '10px 12px 12px',
        borderTop: `1px solid ${borderColor}`,
        transition: 'border-color 0.15s',
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '15px',
          letterSpacing: '0.08em',
          color: '#17120E',
          lineHeight: 1.1,
        }}>
          {collection.name}
        </div>
        <div style={{
          fontFamily: "'Lora', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '11px',
          color: '#7A6A5A',
          marginTop: '5px',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '48px',
        }}>
          {collection.description}
        </div>
        {isAdmin && (
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#9A8878',
            marginTop: '6px',
          }}>
            {collection.questionCount} QUESTIONS
          </div>
        )}
      </div>

      {/* Selected indicator — civic red square badge */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          background: tierColor,
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg style={{ width: '11px', height: '11px', color: '#FFFFFF' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}
