import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import UsersList from './components/UsersList';
import ChatRoom from './components/ChatRoom';
import EmptyPage from './components/EmptyPage';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<LoginSignup />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/chat/:username" element={<ChatRoom />} />
          <Route path="/chat" element={<UsersList />} />
          <Route path="/empty-page" element={<EmptyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
