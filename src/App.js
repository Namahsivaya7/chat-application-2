import './App.css';
import PrivateChat from './components/PrivateChat';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import PrivateChat from './pages/PrivateChat';
import LoginSignup from './components/LoginSignup';
import EmptyPage from './components/EmptyPage';
import { useEffect } from 'react';

function App() {
    useEffect(() => {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Stop automatic prompt
      // e.preventDefault();
      deferredPrompt = e;

      // Prompt immediately or after timeout
      setTimeout(() => {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      }, 3000); // delay for UX
    });
  }, []);

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
