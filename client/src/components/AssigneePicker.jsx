import { useState, useEffect, useRef } from "react";
import { usersAPI } from "../api/apiFunctions.js";
import Avatar from "./Avatar.jsx";


// ── Assignee Picker ────────────────────────────────────────────────────────
function AssigneePicker({ assignees, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search users as user types
  useEffect(() => {
    if (!search.trim()) { 
        setResults([]); 
        return; 
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await usersAPI.searchUsers(search);
        setResults(data.users);
      } catch (err) {
        console.error(err);
        
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const isAssigned = (userId) => assignees.some((a) => (a._id || a) === userId);

  const toggle = (user) => {
    const already = isAssigned(user._id);
    const updated = already
      ? assignees.filter((a) => (a._id || a) !== user._id)
      : [...assignees, user];
    onUpdate(updated);
  };

  return (
    <div className="relative" ref={ref}>
      <label className="label">Assignees</label>

      {/* Current assignees */}
      <div className="flex flex-wrap gap-1 mb-2">
        {assignees.length === 0 && (
          <span className="text-xs text-muted italic">No assignees</span>
        )}
        {assignees.map((a) => (
          <div
            key={a._id || a}
            className="flex items-center gap-1.5 bg-surface2 border border-border rounded-full pl-1 pr-2 py-0.5 group"
          >
            <Avatar name={a.name} src={a.avatar} size={16} />
            <span className="text-xs">{a.name?.split(' ')[0]}</span>
            <button
              onClick={() => toggle(a)}
              className="text-muted hover:text-danger ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <i className="ti ti-x text-[10px]" />
            </button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 transition-colors"
      >
        <i className="ti ti-user-plus text-sm" />
        Assign member
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-surface2 rounded-lg px-2 py-1.5">
              <i className="ti ti-search text-muted text-xs" />
              <input
                autoFocus
                className="bg-transparent text-xs outline-none text-white placeholder-muted w-full"
                placeholder="Search members…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {searching && (
              <div className="flex justify-center py-4">
                <i className="ti ti-loader-2 animate-spin text-muted" />
              </div>
            )}
            {!searching && search && results.length === 0 && (
              <p className="text-xs text-muted text-center py-4">No members found</p>
            )}
            {!searching && !search && (
              <p className="text-xs text-muted text-center py-4">Type a name to search</p>
            )}
            {results.map((u) => {
              const assigned = isAssigned(u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => toggle(u)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface2 transition-colors"
                >
                  <Avatar name={u.name} src={u.avatar} size={24} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-medium truncate">{u.name}</p>
                    <p className="text-[10px] text-muted truncate">{u.email}</p>
                  </div>
                  {assigned && (
                    <i className="ti ti-check text-accent text-sm flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


export default AssigneePicker