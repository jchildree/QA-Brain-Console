import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi, type AdminUserSummary, type Role } from '../api/client';
import { useAuth } from '../context/AuthContext';

function setupLinkFor(username: string, token: string): string {
  return `${window.location.origin}/setup?username=${encodeURIComponent(username)}&token=${token}`;
}

export function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');
  const [setupLink, setSetupLink] = useState<string | null>(null);

  const load = () => {
    adminApi
      .listUsers()
      .then(setUsers)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(load, []);

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSetupLink(null);
    try {
      const created = await adminApi.createUser(newUsername, newRole);
      setSetupLink(setupLinkFor(created.username, created.setupToken));
      setNewUsername('');
      setNewRole('user');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleResend = async (username: string) => {
    setError(null);
    try {
      const { setupToken } = await adminApi.resendSetup(username);
      setSetupLink(setupLinkFor(username, setupToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend setup link');
    }
  };

  const handleToggleActive = async (user: AdminUserSummary) => {
    setError(null);
    try {
      await adminApi.updateUser(user.username, { active: !user.active });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleRoleChange = async (user: AdminUserSummary, role: Role) => {
    setError(null);
    try {
      await adminApi.updateUser(user.username, { role });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="chart-title">Users</h1>

      <form onSubmit={handleCreate} className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Username</span>
          <input
            aria-label="New Username"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Role</span>
          <select
            aria-label="New User Role"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={!newUsername} className="accession-btn">
          Add User
        </button>
      </form>

      {setupLink && (
        <p className="text-xs font-mono break-all" style={{ color: 'var(--teal)' }}>
          Setup link (send this to the new user): {setupLink}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <table className="text-sm font-mono w-full">
        <thead>
          <tr style={{ color: 'var(--ink-dim)' }}>
            <th className="text-left">Username</th>
            <th className="text-left">Role</th>
            <th className="text-left">Status</th>
            <th className="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.username}>
              <td>{u.username}</td>
              <td>
                <select
                  aria-label={`Role for ${u.username}`}
                  value={u.role}
                  onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                  className="text-sm px-2 py-1 rounded-lg focus:outline-none font-mono border"
                  style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{u.pending ? 'Pending setup' : u.active ? 'Active' : 'Inactive'}</td>
              <td className="flex gap-2">
                <button type="button" className="accession-btn" onClick={() => handleToggleActive(u)}>
                  {u.active ? 'Deactivate' : 'Activate'}
                </button>
                {u.pending && (
                  <button type="button" className="accession-btn" onClick={() => handleResend(u.username)}>
                    Resend setup link
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
