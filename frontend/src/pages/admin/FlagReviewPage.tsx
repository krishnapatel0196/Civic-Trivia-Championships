import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../services/api';
import { FlaggedQuestionsTable, FlaggedQuestionRow } from './components/FlaggedQuestionsTable';
import { FlagDetailPanel } from './components/FlagDetailPanel';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useTheme } from '../../hooks/useTheme';

const ADMIN_ACCENT = '#FF5740';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FlagResponse {
  data: FlaggedQuestionRow[];
  pagination: PaginationMeta;
}

export function FlagReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken } = useAuthStore();
  const { C } = useTheme();

  const [questions, setQuestions] = useState<FlaggedQuestionRow[] | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [collections, setCollections] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch(`${API_URL}/api/admin/collections/health`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          const list = data.collections || data;
          setCollections(list.map((c: any) => ({ name: c.name, slug: c.slug })));
        }
      } catch { /* ignore */ }
    };
    fetchCollections();
  }, [accessToken]);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const sort = searchParams.get('sort') || 'flag_count';
  const order = searchParams.get('order') || 'desc';
  const collection = searchParams.get('collection') || '';
  const tab = searchParams.get('tab') || 'active';
  const questionId = searchParams.get('questionId') || '';

  useEffect(() => {
    const fetchFlags = async () => {
      if (!accessToken) return;
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        params.set('sort', sort);
        params.set('order', order);
        params.set('tab', tab);
        if (collection) params.set('collection', collection);
        if (questionId) params.set('questionId', questionId);

        const response = await fetch(`${API_URL}/api/admin/flags?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('Failed to fetch flagged questions');
        const data: FlagResponse = await response.json();
        setQuestions(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setQuestions([]);
      }
    };
    fetchFlags();
  }, [searchParams.toString(), accessToken, refreshKey]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value); else newParams.delete(key);
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value); else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (column: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (sort === column) {
      newParams.set('order', order === 'asc' ? 'desc' : 'asc');
    } else {
      newParams.set('sort', column);
      newParams.set('order', column === 'flag_count' ? 'desc' : 'asc');
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => updateParam('page', newPage.toString());
  const handleQuestionClick = (id: number) => setSelectedQuestionId(id);

  const handleTabChange = (index: number) => {
    const newTab = index === 1 ? 'archived' : 'active';
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const startItem = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;
  const selectedIndex = tab === 'archived' ? 1 : 0;

  const handleQuestionArchived = (id: number) => { setQuestions((prev) => prev?.filter((q) => q.id !== id) || null); setSelectedQuestionId(null); };
  const handleFlagsDismissed = (id: number) => { setQuestions((prev) => prev?.filter((q) => q.id !== id) || null); setSelectedQuestionId(null); };
  const handleQuestionRestored = (id: number) => { setQuestions((prev) => prev?.filter((q) => q.id !== id) || null); setSelectedQuestionId(null); };
  const handleRefreshNeeded = () => setRefreshKey((prev) => prev + 1);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${C.rule}`,
    borderRadius: '2px',
    backgroundColor: C.paper,
    color: C.ink,
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '13px',
    outline: 'none',
  };

  const btnPage: React.CSSProperties = {
    padding: '6px 14px',
    backgroundColor: 'transparent',
    color: C.muted,
    border: `1px solid ${C.rule}`,
    borderRadius: '2px',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '12px',
    letterSpacing: '0.1em',
    cursor: 'pointer',
  };

  const TabPanelContent = ({ tabKey }: { tabKey: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {questionId && (
        <div style={{ border: `1px solid ${C.rule}`, borderRadius: '2px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.ink }}>
            Showing flags for Question #{questionId}
          </span>
          <button
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('questionId');
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '12px', letterSpacing: '0.1em', color: ADMIN_ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            CLEAR FILTER
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="md:grid-cols-3">
        <div>
          <label htmlFor={`collection-${tabKey}`} style={{ display: 'block', fontFamily: "'Bebas Neue', sans-serif", fontSize: '11px', letterSpacing: '0.14em', color: C.muted, marginBottom: '6px' }}>
            COLLECTION
          </label>
          <select id={`collection-${tabKey}`} value={collection} onChange={(e) => handleFilterChange('collection', e.target.value)} style={selectStyle}>
            <option value="">All collections</option>
            {collections.map((coll) => (
              <option key={coll.slug} value={coll.slug}>{coll.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ border: `1px solid ${C.incorrect}`, borderRadius: '2px', padding: '12px 16px' }}>
          <p style={{ fontFamily: "'Lora', Georgia, serif", color: C.incorrect, margin: 0, fontSize: '13px' }}>{error}</p>
        </div>
      )}

      <div style={{ border: `1px solid ${C.rule}`, borderRadius: '2px', overflow: 'hidden' }}>
        {questions && questions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px' }}>
            <svg width="40" height="40" style={{ color: C.mutedFg, marginBottom: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', color: C.muted, textAlign: 'center', margin: 0 }}>
              {tabKey === 'active' ? "No flagged questions -- players haven't flagged anything yet" : 'No archived flagged questions'}
            </p>
          </div>
        ) : (
          <FlaggedQuestionsTable
            questions={questions}
            sort={sort}
            order={order}
            onSortChange={handleSortChange}
            onQuestionClick={handleQuestionClick}
          />
        )}
      </div>

      {pagination && pagination.total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.muted }}>
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{pagination.total}</strong> results
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} style={{ ...btnPage, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>PREV</button>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '12px', letterSpacing: '0.1em', color: C.muted }}>{pagination.page} / {pagination.totalPages}</span>
            <button onClick={() => handlePageChange(page + 1)} disabled={page === pagination.totalPages} style={{ ...btnPage, opacity: page === pagination.totalPages ? 0.4 : 1, cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer' }}>NEXT</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '0.06em', color: C.ink, margin: '0 0 8px 0' }}>
          Flag Review
        </h1>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', fontSize: '13px', color: C.muted, margin: 0 }}>
          Review and triage player-flagged questions
        </p>
      </div>

      {/* Tabs */}
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        <TabList style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `1px solid ${C.rule}` }}>
          {['Active', 'Archived'].map((label, idx) => (
            <Tab
              key={label}
              style={{
                padding: '10px 24px',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '13px',
                letterSpacing: '0.12em',
                background: 'none',
                border: 'none',
                borderBottom: selectedIndex === idx ? `3px solid ${ADMIN_ACCENT}` : '3px solid transparent',
                color: selectedIndex === idx ? ADMIN_ACCENT : C.muted,
                cursor: 'pointer',
                marginBottom: '-1px',
                outline: 'none',
              }}
            >
              {label.toUpperCase()}
            </Tab>
          ))}
        </TabList>

        <TabPanels style={{ marginTop: '24px' }}>
          <TabPanel><TabPanelContent tabKey="active" /></TabPanel>
          <TabPanel><TabPanelContent tabKey="archived" /></TabPanel>
        </TabPanels>
      </TabGroup>

      <FlagDetailPanel
        questionId={selectedQuestionId}
        onClose={() => setSelectedQuestionId(null)}
        onQuestionArchived={handleQuestionArchived}
        onFlagsDismissed={handleFlagsDismissed}
        onQuestionRestored={handleQuestionRestored}
        onRefreshNeeded={handleRefreshNeeded}
      />
    </div>
  );
}
