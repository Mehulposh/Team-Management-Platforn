import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../zustand/notificationStore.js';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS = {
  task_assigned: { icon: 'ti-user-check', color: '#4f8ef7' },
  task_mentioned: { icon: 'ti-at', color: '#7c5cfc' },
  task_commented: { icon: 'ti-message', color: '#22d3a0' },
  task_completed: { icon: 'ti-check', color: '#22d3a0' },
  task_due_soon: { icon: 'ti-clock', color: '#f5a623' },
  task_overdue: { icon: 'ti-alert-circle', color: '#f25c5c' },
  sprint_started: { icon: 'ti-rocket', color: '#4f8ef7' },
  workspace_invite: { icon: 'ti-mail', color: '#e85c9f' },
  project_added: { icon: 'ti-folder-plus', color: '#22d3a0' },
};

export default function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-10 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 animate-slide-up overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-accent hover:underline">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">
            <i className="ti ti-bell-off text-2xl block mb-2 opacity-40" />
            No notifications
          </div>
        ) : (
          notifications.map((n) => {
            const meta = TYPE_ICONS[n.type] || { icon: 'ti-bell', color: '#4f8ef7' };
            return (
              <div
                key={n._id}
                onClick={() => { markRead(n._id); onClose(); }}
                className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-surface2 ${
                  !n.isRead ? 'bg-accent/5' : ''
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${meta.color}20` }}
                >
                  <i className={`ti ${meta.icon} text-sm`} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed truncate">{n.message}</p>
                  <p className="text-[10px] text-muted/60 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}