import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { API_URL } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface Candidate {
  name: string;
  party: string;
  incumbent: boolean;
}

interface ElectionRace {
  id: number;
  seat: string;
  electionType: string;
  electionDate: string;
  timezone: string;
  jurisdiction: string;
  candidates: Candidate[];
  questionsGenerated: boolean;
  followupGenerated: boolean;
  result: string | null;
  createdAt: string;
}

interface RaceWithCount extends ElectionRace {
  questionCount: number;
}

interface CronLastRun {
  timestamp: string;
  racesDetected: number;
  processed: number;
  failures: number;
}

interface ClassifiedData {
  activeElections: RaceWithCount[];
  pendingGeneration: RaceWithCount[];
  awaitingFollowup: RaceWithCount[];
  cronLastRun: CronLastRun | null;
}

const ELECTION_TYPE_LABELS: Record<string, string> = {
  primary: 'Primary',
  general: 'General',
  runoff: 'Runoff',
  'by-election': 'By-Election',
};

function emptyCandidate(): Candidate {
  return { name: '', party: '', incumbent: false };
}

function emptyForm() {
  return {
    seat: '',
    electionType: 'general' as string,
    electionDate: '',
    jurisdiction: '',
    timezone: '',
    candidates: [emptyCandidate()],
  };
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ElectionsPage() {
  const { accessToken } = useAuthStore();

  // Classified data
  const [activeElections, setActiveElections] = useState<RaceWithCount[]>([]);
  const [pendingGeneration, setPendingGeneration] = useState<RaceWithCount[]>([]);
  const [awaitingFollowup, setAwaitingFollowup] = useState<RaceWithCount[]>([]);
  const [cronLastRun, setCronLastRun] = useState<CronLastRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Collections (for dropdown)
  const [collections, setCollections] = useState<{ id: number; name: string; slug: string }[]>([]);
  useEffect(() => {
    if (!accessToken) return;
    fetch(`${API_URL}/api/admin/collections`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => setCollections(data.collections ?? []))
      .catch(() => {});
  }, [accessToken]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Generation state (pending tab)
  const [generatingRaceId, setGeneratingRaceId] = useState<number | null>(null);
  const [genCollectionSlug, setGenCollectionSlug] = useState('');
  const [showCollectionPrompt, setShowCollectionPrompt] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<{
    questionsCreated: number;
    archived: number;
    collectionSlug: string;
    jurisdiction: string;
  } | null>(null);
  const [genError, setGenError] = useState<{
    type: 'blocked' | 'error';
    message: string;
    existingCount?: number;
    generatedAt?: string | null;
  } | null>(null);

  // Edit race state
  const [editingRace, setEditingRace] = useState<RaceWithCount | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete race state
  const [deletingRace, setDeletingRace] = useState<RaceWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Re-generate state (active tab)
  const [regenRace, setRegenRace] = useState<RaceWithCount | null>(null);
  const [regenCounts, setRegenCounts] = useState<{ activeCount: number; draftCount: number } | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);

  // Enter result state (awaiting followup tab)
  const [resultRace, setResultRace] = useState<RaceWithCount | null>(null);
  const [resultForm, setResultForm] = useState({ winnerName: '', termEndDate: '', collectionSlug: '' });
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  const fetchClassified = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races/classified`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ClassifiedData = await res.json();
      setActiveElections(data.activeElections || []);
      setPendingGeneration(data.pendingGeneration || []);
      setAwaitingFollowup(data.awaitingFollowup || []);
      setCronLastRun(data.cronLastRun || null);
    } catch (err) {
      setError('Failed to load election races.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassified();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Create form helpers ----
  const updateCandidate = (index: number, field: keyof Candidate, value: string | boolean) => {
    setForm((prev) => {
      const updated = [...prev.candidates];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, candidates: updated };
    });
  };

  const addCandidate = () => {
    setForm((prev) => ({ ...prev, candidates: [...prev.candidates, emptyCandidate()] }));
  };

  const removeCandidate = (index: number) => {
    setForm((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSubmitting(true);
    setSubmitError(null);
    const electionDateISO = form.electionDate ? `${form.electionDate}T00:00:00.000Z` : '';
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          seat: form.seat,
          electionType: form.electionType,
          electionDate: electionDateISO,
          timezone: form.timezone,
          jurisdiction: form.jurisdiction,
          candidates: form.candidates.filter((c) => c.name.trim() !== ''),
        }),
      });
      if (res.status === 201) {
        await fetchClassified();
        setForm(emptyForm());
        setShowForm(false);
        showToast('Election race created.');
      } else {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to create election race.');
      }
    } catch (err) {
      setSubmitError('Network error — could not create election race.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Generate questions (pending tab) ----
  const handleGenerate = (race: RaceWithCount) => {
    setGeneratingRaceId(race.id);
    const matched = collections.find(c => c.name === race.jurisdiction);
    setGenCollectionSlug(matched?.slug ?? '');
    setShowCollectionPrompt(true);
  };

  const startGeneration = async (raceId: number, collectionSlug: string, force: boolean = false) => {
    setShowCollectionPrompt(false);
    setGenLoading(true);
    setGenResult(null);
    setGenError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/election-races/${raceId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ collectionSlug, force }),
      });
      const data = await response.json();
      if (response.ok) {
        setGenResult(data);
        fetchClassified();
      } else if (response.status === 409) {
        setGenError({ type: 'blocked', message: data.message, existingCount: data.existingCount, generatedAt: data.generatedAt });
      } else {
        setGenError({ type: 'error', message: data.detail || data.error || 'Failed to generate questions' });
      }
    } catch {
      setGenError({ type: 'error', message: 'Network error — please try again' });
    } finally {
      setGenLoading(false);
    }
  };

  // ---- Edit race (pending tab) ----
  const openEditModal = (race: RaceWithCount) => {
    setEditingRace(race);
    setEditForm({
      seat: race.seat,
      electionType: race.electionType,
      electionDate: race.electionDate.split('T')[0],
      jurisdiction: race.jurisdiction,
      timezone: race.timezone,
      candidates: race.candidates.length > 0 ? race.candidates.map(c => ({ ...c })) : [emptyCandidate()],
    });
    setEditError(null);
  };

  const updateEditCandidate = (index: number, field: keyof Candidate, value: string | boolean) => {
    setEditForm((prev) => {
      const updated = [...prev.candidates];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, candidates: updated };
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRace || !accessToken) return;
    setEditSubmitting(true);
    setEditError(null);
    const electionDateISO = editForm.electionDate ? `${editForm.electionDate}T00:00:00.000Z` : '';
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races/${editingRace.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          seat: editForm.seat,
          electionType: editForm.electionType,
          electionDate: electionDateISO,
          timezone: editForm.timezone,
          jurisdiction: editForm.jurisdiction,
          candidates: editForm.candidates.filter((c) => c.name.trim() !== ''),
        }),
      });
      if (res.ok) {
        await fetchClassified();
        setEditingRace(null);
        showToast('Race updated successfully.');
      } else {
        const data = await res.json();
        setEditError(data.error || 'Failed to update race.');
      }
    } catch {
      setEditError('Network error — could not update race.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ---- Delete race (pending tab) ----
  const handleDeleteConfirm = async () => {
    if (!deletingRace || !accessToken) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races/${deletingRace.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await fetchClassified();
        setDeletingRace(null);
        showToast('Race deleted.');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete race.', 'error');
        setDeletingRace(null);
      }
    } catch {
      showToast('Network error — could not delete race.', 'error');
      setDeletingRace(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ---- Re-generate (active tab) ----
  const handleRegenClick = async (race: RaceWithCount) => {
    setRegenRace(race);
    setRegenCounts(null);
    setRegenConfirmOpen(true);
    // Fetch question counts
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races/${race.id}/question-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRegenCounts({ activeCount: data.activeCount ?? 0, draftCount: data.draftCount ?? 0 });
      }
    } catch {
      // Counts failed — modal still opens, just won't show counts
    }
  };

  const handleRegenConfirm = async () => {
    if (!regenRace || !accessToken) return;
    setRegenLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races/${regenRace.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        await fetchClassified();
        setRegenConfirmOpen(false);
        setRegenRace(null);
        showToast(`Re-generated ${data.questionsCreated ?? 0} questions for ${regenRace.jurisdiction}.`);
      } else {
        showToast(data.error || 'Failed to re-generate questions.', 'error');
        setRegenConfirmOpen(false);
        setRegenRace(null);
      }
    } catch {
      showToast('Network error — could not re-generate.', 'error');
      setRegenConfirmOpen(false);
      setRegenRace(null);
    } finally {
      setRegenLoading(false);
    }
  };

  // ---- Enter result (awaiting followup tab) ----
  const openResultModal = (race: RaceWithCount) => {
    setResultRace(race);
    const matched = collections.find(c => c.name === race.jurisdiction);
    setResultForm({ winnerName: '', termEndDate: '', collectionSlug: matched?.slug ?? '' });
    setResultError(null);
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultRace || !accessToken) return;
    setResultLoading(true);
    setResultError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races/${resultRace.id}/enter-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          winnerName: resultForm.winnerName,
          termEndDate: resultForm.termEndDate,
          collectionSlug: resultForm.collectionSlug,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchClassified();
        setResultRace(null);
        showToast(`${data.questionsCreated ?? 0} current-term questions created for ${resultRace.jurisdiction}.`);
      } else if (res.status === 409) {
        setResultError('Current-term questions already generated for this race.');
      } else {
        setResultError(data.error || 'Failed to enter result.');
      }
    } catch {
      setResultError('Network error — please try again.');
    } finally {
      setResultLoading(false);
    }
  };

  // Derived
  const selectedRaceForGen = [...activeElections, ...pendingGeneration, ...awaitingFollowup].find(r => r.id === generatingRaceId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Election Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage election races and lifecycle actions. Races are entered manually.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setSubmitError(null); }}
          className="inline-flex items-center px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Election Race'}
        </button>
      </div>

      {/* Cron last-run banner */}
      {cronLastRun ? (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-blue-800 font-medium">Cron last ran {formatRelativeTime(cronLastRun.timestamp)}</span>
          <span className="text-blue-600">— {cronLastRun.racesDetected} race{cronLastRun.racesDetected !== 1 ? 's' : ''} detected, {cronLastRun.processed} processed
            {cronLastRun.failures > 0 && <span className="text-amber-600 font-medium">, {cronLastRun.failures} failure{cronLastRun.failures !== 1 ? 's' : ''}</span>}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
          Cron: No runs recorded since last server restart
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Election Race</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Seat + Election Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seat Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mayor of Bloomington"
                  value={form.seat}
                  onChange={(e) => setForm((p) => ({ ...p, seat: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Election Type <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={form.electionType}
                  onChange={(e) => setForm((p) => ({ ...p, electionType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                >
                  <option value="general">General</option>
                  <option value="primary">Primary</option>
                  <option value="runoff">Runoff</option>
                  <option value="by-election">By-Election</option>
                </select>
              </div>
            </div>

            {/* Row 2: Date + Jurisdiction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Election Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.electionDate}
                  onChange={(e) => setForm((p) => ({ ...p, electionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jurisdiction <span className="text-red-600">*</span>
                </label>
                {collections.length > 0 ? (
                  <select
                    required
                    value={form.jurisdiction}
                    onChange={(e) => setForm((p) => ({ ...p, jurisdiction: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">— select a collection —</option>
                    {collections.map(c => (
                      <option key={c.slug} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bloomington, IN"
                    value={form.jurisdiction}
                    onChange={(e) => setForm((p) => ({ ...p, jurisdiction: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {/* Row 3: Timezone */}
            <div className="max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., America/Indiana/Indianapolis"
                value={form.timezone}
                onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Candidates section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Candidates</label>
                <button
                  type="button"
                  onClick={addCandidate}
                  className="text-xs text-red-700 hover:text-red-900 font-medium underline"
                >
                  + Add Candidate
                </button>
              </div>
              <div className="space-y-2">
                {form.candidates.map((candidate, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <input
                      type="text"
                      placeholder="Full name"
                      value={candidate.name}
                      onChange={(e) => updateCandidate(idx, 'name', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <input
                      type="text"
                      placeholder="Party"
                      value={candidate.party}
                      onChange={(e) => updateCandidate(idx, 'party', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={candidate.incumbent}
                        onChange={(e) => updateCandidate(idx, 'incumbent', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      Incumbent
                    </label>
                    {form.candidates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCandidate(idx)}
                        className="text-gray-400 hover:text-red-600 transition-colors text-lg leading-none"
                        aria-label="Remove candidate"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Race'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm()); setSubmitError(null); }}
                className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab layout */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading election races...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600 text-sm">{error}</div>
      ) : (
        <TabGroup>
          <TabList className="flex gap-1 rounded-xl bg-gray-100 p-1">
            <Tab className="flex-1 rounded-lg py-2 px-3 text-sm font-medium text-gray-600 transition-colors data-[selected]:bg-white data-[selected]:text-gray-900 data-[selected]:shadow data-[hover]:text-gray-900 focus:outline-none">
              Active Elections ({activeElections.length})
            </Tab>
            <Tab className="flex-1 rounded-lg py-2 px-3 text-sm font-medium text-gray-600 transition-colors data-[selected]:bg-white data-[selected]:text-gray-900 data-[selected]:shadow data-[hover]:text-gray-900 focus:outline-none">
              Pending Generation ({pendingGeneration.length})
            </Tab>
            <Tab className="flex-1 rounded-lg py-2 px-3 text-sm font-medium text-gray-600 transition-colors data-[selected]:bg-white data-[selected]:text-gray-900 data-[selected]:shadow data-[hover]:text-gray-900 focus:outline-none">
              Awaiting Follow-up ({awaitingFollowup.length})
            </Tab>
          </TabList>

          <TabPanels className="mt-4">
            {/* Tab 1: Active Elections */}
            <TabPanel>
              {activeElections.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No active elections with generated questions.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seat</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidates</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {activeElections.map((race) => (
                        <tr key={race.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div>{race.seat}</div>
                            <div className="text-xs text-gray-400">{ELECTION_TYPE_LABELS[race.electionType] || race.electionType}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(race.electionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{race.jurisdiction}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {race.questionCount} questions
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {race.candidates.length} candidate{race.candidates.length !== 1 ? 's' : ''}
                            {race.candidates.length > 0 && (
                              <span className="ml-1 text-gray-400 text-xs">
                                ({race.candidates.map((c) => c.name).join(', ')})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Active
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRegenClick(race)}
                              className="text-xs px-3 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              Re-generate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabPanel>

            {/* Tab 2: Pending Generation */}
            <TabPanel>
              {pendingGeneration.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No elections pending generation.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seat</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidates</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {pendingGeneration.map((race) => (
                        <tr key={race.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div>{race.seat}</div>
                            <div className="text-xs text-gray-400">{ELECTION_TYPE_LABELS[race.electionType] || race.electionType}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(race.electionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{race.jurisdiction}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {race.candidates.length} candidate{race.candidates.length !== 1 ? 's' : ''}
                            {race.candidates.length > 0 && (
                              <span className="ml-1 text-gray-400 text-xs">
                                ({race.candidates.map((c) => c.name).join(', ')})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Pending
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleGenerate(race)}
                                className="text-xs px-3 py-1 rounded bg-red-700 text-white hover:bg-red-800 transition-colors"
                              >
                                Generate Questions
                              </button>
                              <button
                                onClick={() => openEditModal(race)}
                                className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-colors"
                              >
                                Edit Race
                              </button>
                              <button
                                onClick={() => setDeletingRace(race)}
                                className="text-xs px-3 py-1 text-red-600 hover:text-red-800 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabPanel>

            {/* Tab 3: Awaiting Follow-up */}
            <TabPanel>
              {awaitingFollowup.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No expired elections awaiting follow-up.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seat</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidates</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {awaitingFollowup.map((race) => (
                        <tr key={race.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div>{race.seat}</div>
                            <div className="text-xs text-gray-400">{ELECTION_TYPE_LABELS[race.electionType] || race.electionType}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(race.electionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{race.jurisdiction}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {race.questionCount} questions
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {race.candidates.length} candidate{race.candidates.length !== 1 ? 's' : ''}
                            {race.candidates.length > 0 && (
                              <span className="ml-1 text-gray-400 text-xs">
                                ({race.candidates.map((c) => c.name).join(', ')})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              Expired
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openResultModal(race)}
                              className="text-xs px-3 py-1 rounded bg-red-700 text-white hover:bg-red-800 transition-colors"
                            >
                              Enter Result
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      )}

      {/* ---- Modals ---- */}

      {/* Modal: Collection Slug Prompt (Generate Questions) */}
      <Dialog open={showCollectionPrompt} onClose={() => setShowCollectionPrompt(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
              Generate Election Questions
            </DialogTitle>
            <p className="text-sm text-gray-600 mb-4">
              {selectedRaceForGen ? `Race: ${selectedRaceForGen.seat} — ${selectedRaceForGen.jurisdiction}` : ''}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection
            </label>
            {collections.length > 0 ? (
              <select
                value={genCollectionSlug}
                onChange={e => setGenCollectionSlug(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700 mb-4"
              >
                <option value="">— select a collection —</option>
                {collections.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name} ({c.slug})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={genCollectionSlug}
                onChange={e => setGenCollectionSlug(e.target.value)}
                placeholder="e.g., bloomington-in"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700 mb-4"
              />
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCollectionPrompt(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => startGeneration(generatingRaceId!, genCollectionSlug)}
                disabled={!genCollectionSlug.trim()}
                className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Generation Loading */}
      <Dialog open={genLoading} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-700 animate-spin" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">Generating Questions</DialogTitle>
            <p className="text-sm text-gray-600">Creating questions for {selectedRaceForGen?.seat}...</p>
            <p className="text-xs text-gray-400 mt-2">This may take 1–2 minutes.</p>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Generation Success */}
      <Dialog open={genResult !== null} onClose={() => setGenResult(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <DialogTitle className="text-lg font-semibold text-green-700 mb-2">Questions Generated</DialogTitle>
            {genResult && (
              <>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>{genResult.questionsCreated}</strong> draft questions created for {genResult.jurisdiction}.
                  {genResult.archived > 0 && ` (${genResult.archived} previous questions archived)`}
                </p>
                <div className="mt-4 mb-4">
                  <Link
                    to={`/admin/questions?collection=${genResult.collectionSlug}&status=draft`}
                    className="text-sm text-red-700 hover:text-red-800 font-medium"
                    onClick={() => setGenResult(null)}
                  >
                    View in Explorer &rarr;
                  </Link>
                </div>
              </>
            )}
            <div className="flex justify-end">
              <button onClick={() => setGenResult(null)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Generation Error / Blocked */}
      <Dialog open={genError !== null} onClose={() => setGenError(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            {genError?.type === 'blocked' ? (
              <>
                <DialogTitle className="text-lg font-semibold text-amber-700 mb-2">Questions Already Generated</DialogTitle>
                <p className="text-sm text-gray-700 mb-1">
                  {genError.existingCount} questions already exist for this race.
                </p>
                {genError.generatedAt && (
                  <p className="text-xs text-gray-500 mb-3">
                    Generated: {new Date(genError.generatedAt).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm text-gray-600 mb-4">
                  Force Regenerate will archive the existing questions and create new ones.
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setGenError(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                    Cancel
                  </button>
                  <button
                    onClick={() => { setGenError(null); startGeneration(generatingRaceId!, genCollectionSlug, true); }}
                    className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Force Regenerate
                  </button>
                </div>
              </>
            ) : (
              <>
                <DialogTitle className="text-lg font-semibold text-red-700 mb-2">Generation Failed</DialogTitle>
                <p className="text-sm text-gray-700 mb-4">{genError?.message}</p>
                <div className="flex justify-end">
                  <button onClick={() => setGenError(null)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Close
                  </button>
                </div>
              </>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Edit Race */}
      <Dialog open={editingRace !== null} onClose={() => setEditingRace(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg my-8">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">
              Edit Race — {editingRace?.seat}
            </DialogTitle>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seat Name <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={editForm.seat}
                    onChange={(e) => setEditForm((p) => ({ ...p, seat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Election Type <span className="text-red-600">*</span></label>
                  <select
                    required
                    value={editForm.electionType}
                    onChange={(e) => setEditForm((p) => ({ ...p, electionType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="general">General</option>
                    <option value="primary">Primary</option>
                    <option value="runoff">Runoff</option>
                    <option value="by-election">By-Election</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Election Date <span className="text-red-600">*</span></label>
                  <input
                    type="date"
                    required
                    value={editForm.electionDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, electionDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction <span className="text-red-600">*</span></label>
                  {collections.length > 0 ? (
                    <select
                      required
                      value={editForm.jurisdiction}
                      onChange={(e) => setEditForm((p) => ({ ...p, jurisdiction: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">— select a collection —</option>
                      {collections.map(c => (
                        <option key={c.slug} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={editForm.jurisdiction}
                      onChange={(e) => setEditForm((p) => ({ ...p, jurisdiction: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>
              </div>
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  value={editForm.timezone}
                  onChange={(e) => setEditForm((p) => ({ ...p, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              {/* Candidates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Candidates</label>
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, candidates: [...p.candidates, emptyCandidate()] }))}
                    className="text-xs text-red-700 hover:text-red-900 font-medium underline"
                  >
                    + Add Candidate
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.candidates.map((candidate, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="text"
                        placeholder="Full name"
                        value={candidate.name}
                        onChange={(e) => updateEditCandidate(idx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <input
                        type="text"
                        placeholder="Party"
                        value={candidate.party}
                        onChange={(e) => updateEditCandidate(idx, 'party', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={candidate.incumbent}
                          onChange={(e) => updateEditCandidate(idx, 'incumbent', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        Incumbent
                      </label>
                      {editForm.candidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditForm((p) => ({ ...p, candidates: p.candidates.filter((_, i) => i !== idx) }))}
                          className="text-gray-400 hover:text-red-600 transition-colors text-lg leading-none"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {editError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRace(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Delete Race Confirm */}
      <Dialog open={deletingRace !== null} onClose={() => setDeletingRace(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
              Delete Race?
            </DialogTitle>
            <p className="text-sm text-gray-600 mb-4">
              Delete <strong>{deletingRace?.seat}</strong>? Questions linked to this race will be unlinked (not deleted).
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingRace(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Race'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Re-generate Confirm */}
      <Dialog open={regenConfirmOpen} onClose={() => { setRegenConfirmOpen(false); setRegenRace(null); }} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <DialogTitle className="text-lg font-semibold text-amber-800 mb-2">
              Re-generate Questions?
            </DialogTitle>
            <p className="text-sm text-gray-700 mb-2">
              Race: <strong>{regenRace?.seat}</strong>
            </p>
            {regenCounts ? (
              <p className="text-sm text-gray-600 mb-4">
                Re-generating will archive <strong>{regenCounts.activeCount}</strong> active question{regenCounts.activeCount !== 1 ? 's' : ''} and
                delete <strong>{regenCounts.draftCount}</strong> draft question{regenCounts.draftCount !== 1 ? 's' : ''}. Continue?
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-4">Loading question counts...</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRegenConfirmOpen(false); setRegenRace(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenConfirm}
                disabled={regenLoading}
                className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {regenLoading ? 'Re-generating...' : 'Re-generate'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Modal: Enter Result */}
      <Dialog open={resultRace !== null} onClose={() => setResultRace(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">
              Enter Election Result — {resultRace?.seat}
            </DialogTitle>
            <form onSubmit={handleResultSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Winner Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Jane Smith"
                  value={resultForm.winnerName}
                  onChange={(e) => setResultForm((p) => ({ ...p, winnerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={resultForm.termEndDate}
                  onChange={(e) => setResultForm((p) => ({ ...p, termEndDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection <span className="text-red-600">*</span>
                </label>
                {collections.length > 0 ? (
                  <select
                    required
                    value={resultForm.collectionSlug}
                    onChange={(e) => setResultForm((p) => ({ ...p, collectionSlug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">— select a collection —</option>
                    {collections.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name} ({c.slug})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g., bloomington-in"
                    value={resultForm.collectionSlug}
                    onChange={(e) => setResultForm((p) => ({ ...p, collectionSlug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>
              {resultError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{resultError}</p>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setResultRace(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resultLoading}
                  className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
                >
                  {resultLoading ? 'Generating...' : 'Generate Current-Term Questions'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
