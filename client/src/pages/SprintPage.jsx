import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sprintsAPI, tasksAPI } from '../api/apiFunctions.js';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { format, differenceInDays, isPast } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CreateSprintModal from '../components/CreateSprintModal.jsx';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  planning: { label: 'Planning', color: '#6b7590' },
  active: { label: 'Active', color: '#4f8ef7' },
  completed: { label: 'Completed', color: '#22d3a0' },
  cancelled: { label: 'Cancelled', color: '#f25c5c' },
};

function SprintCard({ sprint, tasks, onActivate, onComplete, onDelete }) {
  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const daysLeft = differenceInDays(new Date(sprint.endDate), new Date());
  const meta = STATUS_MAP[sprint.status];

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold">{sprint.name}</h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${meta.color}18`, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          {sprint.goal && <p className="text-xs text-muted">{sprint.goal}</p>}
        </div>
        <div className="flex gap-1">
          {sprint.status === 'planning' && (
            <button onClick={() => onActivate(sprint._id)} className="btn-primary text-xs py-1">
              Start Sprint
            </button>
          )}
          {sprint.status === 'active' && (
            <button onClick={() => onComplete(sprint._id)} className="btn-secondary text-xs py-1">
              Complete
            </button>
          )}
          {sprint.status !== 'active' && (
            <button onClick={() => onDelete(sprint._id)} className="btn-ghost text-xs py-1 text-danger">
              <i className="ti ti-trash text-sm" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted mb-4">
        <span className="flex items-center gap-1">
          <i className="ti ti-calendar text-xs" />
          {format(new Date(sprint.startDate), 'MMM d')} – {format(new Date(sprint.endDate), 'MMM d, yyyy')}
        </span>
        {sprint.status === 'active' && (
          <span className={`flex items-center gap-1 font-medium ${daysLeft < 2 ? 'text-danger' : daysLeft < 4 ? 'text-amber' : 'text-muted'}`}>
            <i className="ti ti-clock text-xs" />
            {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2 bg-surface3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct === 100 ? '#22d3a0' : '#4f8ef7' }}
          />
        </div>
        <span className="text-xs text-muted font-medium w-10 text-right">{pct}%</span>
      </div>
      <div className="flex gap-4 text-[11px] text-muted">
        <span><span className="text-green font-medium">{done}</span> done</span>
        <span><span className="text-accent font-medium">{total - done}</span> remaining</span>
        {sprint.capacity > 0 && <span><span className="font-medium text-white">{sprint.capacity}</span> pts capacity</span>}
      </div>

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-border pt-4">
          {tasks.slice(0, 5).map((t) => (
            <div key={t._id} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === 'done' ? 'bg-green' : 'bg-muted'}`} />
              <span className={`flex-1 truncate ${t.status === 'done' ? 'line-through text-muted' : ''}`}>{t.title}</span>
              {t.storyPoints > 0 && <span className="text-muted">{t.storyPoints}pt</span>}
            </div>
          ))}
          {tasks.length > 5 && (
            <p className="text-xs text-muted pl-3.5">+{tasks.length - 5} more tasks</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SprintPage() {
  const { projectId } = useParams();
  const { activeProject, activeWorkspace } = useWorkspaceStore();
  const [sprints, setSprints] = useState([]);
  const [sprintTasks, setSprintTasks] = useState({});
  const [backlog, setBacklog] = useState([]);
  const [burndown, setBurndown] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sprints');


  const loadAll = async () => {
    setLoading(true);
    try {
      const [sprintRes, backlogRes] = await Promise.all([
        sprintsAPI.getAll(projectId),
        tasksAPI.getAll({ project: projectId, sprint: 'none', limit: 100 }),
      ]);
      setSprints(sprintRes.data.sprints);
      setBacklog(backlogRes.data.tasks);

      // Load tasks for each sprint
      const taskMap = {};
      await Promise.all(
        sprintRes.data.sprints.map(async (s) => {
          const res = await sprintsAPI.get(s._id);
          taskMap[s._id] = res.data.tasks;
          if (s.status === 'active') {
            const bd = await sprintsAPI.getBurndown(s._id);
            setBurndown(bd.data);
          }
        })
      );
      setSprintTasks(taskMap);
    } catch (err) {console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [projectId]);


  const handleActivate = async (id) => {
    try {
      await sprintsAPI.update(id, { status: 'active', project: projectId });
      toast.success('Sprint started!');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start sprint');
    }
  };

  const handleComplete = async (id) => {
    try {
      await sprintsAPI.update(id, { status: 'completed', project: projectId });
      toast.success('Sprint completed!');
      loadAll();
    } catch (_) { toast.error('Failed to complete sprint'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sprint? Tasks will return to backlog.')) return;
    try {
      await sprintsAPI.delete(id);
      toast.success('Sprint deleted');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete sprint');
    }
  };

  const activeSprint = sprints.find((s) => s.status === 'active');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">{activeProject?.name} — Sprints</h1>
          <p className="text-sm text-muted mt-1">{sprints.length} sprints · {backlog.length} in backlog</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <i className="ti ti-plus" /> New Sprint
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {['sprints', 'backlog', ...(activeSprint ? ['burndown'] : [])].map((tab) => (
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

      {loading ? (
        <div className="flex justify-center py-20"><i className="ti ti-loader-2 animate-spin text-2xl text-muted" /></div>
      ) : (
        <>
          {activeTab === 'sprints' && (
            <div className="space-y-4">
              {sprints.length === 0 && (
                <div className="card p-12 text-center">
                  <i className="ti ti-rocket text-3xl text-muted/30 block mb-3" />
                  <p className="text-sm text-muted">No sprints yet. Create your first sprint to start planning.</p>
                </div>
              )}
              {sprints.map((s) => (
                <SprintCard
                  key={s._id}
                  sprint={s}
                  tasks={sprintTasks[s._id] || []}
                  onActivate={handleActivate}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {activeTab === 'backlog' && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold">Backlog</span>
                <span className="text-xs text-muted">{backlog.length} tasks</span>
              </div>
              {backlog.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted">Backlog is empty</div>
              ) : (
                <div className="divide-y divide-border">
                  {backlog.map((task) => (
                    <div key={task._id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition-colors">
                      <span
                        className="w-1.5 h-5 rounded-full flex-shrink-0"
                        style={{ background: { urgent: '#e85c9f', high: '#f25c5c', medium: '#f5a623', low: '#22d3a0' }[task.priority] }}
                      />
                      <span className="flex-1 text-sm">{task.title}</span>
                      <span className="text-xs text-muted capitalize">{task.priority}</span>
                      {task.storyPoints > 0 && (
                        <span className="text-xs bg-surface3 px-2 py-0.5 rounded-full">{task.storyPoints}pt</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'burndown' && burndown && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Sprint Burndown — {activeSprint?.name}</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={burndown.ideal?.map((d, i) => ({
                  ...d,
                  actual: burndown.burndown?.[i]?.remaining,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6b7590', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7590', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#6b7590' }} />
                  <Line type="monotone" dataKey="ideal" stroke="#6b7590" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Ideal" />
                  <Line type="monotone" dataKey="actual" stroke="#4f8ef7" strokeWidth={2.5} dot={{ fill: '#4f8ef7', r: 3 }} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateSprintModal
          projectId={projectId}
          workspaceId={activeWorkspace?._id}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAll(); }}
        />
      )}
    </div>
  );
}