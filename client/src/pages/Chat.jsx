import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { motion } from 'framer-motion';

export default function Chat() {
  return (
    <div className="h-[100dvh] w-full p-0 md:p-4 flex items-center justify-center relative overflow-hidden bg-black">
      {/* iOS-style animated blurred background gradient */}
      <motion.div 
        animate={{ 
          background: [
            "linear-gradient(120deg, #ff9a9e 0%, #fecfef 100%)",
            "linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)",
            "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
            "linear-gradient(120deg, #ff9a9e 0%, #fecfef 100%)"
          ] 
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-0 opacity-80"
      />
      
      {/* Floating Orbs for extra depth */}
      <motion.div 
        animate={{ y: [0, -50, 0], x: [0, 30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[15%] w-96 h-96 bg-purple-500/40 rounded-full blur-[100px] z-0"
      />
      <motion.div 
        animate={{ y: [0, 50, 0], x: [0, -40, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[10%] right-[15%] w-[30rem] h-[30rem] bg-blue-500/30 rounded-full blur-[120px] z-0"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        className="w-full h-full md:max-w-[1400px] md:h-[92vh] bg-white/90 backdrop-blur-xl md:shadow-2xl md:rounded-3xl flex overflow-hidden z-10 border border-white/40"
      >
        <Sidebar />
        <ChatWindow />
      </motion.div>
    </div>
  );
}
