import React from 'react';
import AuthWrapper from './components/AuthWrapper';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Dashboard />
      </div>
    </AuthWrapper>
  );
}

export default App;