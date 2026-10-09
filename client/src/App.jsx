import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Login from './pages/Login';
import Chat from './pages/Chat';
import { ErrorBoundary } from './components/ErrorBoundary';

const PrivateRoute = ({ children }) => {
  const user = useStore(state => state.user);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <ErrorBoundary>
      <div className={`min-h-[100dvh] flex items-center justify-center overflow-hidden transition-colors duration-1000 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]'}`}>
        {/* Ambient Mesh Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
           <div className={`absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob ${isDarkMode ? 'bg-purple-900' : 'bg-pink-300'}`}></div>
           <div className={`absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000 ${isDarkMode ? 'bg-blue-900' : 'bg-yellow-300'}`}></div>
           <div className={`absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000 ${isDarkMode ? 'bg-indigo-900' : 'bg-purple-300'}`}></div>
        </div>
        
        {/* Dark Mode Toggle */}
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl hover:scale-110 transition-all">
           {isDarkMode ? '☀️' : '🌙'}
        </button>

        <div className="relative z-10 w-full h-full flex flex-col">
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              } />
            </Routes>
          </Router>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
