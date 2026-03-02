import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../services/api';

interface AdminUser {
  userId: string;
  email: string;
  superAdmin: boolean;
  createdAt: string;
}

export function AdminsPage() {
  const { accessToken, isSuperAdmin } = useAuthStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [addSuperAdmin, setAddSuperAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function fetchAdmins() {
    try {
      const res = await fetch(`${API_URL}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to load admins');
      setAdmins(await res.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAdmins(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/admins`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: addEmail.trim(), superAdmin: addSuperAdmin }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add admin');
      }
      setAddEmail('');
      setAddSuperAdmin(false);
      await fetchAdmins();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: string, email: string) {
    if (!confirm(`Remove admin access from ${email}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/admins/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove admin');
      }
      await fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-16 text-gray-500">
        Super-admin access required to manage admins.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Admins</h1>
      <p className="text-sm text-gray-500 mb-8">
        Add or remove admin access. Super-admins can manage this list and cannot be removed by others.
      </p>

      {/* Add admin form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add Admin</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={adding || !addEmail.trim()}
              className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={addSuperAdmin}
              onChange={(e) => setAddSuperAdmin(e.target.checked)}
              className="rounded border-gray-300 text-red-700 focus:ring-red-500"
            />
            Grant super-admin (can manage other admins)
          </label>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
        </form>
      </div>

      {/* Admin list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Current Admins</h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-red-500 text-sm">{error}</div>
        ) : admins.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No admins yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <li key={admin.userId} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{admin.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {admin.superAdmin && (
                      <span className="text-xs font-medium px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                        Super-admin
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Added {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(admin.userId, admin.email)}
                  className="text-sm text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove admin access"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
