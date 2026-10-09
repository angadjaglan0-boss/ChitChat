import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';
import useStore from './store/useStore';
import { io } from 'socket.io-client';

const API_URL = '/api';

export default function App() {
  const { user, setUser, setMessages, setSocket } = useStore();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode!

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/me`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) { console.error('Not logged in'); }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io(); // Connects to the same origin
      setSocket(newSocket);
      
      newSocket.on('newMessage', (msg) => {
        // Play receive sound
        try { playReceiveSound(); } catch(e){}
        useStore.getState().set(state => ({
          messages: [...state.messages, msg]
        }));
      });
      
      return () => newSocket.close();
    }
  }, [user]);

  // UI Sound Effects Synth
  const playReceiveSound = () => {
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
  };

  return (
    <div className={`min-h-[100dvh] flex items-center justify-center overflow-hidden transition-colors duration-1000 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]'}`}>
      {/* Ambient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className={`absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob ${isDarkMode ? 'bg-purple-900' : 'bg-pink-300'}`}></div>
         <div className={`absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000 ${isDarkMode ? 'bg-blue-900' : 'bg-yellow-300'}`}></div>
         <div className={`absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000 ${isDarkMode ? 'bg-indigo-900' : 'bg-purple-300'}`}></div>
      </div>
      
      {/* Dark Mode Toggle */}
      <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl hover:scale-110 transition-all">
         {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className="relative z-10 w-full h-full flex items-center justify-center p-0 md:p-8 max-w-7xl">
        {user ? <Chat /> : <Login onLogin={setUser} />}
      </div>
    </div>
  );
}
