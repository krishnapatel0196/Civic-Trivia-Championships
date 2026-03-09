import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { QuestionTable, QuestionRow } from './components/QuestionTable';
import { QuestionDetailPanel } from './components/QuestionDetailPanel';
import { useTheme } from '../../hooks/useTheme';

const ADMIN_ACCENT = '#FF5740';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ExploreResponse {
  data: QuestionRow[];
  pagination: PaginationMeta;
}

export function QuestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken } = useAuthStore();
  const { C } = useTheme();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [questions, setQuestions] = useState<QuestionRow[] | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [pendingSelectFirst, setPendingSelectFirst] = useState(false);
  const [pendingSelectLast, setPendingSelectLast] = useState(false);

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) setSelectedQuestionId(id);
    }
  }, []);

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
  const sort = searchParams.get('sort') || 'quality_score';
  const order = searchParams.get('order') || 'asc';
  const collection = searchParams.get('collection') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const status = searchParams.get('status') ?? '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParam('search', debouncedSearch);
      if (debouncedSearch !== searchInput) updateParam('page', '1');
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!accessToken) return;
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        params.set('sort', sort);
        params.set('order', order);
        if (collection) params.set('collection', collection);
        if (difficulty) params.set('difficulty', difficulty);
        if (status) params.set('status', status);
        if (search) params.set('search', search);
        const flagged = searchParams.get('flagged') || '';
        if (flagged) params.set('flagged', flagged);

        const response = await fetch(`${API_URL}/api/admin/questions/explore?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data: ExploreResponse = await response.json();
        setQuestions(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [searchParams.toString(), accessToken]);

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
      newParams.set('order', 'asc');
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => updateParam('page', newPage.toString());
  const handleQuestionClick = (id: number, index: number) => { setSelectedQuestionId(id); setSelectedQuestionIndex(index); };

  useEffect(() => {
    if (!questions || questions.length === 0) return;
    if (pendingSelectFirst) {
      setSelectedQuestionIndex(0);
      setSelectedQuestionId(questions[0].id);
      setPendingSelectFirst(false);
    } else if (pendingSelectLast) {
      const lastIndex = questions.length - 1;
      setSelectedQuestionIndex(lastIndex);
      setSelectedQuestionId(questions[lastIndex].id);
      setPendingSelectLast(false);
    }
  }, [questions]);

  const handlePanelNavigate = (direction: 'prev' | 'next') => {
    if (!questions) return;
    if (direction === 'prev') {
      if (selectedQuestionIndex > 0) {
        const newIndex = selectedQuestionIndex - 1;
        setSelectedQuestionIndex(newIndex);
        setSelectedQuestionId(questions[newIndex].id);
      } else if (page > 1) {
        setPendingSelectLast(true);
        handlePageChange(page - 1);
      }
    } else {
      if (selectedQuestionIndex < questions.length - 1) {
        const newIndex = selectedQuestionIndex + 1;
        setSelectedQuestionIndex(newIndex);
        setSelectedQuestionId(questions[newIndex].id);
      } else if (pagination && page < pagination.totalPages) {
        setPendingSelectFirst(true);
        handlePageChange(page + 1);
      }
    }
  };

  const handlePanelClose = () => setSelectedQuestionId(null);

  const handleQuestionUpdated = (updated: {
    id: number;
    text: string;
    difficulty: string;
    qualityScore: number | null;
    violationCount: number;
    status: string;
  }) => {
    setQuestions((prev) => {
      if (!prev) return prev;
      return prev.map((q) => {
        if (q.id !== updated.id) return q;
        return {
          ...q,
          text: updated.text.length > 120 ? updated.text.substring(0, 120) + '...' : updated.text,
          difficulty: updated.difficulty,
          qualityScore: updated.qualityScore,
          violationCount: updated.violationCount,
          status: updated.status,
        };
      });
    });
  };

  const startItem = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${C.rule}`,
    borderRadius: '2px',
    backgroundColor: C.paper,
    color: C.ink,
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    outline: 'none',
  };

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '11px',
    letterSpacing: '0.14em',
    color: C.muted,
    marginBottom: '6px',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '0.06em', color: C.ink, margin: '0 0 8px 0' }}>
          Question Explorer
        </h1>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', fontSize: '13px', color: C.muted, margin: 0 }}>
          Browse, search, and inspect questions across all collections
        </p>
      </div>

      {/* Search */}
      <div>
        <label htmlFor="search" className="sr-only">Search questions</label>
        <input
          type="text"
          id="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search questions, answers, or explanations..."
          style={inputStyle}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="md:grid-cols-4">
        <div>
          <label htmlFor="collection" style={labelStyle}>COLLECTION</label>
          <select id="collection" value={collection} onChange={(e) => handleFilterChange('collection', e.target.value)} style={selectStyle}>
            <option value="">All collections</option>
            {collections.map((coll) => (
              <option key={coll.slug} value={coll.slug}>{coll.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="difficulty" style={labelStyle}>DIFFICULTY</label>
          <select id="difficulty" value={difficulty} onChange={(e) => handleFilterChange('difficulty', e.target.value)} style={selectStyle}>
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" style={labelStyle}>STATUS</label>
          <select id="status" value={status} onChange={(e) => handleFilterChange('status', e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Lora', Georgia, serif", fontSize: '13px', color: C.muted, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={searchParams.get('flagged') === 'true'}
              onChange={(e) => handleFilterChange('flagged', e.target.checked ? 'true' : '')}
              style={{ accentColor: ADMIN_ACCENT }}
            />
            Flagged only
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ border: `1px solid ${C.incorrect}`, borderRadius: '2px', padding: '12px 16px' }}>
          <p style={{ fontFamily: "'Lora', Georgia, serif", color: C.incorrect, margin: 0, fontSize: '13px' }}>{error}</p>
        </div>
      )}

      {/* Table */}
      <div style={{ border: `1px solid ${C.rule}`, borderRadius: '2px', overflow: 'hidden' }}>
        <QuestionTable
          questions={questions}
          sort={sort}
          order={order}
          onSortChange={handleSortChange}
          onQuestionClick={handleQuestionClick}
        />
      </div>

      {/* Pagination */}
      {pagination && (
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

      {/* Detail Panel */}
      <QuestionDetailPanel
        questionId={selectedQuestionId}
        onClose={handlePanelClose}
        onNavigate={handlePanelNavigate}
        hasPrev={selectedQuestionIndex > 0 || page > 1}
        hasNext={questions ? selectedQuestionIndex < questions.length - 1 || page < (pagination?.totalPages ?? 1) : false}
        onQuestionUpdated={handleQuestionUpdated}
      />
    </div>
  );
}
