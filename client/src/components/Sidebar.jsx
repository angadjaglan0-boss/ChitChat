import React, { useState } from 'react';
import { LogOut, Search, MoreVertical, MessageSquare } from 'lucide-react';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';

export default function Sidebar() {
  const { user, users, activeChat, setActiveChat, logout } = useStore();
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);

  const filteredUsers = (users || []).filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full md:w-1/3 h-full border-r border-gray-200 flex flex-col bg-transparent flex-shrink-0 z-20">
      {/* Header */}
      <div className="h-16 bg-white/50 backdrop-blur-md flex items-center justify-between px-4 py-2 border-b">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <img src={user?.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-gray-300" />
          <span className="font-semibold text-gray-800">{user?.username}</span>
        </motion.div>
        <div className="flex items-center text-gray-500 gap-4">
          <motion.div whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}>
            <MessageSquare className="cursor-pointer hover:text-[#0a7aff]" size={20} onClick={() => setShowGroupModal(true)} />
          </motion.div>
          <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
            <MoreVertical className="cursor-pointer hover:text-whatsapp-dark" size={20} />
          </motion.div>
          <motion.div whileHover={{ scale: 1.2, rotate: -15 }} whileTap={{ scale: 0.9 }}>
            <LogOut className="cursor-pointer hover:text-red-500" size={20} onClick={logout} />
          </motion.div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-transparent p-3 border-b shadow-sm z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/50 backdrop-blur-md rounded-xl flex items-center px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-whatsapp-light focus-within:bg-transparent border border-transparent focus-within:border-whatsapp-light shadow-inner"
        >
          <motion.div
            animate={{ rotate: search ? 90 : 0 }}
          >
            <Search size={18} className="text-gray-500 mr-3" />
          </motion.div>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start new chat" 
            className="bg-transparent border-none focus:outline-none w-full text-sm text-gray-700"
          />
        </motion.div>
      </div>

      {/* Contact List */}
      <motion.div 
        className="flex-1 overflow-y-auto scrollbar-hide bg-transparent"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
      >
        <AnimatePresence>
          {filteredUsers.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center p-8 text-gray-500 text-sm"
            >
              No contacts found
            </motion.div>
          ) : (
            filteredUsers.map(contact => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ backgroundColor: '#f9fafb', scale: 0.98 }}
                whileTap={{ scale: 0.95 }}
                key={contact.id}
                onClick={() => setActiveChat(contact)}
                className={`flex items-center p-3 cursor-pointer border-b border-gray-100 transition-colors ${activeChat?.id === contact.id ? 'bg-green-50/80 border-l-4 border-l-whatsapp-light' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="relative">
                  <motion.img 
                    layoutId={`avatar-${contact.id}`}
                    src={contact.avatar} 
                    alt={contact.username || contact.name} 
                    className="w-12 h-12 rounded-full shadow-sm bg-white/50 backdrop-blur-md" 
                  />
                  {contact.status === 'online' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"
                    ></motion.div>
                  )}
                </div>
                <div className="ml-4 flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-md font-medium text-gray-900 truncate">{contact.username || contact.name}</h2>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {contact.username === 'ChitChat AI' ? 'Always here to help ✨' : (contact.isGroup ? 'Group Chat' : (contact.status === 'online' ? 'Online' : 'Offline'))}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
