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

    socket.on('newMessage', (msg) => {
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
