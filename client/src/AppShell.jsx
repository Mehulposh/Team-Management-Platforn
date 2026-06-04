import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './zustand/authStore.js';
import { useWorkspaceStore } from './zustand/workspaceStore.js';
import { useNotificationStore } from './zustand/notificationStore.js';
import { useSocket } from './socket/UseSocket.js';
import NotificationPanel from './components/NotificationPanel.jsx';
import EmailVerificationBanner from './components/EmailVerificationBanner.jsx';
import CreateProjectModal from './components/CreateProjectModal.jsx';
import Avatar from './components/Avatar.jsx';

function ProjectNavItem({ project, onSelect }) {
  const location = useLocation();
  const isProjectActive = location.pathname.startsWith(`/projects/${project._id}`);
  const [expanded, setExpanded] = useState(isProjectActive);

  // Auto-expand when navigating into this project
  useEffect(() => {
    if (isProjectActive) setExpanded(true);
  }, [isProjectActive]);

  const subLink = (to, icon, label) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 pl-7 pr-2.5 py-1.5 rounded-lg text-xs transition-all ${
          isActive
            ? 'bg-accent/15 text-accent'
            : 'text-muted hover:bg-surface2 hover:text-white'
        }`
      }
    >
      <i className={`ti ti-${icon} text-xs`} />
      {label}
    </NavLink>
  );

  return (
    <div>
      {/* Project row */}
      <button
        onClick={() => {
          setExpanded((v) => !v);
          onSelect(project);
        }}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
          isProjectActive
            ? 'text-white'
            : 'text-muted hover:bg-surface2 hover:text-white'
        }`}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: project.color || '#4f8ef7' }}
        />
        <span className="flex-1 text-left truncate">{project.name}</span>
        <i
          className={`ti ti-chevron-${expanded ? 'down' : 'right'} text-xs text-muted flex-shrink-0`}
        />
      </button>

      {/* Sub-links */}
      {expanded && (
        <div className="mt-0.5 space-y-0.5 mb-1">
          {subLink(`/projects/${project._id}/board`,    'layout-kanban', 'Board')}
          {subLink(`/projects/${project._id}/sprints`,  'rocket',        'Sprints')}
         
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const {
    workspaces,
    activeWorkspace,
    projects,
    isLoading: wsLoading,
    fetchWorkspaces,
    setActiveWorkspace,
    setActiveProject,
  } = useWorkspaceStore();
  const { unreadCount, fetch: fetchNotifications } = useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  useSocket();

  useEffect(() => {
    fetchWorkspaces();
    fetchNotifications();
  }, [fetchNotifications,fetchWorkspaces]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
    {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
    )}
      {/* SIDEBAR */}
      <aside className={`fixed lg:relative z-50 lg:z-auto w-56 min-w-56 h-full bg-surface border-r border-border flex flex-col
        transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white font-bold text-sm">
            T
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-none">TeamFlow</div>
            <div className="text-[10px] text-muted mt-0.5 uppercase tracking-wide truncate">
              {activeWorkspace?.name || (wsLoading ? 'Loading…' : 'No workspace')}
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted hover:text-white ml-1"
          >
            <i className="ti ti-x text-base" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          <p className="text-[10px] text-muted uppercase tracking-wider px-2 pt-2 pb-1 font-medium">
            Main
          </p>

          <NavLink
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2 hover:text-white'
              }`
            }
          >
            <i className="ti ti-layout-dashboard text-base" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/chat"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2 hover:text-white'
              }`
            }
          >
            <i className="ti ti-message-circle text-base" />
            <span>Team Chat</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2 hover:text-white'
              }`
            }
          >
            <i className="ti ti-settings text-base" />
            <span>Settings</span>
          </NavLink>

          <p className="text-[10px] text-muted uppercase tracking-wider px-2 pt-3 pb-1 font-medium">
            Projects
          </p>

          {wsLoading && projects.length === 0 && (
            <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted">
              <i className="ti ti-loader-2 animate-spin text-sm" /> Loading…
            </div>
          )}

          {!wsLoading && projects.length === 0 && activeWorkspace && (
            <p className="px-3 py-1.5 text-xs text-muted italic">No projects yet</p>
          )}

          {projects.map((p) => (
            <ProjectNavItem
              key={p._id}
              project={p}
              onSelect={(proj) => {
                setActiveProject(proj);
                setSidebarOpen(false);
              }}
            />
          ))}

          <button
            onClick={() => {
              setShowCreateProject(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted hover:bg-surface2 hover:text-white transition-all mt-1"
          >
            <i className="ti ti-plus text-base" />
            New Project
          </button>
        </nav>

        {/* Workspaces */}
        <div className="p-2 border-t border-border">
          <p className="text-[10px] text-muted uppercase tracking-wider px-2 pb-1 font-medium">
            Workspaces
          </p>
          {workspaces.length === 0 && !wsLoading && (
            <p className="px-2 py-1 text-xs text-muted italic">No workspaces yet</p>
          )}
          {workspaces.map((ws) => (
            <button
              key={ws._id}
              onClick={() => setActiveWorkspace(ws)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                activeWorkspace?._id === ws._id
                  ? 'text-white bg-surface2'
                  : 'text-muted hover:bg-surface2 hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: ws.color || '#4f8ef7' }}
              />
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
        </div>
          
        {/* User */}
        <div className="p-3 border-t border-border flex items-center gap-2.5">
          <Avatar name={user?.name} src={user?.avatar} size={28} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.name}</div>
            <div className="text-[10px] text-muted capitalize">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted hover:text-danger transition-colors flex-shrink-0"
            title="Logout"
          >
            <i className="ti ti-logout text-base" />
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-12 bg-surface border-b border-border flex items-center gap-2 sm:gap-3 px-3 sm:px-5 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted hover:text-white flex-shrink-0"
          >
            <i className="ti ti-menu-2 text-lg" />
          </button>
          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-1.5 w-44 sm:w-52">
            <i className="ti ti-search text-muted text-sm" />
            <input
              placeholder="Search…"
              className="bg-transparent border-none outline-none text-xs text-white placeholder-muted w-full"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center text-muted hover:text-white transition-colors"
            >
              <i className="ti ti-bell text-base" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger rounded-full border border-surface" />
              )}
            </button>
            {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
          </div>

          <Avatar name={user?.name} src={user?.avatar} size={28} />
        </header>
        
         {/* Email verification banner */}
        <EmailVerificationBanner />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          workspaceId={activeWorkspace?._id}
        />
      )}
    </div>
  );
}