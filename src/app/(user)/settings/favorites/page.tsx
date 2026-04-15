'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input, Button, Text, ActionIcon } from 'rizzui';
import {
  PiCaretLeftBold,
  PiFolderSimpleBold,
  PiPlusBold,
  PiDotsThreeVerticalBold,
  PiTrashBold,
  PiPencilSimpleBold,
  PiUserCircleBold,
  PiXBold,
  PiFolderSimpleDashedLight,
  PiUserLight,
} from 'react-icons/pi';
import toast from 'react-hot-toast';

interface Folder {
  id: number;
  name: string;
  userCount: number;
}

interface FolderUser {
  foldUserId: number;
  userId: number;
  name: string;
  photo: string;
}

function getUid(): number {
  if (typeof window === 'undefined') return 0;
  const token = localStorage.getItem('su_register_token') || '';
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Number(payload.IndividualUserId || 0);
  } catch {
    return 0;
  }
}

// ─── Folder Action Menu ────────────────────────────────────────
function FolderMenu({
  onRename,
  onDelete,
  onClose,
}: {
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-8 z-50 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
        <button
          onClick={() => { onRename(); onClose(); }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <PiPencilSimpleBold className="h-4 w-4" />
          Rename
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
        >
          <PiTrashBold className="h-4 w-4" />
          Delete
        </button>
      </div>
    </>
  );
}

// ─── Modal Wrapper ─────────────────────────────────────────────
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

// ─── User Avatar ───────────────────────────────────────────────
function UserAvatar({ photo, name, size = 44 }: { photo: string; name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (!photo || imgError) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-gray-100"
        style={{ width: size, height: size }}
      >
        <PiUserCircleBold className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={photo}
      alt={name}
      onError={() => setImgError(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function FavoritesPage() {
  const router = useRouter();
  const [uid] = useState(getUid);

  // State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder detail view
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [folderUsers, setFolderUsers] = useState<FolderUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Menus
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  // Create folder modal
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  // Rename modal
  const [renameFolder, setRenameFolder] = useState<Folder | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete confirm
  const [deleteFolder, setDeleteFolder] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── API helpers ──
  const api = useCallback(
    (action: string, data?: any) =>
      axios.post('/api/user/favorites', { action, userId: uid, data }),
    [uid]
  );

  // ── Load folders ──
  const loadFolders = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await api('getFolders');
      if (res.data?.ok) {
        setFolders(res.data.folders);
      }
    } catch {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, [uid, api]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // ── Open folder ──
  async function openFolder(folder: Folder) {
    setActiveFolder(folder);
    setLoadingUsers(true);
    try {
      const res = await api('getFolderUsers', { folderId: folder.id });
      if (res.data?.ok) {
        setFolderUsers(res.data.users);
        // Update folder name in case it changed
        if (res.data.folderName) {
          setActiveFolder((prev) => prev ? { ...prev, name: res.data.folderName } : prev);
        }
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }

  // ── Create folder ──
  async function handleCreate() {
    const name = newFolderName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await api('createFolder', { name });
      if (res.data?.ok) {
        setFolders((prev) => [res.data.folder, ...prev]);
        setShowCreate(false);
        setNewFolderName('');
        toast.success('Folder created');
      } else {
        toast.error(res.data?.error || 'Failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setCreating(false);
    }
  }

  // ── Rename folder ──
  async function handleRename() {
    if (!renameFolder) return;
    const name = renameName.trim();
    if (!name) return;
    setRenaming(true);
    try {
      const res = await api('renameFolder', { folderId: renameFolder.id, name });
      if (res.data?.ok) {
        setFolders((prev) =>
          prev.map((f) => (f.id === renameFolder.id ? { ...f, name } : f))
        );
        if (activeFolder?.id === renameFolder.id) {
          setActiveFolder((prev) => prev ? { ...prev, name } : prev);
        }
        setRenameFolder(null);
        toast.success('Folder renamed');
      } else {
        toast.error(res.data?.error || 'Failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setRenaming(false);
    }
  }

  // ── Delete folder ──
  async function handleDelete() {
    if (!deleteFolder) return;
    setDeleting(true);
    try {
      const res = await api('deleteFolder', { folderId: deleteFolder.id });
      if (res.data?.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== deleteFolder.id));
        if (activeFolder?.id === deleteFolder.id) {
          setActiveFolder(null);
          setFolderUsers([]);
        }
        setDeleteFolder(null);
        toast.success('Folder deleted');
      } else {
        toast.error(res.data?.error || 'Failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setDeleting(false);
    }
  }

  // ── Remove user from folder ──
  async function handleRemoveUser(user: FolderUser) {
    try {
      const res = await api('removeUser', {
        foldUserId: user.foldUserId,
        folderId: activeFolder?.id,
      });
      if (res.data?.ok) {
        setFolderUsers((prev) => prev.filter((u) => u.foldUserId !== user.foldUserId));
        // Update count in folders list
        setFolders((prev) =>
          prev.map((f) =>
            f.id === activeFolder?.id ? { ...f, userCount: Math.max(0, f.userCount - 1) } : f
          )
        );
        toast.success('User removed');
      }
    } catch {
      toast.error('Failed to remove user');
    }
  }

  // ── Back from folder detail ──
  function goBackToFolders() {
    setActiveFolder(null);
    setFolderUsers([]);
    loadFolders(); // refresh counts
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#F26B50]" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FOLDER DETAIL VIEW
  // ═══════════════════════════════════════════════════════════
  if (activeFolder) {
    return (
      <div className="min-h-screen bg-white">
        {/* Mobile header */}
        <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
          <button onClick={goBackToFolders} className="mr-3 text-[#F26B50]">
            <PiCaretLeftBold className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
            {activeFolder.name}
          </h1>
          <div className="w-8" />
        </div>

        {/* Desktop header */}
        <div className="hidden items-center gap-3 border-b border-gray-100 px-8 py-5 md:flex">
          <button
            onClick={goBackToFolders}
            className="rounded-lg p-1 text-[#F26B50] hover:bg-gray-50"
          >
            <PiCaretLeftBold className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{activeFolder.name}</h1>
          <span className="text-sm text-gray-400">
            {folderUsers.length} {folderUsers.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {/* Users list */}
        <div className="mx-auto max-w-lg">
          {loadingUsers ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-[#F26B50]" />
            </div>
          ) : folderUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <PiUserLight className="mb-3 h-16 w-16 text-gray-200" />
              <Text className="text-sm text-gray-400">No users in this folder</Text>
              <Text className="mt-1 text-xs text-gray-300">
                Add users from their profile page
              </Text>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {folderUsers.map((user) => (
                <li
                  key={user.foldUserId}
                  className="flex items-center gap-3 px-5 py-3 md:px-8"
                >
                  <UserAvatar photo={user.photo} name={user.name} />
                  <div className="min-w-0 flex-1">
                    <Text className="truncate text-sm font-semibold text-gray-900">
                      {user.name}
                    </Text>
                  </div>
                  <ActionIcon
                    variant="text"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => handleRemoveUser(user)}
                  >
                    <PiXBold className="h-4 w-4" />
                  </ActionIcon>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FOLDER LIST VIEW
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button onClick={() => router.back()} className="mr-3 text-[#F26B50]">
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Favorites
        </h1>
        <ActionIcon
          variant="text"
          size="sm"
          className="text-[#F26B50]"
          onClick={() => { setNewFolderName(''); setShowCreate(true); }}
        >
          <PiPlusBold className="h-5 w-5" />
        </ActionIcon>
      </div>

      {/* Desktop header */}
      <div className="hidden items-center justify-between border-b border-gray-100 px-8 py-5 md:flex">
        <h1 className="text-xl font-bold text-gray-900">Favorites</h1>
        <Button
          size="sm"
          className="rounded-lg text-sm font-semibold"
          style={{ backgroundColor: '#F26B50', color: 'white' }}
          onClick={() => { setNewFolderName(''); setShowCreate(true); }}
        >
          <PiPlusBold className="mr-1.5 h-4 w-4" />
          New Folder
        </Button>
      </div>

      {/* Folder list */}
      <div className="mx-auto max-w-lg">
        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <PiFolderSimpleDashedLight className="mb-3 h-16 w-16 text-gray-200" />
            <Text className="text-sm text-gray-400">No favourite folders yet</Text>
            <Button
              size="md"
              className="mt-4 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#F26B50', color: 'white' }}
              onClick={() => { setNewFolderName(''); setShowCreate(true); }}
            >
              <PiPlusBold className="mr-1.5 h-4 w-4" />
              Create Folder
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {folders.map((folder) => (
              <li key={folder.id} className="relative">
                <button
                  onClick={() => openFolder(folder)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 md:px-8"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EC]">
                    <PiFolderSimpleBold className="h-5 w-5 text-[#F26B50]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Text className="truncate text-sm font-semibold text-gray-900">
                      {folder.name}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {folder.userCount} {folder.userCount === 1 ? 'user' : 'users'}
                    </Text>
                  </div>
                </button>
                {/* Action menu trigger */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 md:right-6">
                  <ActionIcon
                    variant="text"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === folder.id ? null : folder.id);
                    }}
                  >
                    <PiDotsThreeVerticalBold className="h-5 w-5" />
                  </ActionIcon>
                  {menuOpen === folder.id && (
                    <FolderMenu
                      onRename={() => {
                        setRenameFolder(folder);
                        setRenameName(folder.name);
                      }}
                      onDelete={() => setDeleteFolder(folder)}
                      onClose={() => setMenuOpen(null)}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── CREATE FOLDER MODAL ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <Text className="mb-4 text-lg font-bold text-gray-900">New Folder</Text>
        <Input
          size="lg"
          inputClassName="text-sm"
          placeholder="Folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          autoFocus
        />
        <div className="mt-5 flex gap-3">
          <Button
            size="md"
            variant="outline"
            className="flex-1 rounded-lg text-sm"
            onClick={() => setShowCreate(false)}
          >
            Cancel
          </Button>
          <Button
            size="md"
            className="flex-1 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#F26B50', color: 'white' }}
            isLoading={creating}
            onClick={handleCreate}
            disabled={!newFolderName.trim()}
          >
            Create
          </Button>
        </div>
      </Modal>

      {/* ── RENAME FOLDER MODAL ── */}
      <Modal open={!!renameFolder} onClose={() => setRenameFolder(null)}>
        <Text className="mb-4 text-lg font-bold text-gray-900">Rename Folder</Text>
        <Input
          size="lg"
          inputClassName="text-sm"
          placeholder="Folder name"
          value={renameName}
          onChange={(e) => setRenameName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          autoFocus
        />
        <div className="mt-5 flex gap-3">
          <Button
            size="md"
            variant="outline"
            className="flex-1 rounded-lg text-sm"
            onClick={() => setRenameFolder(null)}
          >
            Cancel
          </Button>
          <Button
            size="md"
            className="flex-1 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#F26B50', color: 'white' }}
            isLoading={renaming}
            onClick={handleRename}
            disabled={!renameName.trim()}
          >
            Save
          </Button>
        </div>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ── */}
      <Modal open={!!deleteFolder} onClose={() => setDeleteFolder(null)}>
        <Text className="mb-2 text-lg font-bold text-gray-900">Delete Folder</Text>
        <Text className="mb-5 text-sm text-gray-500">
          Are you sure you want to delete &ldquo;{deleteFolder?.name}&rdquo;? This will also remove all saved users in this folder.
        </Text>
        <div className="flex gap-3">
          <Button
            size="md"
            variant="outline"
            className="flex-1 rounded-lg text-sm"
            onClick={() => setDeleteFolder(null)}
          >
            Cancel
          </Button>
          <Button
            size="md"
            className="flex-1 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
            isLoading={deleting}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
