import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { analyticsAPI, sprintsAPI } from '../api/apiFunctions.js';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import Avatar from '../components/Avatar.jsx';

const STATUS_COLORS = { todo: '#6b7590', in_progress: '#4f8ef7', review: '#f5a623', done: '#22d3a0' };
const PRIORITY_COLORS = { low: '#22d3a0', medium: '#f5a623', high: '#f25c5c', urgent: '#e85c9f' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const { projectId } = useParams();
  const { activeProject, activeWorkspace } = useWorkspaceStore();
  const [data, setData] = useState(null);
  const [wsData, setWsData] = useState(null);
  const [burndown, setBurndown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [projRes, wsRes] = await Promise.all([
          analyticsAPI.getProject(projectId),
          activeWorkspace ? analyticsAPI.getWorkspace(activeWorkspace._id) : Promise.resolve(null),
        ]);
        setData(projRes.data);
        if (wsRes) setWsData(wsRes.data);

        // Try active sprint burndown
        if (wsRes?.data?.activeSprint) {
          const bd = await sprintsAPI.getBurndown(wsRes.data.activeSprint._id);
          setBurndown(bd.data);
        }
      } catch (err) {
        console.log(err);
        
      }
      setLoading(false);
    };
    if (projectId) load();
  }, [projectId, activeWorkspace?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <i className="ti ti-loader-2 animate-spin text-2xl text-muted" />
      </div>
    );
  }

  const statusData = data?.tasksByStatus?.map((s) => ({
    name: s._id.replace('_', ' '),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6b7590',
  })) || [];

  const priorityData = data?.tasksByPriority?.map((p) => ({
    name: p._id,
    value: p.count,
    color: PRIORITY_COLORS[p._id] || '#6b7590',
  })) || [];

  const completionData = data?.completionByDay?.map((d) => ({
    date: d._id,
    completed: d.count,
  })) || [];

  const velocityData = wsData?.velocityTrend?.map((s) => ({
    sprint: s.name,
    velocity: s.velocity,
    capacity: s.capacity,
  })) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">{activeProject?.name} — Analytics</h1>
        <p className="text-sm text-muted mt-1">Project performance overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: data?.tasksByStatus?.reduce((s, x) => s + x.count, 0) ?? 0, icon: 'list', color: '#4f8ef7' },
          { label: 'Completed (30d)', value: data?.completedLast30 ?? 0, icon: 'check', color: '#22d3a0' },
          { label: 'Overdue', value: data?.overdueCount ?? 0, icon: 'alert-circle', color: '#f25c5c' },
          { label: 'Workspace Velocity', value: wsData?.velocityTrend?.slice(-1)[0]?.velocity ?? '—', icon: 'chart-line', color: '#7c5cfc' },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}18` }}>
              <i className={`ti ti-${kpi.icon}`} style={{ color: kpi.color }} />
            </div>
            <div className="text-2xl font-semibold font-mono">{kpi.value}</div>
            <div className="text-xs text-muted mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Section title="Tasks by Status">
          <div className="card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted capitalize">{s.name}</span>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Tasks by Priority */}
        <Section title="Tasks by Priority">
          <div className="card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7590', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7590', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Completion Trend */}
        <Section title="Task Completion (Last 14 Days)">
          <div className="card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7590', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7590', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="completed" stroke="#22d3a0" strokeWidth={2} dot={{ fill: '#22d3a0', r: 3 }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Sprint Velocity */}
        <Section title="Sprint Velocity Trend">
          <div className="card p-4">
            {velocityData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted">No sprint data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={velocityData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="sprint" tick={{ fill: '#6b7590', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7590', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#6b7590' }} />
                  <Bar dataKey="capacity" fill="#4f8ef733" radius={[4, 4, 0, 0]} name="Capacity" />
                  <Bar dataKey="velocity" fill="#4f8ef7" radius={[4, 4, 0, 0]} name="Velocity" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      {/* Workload by Assignee */}
      {data?.workloadByAssignee?.length > 0 && (
        <Section title="Team Workload">
          <div className="card p-4">
            <div className="space-y-3">
              {data.workloadByAssignee.map((member) => {
                const max = Math.max(...data.workloadByAssignee.map((m) => m.count));
                const pct = Math.round((member.count / max) * 100);
                return (
                  <div key={member._id} className="flex items-center gap-3">
                    <Avatar name={member.name} src={member.avatar} size={28} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted">{member.count} tasks</span>
                      </div>
                      <div className="h-2 bg-surface3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct > 80 ? '#f25c5c' : pct > 50 ? '#f5a623' : '#4f8ef7' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}