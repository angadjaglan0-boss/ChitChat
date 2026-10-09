import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { MessageCircle } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
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
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden z-10 border border-white/50"
      >
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white text-center flex flex-col items-center relative overflow-hidden">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/10 p-4 rounded-full backdrop-blur-md mb-4 border border-white/20"
          >
            <MessageCircle size={48} className="text-white drop-shadow-lg" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight z-10">ChitChat</h1>
          <p className="text-gray-300 mt-2 z-10 font-medium">Connect instantly.</p>
        </div>

        <div className="p-8">
          <div className="flex mb-8 bg-gray-100 rounded-xl p-1 relative">
            <motion.div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
              animate={{ x: isLogin ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
            <button 
              className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${isLogin ? 'text-gray-900' : 'text-gray-500'}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 py-2.5 text-sm font-semibold z-10 transition-colors ${!isLogin ? 'text-gray-900' : 'text-gray-500'}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-black transition-all flex justify-center items-center"
            >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                 isLogin ? 'Sign In' : 'Create Account'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
