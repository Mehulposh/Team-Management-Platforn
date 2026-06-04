import { useState , useEffect} from 'react';
import { useAuthStore } from '../zustand/authStore.js';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { usersAPI, workspacesAPI } from '../api/apiFunctions.js';
import Avatar from '../components/Avatar.jsx';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  admin: { label: 'Admin', color: 'text-pink bg-pink/10' },
  project_manager: { label: 'Project Manager', color: 'text-accent bg-accent/10' },
  member: { label: 'Member', color: 'text-green bg-green/10' },
  viewer: { label: 'Viewer', color: 'text-muted bg-surface3' },
};

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
  const { activeWorkspace, workspaces, fetchWorkspaces } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', role: 'member',});
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

   const loadMembers = async () => {
    setLoadingMembers(true);

    try {
      const { data } = await workspacesAPI.get(activeWorkspace._id);
      setMembers(data.workspace.members || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load members');  
    }

    setLoadingMembers(false);
  };

  // Direct add — instant, no email needed
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return toast.error('No workspace selected');
    if (!addForm.email.trim()) return toast.error('Email is required');
    setSaving(true);
    try {
      const { data } = await workspacesAPI.addMember(activeWorkspace._id, addForm);
      toast.success(data.message);
      setAddForm({ email: '', role: 'member' });
      loadMembers();
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    }
    setSaving(false);
  };

  const handleRemoveMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    try {
      await workspacesAPI.removeMember(activeWorkspace._id, userId);
      toast.success(`${name} removed`);
      loadMembers();
      fetchWorkspaces();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await workspacesAPI.updateMemberRole(activeWorkspace._id, userId, role);
      toast.success('Role updated');
      loadMembers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const isOwner = activeWorkspace?.owner === user?._id || activeWorkspace?.owner?._id === user?._id;

  const TABS = ['profile', 'password', 'workspace', 'notifications'];
  useEffect(() => {
    if (activeTab === 'workspace' && activeWorkspace?._id) {
      loadMembers();
    }
  }, [activeTab, activeWorkspace?._id]);
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-all capitalize whitespace-nowrap ${
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
              <Avatar name={user?.name} src={user?.avatar} size={52} />
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

       {/* ── Workspace ── */}
      {activeTab === 'workspace' && (
        <>
          {/* Add member directly */}
          <Section
            title="Add Member"
            description={`Add anyone to ${activeWorkspace?.name || 'your workspace'} instantly by their email address. They must have a TeamFlow account.`}
          >
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label className="label">Email Address</label>
                  <input type="email" className="input" placeholder="colleague@company.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required />
                </div>
                <div className="w-full sm:w-40">
                  <label className="label">Role</label>
                  <select className="input" value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
 
              {/* Info box */}
              <div className="flex items-start gap-2 p-3 bg-accent/8 border border-accent/20 rounded-xl">
                <i className="ti ti-info-circle text-accent text-base flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/70 leading-relaxed">
                  The user will be added <strong className="text-white">immediately</strong> — no email required.
                  They'll see this workspace next time they log in or refresh.
                </p>
              </div>
 
              <button type="submit" disabled={saving} className="btn-primary">
                {saving
                  ? <i className="ti ti-loader-2 animate-spin" />
                  : <><i className="ti ti-user-plus" /> Add to Workspace</>
                }
              </button>
            </form>
          </Section>
 
          {/* Current members */}
          <Section title={`Members (${members.length})`} description="Manage roles and access">
            {loadingMembers ? (
              <div className="flex justify-center py-6">
                <i className="ti ti-loader-2 animate-spin text-muted text-xl" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const memberUser = m.user || {};
                  const isMe = memberUser._id === user?._id;
                  const roleInfo = ROLE_LABELS[m.role] || ROLE_LABELS.member;
                  const isWorkspaceOwner =
                    activeWorkspace?.owner === memberUser._id ||
                    activeWorkspace?.owner?._id === memberUser._id;
 
                  return (
                    <div 
                      key={m._id || memberUser._id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-surface2 rounded-xl border border-border"
                    >
                      <Avatar name={memberUser.name} src={memberUser.avatar} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{memberUser.name}</span>
                          {isMe && <span className="text-[10px] text-muted">(you)</span>}
                          {isWorkspaceOwner && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber/10 text-amber">Owner</span>
                          )}
                        </div>
                        <p className="text-xs text-muted truncate">{memberUser.email}</p>
                      </div>
 
                      {/* Role badge / selector */}
                      {isOwner && !isMe && !isWorkspaceOwner ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(memberUser._id, e.target.value)}
                          className="text-xs bg-surface3 border border-border rounded-lg px-2 py-1 outline-none text-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="project_manager">Project Manager</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      )}
 
                      {/* Remove button */}
                      {isOwner && !isMe && !isWorkspaceOwner && (
                        <button
                          onClick={() => handleRemoveMember(memberUser._id, memberUser.name)}
                          className="text-muted hover:text-danger transition-colors ml-1 flex-shrink-0"
                          title="Remove member"
                        >
                          <i className="ti ti-user-x text-sm" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
            
          {/* Workspace switcher */}
          <Section title="Your Workspaces">
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div key={ws._id} className="flex items-center gap-3 p-3 bg-surface2 rounded-xl">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: ws.color }}>
                    {ws.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ws.name}</p>
                    <p className="text-xs text-muted">{ws.members?.length ?? 0} members</p>
                  </div>
                  {(ws.owner === user?._id || ws.owner?._id === user?._id) && (
                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full flex-shrink-0">Owner</span>
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