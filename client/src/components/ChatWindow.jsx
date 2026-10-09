import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Search, X, MessageCircle, MapPin, Image as ImageIcon, Phone, Trash2, Globe, Mic, Bomb, Palette } from 'lucide-react';
import CallModal from './CallModal';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const API_URL = '/api';

const APPLE_GIFS = [
  'https://media.giphy.com/media/l41YkFIiBxQdRlKI8/giphy.gif',
  'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif',
  'https://media.giphy.com/media/1n7cOcn3P1B2b4WjIH/giphy.gif',
  'https://media.giphy.com/media/l0HlBwsIWjIgEQy52/giphy.gif',
  'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
];

const getSmartReplies = (msgs, user) => {
  const last = msgs[msgs.length-1];
  if (!last || last.sender_id === user?.id || last.type !== 'text') return [];
  const t = last.content.toLowerCase();
  if (t.includes('?')) return ["Yes absolutely!", "I don't think so.", "Let me check."];
  if (t.includes('hi') || t.includes('hello')) return ["Hey!", "Hi there!", "What's up?"];
  if (t.includes('bye')) return ["See ya!", "Goodbye!", "Take care!"];
  return ["Awesome!", "Haha yeah", "Cool!"];
};

const getSentimentEmoji = (text) => {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.match(/sad|bad|sorry|cry/)) return '😢';
  if (t.match(/good|great|awesome|love|haha|lol/)) return '😍';
  if (t.match(/mad|angry|hate|stupid/)) return '😡';
  return null;
};

export default function ChatWindow() {
  const { user, activeChat, messages = [], sendMessage } = useStore();
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [callState, setCallState] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const gifRef = useRef(null);
  const typingTimeout = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState({});

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isUploading, isTyping]);

  useEffect(() => {
    const s = useStore.getState().socket;
    if (!s) return;
    const handleSignal = (data) => {
      if (data.type === 'offer') setCallState('incoming');
      if (data.type === 'answer') setCallState('active');
      if (data.type === 'end') setCallState(null);
    };
    const handleTyping = (data) => {
      const active = useStore.getState().activeChat;
      if (!active) return;
      if ((data.isGroup && data.to == active.id) || (!data.isGroup && data.from == active.id)) {
        setIsTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };
    s.on('webrtc_signal', handleSignal);
    s.on('typing', handleTyping);
    return () => { s.off('webrtc_signal', handleSignal); s.off('typing', handleTyping); };
  }, [activeChat]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
      if (gifRef.current && !gifRef.current.contains(e.target)) setShowGifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteMessage = async (msgId) => {
    try { await fetch(`${API_URL}/messages/${msgId}`, { method: 'DELETE' }); } 
    catch(err) { console.error(err); }
  };

  const handleTranslate = async (msgId, text) => {
    if (!text) return;
    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'hi' })
      });
      const data = await res.json();
      if (data.translated) {
        useStore.getState().socket.emit('update_message', { id: msgId, content: data.translated });
        useStore.getState().set({ messages: useStore.getState().messages.map(m => m.id === msgId ? { ...m, content: data.translated } : m) });
      }
    } catch(err) { console.error(err); }
  };

  const handleSend = (e, overrideInput) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if (finalInput.trim()) {
      sendMessage(isSecret ? `💣SECRET:${finalInput.trim()}` : finalInput.trim());
      setInput('');
      setShowEmoji(false);
      setShowGifs(false);
      setIsSecret(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        const reader = new FileReader();
        reader.onloadend = () => {
           useStore.getState().socket.emit('send_message', {
             sender_id: user.id, receiver_id: activeChat.id, content: reader.result, type: 'audio', isGroup: activeChat.isGroup
           });
        };
        reader.readAsDataURL(audioBlob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { alert('Microphone access denied!'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  const initCanvas = (canvas) => {
    if (!canvas) return;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0a7aff';
    ctxRef.current = ctx;
  };

  const handleDraw = (e) => {
    if (!isDrawing || !ctxRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctxRef.current.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctxRef.current.stroke();
  };

  const sendCanvas = () => {
    if (canvasRef.current) {
      const imgData = canvasRef.current.toDataURL('image/png');
      useStore.getState().socket.emit('send_message', {
         sender_id: user.id, receiver_id: activeChat.id, content: imgData, type: 'image', isGroup: activeChat.isGroup
      });
      setShowCanvas(false);
    }
  };

  const handleFileUpload = (e) => { /* ... existing file upload ... */ 
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      useStore.getState().socket.emit('send_message', { sender_id: user.id, receiver_id: activeChat.id, content: reader.result, type: file.type.startsWith('image/') ? 'image' : 'file', isGroup: activeChat.isGroup });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (e) => setInput(p => p + e.emoji);
  const handleSendGif = (url) => { sendMessage(url, 'image'); setShowGifs(false); };
  const handleShareLocation = () => { /* ... */ 
    if (navigator.geolocation) {
      setIsUploading(true);
      navigator.geolocation.getCurrentPosition((pos) => {
        sendMessage(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`, 'location');
        setIsUploading(false);
      }, () => setIsUploading(false));
    }
  };

  if (!activeChat) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center flex-1 bg-transparent border-l border-white/20 overflow-hidden relative">
        <div className="text-center">
          <MessageCircle size={80} className="text-white/50 mx-auto mb-6" />
          <h2 className="text-3xl font-light text-white mb-2">ChitChat for Web</h2>
          <p className="text-white/60 font-medium">Select a friend to start chatting</p>
        </div>
      </div>
    );
  }

  const smartReplies = getSmartReplies(messages, user);

  return (
    <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden border-l border-white/30">
      <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="h-16 bg-white/40 backdrop-blur-md flex items-center justify-between px-4 py-2 border-b border-white/40 z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <button className="md:hidden p-1 mr-1 rounded-full hover:bg-black/5" onClick={() => useStore.getState().setActiveChat(null)}>
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <motion.img layoutId={`avatar-${activeChat.id}`} src={activeChat.avatar} alt="avatar" className="w-10 h-10 rounded-full shadow-sm bg-white/80" />
          <div>
            <h2 className="font-semibold text-gray-900">{activeChat.username || activeChat.name}</h2>
            <p className="text-xs text-gray-600 font-medium">{activeChat.username === 'ChitChat AI' ? 'Always Online' : (activeChat.isGroup ? 'Group Chat' : (activeChat.status === 'online' ? 'online' : 'offline'))}</p>
          </div>
        </div>
        <div className="flex items-center text-gray-700 gap-5">
          {!activeChat.isGroup && activeChat.username !== 'ChitChat AI' && (
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}>
               <Phone className="cursor-pointer hover:text-green-500" size={20} onClick={() => { setCallState('outgoing'); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'offer' }); }} />
            </motion.div>
          )}
          <Search className="cursor-pointer hover:text-[#0a7aff]" size={20} />
          <MoreVertical className="cursor-pointer hover:text-[#0a7aff]" size={20} />
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 z-10 scrollbar-hide flex flex-col space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            const isSecretMsg = msg.type === 'text' && msg.content.startsWith('💣SECRET:');
            const cleanContent = isSecretMsg ? msg.content.substring(9) : msg.content;
            const isRevealed = revealedSecrets[msg.id];
            const sentiment = msg.type === 'text' && !isSecretMsg ? getSentimentEmoji(cleanContent) : null;

            return (
              <motion.div layout initial={{ opacity: 0, scale: 0.8, x: isMe ? 50 : -50, originX: isMe ? 1 : 0 }} animate={{ opacity: 1, scale: 1, x: 0 }} key={msg.id || idx} className={`group flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {isMe && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button onClick={() => handleTranslate(msg.id, cleanContent)} className="p-1 text-gray-400 hover:text-blue-500"><Globe size={16} /></button>
                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                )}
                <div className="relative">
                  <div className={`max-w-[100%] px-4 py-2 text-[15px] ${isMe ? 'bg-[#0a7aff] text-white rounded-2xl rounded-br-[4px] shadow-sm' : 'bg-[#e9e9eb] text-black rounded-2xl rounded-bl-[4px] shadow-sm'}`}>
                    {activeChat.isGroup && !isMe && <div className="text-[11px] text-gray-500 mb-1">{msg.sender_name}</div>}
                    
                    {msg.type === 'audio' ? (
                      <audio src={msg.content} controls className="h-8 max-w-[200px]" />
                    ) : isSecretMsg && !isMe && !isRevealed ? (
                      <button onClick={() => { setRevealedSecrets(p => ({...p, [msg.id]: true})); setTimeout(() => handleDeleteMessage(msg.id), 10000); }} className="font-bold flex items-center gap-2">💣 Tap to Reveal (10s)</button>
                    ) : msg.type === 'image' ? (
                      <motion.img initial={{opacity:0}} animate={{opacity:1}} src={cleanContent} className="rounded-lg max-w-full max-h-64 object-cover mb-1" />
                    ) : (
                      <p className="break-words whitespace-pre-wrap">{cleanContent}</p>
                    )}
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-100 text-right' : 'text-gray-500 text-right'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {sentiment && !isMe && <div className="absolute -bottom-2 -right-2 text-lg">{sentiment}</div>}
                </div>
                {!isMe && (
                  <button onClick={() => handleTranslate(msg.id, cleanContent)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity"><Globe size={16} /></button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isTyping && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-gray-500 italic ml-6 mb-2">{activeChat.isGroup ? 'Someone is typing...' : `${activeChat.username || activeChat.name} is typing...`}</motion.div>}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {smartReplies.length > 0 && !isTyping && (
        <div className="flex gap-2 px-4 py-2 z-20 justify-end overflow-x-auto scrollbar-hide absolute bottom-16 w-full">
          {smartReplies.map((reply, i) => (
             <button key={i} onClick={() => handleSend(null, reply)} className="bg-white/80 backdrop-blur shadow-sm border border-gray-200 text-[#0a7aff] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#0a7aff] hover:text-white transition-colors whitespace-nowrap">{reply}</button>
          ))}
        </div>
      )}

      {/* Shared Canvas Modal */}
      {showCanvas && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
          <div className="bg-white shadow-2xl rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">Live Whiteboard</h3>
              <button onClick={() => setShowCanvas(false)}><X size={20} className="text-gray-500 hover:text-red-500"/></button>
            </div>
            <canvas ref={initCanvas} width={300} height={300} className="border-2 border-gray-200 rounded-lg bg-gray-50 cursor-crosshair mb-4" onMouseDown={(e) => { setIsDrawing(true); ctxRef.current?.beginPath(); ctxRef.current?.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); }} onMouseMove={handleDraw} onMouseUp={() => setIsDrawing(false)} onMouseOut={() => setIsDrawing(false)} />
            <button onClick={sendCanvas} className="w-full bg-[#0a7aff] text-white py-2 rounded-lg font-medium shadow-md hover:bg-blue-600 transition-colors">Send Drawing</button>
          </div>
        </div>
      )}

      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white/40 backdrop-blur-md flex items-center px-4 py-3 z-20 relative border-t border-white/40">
        <button onClick={() => setShowCanvas(true)} className="text-gray-500 hover:text-[#0a7aff] p-2 rounded-full"><Palette size={22} /></button>
        <button onClick={() => setIsSecret(!isSecret)} className={`p-2 rounded-full transition-colors ${isSecret ? 'bg-red-100 text-red-500' : 'text-gray-500 hover:text-red-500'}`}><Bomb size={22} /></button>
        <button onClick={() => { setShowEmoji(!showEmoji); setShowGifs(false); }} className="text-gray-500 hover:text-[#0a7aff] p-2 rounded-full"><Smile size={24} /></button>
        
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-[#0a7aff] p-2 mx-1 rounded-full"><Paperclip size={22} /></button>
        
        <form onSubmit={(e) => handleSend(e, null)} className="flex-1 flex px-2 relative">
          <input type="text" value={input} onChange={(e) => { setInput(e.target.value); useStore.getState().socket?.emit('typing', { to: activeChat.id, isGroup: activeChat.isGroup }); }} placeholder={isSecret ? "Type a secret message..." : "iMessage"} className={`w-full rounded-full px-5 py-2 focus:outline-none text-sm text-gray-900 shadow-sm border ${isSecret ? 'bg-red-50 border-red-300 placeholder-red-400' : 'bg-white/80 border-gray-300 focus:border-[#0a7aff]'}`} />
        </form>

        {input.trim() ? (
          <button onClick={(e) => handleSend(e, null)} className={`p-2 rounded-full shadow-md ml-1 text-white ${isSecret ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0a7aff] hover:bg-blue-600'}`}><Send size={18} className="ml-0.5" /></button>
        ) : (
          <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-2 rounded-full shadow-md ml-1 text-white ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#34c759] hover:bg-green-600'}`}><Mic size={18} /></button>
        )}
      </motion.div>
      <AnimatePresence>
        {callState && <CallModal caller={activeChat} isIncoming={callState === 'incoming'} onAccept={() => { setCallState('active'); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'answer' }); }} onDecline={() => { setCallState(null); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'end' }); }} onEnd={() => { setCallState(null); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'end' }); }} />}
      </AnimatePresence>
    </div>
  );
}
