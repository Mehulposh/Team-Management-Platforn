import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../zustand/authStore.js';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { analyticsAPI, tasksAPI } from '../api/apiFunctions.js';
import Avatar from '../components/Avatar.jsx';
import { format, isPast, isToday } from 'date-fns';

const PRIORITY_COLORS = { urgent: '#e85c9f', high: '#f25c5c', medium: '#f5a623', low: '#22d3a0' };

function StatCard({ icon, label, value, sub, color = '#4f8ef7' }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <i className={`ti ti-${icon} text-lg`} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-semibold font-mono">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { projects, activeWorkspace } = useWorkspaceStore();
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    analyticsAPI.getMe().then(({ data }) => setStats(data)).catch(() => {});
    tasksAPI.getAll({ assignee: user?._id, limit: 8 }).then(({ data }) => setMyTasks(data.tasks)).catch(() => {});
  }, [user?._id]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-semibold">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-muted mt-1">
          {activeWorkspace?.name} · {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard icon="list-check" label="My Open Tasks" value={stats?.myTasks ?? '—'} color="#4f8ef7" />
        <StatCard icon="check" label="Completed This Week" value={stats?.completedThisWeek ?? '—'} sub="↑ this week" color="#22d3a0" />
        <StatCard icon="alert-circle" label="Overdue" value={stats?.overdue ?? '—'} color="#f25c5c" />
        <StatCard icon="layout-kanban" label="Active Projects" value={projects.filter(p => p.status === 'active').length} color="#7c5cfc" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">My Tasks</h2>
            <span className="text-xs text-muted">{myTasks.length} tasks</span>
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 && (
              <div className="card p-8 text-center text-sm text-muted">
                <i className="ti ti-check-circle text-2xl block mb-2 opacity-30" />
                No tasks assigned to you
              </div>
            )}
            {myTasks.map((task) => {
              const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
              const dueToday = task.dueDate && isToday(new Date(task.dueDate));
              return (
                <div
                  key={task._id}
                  onClick={() => navigate(`/projects/${task.project}/board`)}
                  className="card p-3.5 flex items-center gap-3 cursor-pointer hover:border-border2 transition-all"
                >
                  <div
                    className="w-1.5 h-10 rounded-full flex-shrink-0"
                    style={{ background: PRIORITY_COLORS[task.priority] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`status-${task.status} text-[10px]`}>{task.status.replace('_', ' ')}</span>
                      {task.dueDate && (
                        <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-danger' : dueToday ? 'text-amber' : 'text-muted'}`}>
                          <i className="ti ti-calendar text-xs" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <i className="ti ti-chevron-right text-muted text-sm" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Projects</h2>
            <span className="text-xs text-muted">{projects.length}</span>
          </div>
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p._id}
                onClick={() => navigate(`/projects/${p._id}/board`)}
                className="card p-3.5 flex items-center gap-3 cursor-pointer hover:border-border2 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p.color}20` }}>
                  <i className="ti ti-layout-kanban text-sm" style={{ color: p.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[11px] text-muted">{p.members?.length} members</p>
                </div>
                <div className="flex -space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.members?.slice(0, 3).map((m, i) => (
                    <Avatar key={i} name={m.user?.name} src={m.user?.avatar} size={20} />
                  ))}
                </div>
                <i className="ti ti-chevron-right text-muted text-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}