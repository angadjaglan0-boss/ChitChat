import { create } from 'zustand';
import { io } from 'socket.io-client';

const HOST = window.location.hostname;
const API_URL = '/api';
const SOCKET_URL = '/';

const useStore = create((set, get) => ({
  user: null,
  token: null,
  socket: null,
  users: [],
  activeChat: null,
  messages: [],
  
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      set({ user: data.user, token: data.token });
      get().connectSocket(data.token);
      return true;
    }
    throw new Error(data.error);
  },

  register: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      set({ user: data.user, token: data.token });
      get().connectSocket(data.token);
      return true;
    }
    throw new Error(data.error);
  },

  logout: () => {
    const socket = get().socket;
    if (socket) socket.disconnect();
    set({ user: null, token: null, socket: null, activeChat: null, messages: [] });
  },

  connectSocket: (token) => {
    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('message_updated', (data) => {
      set({ messages: get().messages.map(m => m.id === data.id ? { ...m, content: data.content } : m) });
    });

    socket.on('message_deleted', (id) => {
      set({ messages: get().messages.filter(m => m.id != id) });
    });

    socket.on('newMessage', (msg) => {
      if (msg.sender_id !== get().user?.id) window.playReceiveSound();
      const { activeChat } = get();
      if (activeChat && (msg.sender_id === activeChat.id || msg.receiver_id === activeChat.id)) {
        set(state => ({ messages: [...state.messages, msg] }));
      }
    });

    socket.on('userStatusChange', ({ userId, status }) => {
      set(state => ({
        users: state.users.map(u => u.id === userId ? { ...u, status } : u)
      }));
    });

    set({ socket });
    get().fetchUsers();
  },

  fetchUsers: async () => {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    const gRes = await fetch(`${API_URL}/groups/${get().user.id}`);
    const groups = await gRes.json();
    set({ users: [...groups, ...users.filter(u => u.id !== get().user.id)] });
  },

  setActiveChat: async (chatObj) => {
    set({ activeChat: chatObj });
    if (chatObj.isGroup) {
      const res = await fetch(`${API_URL}/group-messages/${chatObj.id}`);
      const data = await res.json();
      set({ messages: data });
    } else {
      const res = await fetch(`${API_URL}/messages/${get().user.id}/${chatObj.id}`);
      const data = await res.json();
      set({ messages: data });
    }
  },

  sendMessage: (content) => {
    const { socket, activeChat } = get();
    if (!socket || !activeChat) return;
    
    if (activeChat.isGroup) {
      socket.emit('sendMessage', {
        groupId: activeChat.id,
        content,
        type: 'text'
      });
    } else {
      socket.emit('sendMessage', {
        receiverId: activeChat.id,
        content,
        type: 'text'
      });
    }
  }
}));

export default useStore;

// Add global sound synth
window.playSendSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch(e) {}
};

window.playReceiveSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch(e) {}
};
