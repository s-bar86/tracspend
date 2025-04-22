import { useState } from 'react';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { useEffect, useRef } from 'react';

export default function UserMenu({ user, onSignOut, onResetData }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Hide menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile(auth.currentUser, { displayName });
      setEditing(false);
    } catch (err) {
      setError('Failed to update display name.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    setShowResetConfirm(false);
    onResetData();
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 focus:outline-none"
        tabIndex={0}
        onClick={() => setShowMenu((v) => !v)}
        aria-haspopup="true"
        aria-expanded={showMenu}
      >
        <span className="font-medium text-primary">
          {user.displayName || user.email}
        </span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            {editing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  className="input-field"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  disabled={saving}
                />
                {error && <div className="text-red-600 text-xs">{error}</div>}
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
                    Save
                  </button>
                  <button className="btn flex-1" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">Display name:</span>
                <span>{user.displayName || user.email}</span>
                <button className="text-xs text-primary underline ml-2" onClick={() => setEditing(true)}>
                  Edit
                </button>
              </div>
            )}
          </div>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-50" onClick={handleResetClick}>
            Reset data
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-50 border-t" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}
      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-200 skeuo-modal">
            <h3 className="text-xl font-bold mb-3 text-center text-primary">Reset Data</h3>
            <p className="mb-4 text-center text-gray-700">
              Are you sure you want to <span className="font-semibold text-red-600">delete all data</span> for this account?
            </p>
            <div className="mb-6 text-center text-sm text-gray-500">
              Account: <span className="font-mono">{user.email}</span>
            </div>
            <div className="flex gap-4">
              <button
                className="btn btn-primary flex-1 bg-red-500 hover:bg-red-600 border-0"
                onClick={handleResetConfirm}
              >
                Yes, Reset
              </button>
              <button
                className="btn flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                onClick={handleResetCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
