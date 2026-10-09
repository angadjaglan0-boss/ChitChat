import React from 'react';
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
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
