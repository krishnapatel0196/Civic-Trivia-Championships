import { useState } from 'react';
import type { CollectionSummary } from '../types';
import { useAuthStore } from '../../../store/authStore';
import { formatFreshness } from '../../../utils/formatFreshness';
import { useTheme } from '../../../hooks/useTheme';

interface CollectionCardProps {
  collection: CollectionSummary;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function CollectionCard({ collection, isSelected, onSelect }: CollectionCardProps) {
  const user       = useAuthStore((state) => state.user);
  const isAdmin    = user?.tier === 'empowered';
  const [isHovered, setIsHovered] = useState(false);
  const { darkMode } = useTheme();

  const borderColor = isSelected
    ? '#B8A020'
    : isHovered
    ? '#2A8A9A'
    : darkMode ? '#1A3A50' : '#1A6A7A';

  const shadow = isSelected
    ? '0 4px 20px rgba(184,160,32,0.35)'
    : isHovered
    ? '0 2px 12px rgba(30,120,140,0.25)'
    : darkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(26,106,122,0.12)';

  const cardBodyBg   = darkMode ? '#0D1C2C' : '#FFFFFF';
  const cardTitleColor = darkMode ? '#E8F4FF' : '#17120E';
  const cardDescColor  = darkMode ? '#5A8AAA' : '#5A7A8A';
  const cardMetaColor  = darkMode ? '#3A6A80' : '#7A9AAA';

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
        background: cardBodyBg,
        padding: '10px 12px 12px',
        height: '96px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderTop: `1px solid ${borderColor}`,
        transition: 'border-color 0.15s, background 0.2s',
      }}>
        <div style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '0.01em',
          color: cardTitleColor,
          lineHeight: 1.2,
        }}>
          {collection.name}
        </div>
        <div style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 400,
          fontSize: '11px',
          color: cardDescColor,
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
            fontFamily: "'Manrope', sans-serif",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: cardMetaColor,
            marginTop: '6px',
          }}>
            {collection.questionCount} QUESTIONS
          </div>
        )}
        {collection.tier === 'international' && collection.latestQuestionAt && (
          <div style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: cardMetaColor,
            marginTop: '6px',
          }}>
            {formatFreshness(collection.latestQuestionAt)}
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
          background: '#B8A020',
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
