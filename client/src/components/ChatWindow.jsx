import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Trash2, Globe, Paperclip, Smile, MoreVertical, Search, X, MessageCircle, MapPin, Image as ImageIcon, Phone } from 'lucide-react';
import CallModal from './CallModal';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const API_URL = '/api';

const APPLE_GIFS = [
  'https://media.giphy.com/media/l41YkFIiBxQdRlKI8/giphy.gif', // Apple logo
  'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif', // Tim Cook
  'https://media.giphy.com/media/1n7cOcn3P1B2b4WjIH/giphy.gif', // Memoji
  'https://media.giphy.com/media/l0HlBwsIWjIgEQy52/giphy.gif', // iPhone
  'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif', // Mac
];

export default function ChatWindow() {
  const { user, activeChat, messages = [], sendMessage } = useStore();
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [callState, setCallState] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);
  const gifRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isUploading]);

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
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) setShowEmoji(false);
      if (gifRef.current && !gifRef.current.contains(event.target)) setShowGifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteMessage = async (msgId) => {
    try {
      await fetch(`${API_URL}/messages/${msgId}`, { method: 'DELETE' });
    } catch(err) { console.error(err); }
  };

  const handleTranslate = async (msgId, text) => {
    if (!text) return;
    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'hi' }) // Translates to Hindi
      });
      const data = await res.json();
      if (data.translated) {
        useStore.getState().socket.emit('update_message', { id: msgId, content: data.translated });
        useStore.getState().set({ messages: useStore.getState().messages.map(m => m.id === msgId ? { ...m, content: data.translated } : m) });
      }
    } catch(err) { console.error(err); }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
      setShowEmoji(false);
      setShowGifs(false);
    }
  };

  const handleEmojiClick = (emojiObj) => {
    setInput(prev => prev + emojiObj.emoji);
  };

  const handleSendGif = (url) => {
    useStore.getState().socket.emit('sendMessage', {
      receiverId: activeChat.id,
      content: url,
      type: 'image'
    });
    setShowGifs(false);
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      useStore.getState().socket.emit('sendMessage', {
        receiverId: activeChat.id,
        content: url,
        type: 'location'
      });
    }, () => {
      alert("Unable to retrieve your location. Check your browser permissions.");
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        const isImage = file.type.startsWith('image/');
        useStore.getState().socket.emit('sendMessage', {
          receiverId: activeChat.id,
          content: data.url,
          type: isImage ? 'image' : 'file'
        });
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!activeChat) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center flex-1 bg-transparent border-l border-white/20 overflow-hidden relative">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center z-10"
        >
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-64 h-64 mx-auto bg-gradient-to-tr from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-full flex items-center justify-center mb-8 shadow-inner border border-white/30"
          >
            <MessageCircle size={80} className="text-gray-800/50" />
          </motion.div>
          <h2 className="text-4xl font-light text-gray-800 tracking-tight">iMessage for Web</h2>
          <p className="text-gray-600 mt-4 max-w-md mx-auto leading-relaxed">
            Send texts, locations, and Apple GIFs seamlessly.<br/>
            Try saying "Hello" to **ChitChat AI**!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden border-l border-white/30">
      {/* Header */}
      <motion.div 
        initial={{ y: -50 }} animate={{ y: 0 }}
        className="h-16 bg-white/40 backdrop-blur-md flex items-center justify-between px-4 py-2 border-b border-white/40 z-20"
      >
        <div className="flex items-center gap-2 md:gap-4">
          <button className="md:hidden p-1 mr-1 rounded-full hover:bg-black/5" onClick={() => useStore.getState().setActiveChat(null)}>
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <motion.img 
            layoutId={`avatar-${activeChat.id}`}
            src={activeChat.avatar} alt="avatar" className="w-10 h-10 rounded-full shadow-sm bg-white/80" 
          />
          <div>
            <h2 className="font-semibold text-gray-900">{activeChat.username || activeChat.name}</h2>
            <p className="text-xs text-gray-600 font-medium">
               {activeChat.username === 'ChitChat AI' ? 'Always Online' : (activeChat.isGroup ? 'Group Chat' : (activeChat.status === 'online' ? 'online' : 'offline'))}
            </p>
          </div>
        </div>
        <div className="flex items-center text-gray-700 gap-5">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Search size={20}/></motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setCallState('calling'); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'offer' }); }}><Phone size={20}/></motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><MoreVertical size={20}/></motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 z-10 scrollbar-hide flex flex-col space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8, x: isMe ? 50 : -50, originX: isMe ? 1 : 0 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                key={msg.id || idx}
                className={`group flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {isMe && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button onClick={() => handleTranslate(msg.id, msg.content)} className="p-1 text-gray-400 hover:text-blue-500">
                      <Globe size={16} />
                    </button>
                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <div 
                  className={`max-w-[75%] px-4 py-2 text-[15px] ${
                    isMe ? 'bg-[#0a7aff] text-white rounded-2xl rounded-br-[4px] shadow-sm' : 'bg-[#e9e9eb] text-black rounded-2xl rounded-bl-[4px] shadow-sm'
                  }`}
                >
                  {activeChat.isGroup && !isMe && <div className="text-[11px] text-gray-500 mb-1">{msg.sender_name}</div>}
                  {msg.type === 'image' ? (
                    <motion.img initial={{opacity:0}} animate={{opacity:1}} src={msg.content} alt="attachment" className="rounded-lg max-w-full max-h-64 object-cover mb-1" />
                  ) : msg.type === 'file' ? (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 underline bg-white/50 p-3 rounded-lg">
                      <Paperclip size={18}/> View Attachment
                    </a>
                  ) : msg.type === 'location' ? (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white underline font-medium">
                      <MapPin size={18}/> View Location on Map
                    </a>
                  ) : (
                    <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-100 text-right' : 'text-gray-500 text-right'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!isMe && (
                  <button onClick={() => handleTranslate(msg.id, msg.content)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity">
                    <Globe size={16} />
                  </button>
                )}
              </motion.div>
            );
          })}
          {isUploading && (
            <motion.div key="uploading-state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
               <div className="bg-[#0a7aff] text-white rounded-2xl rounded-br-[4px] px-4 py-3 shadow-sm text-[14px] flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 Uploading...
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <motion.div 
        initial={{ y: 50 }} animate={{ y: 0 }}
        className="bg-white/40 backdrop-blur-md flex items-center px-4 py-3 z-20 relative border-t border-white/40"
      >
        {/* Emoji Picker Popup */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div 
              key="emoji-picker" ref={emojiRef}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 left-4 shadow-2xl rounded-xl z-50 overflow-hidden"
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} searchDisabled skinTonesDisabled />
            </motion.div>
          )}
        </AnimatePresence>

        {/* GIF Picker Popup */}
        <AnimatePresence>
          {showGifs && (
            <motion.div 
              key="gif-picker" ref={gifRef}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 left-16 bg-white shadow-2xl rounded-xl z-50 overflow-hidden p-3 w-64 border border-gray-100"
            >
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Apple GIFs</h3>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {APPLE_GIFS.map((gif, idx) => (
                  <img 
                    key={idx} src={gif} alt="gif" 
                    onClick={() => handleSendGif(gif)}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }}
          onClick={() => { setShowEmoji(!showEmoji); setShowGifs(false); }}
          className={`p-2 rounded-full transition-colors ${showEmoji ? 'bg-blue-100 text-[#0a7aff]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Smile size={24} />
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => { setShowGifs(!showGifs); setShowEmoji(false); }}
          className={`p-2 rounded-full transition-colors ${showGifs ? 'bg-blue-100 text-[#0a7aff]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ImageIcon size={22} />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.9 }}
          onClick={handleShareLocation}
          className="text-gray-500 hover:text-[#0a7aff] p-2 rounded-full transition-colors"
          title="Share Location"
        >
          <MapPin size={22} />
        </motion.button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <motion.button 
          whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-gray-700 p-2 mx-1 rounded-full transition-colors"
        >
          <Paperclip size={22} />
        </motion.button>
        
        <form onSubmit={handleSend} className="flex-1 flex px-2">
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); useStore.getState().socket?.emit('typing', { to: activeChat.id, isGroup: activeChat.isGroup }); }}
            placeholder="iMessage"
            className="w-full bg-white/80 rounded-full px-5 py-2 focus:outline-none text-sm text-gray-900 shadow-sm transition-all focus:shadow-md border border-gray-300 focus:border-[#0a7aff]"
          />
        </form>
        
        <AnimatePresence mode="popLayout">
          {input.trim() ? (
            <motion.button 
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend} 
              className="bg-[#0a7aff] text-white p-2 rounded-full shadow-md ml-1 hover:bg-blue-600 transition-colors"
            >
              <Send size={18} className="ml-0.5" />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {callState && (
          <CallModal
            caller={activeChat}
            isIncoming={callState === 'incoming'}
            onAccept={() => { setCallState('active'); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'answer' }); }}
            onDecline={() => { setCallState(null); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'end' }); }}
            onEnd={() => { setCallState(null); useStore.getState().socket.emit('webrtc_signal', { to: activeChat.id, type: 'end' }); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
