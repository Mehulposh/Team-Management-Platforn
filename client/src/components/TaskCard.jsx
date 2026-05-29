import { format, isPast, isToday } from 'date-fns';
import Avatar from './Avatar.jsx';

const PRIORITY_MAP = {
  urgent: { cls: 'priority-urgent', icon: 'ti-urgent', label: 'Urgent' },
  high: { cls: 'priority-high', icon: 'ti-flame', label: 'High' },
  medium: { cls: 'priority-medium', icon: 'ti-minus', label: 'Medium' },
  low: { cls: 'priority-low', icon: 'ti-arrow-down', label: 'Low' },
};

export default function TaskCard({ task, onClick, isDragging }) {
  const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const subtasksDone = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const completionPct = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`bg-surface2 border rounded-xl p-3 cursor-pointer transition-all duration-150 group ${
        isDragging
          ? 'border-accent/50 shadow-lg shadow-accent/10 rotate-1'
          : 'border-border hover:border-border2 hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {task.labels.map((l, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${l.color}20`, color: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className={`text-sm font-medium leading-snug mb-2.5 ${task.status === 'done' ? 'line-through text-muted' : ''}`}>
        {task.title}
      </p>

      {/* Priority */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={priority.cls}>
          <i className={`ti ${priority.icon} text-[10px]`} />
          {priority.label}
        </span>
      </div>

      {/* Subtask progress */}
      {subtasksTotal > 0 && (
        <div className="mb-2.5">
          <div className="flex justify-between text-[10px] text-muted mb-1">
            <span>{subtasksDone}/{subtasksTotal} subtasks</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-1 bg-surface3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${completionPct}%`, background: completionPct === 100 ? '#22d3a0' : '#4f8ef7' }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[11px] ${
              isOverdue ? 'text-danger' : isDueToday ? 'text-amber' : 'text-muted'
            }`}>
              <i className="ti ti-calendar text-xs" />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <i className="ti ti-paperclip text-xs" />
              {task.attachments.length}
            </span>
          )}
          {task._commentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <i className="ti ti-message text-xs" />
              {task._commentCount}
            </span>
          )}
        </div>

        {/* Assignees */}
        <div className="flex">
          {task.assignees?.slice(0, 3).map((a, i) => (
            <div key={a._id || i} style={{ marginLeft: i > 0 ? '-6px' : 0 }}>
              <Avatar name={a.name} src={a.avatar} size={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}