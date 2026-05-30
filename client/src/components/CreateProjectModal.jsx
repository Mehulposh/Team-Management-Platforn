import { useState } from 'react';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const COLORS = ['#4f8ef7', '#7c5cfc', '#22d3a0', '#f5a623', '#f25c5c', '#e85c9f'];

// Step 1 shown when user has no workspace yet
function CreateWorkspaceStep({ onDone }) {
  const { createWorkspace } = useWorkspaceStore();
  const [form, setForm] = useState({ name: '', color: '#4f8ef7' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Workspace name is required');
    setLoading(true);
    try {
      const ws = await createWorkspace(form);
      toast.success(`Workspace "${ws.name}" created!`);
      onDone(ws);
    } catch (err) {
      console.error('Failed to create workspace',err);
      
      toast.error('Failed to create workspace');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="font-semibold">Create your Workspace</h2>
          <p className="text-xs text-muted mt-0.5">You need a workspace before creating a project</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">Workspace Name</label>
          <input
            className="input"
            placeholder="e.g. Acme Engineering"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                style={{
                  background: c,
                  outline: form.color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2">
          {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Create Workspace & Continue →'}
        </button>
      </form>
    </>
  );
}

// Step 2 — actual project creation
function CreateProjectStep({ workspaceId, workspaceName, onClose }) {
  const { createProject } = useWorkspaceStore();
  const [form, setForm] = useState({ name: '', description: '', color: '#4f8ef7' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setLoading(true);
    try {
      const project = await createProject({ ...form, workspace: workspaceId });
      toast.success('Project created!');
      onClose();
      navigate(`/projects/${project._id}/board`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create project');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h2 className="font-semibold">New Project</h2>
          <p className="text-xs text-muted mt-0.5">
            in <span className="text-white">{workspaceName}</span>
          </p>
        </div>
        <button onClick={onClose} className="text-muted hover:text-white transition-colors">
          <i className="ti ti-x text-lg" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">Project Name</label>
          <input
            className="input"
            placeholder="e.g. Platform Redesign"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label">Description <span className="text-muted">(optional)</span></label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="What is this project about?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                style={{
                  background: c,
                  outline: form.color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Create Project'}
          </button>
        </div>
      </form>
    </>
  );
}

export default function CreateProjectModal({ onClose, workspaceId: propWorkspaceId }) {
  const { activeWorkspace, workspaces } = useWorkspaceStore();

  // Resolve workspace: prefer prop → activeWorkspace → first in list
  const resolvedWsId =
    propWorkspaceId ||
    activeWorkspace?._id ||
    workspaces[0]?._id ||
    null;

  const resolvedWsName =
    activeWorkspace?.name ||
    workspaces[0]?.name ||
    '';

  // Track workspace created during this modal session
  const [createdWs, setCreatedWs] = useState(null);

  const finalWsId = createdWs?._id || resolvedWsId;
  const finalWsName = createdWs?.name || resolvedWsName;
  const needsWorkspace = !finalWsId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {needsWorkspace ? (
          <CreateWorkspaceStep onDone={(ws) => setCreatedWs(ws)} />
        ) : (
          <CreateProjectStep
            workspaceId={finalWsId}
            workspaceName={finalWsName}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}