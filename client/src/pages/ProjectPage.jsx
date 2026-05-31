import { useEffect } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { projectsAPI } from '../api/apiFunctions.js';

export default function ProjectPage() {
  const { projectId } = useParams();
  const { projects, setActiveProject, activeProject } = useWorkspaceStore();
  const navigate = useNavigate();

  useEffect(() => {
    const found = projects.find((p) => p._id === projectId);
    if (found) {
      setActiveProject(found);
    } else {
      projectsAPI.get(projectId)
        .then(({ data }) => setActiveProject(data.project))
        .catch(() => navigate('/'));
    }
    // Redirect to board by default
    navigate(`/projects/${projectId}/board`, { replace: true });
  }, [projectId]);

  return null;
}