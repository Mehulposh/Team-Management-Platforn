import { useState } from 'react';
import { sprintsAPI } from '../api/apiFunctions.js';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';

export default function CreateSprintModal({ projectId, workspaceId, onClose, onCreated }) {
  const today = new Date();
  const [form, setForm] = useState({
    name: `Sprint ${Math.ceil(Math.random() * 10)}`,
    goal: '',
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(addDays(today, 14), 'yyyy-MM-dd'),
    capacity: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return toast.error('Name and dates required');
    if (new Date(form.endDate) <= new Date(form.startDate)) return toast.error('End date must be after start date');
    setLoading(true);
    try {
      await sprintsAPI.create({
        ...form,
        project: projectId,
        workspace: workspaceId,
        capacity: form.capacity ? parseInt(form.capacity) : 0,
      });
      toast.success('Sprint created');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">New Sprint</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><i className="ti ti-x" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Sprint Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Goal <span className="text-muted">(optional)</span></label>
            <textarea className="input resize-none" rows={2} placeholder="What should be achieved in this sprint?"
              value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Capacity <span className="text-muted">(story points)</span></label>
            <input type="number" className="input" placeholder="e.g. 40" min={0}
              value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}