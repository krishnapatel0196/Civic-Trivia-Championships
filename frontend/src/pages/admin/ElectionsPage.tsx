import { Fragment, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
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

export function ElectionsPage() {
  const { accessToken } = useAuthStore();

  const [races, setRaces] = useState<ElectionRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generation state
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

  const fetchRaces = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/election-races`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRaces(data.races || []);
    } catch (err) {
      setError('Failed to load election races.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Build ISO datetime with offset from date input (date input gives YYYY-MM-DD, append T00:00:00Z)
    const electionDateISO = form.electionDate
      ? `${form.electionDate}T00:00:00.000Z`
      : '';

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
        await fetchRaces();
        setForm(emptyForm());
        setShowForm(false);
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

  // Generation handlers
  const handleGenerate = (raceId: number) => {
    setGeneratingRaceId(raceId);
    setGenCollectionSlug('');
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
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ collectionSlug, force }),
      });
      const data = await response.json();
      if (response.ok) {
        setGenResult(data);
        fetchRaces();
      } else if (response.status === 409) {
        setGenError({ type: 'blocked', message: data.message, existingCount: data.existingCount, generatedAt: data.generatedAt });
      } else {
        setGenError({ type: 'error', message: data.error || 'Failed to generate questions' });
      }
    } catch (err) {
      setGenError({ type: 'error', message: 'Network error — please try again' });
    } finally {
      setGenLoading(false);
    }
  };

  const selectedRace = races.find(r => r.id === generatingRaceId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Election Races</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage election races for question generation. Races are entered manually.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setSubmitError(null); }}
          className="inline-flex items-center px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Election Race'}
        </button>
      </div>

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
                <input
                  type="text"
                  required
                  placeholder="e.g., Bloomington, IN"
                  value={form.jurisdiction}
                  onChange={(e) => setForm((p) => ({ ...p, jurisdiction: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
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

      {/* Race list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading election races...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600 text-sm">{error}</div>
      ) : races.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium text-gray-700 mb-1">No election races yet</p>
          <p className="text-sm">Create a race to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidates</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {races.map((race) => (
                <tr key={race.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{race.seat}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      {ELECTION_TYPE_LABELS[race.electionType] || race.electionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(race.electionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
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
                    <div className="flex gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          race.questionsGenerated
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Q{race.questionsGenerated ? ' Done' : ' Pending'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          race.followupGenerated
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        F/U{race.followupGenerated ? ' Done' : ' Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleGenerate(race.id)}
                      className="text-xs px-3 py-1 rounded border border-gray-300 hover:border-red-700 hover:text-red-700 transition-colors"
                    >
                      Generate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Collection Slug Prompt */}
      <Transition show={showCollectionPrompt} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowCollectionPrompt(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                  Generate Election Questions
                </Dialog.Title>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedRace ? `Race: ${selectedRace.seat} — ${selectedRace.jurisdiction}` : ''}
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection slug
                </label>
                <input
                  type="text"
                  value={genCollectionSlug}
                  onChange={e => setGenCollectionSlug(e.target.value)}
                  placeholder="e.g., bloomington-in"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-700 mb-4"
                />
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Modal 2: Loading */}
      <Transition show={genLoading} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-40" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-700 animate-spin" />
                </div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">Generating Questions</Dialog.Title>
                <p className="text-sm text-gray-600">Creating questions for {selectedRace?.seat}...</p>
                <p className="text-xs text-gray-400 mt-2">This may take 1–2 minutes.</p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Modal 3: Success */}
      <Transition show={genResult !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setGenResult(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-40" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <Dialog.Title className="text-lg font-semibold text-green-700 mb-2">Questions Generated</Dialog.Title>
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Modal 4: Error / Blocked */}
      <Transition show={genError !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setGenError(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-40" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                {genError?.type === 'blocked' ? (
                  <>
                    <Dialog.Title className="text-lg font-semibold text-amber-700 mb-2">Questions Already Generated</Dialog.Title>
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
                    <Dialog.Title className="text-lg font-semibold text-red-700 mb-2">Generation Failed</Dialog.Title>
                    <p className="text-sm text-gray-700 mb-4">{genError?.message}</p>
                    <div className="flex justify-end">
                      <button onClick={() => setGenError(null)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        Close
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
