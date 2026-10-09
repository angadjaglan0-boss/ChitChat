import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

export default function CallModal({ caller, isIncoming, onAccept, onDecline, onEnd }) {
  const [accepted, setAccepted] = useState(!isIncoming);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let timer;
    if (accepted) {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [accepted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-2xl flex flex-col items-center justify-center overflow-hidden">
      {/* Background Animated Blobs */}
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 10, repeat: Infinity }} className="absolute w-96 h-96 bg-green-500/20 rounded-full blur-[100px] z-0" />
      
      <div className="z-10 flex flex-col items-center">
        <motion.div 
          animate={accepted ? {} : { scale: [1, 1.1, 1], boxShadow: ["0px 0px 0px 0px rgba(74,222,128,0)", "0px 0px 0px 30px rgba(74,222,128,0.3)", "0px 0px 0px 0px rgba(74,222,128,0)"] }}
          transition={{ duration: 1.5, repeat: accepted ? 0 : Infinity }}
          className="relative rounded-full mb-6"
        >
          <img src={caller.avatar} alt="caller" className="w-32 h-32 rounded-full border-4 border-white/20 shadow-2xl bg-white" />
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{caller.username || caller.name}</h2>
        <p className="text-white/70 font-medium mb-12 text-lg">
          {accepted ? formatTime(duration) : (isIncoming ? 'Incoming Voice Call...' : 'Calling...')}
        </p>

        {accepted && (
          <div className="flex items-center gap-2 mb-12 h-10">
            {[...Array(15)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [10, Math.random() * 30 + 10, 10] }}
                transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                className="w-1.5 bg-green-400 rounded-full"
              />
            ))}
          </div>
        )}

        <div className="flex gap-8">
          {isIncoming && !accepted && (
            <motion.button 
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => { setAccepted(true); onAccept(); }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
            >
              <Phone size={28} className="text-white" />
            </motion.button>
          )}

          {accepted && (
            <motion.button 
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setMuted(!muted)}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${muted ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              {muted ? <MicOff size={28} /> : <Mic size={28} />}
            </motion.button>
          )}

          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={isIncoming && !accepted ? onDecline : onEnd}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            <PhoneOff size={28} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
