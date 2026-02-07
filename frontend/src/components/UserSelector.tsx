/**
 * Component for selecting or creating a user to trade with.
 * Persists the selected user in localStorage.
 */
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { userAPI } from '../services/api';

interface UserSelectorProps {
  onUserSelect: (user: User | null) => void;
  selectedUser: User | null;
}

const UserSelector: React.FC<UserSelectorProps> = ({ onUserSelect, selectedUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userAPI.list();
      setUsers(data);

      // Restore previously selected user
      const savedId = localStorage.getItem('selectedUserId');
      if (savedId && !selectedUser) {
        const user = data.find((u) => u.id === parseInt(savedId));
        if (user) onUserSelect(user);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = parseInt(e.target.value);
    if (userId === 0) {
      onUserSelect(null);
      localStorage.removeItem('selectedUserId');
      return;
    }
    const user = users.find((u) => u.id === userId);
    if (user) {
      onUserSelect(user);
      localStorage.setItem('selectedUserId', String(user.id));
    }
  };

  const handleCreate = async () => {
    if (!newUsername.trim()) return;
    setCreating(true);
    try {
      const user = await userAPI.create({
        username: newUsername,
        display_name: newDisplayName || undefined,
      });
      setUsers([...users, user]);
      onUserSelect(user);
      localStorage.setItem('selectedUserId', String(user.id));
      setNewUsername('');
      setNewDisplayName('');
      setShowCreate(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-indigo-800">Trader:</label>
        <select
          value={selectedUser?.id || 0}
          onChange={handleSelect}
          className="px-3 py-1 border border-indigo-300 rounded-md text-sm bg-white"
        >
          <option value={0}>-- Select User --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name || u.username} (${u.balance.toFixed(0)})
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showCreate ? 'Cancel' : '+ New User'}
        </button>

        {selectedUser && (
          <span className="ml-auto text-sm text-indigo-700">
            Balance: <strong>${selectedUser.balance.toFixed(2)}</strong>
          </span>
        )}
      </div>

      {showCreate && (
        <div className="mt-3 flex items-end gap-2">
          <div>
            <label className="block text-xs text-indigo-700 mb-1">Username *</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="px-2 py-1 border border-indigo-300 rounded text-sm w-32"
              placeholder="alice123"
            />
          </div>
          <div>
            <label className="block text-xs text-indigo-700 mb-1">Display Name</label>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="px-2 py-1 border border-indigo-300 rounded text-sm w-32"
              placeholder="Alice"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newUsername.trim()}
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
