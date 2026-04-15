'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input, Button, Password, Text } from 'rizzui';
import {
  PiCaretLeftBold,
  PiCaretDownBold,
  PiCaretUpBold,
  PiLockKeyLight,
  PiEnvelopeLight,
  PiCrownLight,
  PiProhibitLight,
  PiSignOutLight,
  PiTrashLight,
  PiUserCircleLight,
  PiXBold,
  PiWarningCircleFill,
} from 'react-icons/pi';
import toast from 'react-hot-toast';

type Section =
  | 'password'
  | 'email'
  | 'subscription'
  | 'blocked'
  | null;

interface BlockedUser {
  UserBlockId: number;
  ToIndividualUserId: number;
  FirstName: string;
  LastName: string;
  ProfileImage: string;
}

interface Subscription {
  SubscriptionPlanId: number;
  SubscriptionPlanDate: string;
  SubscriptionExpiryDate: string;
  SubscriptionPlanName: string;
  SubscriptionPlanPrice: number;
  SubscriptionPlanDuration: number;
}

function getUserId(): number {
  try {
    const token = localStorage.getItem('su_register_token') || '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Number(payload.IndividualUserId || 0);
  } catch {
    return 0;
  }
}

export default function AccountPage() {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<Section>(null);

  // Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Email state
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toggle = (s: Section) => setOpenSection(openSection === s ? null : s);

  const fetchSubscription = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    setSubLoading(true);
    try {
      const res = await axios.post('/api/user/account', {
        action: 'getSubscription',
        userId: uid,
      });
      if (res.data?.ok) setSubscription(res.data.data);
    } catch {
      toast.error('Failed to load subscription');
    } finally {
      setSubLoading(false);
    }
  }, []);

  const fetchBlockedUsers = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    setBlockedLoading(true);
    try {
      const res = await axios.post('/api/user/account', {
        action: 'getBlockedUsers',
        userId: uid,
      });
      if (res.data?.ok) setBlockedUsers(res.data.data || []);
    } catch {
      toast.error('Failed to load blocked users');
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (openSection === 'subscription' && !subscription) fetchSubscription();
    if (openSection === 'blocked') fetchBlockedUsers();
  }, [openSection, subscription, fetchSubscription, fetchBlockedUsers]);

  // ── Handlers ──

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPwd.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwdLoading(true);
    try {
      const res = await axios.post('/api/user/account', {
        action: 'changePassword',
        userId: getUserId(),
        data: { currentPassword: currentPwd, newPassword: newPwd },
      });
      if (res.data?.ok) {
        toast.success('Password updated');
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setOpenSection(null);
      } else {
        toast.error(res.data?.error || 'Failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (newEmail !== confirmEmail) {
      toast.error('Emails do not match');
      return;
    }
    if (!newEmail.includes('@')) {
      toast.error('Invalid email');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await axios.post('/api/user/account', {
        action: 'changeEmail',
        userId: getUserId(),
        data: { newEmail },
      });
      if (res.data?.ok) {
        toast.success('Email updated');
        setNewEmail('');
        setConfirmEmail('');
        setOpenSection(null);
      } else {
        toast.error(res.data?.error || 'Failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleUnblock(blockedUserId: number) {
    try {
      const res = await axios.post('/api/user/account', {
        action: 'unblockUser',
        userId: getUserId(),
        data: { blockedUserId },
      });
      if (res.data?.ok) {
        toast.success('User unblocked');
        setBlockedUsers((prev) =>
          prev.filter((u) => u.ToIndividualUserId !== blockedUserId)
        );
      } else {
        toast.error(res.data?.error || 'Failed');
      }
    } catch {
      toast.error('Connection error');
    }
  }

  function handleLogout() {
    localStorage.removeItem('su_register_token');
    localStorage.removeItem('su_user');
    localStorage.removeItem('token');
    router.push('/signin');
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      const res = await axios.post('/api/user/account', {
        action: 'deleteAccount',
        userId: getUserId(),
      });
      if (res.data?.ok) {
        toast.success('Account deleted');
        localStorage.removeItem('su_register_token');
        localStorage.removeItem('su_user');
        localStorage.removeItem('token');
        router.push('/signin');
      } else {
        toast.error(res.data?.error || 'Failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Format helpers ──

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  }

  function getSubStatus(sub: Subscription): { label: string; color: string } {
    if (!sub.SubscriptionExpiryDate) return { label: 'Active', color: 'text-green-600' };
    const expiry = new Date(sub.SubscriptionExpiryDate);
    if (expiry > new Date()) return { label: 'Active', color: 'text-green-600' };
    return { label: 'Expired', color: 'text-red-500' };
  }

  // ── Menu item renderer ──

  function MenuItem({
    icon: Icon,
    label,
    section,
    danger,
    onClick,
  }: {
    icon: any;
    label: string;
    section?: Section;
    danger?: boolean;
    onClick?: () => void;
  }) {
    const isOpen = section ? openSection === section : false;
    const colorClass = danger ? 'text-red-500' : 'text-gray-800';
    const iconColor = danger ? 'text-red-400' : 'text-gray-500';

    return (
      <button
        onClick={onClick || (() => section && toggle(section))}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors active:bg-gray-50"
      >
        <Icon className={`h-6 w-6 flex-shrink-0 ${iconColor}`} />
        <span className={`flex-1 text-[15px] ${colorClass}`}>{label}</span>
        {section && (
          isOpen ? (
            <PiCaretUpBold className="h-4 w-4 text-gray-400" />
          ) : (
            <PiCaretDownBold className="h-4 w-4 text-gray-400" />
          )
        )}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button onClick={() => router.back()} className="mr-3 text-[#F26B50]">
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Account
        </h1>
        <div className="w-8" />
      </div>

      {/* Desktop title */}
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Account</h1>
      </div>

      <div className="mx-auto max-w-lg">
        {/* ── Change Password ── */}
        <div className="border-b border-gray-50">
          <MenuItem
            icon={PiLockKeyLight}
            label="Change Password"
            section="password"
          />
          {openSection === 'password' && (
            <form
              onSubmit={handleChangePassword}
              className="space-y-4 px-5 pb-5"
            >
              <Password
                size="lg"
                label="Current Password"
                placeholder="Enter current password"
                inputClassName="text-sm"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
              />
              <Password
                size="lg"
                label="New Password"
                placeholder="Enter new password"
                inputClassName="text-sm"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
              <Password
                size="lg"
                label="Confirm New Password"
                placeholder="Confirm new password"
                inputClassName="text-sm"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#F26B50', color: 'white' }}
                isLoading={pwdLoading}
              >
                Update Password
              </Button>
            </form>
          )}
        </div>

        {/* ── Change Email ── */}
        <div className="border-b border-gray-50">
          <MenuItem
            icon={PiEnvelopeLight}
            label="Change Email"
            section="email"
          />
          {openSection === 'email' && (
            <form onSubmit={handleChangeEmail} className="space-y-4 px-5 pb-5">
              <Input
                type="email"
                size="lg"
                label="New Email"
                placeholder="your@email.com"
                inputClassName="text-sm"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Input
                type="email"
                size="lg"
                label="Confirm Email"
                placeholder="Confirm your email"
                inputClassName="text-sm"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#F26B50', color: 'white' }}
                isLoading={emailLoading}
              >
                Update Email
              </Button>
            </form>
          )}
        </div>

        {/* ── Subscription ── */}
        <div className="border-b border-gray-50">
          <MenuItem
            icon={PiCrownLight}
            label="Subscription"
            section="subscription"
          />
          {openSection === 'subscription' && (
            <div className="px-5 pb-5">
              {subLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                </div>
              ) : subscription ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Text className="text-sm font-semibold text-gray-900">
                      {subscription.SubscriptionPlanName || 'Free Plan'}
                    </Text>
                    <span
                      className={`text-xs font-semibold ${getSubStatus(subscription).color}`}
                    >
                      {getSubStatus(subscription).label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {subscription.SubscriptionPlanPrice != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Price</span>
                        <span className="font-medium text-gray-800">
                          {subscription.SubscriptionPlanPrice === 0
                            ? 'Free'
                            : `$${subscription.SubscriptionPlanPrice}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Start Date</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(subscription.SubscriptionPlanDate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Expiry Date</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(subscription.SubscriptionExpiryDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <Text className="py-4 text-center text-sm text-gray-400">
                  No subscription info available
                </Text>
              )}
            </div>
          )}
        </div>

        {/* ── Blocked Users ── */}
        <div className="border-b border-gray-50">
          <MenuItem
            icon={PiProhibitLight}
            label="Blocked Users"
            section="blocked"
          />
          {openSection === 'blocked' && (
            <div className="px-5 pb-5">
              {blockedLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <Text className="py-4 text-center text-sm text-gray-400">
                  No blocked users
                </Text>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((u) => (
                    <div
                      key={u.ToIndividualUserId}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      {u.ProfileImage ? (
                        <img
                          src={u.ProfileImage}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#F26B50]">
                          {(u.FirstName || '?').charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Text className="truncate text-sm font-medium text-gray-900">
                          {u.FirstName} {u.LastName}
                        </Text>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 rounded-lg border-gray-200 text-xs font-medium text-gray-600"
                        onClick={() => handleUnblock(u.ToIndividualUserId)}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Log Out ── */}
        <div className="border-b border-gray-50">
          <MenuItem
            icon={PiSignOutLight}
            label="Log Out"
            onClick={handleLogout}
          />
        </div>

        {/* ── Delete Account ── */}
        <div className="border-b border-gray-50">
          <MenuItem
            icon={PiTrashLight}
            label="Delete Account"
            danger
            onClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <PiWarningCircleFill className="h-6 w-6 text-red-500" />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
              >
                <PiXBold className="h-5 w-5" />
              </button>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">
              Delete Account
            </h3>
            <p className="mt-1.5 text-sm text-gray-500">
              Are you sure you want to delete your account? This action cannot be
              undone and all your data will be permanently removed.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-lg text-sm font-semibold"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                className="flex-1 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
                isLoading={deleteLoading}
                onClick={handleDeleteAccount}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
