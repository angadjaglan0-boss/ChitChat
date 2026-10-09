import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import useStore from '../store/useStore';

export default function CreateGroupModal({ onClose }) {
  const { user, users, fetchUsers } = useStore();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([user.id]); // creator is always in
  const [loading, setLoading] = useState(false);

  const friends = users.filter(u => !u.isGroup);

  const handleCreate = async () => {
    if (!name.trim() || selected.length < 2) return;
    setLoading(true);
    try {
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, members: selected, createdBy: user.id })
      });
      await fetchUsers();
      onClose();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 shadow-2xl border border-white/50 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={20}/></button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 text-[#0a7aff] rounded-xl"><Users size={24}/></div>
          <h2 className="text-xl font-bold text-gray-900">New Group</h2>
        </div>
        
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group Name"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0a7aff] focus:border-transparent transition-all bg-white/50 mb-4"
        />

        <div className="mb-2 text-sm font-medium text-gray-700">Select Members:</div>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white/30 p-2 mb-6">
          {friends.map(f => (
            <div key={f.id} className="flex items-center justify-between p-2 hover:bg-white/50 rounded-lg cursor-pointer" onClick={() => {
              if (selected.includes(f.id)) setSelected(selected.filter(id => id !== f.id));
              else setSelected([...selected, f.id]);
            }}>
              <div className="flex items-center gap-3">
                <img src={f.avatar} className="w-8 h-8 rounded-full" alt=""/>
                <span className="text-sm font-medium">{f.username}</span>
              </div>
              <input type="checkbox" checked={selected.includes(f.id)} readOnly className="w-4 h-4 text-[#0a7aff] rounded border-gray-300 focus:ring-[#0a7aff]" />
            </div>
          ))}
        </div>

        <button 
          onClick={handleCreate}
          disabled={loading || selected.length < 2 || !name.trim()}
          className="w-full py-3 bg-[#0a7aff] text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors"
        >
          {loading ? 'Creating...' : 'Create Group Chat'}
        </button>
      </motion.div>
    </div>
  );
}
