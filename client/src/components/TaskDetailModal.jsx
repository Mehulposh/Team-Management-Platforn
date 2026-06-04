import { useState, useEffect ,useCallback } from 'react';
import { tasksAPI, commentsAPI  } from '../api/apiFunctions.js';
import { useAuthStore } from '../zustand/authStore.js';
import { useBoardStore } from '../zustand/boardStore.js';
import Avatar from './Avatar.jsx';
import AssigneePicker from './AssigneePicker.jsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];



export default function TaskDetailModal({ task: initialTask, onClose }) {
  const { user } = useAuthStore();
  const { updateTask } = useBoardStore();
  const [task, setTask] = useState(initialTask);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
 

  
  const loadTask = useCallback(async () => {
    try {
      const { data } = await tasksAPI.get(initialTask._id);
      setTask(data.task);
    } catch (err) {console.log(err);
    }
  },[initialTask._id])

  const loadComments = useCallback(async () => {
    try {
      const { data } = await commentsAPI.getAll(initialTask._id);
      setComments(data.comments);
    } catch (err) {console.log(err);
    }
  }, [initialTask._id])

  useEffect(() => {
    loadTask();
    loadComments();
  }, [loadComments, loadTask]);

  const handleUpdate = async (field, value) => {
    try {
      const { data } = await tasksAPI.update(task._id, { [field]: value });
      setTask(data.task);
      updateTask(task._id, { [field]: value });
    } catch (err) { 
        console.log('Failed to update', err);
        toast.error('Failed to update'); 
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await commentsAPI.create({ task: task._id, content: newComment });
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
    } catch (err) { 
        console.log('Failed to add comment', err);
     toast.error('Failed to add comment'); }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const { data } = await tasksAPI.addSubtask(task._id, newSubtask);
      setTask(data.task);
      setNewSubtask('');
    } catch (err) { 
        console.log('Failed to add subtask', err);
        toast.error('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const { data } = await tasksAPI.toggleSubtask(task._id, subtaskId);
      setTask(data.task);
    } catch (err) {console.log(err);
    }
  };

  // Called by AssigneePicker with the full updated assignees array
  const handleAssigneesUpdate = async (updatedAssignees) => {
    const ids = updatedAssignees.map((a) => a._id || a);
    try {
      const { data } = await tasksAPI.updateAssignees(task._id, ids);
      setTask((prev) => ({ ...prev, assignees: data.task.assignees }));
      updateTask(task._id, { assignees: data.task.assignees });
      toast.success('Assignees updated');
    } catch (_) { toast.error('Failed to update assignees'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-3xl max-h-screen sm:max-h-[90vh] flex flex-col animate-slide-up">        {/* Header */}
        <div className="flex items-start gap-3 p-4 sm:p-5 border-b border-border">
          <div className="flex-1">
            <input
              className="w-full bg-transparent text-base font-semibold outline-none border-none text-white placeholder-muted"
              defaultValue={task.title}
              onBlur={(e) => handleUpdate('title', e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`status-${task.status}`}>
                {task.status.replace('_', ' ')}
              </span>
              <select
                value={task.priority}
                onChange={(e) => handleUpdate('priority', e.target.value)}
                className="text-xs bg-surface2 border border-border rounded-lg px-2 py-1 outline-none text-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
              {task.dueDate && (
                <span className="text-xs text-muted flex items-center gap-1">
                  <i className="ti ti-calendar" /> {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors mt-1">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-border px-2 sm:px-5">
          {['overview', 'activity', 'attachments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 text-xs font-medium  whitespace-nowrap border-b-2 transition-all capitalize ${
                activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="flex flex-col lg:flex-row">
              {/* Left: description + subtasks + comments */}
              <div className="flex-1 p-4 sm:p-5 space-y-5">
                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input resize-none"
                    rows={4}
                    defaultValue={task.description}
                    onBlur={(e) => handleUpdate('description', e.target.value)}
                    placeholder="Add a description…"
                  />
                </div>

                {/* Subtasks */}
                <div>
                  <label className="label">Subtasks ({task.subtasks?.filter(s => s.isCompleted).length}/{task.subtasks?.length})</label>
                  <div className="space-y-1.5 mb-2">
                    {task.subtasks?.map((s) => (
                      <label key={s._id} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={s.isCompleted}
                          onChange={() => handleToggleSubtask(s._id)}
                          className="accent-accent"
                        />
                        <span className={`text-sm ${s.isCompleted ? 'line-through text-muted' : ''}`}>
                          {s.title}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="input text-xs flex-1"
                      placeholder="Add subtask…"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    />
                    <button onClick={handleAddSubtask} className="btn-secondary text-xs">Add</button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="label">Comments ({comments.length})</label>
                  <div className="space-y-3 mb-3">
                    {comments.map((c) => (
                      <div key={c._id} className="flex gap-2.5">
                        <Avatar name={c.author?.name} src={c.author?.avatar} size={28} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{c.author?.name}</span>
                            <span className="text-[10px] text-muted">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                            {c.isEdited && <span className="text-[10px] text-muted">(edited)</span>}
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">{c.content}</p>
                          {c.reactions?.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {c.reactions.map((r) => (
                                <span key={r.emoji} className="text-xs bg-surface3 border border-border px-2 py-0.5 rounded-full">
                                  {r.emoji} {r.users.length}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Avatar name={user?.name} src={user?.avatar} size={28} />
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <input
                        className="input text-sm flex-1"
                        placeholder="Write a comment…"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                      />
                      <button onClick={handleAddComment} className="btn-primary text-xs">Post</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: metadata */}
              <div className="w-full lg:w-52 p-5 border-t lg:border-t-0 lg:border-l border-border space-y-4 flex-shrink-0">
                
               <AssigneePicker 
                 assignees={task.assignees || []}
                 onUpdate={handleAssigneesUpdate}
               />
                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    className="input text-xs"
                    defaultValue={task.dueDate ? task.dueDate.split('T')[0] : ''}
                    onChange={(e) => handleUpdate('dueDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Story Points</label>
                  <input
                    type="number"
                    className="input text-xs"
                    defaultValue={task.storyPoints}
                    onBlur={(e) => handleUpdate('storyPoints', parseInt(e.target.value))}
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Est. Hours</label>
                  <input
                    type="number"
                    className="input text-xs"
                    defaultValue={task.estimatedHours}
                    onBlur={(e) => handleUpdate('estimatedHours', parseFloat(e.target.value))}
                    min={0}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="label">Creator</label>
                  <div className="flex items-center gap-1.5">
                    <Avatar name={task.creator?.name} src={task.creator?.avatar} size={18} />
                    <span className="text-xs text-muted">{task.creator?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="p-5 space-y-3">
              {task.activity?.slice().reverse().map((a, i) => (
                <div key={i} className="flex gap-2.5 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white/70">{a.message}</span>
                    <span className="text-muted text-xs ml-2">{format(new Date(a.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="p-5">
              {task.attachments?.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No attachments yet</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {task.attachments?.map((a) => (
                  <a
                    key={a._id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 bg-surface2 border border-border rounded-xl hover:border-border2 transition-all"
                  >
                    <i className={`ti ti-${a.mimetype?.startsWith('image/') ? 'photo' : 'file'} text-accent`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{a.filename}</div>
                      <div className="text-[10px] text-muted">{Math.round(a.size / 1024)}KB</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}