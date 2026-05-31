import { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../api/apiFunctions.js';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import { useAuthStore } from '../zustand/authStore.js';
import { getSocket } from '../socket/UseSocket.js';
import Avatar from '../components/Avatar.jsx';
import { format, isToday, isYesterday } from 'date-fns';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🚀', '👀', '✅', '🔥'];

function formatMsgTime(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

function Message({ msg, isOwn, onReact }) {
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <div className={`group flex gap-3 px-4 py-1.5 hover:bg-surface2/40 transition-colors ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar name={msg.sender?.name} src={msg.sender?.avatar} size={30} />
      <div className={`flex-1 min-w-0 ${isOwn ? 'items-end flex flex-col' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold">{msg.sender?.name}</span>
          <span className="text-[10px] text-muted">{formatMsgTime(msg.createdAt)}</span>
          {msg.isEdited && <span className="text-[10px] text-muted">(edited)</span>}
        </div>

        {msg.replyTo && (
          <div className="bg-surface3 border-l-2 border-accent px-2 py-1 rounded text-xs text-muted mb-1.5 max-w-xs">
            <span className="font-medium text-white">{msg.replyTo.sender?.name}: </span>
            {msg.replyTo.content}
          </div>
        )}

        <div className={`inline-block max-w-md ${isOwn ? 'bg-accent/15 border border-accent/20' : 'bg-surface2 border border-border'} rounded-2xl px-3.5 py-2`}>
          {msg.isDeleted ? (
            <span className="text-sm text-muted italic">Message deleted</span>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          )}
        </div>

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(msg._id, r.emoji)}
                className="flex items-center gap-1 text-xs bg-surface2 hover:bg-surface3 border border-border px-2 py-0.5 rounded-full transition-colors"
              >
                {r.emoji} <span className="text-muted">{r.users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover actions */}
        <div className={`hidden group-hover:flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-6 h-6 rounded-lg bg-surface2 border border-border flex items-center justify-center text-muted hover:text-white text-xs transition-colors"
            >
              <i className="ti ti-mood-smile" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-8 left-0 flex gap-1 bg-surface border border-border rounded-xl p-2 shadow-xl z-10">
                {EMOJI_LIST.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onReact(msg._id, e); setShowEmoji(false); }}
                    className="w-7 h-7 hover:bg-surface2 rounded-lg flex items-center justify-center text-sm transition-colors"
                  >
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

export default function ChatPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  
  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel._id);
      setupSocketListeners(activeChannel._id);
    }
    return () => teardownSocketListeners();
  }, [activeChannel?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChannels = async () => {
    try {
      const { data } = await chatAPI.getChannels(activeWorkspace._id);
      setChannels(data.channels);
      if (data.channels.length > 0 && !activeChannel) {
        setActiveChannel(data.channels[0]);
      }
    } catch (_) {}
  };

  const loadMessages = async (channelId) => {
    setLoading(true);
    try {
      const { data } = await chatAPI.getMessages(channelId);
      setMessages(data.messages);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    if (activeWorkspace?._id) loadChannels();
  }, [activeWorkspace?._id]);


  const setupSocketListeners = (channelId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('channel:join', channelId);
    socket.on('message:new', (msg) => {
      if (msg.channel === channelId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    socket.on('channel:typing', ({ userId, name }) => {
      if (userId !== user?._id) {
        setTypingUsers((prev) => prev.find(u => u.userId === userId) ? prev : [...prev, { userId, name }]);
      }
    });
    socket.on('channel:stop_typing', ({ userId }) => {
      setTypingUsers((prev) => prev.filter(u => u.userId !== userId));
    });
    socket.on('message:reaction_updated', ({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
    });
  };

  const teardownSocketListeners = () => {
    const socket = getSocket();
    if (!socket || !activeChannel) return;
    socket.emit('channel:leave', activeChannel._id);
    socket.off('message:new');
    socket.off('channel:typing');
    socket.off('channel:stop_typing');
    socket.off('message:reaction_updated');
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChannel) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('message:send', { channelId: activeChannel._id, content: input.trim() });
    }
    setInput('');
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('channel:typing', { channelId: activeChannel._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('channel:stop_typing', { channelId: activeChannel._id });
    }, 2000);
  };

  const handleReact = (messageId, emoji) => {
    const socket = getSocket();
    if (socket) socket.emit('message:react', { messageId, emoji });
  };

  return (
    <div className="flex h-full">
      {/* Channel list */}
      <div className="w-56 bg-surface border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">{activeWorkspace?.name}</h2>
          <p className="text-[11px] text-muted">Team Chat</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-[10px] text-muted uppercase tracking-wider px-2 py-2 font-medium">Channels</p>
          {channels.map((ch) => (
            <button
              key={ch._id}
              onClick={() => setActiveChannel(ch)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all ${
                activeChannel?._id === ch._id ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface2 hover:text-white'
              }`}
            >
              <span className="text-base">#</span>
              <span className="flex-1 text-left truncate">{ch.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {activeChannel ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface">
            <span className="text-lg text-muted">#</span>
            <div>
              <h3 className="text-sm font-semibold">{activeChannel.name}</h3>
              {activeChannel.description && (
                <p className="text-xs text-muted">{activeChannel.description}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {activeChannel.members?.slice(0, 5).map((m, i) => (
                <div key={m._id || i} style={{ marginLeft: i > 0 ? '-6px' : 0 }}>
                  <Avatar name={m.name} src={m.avatar} size={22} />
                </div>
              ))}
              {activeChannel.members?.length > 5 && (
                <span className="text-xs text-muted ml-2">+{activeChannel.members.length - 5}</span>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto py-3">
            {loading ? (
              <div className="flex justify-center py-10"><i className="ti ti-loader-2 animate-spin text-muted text-xl" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-2xl mb-3">
                  #
                </div>
                <h3 className="font-semibold mb-1">Welcome to #{activeChannel.name}!</h3>
                <p className="text-sm text-muted">This is the beginning of this channel.</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <Message
                    key={msg._id}
                    msg={msg}
                    isOwn={msg.sender?._id === user?._id}
                    onReact={handleReact}
                  />
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-5 pb-1 text-xs text-muted flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex items-center gap-2 bg-surface2 border border-border rounded-xl px-4 py-2.5 focus-within:border-border2 transition-colors">
              <input
                className="flex-1 bg-transparent outline-none text-sm placeholder-muted"
                placeholder={`Message #${activeChannel.name}`}
                value={input}
                onChange={(e) => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white disabled:opacity-40 hover:bg-blue-400 transition-colors"
              >
                <i className="ti ti-send text-sm" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted">
          <div className="text-center">
            <i className="ti ti-message-circle text-4xl opacity-20 block mb-3" />
            <p className="text-sm">Select a channel to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}