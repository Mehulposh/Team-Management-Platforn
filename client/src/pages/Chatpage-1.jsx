import { useEffect, useState, useRef, useCallback } from 'react';
import { chatAPI } from '../api/apiFunctions.js';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { useAuthStore } from '../zustand/authStore.js';
import { getSocket } from '../socket/UseSocket.js';
import Avatar from '../components/Avatar.jsx';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🚀', '👀', '✅', '🔥'];

function formatMsgTime(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

function Message({ msg, isOwn, onReact }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className={`group flex gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 hover:bg-surface2/40 transition-colors ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar name={msg.sender?.name} src={msg.sender?.avatar} size={28} />
      <div className={`flex-1 min-w-0 ${isOwn ? 'items-end flex flex-col' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold truncate max-w-[120px]">{msg.sender?.name}</span>
          <span className="text-[10px] text-muted flex-shrink-0">{formatMsgTime(msg.createdAt)}</span>
          {msg.isEdited && <span className="text-[10px] text-muted">(edited)</span>}
        </div>
        <div className={`inline-block max-w-[85%] sm:max-w-md ${isOwn ? 'bg-accent/15 border border-accent/20' : 'bg-surface2 border border-border'} rounded-2xl px-3 py-2`}>
          {msg.isDeleted
            ? <span className="text-sm text-muted italic">Message deleted</span>
            : <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          }
        </div>
        {msg.reactions?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.reactions.map((r) => (
              <button key={r.emoji} onClick={() => onReact(msg._id, r.emoji)}
                className="flex items-center gap-1 text-xs bg-surface2 hover:bg-surface3 border border-border px-2 py-0.5 rounded-full">
                {r.emoji} <span className="text-muted">{r.users.length}</span>
              </button>
            ))}
          </div>
        )}
        {/* Hover actions */}
        <div ref={ref} className={`hidden group-hover:flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div className="relative">
            <button onClick={() => setShowEmoji(v => !v)}
              className="w-6 h-6 rounded-lg bg-surface2 border border-border flex items-center justify-center text-muted hover:text-white text-xs transition-colors">
              <i className="ti ti-mood-smile" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-8 left-0 flex gap-1 bg-surface border border-border rounded-xl p-2 shadow-xl z-10">
                {EMOJI_LIST.map((e) => (
                  <button key={e} onClick={() => { onReact(msg._id, e); setShowEmoji(false); }}
                    className="w-7 h-7 hover:bg-surface2 rounded-lg flex items-center justify-center text-sm">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateChannelModal({ workspaceId, onCreated, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'public' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Channel name required');
    setLoading(true);
    try {
      const { data } = await chatAPI.createChannel({ ...form, workspace: workspaceId });
      toast.success(`#${data.channel.name} created`);
      onCreated(data.channel);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create channel');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-sm">New Channel</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><i className="ti ti-x" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="label">Channel Name</label>
            <input className="input" placeholder="e.g. general" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
          </div>
          <div>
            <label className="label">Description <span className="text-muted">(optional)</span></label>
            <input className="input" placeholder="What's this channel about?" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="public">Public — anyone in workspace can see</option>
              <option value="private">Private — invite only</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeChannelRef = useRef(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep ref in sync for socket callbacks (avoids stale closure)
  useEffect(() => {
    activeChannelRef.current = activeChannel?._id;
  }, [activeChannel?._id]);


  const loadMessages = useCallback(async (channelId) => {
        setLoading(true);

        try {
            const { data } = await chatAPI.getMessages(channelId);
            setMessages(data.messages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
  }, []);


  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel._id);

    const socket = getSocket();
    if (!socket) return;

    socket.emit('channel:join', activeChannel._id);

    const onNewMsg = (msg) => {
      if (msg.channel === activeChannelRef.current) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const onTyping = ({ userId, name }) => {
      if (userId !== user?._id)
        setTypingUsers((prev) => prev.find(u => u.userId === userId) ? prev : [...prev, { userId, name }]);
    };
    const onStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter(u => u.userId !== userId));
    };
    const onReaction = ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
    };

    socket.on('message:new', onNewMsg);
    socket.on('channel:typing', onTyping);
    socket.on('channel:stop_typing', onStopTyping);
    socket.on('message:reaction_updated', onReaction);

    return () => {
      socket.emit('channel:leave', activeChannel._id);
      socket.off('message:new', onNewMsg);
      socket.off('channel:typing', onTyping);
      socket.off('channel:stop_typing', onStopTyping);
      socket.off('message:reaction_updated', onReaction);
    };
  }, [activeChannel?._id, loadMessages]);

  const loadChannels = async () => {
    try {
      const { data } = await chatAPI.getChannels(activeWorkspace._id);
      setChannels(data.channels);
      if (data.channels.length > 0 && !activeChannel) {
        setActiveChannel(data.channels[0]);
      }
    } catch (err) {console.error(err)}
  };

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeChannel) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('message:send', { channelId: activeChannel._id, content: input.trim() });
    } else {
      // Fallback: REST if socket not connected
      toast.error('Connecting… please try again in a moment');
    }
    setInput('');
  }, [input, activeChannel]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket?.connected) return;
    socket.emit('channel:typing', { channelId: activeChannel._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('channel:stop_typing', { channelId: activeChannel._id });
    }, 2000);
  };

  const handleReact = (messageId, emoji) => {
    const socket = getSocket();
    if (socket?.connected) socket.emit('message:react', { messageId, emoji });
  };

  const handleChannelCreated = (channel) => {
    setChannels((prev) => [channel, ...prev]);
    setActiveChannel(channel);
    setShowCreateChannel(false);
  };

   useEffect(() => {
    if (activeWorkspace?._id) loadChannels();
  }, [activeWorkspace?._id]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Channel sidebar */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} sm:flex w-full sm:w-56 min-w-0 sm:min-w-56 bg-surface border-r border-border flex-col absolute sm:relative z-20 h-full`}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">{activeWorkspace?.name || 'Chat'}</h2>
            <p className="text-[11px] text-muted">Team Chat</p>
          </div>
          <button onClick={() => setShowSidebar(false)} className="sm:hidden text-muted hover:text-white">
            <i className="ti ti-x" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-2">
            <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Channels</p>
            <button onClick={() => setShowCreateChannel(true)}
              className="text-muted hover:text-white transition-colors" title="New channel">
              <i className="ti ti-plus text-sm" />
            </button>
          </div>

          {channels.length === 0 && (
            <button onClick={() => setShowCreateChannel(true)}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-muted hover:bg-surface2 hover:text-white transition-all flex items-center gap-2">
              <i className="ti ti-plus text-sm" /> Create first channel
            </button>
          )}

          {channels.map((ch) => (
            <button key={ch._id}
              onClick={() => { setActiveChannel(ch); setShowSidebar(false); }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all ${
                activeChannel?._id === ch._id ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2 hover:text-white'
              }`}>
              <span className="text-base">#</span>
              <span className="flex-1 text-left truncate">{ch.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface flex-shrink-0">
              <button onClick={() => setShowSidebar(true)}
                className="sm:hidden text-muted hover:text-white mr-1">
                <i className="ti ti-menu-2" />
              </button>
              <span className="text-base text-muted">#</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{activeChannel.name}</h3>
                {activeChannel.description && (
                  <p className="text-xs text-muted truncate">{activeChannel.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {activeChannel.members?.slice(0, 4).map((m, i) => (
                  <div key={m._id || i} style={{ marginLeft: i > 0 ? '-4px' : 0 }}>
                    <Avatar name={m.name} src={m.avatar} size={22} />
                  </div>
                ))}
                {activeChannel.members?.length > 4 && (
                  <span className="text-xs text-muted ml-1">+{activeChannel.members.length - 4}</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-3">
              {loading
                ? <div className="flex justify-center py-10"><i className="ti ti-loader-2 animate-spin text-muted text-xl" /></div>
                : messages.length === 0
                  ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                      <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-2xl mb-3 text-muted">#</div>
                      <h3 className="font-semibold mb-1">Welcome to #{activeChannel.name}!</h3>
                      <p className="text-sm text-muted">This is the beginning of this channel. Say hello 👋</p>
                    </div>
                  )
                  : messages.map((msg) => (
                    <Message key={msg._id} msg={msg} isOwn={msg.sender?._id === user?._id} onReact={handleReact} />
                  ))
              }
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 pb-1 flex items-center gap-1.5 text-xs text-muted">
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
                {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
              </div>
            )}

            {/* Input */}
            <div className="px-3 sm:px-4 pb-4 pt-2">
              <div className="flex items-center gap-2 bg-surface2 border border-border rounded-xl px-3 sm:px-4 py-2.5 focus-within:border-border2 transition-colors">
                <input
                  className="flex-1 bg-transparent outline-none text-sm placeholder-muted text-white"
                  placeholder={`Message #${activeChannel.name}`}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />
                <button onClick={sendMessage} disabled={!input.trim()}
                  className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-400 transition-colors flex-shrink-0">
                  <i className="ti ti-send text-sm" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <i className="ti ti-message-circle text-4xl text-muted/20 block mb-3" />
            <p className="text-sm text-muted mb-3">
              {channels.length === 0 ? 'No channels yet.' : 'Select a channel to start chatting'}
            </p>
            {channels.length === 0 && (
              <button onClick={() => setShowCreateChannel(true)} className="btn-primary text-xs">
                <i className="ti ti-plus" /> Create a channel
              </button>
            )}
            <button onClick={() => setShowSidebar(true)} className="sm:hidden btn-secondary text-xs mt-2">
              <i className="ti ti-menu-2" /> View channels
            </button>
          </div>
        )}
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          workspaceId={activeWorkspace?._id}
          onCreated={handleChannelCreated}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
    </div>
  );
}