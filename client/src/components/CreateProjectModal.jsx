import { useState } from 'react';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const COLORS = ['#4f8ef7', '#7c5cfc', '#22d3a0', '#f5a623', '#f25c5c', '#e85c9f'];

export default function CreateProjectModal({ onClose, workspaceId }) {
  const { createProject } = useWorkspaceStore();
  const [form, setForm] = useState({ name: '', description: '', color: '#4f8ef7' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workspaceId) return toast.error('No workspace selected');
    setLoading(true);
    try {
      const project = await createProject({ ...form, workspace: workspaceId });
      toast.success('Project created!');
      navigate(`/projects/${project._id}/board`);
      onClose();
    } catch (err) { 
        console.log('Failed to create project', err);
        toast.error('Failed to create project'); 
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">New Project</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><i className="ti ti-x" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Project Name</label>
            <input className="input" placeholder="e.g. Platform Redesign" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What is this project about?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}