import { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import toast from 'react-hot-toast';

export default function CreateTaskModal({ columnId, boardId, projectId, workspaceId, onClose }) {
  const { createTask } = useBoardStore();
  const [form, setForm] = useState({ title: '', priority: 'medium', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      await createTask({
        ...form,
        columnId,
        board: boardId,
        project: projectId,
        workspace: workspaceId,
        dueDate: form.dueDate || undefined,
      });
      toast.success('Task created');
      onClose();
    } catch (err) {
        console.log('Failed to create task', err);
        
      toast.error('Failed to create task');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">New Task</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><i className="ti ti-x" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="Task title…"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}