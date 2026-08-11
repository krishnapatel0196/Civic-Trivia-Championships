export function CollectionCardSkeleton() {
  return (
    <div
      className="w-full sm:w-48 flex-shrink-0"
      style={{
        border: '2px solid #DDD5C3',
        borderRadius: '3px',
        overflow: 'hidden',
      }}
    >
      {/* Banner placeholder */}
      <div style={{
        height: '112px',
        background: '#DDD5C3',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />

      {/* Body placeholders */}
      <div style={{ background: '#F5EDD8', padding: '10px 12px 12px' }}>
        <div style={{
          height: '14px',
          background: '#DDD5C3',
          borderRadius: '2px',
          width: '70%',
          marginBottom: '8px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <div style={{
          height: '10px',
          background: '#DDD5C3',
          borderRadius: '2px',
          width: '100%',
          marginBottom: '5px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <div style={{
          height: '10px',
          background: '#DDD5C3',
          borderRadius: '2px',
          width: '55%',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}
