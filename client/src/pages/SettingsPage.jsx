import { useState } from 'react';
import { useAuthStore } from '../zustand/authStore.js';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { usersAPI, workspacesAPI } from '../api/apiFunctions.js';
import Avatar from '../components/Avatar.jsx';
import toast from 'react-hot-toast';

function Section({ title, description, children }) {
  return (
    <div className="card p-5 mb-4">
      <div className="mb-5 pb-4 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { activeWorkspace, workspaces } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await usersAPI.updateMe({ name: profileForm.name });
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) { 
        console.error(err);
        toast.error('Failed to update profile'); 
    }
    setSaving(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      return toast.error('Passwords do not match');
    }
    setSaving(true);
    try {
      await usersAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return toast.error('No workspace selected');
    setSaving(true);
    try {
      await workspacesAPI.invite(activeWorkspace._id, inviteForm);
      toast.success(`Invite sent to ${inviteForm.email}`);
      setInviteForm({ email: '', role: 'member' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send invite'); }
    setSaving(false);
  };

  const TABS = ['profile', 'password', 'workspace', 'notifications'];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-all capitalize ${
              activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <>
          <Section title="Profile" description="Update your personal information">
            <div className="flex items-center gap-4 mb-5">
              <Avatar name={user?.name} src={user?.avatar} size={56} />
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
                <p className="text-[11px] text-muted mt-0.5 capitalize">{user?.role}</p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={profileForm.email} disabled />
                <p className="text-[11px] text-muted mt-1">Email cannot be changed</p>
              </div>
              <div className="flex items-center gap-2">
                {user?.isEmailVerified ? (
                  <span className="flex items-center gap-1.5 text-xs text-green">
                    <i className="ti ti-check-circle" /> Email verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber">
                    <i className="ti ti-alert-circle" /> Email not verified
                  </span>
                )}
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <i className="ti ti-loader-2 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </Section>
        </>
      )}

      {activeTab === 'password' && (
        <Section title="Change Password" description="Use a strong, unique password">
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Repeat new password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <i className="ti ti-loader-2 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </Section>
      )}

      {activeTab === 'workspace' && (
        <>
          <Section title="Invite Members" description={`Invite people to ${activeWorkspace?.name}`}>
            <form onSubmit={sendInvite} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="colleague@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <i className="ti ti-loader-2 animate-spin" /> : <><i className="ti ti-mail" /> Send Invite</>}
              </button>
            </form>
          </Section>

          <Section title="Workspaces" description="Your workspace memberships">
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div key={ws._id} className="flex items-center gap-3 p-3 bg-surface2 rounded-xl">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: ws.color }}>
                    {ws.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ws.name}</p>
                    <p className="text-xs text-muted">{ws.members?.length} members</p>
                  </div>
                  {ws.owner === user?._id && (
                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">Owner</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {activeTab === 'notifications' && (
        <Section title="Notification Preferences" description="Choose what you want to be notified about">
          <div className="space-y-4">
            {[
              { key: 'taskAssigned', label: 'Task assigned to me', desc: 'When someone assigns you a task' },
              { key: 'mentioned', label: 'Mentions', desc: 'When you are @mentioned in comments' },
              { key: 'deadlineReminder', label: 'Deadline reminders', desc: 'Reminders before tasks are due' },
              { key: 'email', label: 'Email notifications', desc: 'Receive notifications via email' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-none">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked={user?.preferences?.notifications?.[key] !== false}
                    onChange={async (e) => {
                      try {
                        const { data } = await usersAPI.updateMe({
                          preferences: {
                            ...user.preferences,
                            notifications: {
                              ...user.preferences?.notifications,
                              [key]: e.target.checked,
                            },
                          },
                        });
                        updateUser(data.user);
                      } catch (err) {console.error(err)}
                    }}
                  />
                  <div className="w-9 h-5 bg-surface3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
                </label>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}