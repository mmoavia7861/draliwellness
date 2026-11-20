import React, { useState } from 'react';
import { Copy, Download, ShieldCheck, Trash2, Users } from 'lucide-react';
import type { AdminMember, NewsletterSubscriber, UserPublicProfile } from '../../types';
import { formatSubscribersCsv } from '../../utils/admin';

interface AdminAudiencePanelProps {
  currentUid: string;
  subscribers: NewsletterSubscriber[];
  usersList: UserPublicProfile[];
  adminMembers: AdminMember[];
  onDeleteSubscriber: (id: string) => Promise<void>;
  onSaveAdminMember: (member: {
    uid: string;
    email: string;
    role: 'super_admin' | 'editor';
  }) => Promise<void>;
  onDeleteAdminMember: (uid: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

export const AdminAudiencePanel: React.FC<AdminAudiencePanelProps> = ({
  currentUid,
  subscribers,
  usersList,
  adminMembers,
  onDeleteSubscriber,
  onSaveAdminMember,
  onDeleteAdminMember,
  onNotify,
}) => {
  const [adminUid, setAdminUid] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<'super_admin' | 'editor'>('editor');
  const [error, setError] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);

  const handleExportCsv = () => {
    const csv = formatSubscribersCsv(subscribers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dr-ali-hassan-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Exported newsletter subscribers CSV.');
  };

  return (
    <div className="space-y-8">
      {/* Newsletter Subscribers & Customer Directory */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                Newsletter Subscribers ({subscribers.length})
              </h2>
              <p className="text-xs text-[#252B29]/65">
                Customers who opted in via the storefront newsletter box.
              </p>
            </div>
            {subscribers.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="h-9 px-3 rounded-lg border border-[#174D40]/20 text-xs font-semibold text-[#174D40] inline-flex items-center gap-1.5 hover:bg-[#E8F1EB] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          {subscribers.length === 0 ? (
            <p className="text-xs text-[#252B29]/65">No newsletter subscribers recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[#174D40]/10 max-h-80 overflow-y-auto text-xs">
              {subscribers.map((sub) => (
                <li key={sub.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#252B29]">{sub.email}</p>
                    <p className="text-[11px] text-[#252B29]/55">Consent verified</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete subscriber ${sub.email}`}
                    onClick={() => void onDeleteSubscriber(sub.id)}
                    className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#174D40]" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                Registered Customers ({usersList.length})
              </h2>
              <p className="text-xs text-[#252B29]/65">
                Verified accounts synced via Google Sign-In.
              </p>
            </div>
          </div>

          {usersList.length === 0 ? (
            <p className="text-xs text-[#252B29]/65">No registered customer accounts yet.</p>
          ) : (
            <ul className="divide-y divide-[#174D40]/10 max-h-80 overflow-y-auto text-xs">
              {usersList.map((u) => (
                <li key={u.uid} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#252B29]">{u.displayName || 'Customer'}</p>
                    <p className="text-[11px] text-[#252B29]/60 font-mono">{u.uid}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard?.writeText(u.uid);
                      onNotify(`Copied UID for ${u.displayName || 'user'}`);
                    }}
                    className="px-2.5 py-1 rounded border border-[#174D40]/20 text-[11px] font-medium text-[#174D40] hover:bg-[#E8F1EB] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy UID
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Team & Admin Access Management */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#174D40]" />
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                Administrator Access Registry ({adminMembers.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard?.writeText(currentUid);
                onNotify('Your Admin UID copied to clipboard.');
              }}
              className="text-xs text-[#174D40] underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy My UID
            </button>
          </div>

          {adminMembers.length === 0 ? (
            <p className="text-xs text-[#252B29]/65">
              Only the primary bootstrapped administrator is active.
            </p>
          ) : (
            <ul className="divide-y divide-[#174D40]/10 text-xs">
              {adminMembers.map((member) => {
                const isSelf = member.uid === currentUid;
                return (
                  <li key={member.uid} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#252B29]">
                        {member.email}{' '}
                        <span className="ml-1 uppercase text-[10px] px-2 py-0.5 rounded bg-[#E8F1EB] text-[#174D40]">
                          {member.role.replace('_', ' ')}
                        </span>
                      </p>
                      <p className="text-[11px] text-[#252B29]/60 font-mono">{member.uid}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isSelf}
                      title={isSelf ? 'Cannot remove your own active session' : 'Revoke admin access'}
                      aria-label={`Remove admin ${member.email}`}
                      onClick={() => void onDeleteAdminMember(member.uid)}
                      className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setSavingAdmin(true);
            try {
              await onSaveAdminMember({
                uid: adminUid,
                email: adminEmail,
                role: adminRole,
              });
              setAdminUid('');
              setAdminEmail('');
              setAdminRole('editor');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to save admin member.');
            } finally {
              setSavingAdmin(false);
            }
          }}
          className="lg:col-span-5 bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4 h-fit text-sm"
        >
          <h3 className="font-serif text-xl font-semibold text-[#174D40]">
            Grant / Update Admin Access
          </h3>
          <p className="text-xs text-[#252B29]/65">
            Copy a registered user&apos;s Firebase UID from the directory above and assign them an admin role.
          </p>
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold">Firebase User UID *</label>
            <input
              type="text"
              required
              placeholder="e.g. a1b2c3d4..."
              value={adminUid}
              onChange={(e) => setAdminUid(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Google Email *</label>
            <input
              type="email"
              required
              placeholder="team@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Role</label>
            <select
              value={adminRole}
              onChange={(e) => setAdminRole(e.target.value as 'super_admin' | 'editor')}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
            >
              <option value="editor">Editor</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={savingAdmin}
            className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-xs font-semibold hover:bg-[#113A30] disabled:opacity-60 cursor-pointer"
          >
            {savingAdmin ? 'Saving...' : 'Save Admin Member'}
          </button>
        </form>
      </div>
    </div>
  );
};
