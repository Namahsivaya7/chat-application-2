import './App.css';
import PrivateChat from './components/PrivateChat';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import PrivateChat from './pages/PrivateChat';
import LoginSignup from './components/LoginSignup';
import EmptyPage from './components/EmptyPage';

function App() {
  return (
    <div className="App">
     {/* <ChatUi/> */}
     {/* <PrivateChat/> */}
      <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/chat" element={<PrivateChat />} />
      <Route path='empty-page' element={<EmptyPage/>}/>
      </Routes>
    </Router>
    </div>
  );
}

export default App;
