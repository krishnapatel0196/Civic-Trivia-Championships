import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../services/api';
import { FlaggedQuestionsTable, FlaggedQuestionRow } from './components/FlaggedQuestionsTable';
import { FlagDetailPanel } from './components/FlagDetailPanel';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

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

  // Data state
  const [questions, setQuestions] = useState<FlaggedQuestionRow[] | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Detail panel state
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  // Refresh trigger for re-fetching after errors
  const [refreshKey, setRefreshKey] = useState(0);

  // Collections list (fetched from API)
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

  // Get current filter values from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const sort = searchParams.get('sort') || 'flag_count';
  const order = searchParams.get('order') || 'desc';
  const collection = searchParams.get('collection') || '';
  const tab = searchParams.get('tab') || 'active';

  // Fetch data when URL params change
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

        const response = await fetch(
          `${API_URL}/api/admin/flags?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch flagged questions');
        }

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

  // Helper to update a single URL param
  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Handle filter changes (set filter + reset to page 1 in one update)
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle sort change (set sort + order in one update)
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

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateParam('page', newPage.toString());
  };

  // Handle question click (detail panel wired in Plan 03)
  const handleQuestionClick = (id: number) => {
    setSelectedQuestionId(id);
  };

  // Handle tab change
  const handleTabChange = (index: number) => {
    const newTab = index === 1 ? 'archived' : 'active';
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Calculate pagination display
  const startItem = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;

  // Sync tab with URL
  const selectedIndex = tab === 'archived' ? 1 : 0;

  // Detail panel callbacks
  const handleQuestionArchived = (id: number) => {
    setQuestions((prev) => prev?.filter((q) => q.id !== id) || null);
    setSelectedQuestionId(null);
  };

  const handleFlagsDismissed = (id: number) => {
    setQuestions((prev) => prev?.filter((q) => q.id !== id) || null);
    setSelectedQuestionId(null);
  };

  const handleQuestionRestored = (id: number) => {
    setQuestions((prev) => prev?.filter((q) => q.id !== id) || null);
    setSelectedQuestionId(null);
  };

  const handleRefreshNeeded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Flag Review</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and triage player-flagged questions
        </p>
      </div>

      {/* Tabs */}
      <TabGroup selectedIndex={selectedIndex} onChange={handleTabChange}>
        <TabList className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          <Tab className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 data-[selected]:bg-white data-[selected]:text-red-900 data-[selected]:shadow-sm data-[hover]:text-gray-900">
            Active
          </Tab>
          <Tab className="w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 data-[selected]:bg-white data-[selected]:text-red-900 data-[selected]:shadow-sm data-[hover]:text-gray-900">
            Archived
          </Tab>
        </TabList>

        <TabPanels className="mt-6">
          {/* Active Tab */}
          <TabPanel className="space-y-6">
            {/* Collection Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="collection"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Collection
                </label>
                <select
                  id="collection"
                  value={collection}
                  onChange={(e) => handleFilterChange('collection', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All collections</option>
                  {collections.map((coll) => (
                    <option key={coll.slug} value={coll.slug}>
                      {coll.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {questions && questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                    />
                  </svg>
                  <p className="text-gray-600 text-center">
                    No flagged questions -- players haven't flagged anything yet
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

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startItem}</span> to{' '}
                  <span className="font-medium">{endItem}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </TabPanel>

          {/* Archived Tab */}
          <TabPanel className="space-y-6">
            {/* Collection Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="collection-archived"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Collection
                </label>
                <select
                  id="collection-archived"
                  value={collection}
                  onChange={(e) => handleFilterChange('collection', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All collections</option>
                  {collections.map((coll) => (
                    <option key={coll.slug} value={coll.slug}>
                      {coll.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {questions && questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                    />
                  </svg>
                  <p className="text-gray-600 text-center">
                    No archived flagged questions
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

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startItem}</span> to{' '}
                  <span className="font-medium">{endItem}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Flag Detail Panel */}
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
