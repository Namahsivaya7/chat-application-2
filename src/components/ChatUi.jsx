//  Not used

import { useState, useEffect, useRef } from 'react';
import '.././App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NetworkStatus from './NetworkStatus';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Connect to your backend Socket.IO server
// const socket = io('http://localhost:4000');
const socket = io('https://chat-application-server-m2ju.onrender.com')

function ChatUi() {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
 

  const chatRef = useRef(null);

  // Listen for incoming messages
  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });
    return () => {
      socket.off('receive_message');
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (msg.trim() === '') return;

    const message = {
      id: uuidv4(),
      text: msg,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit('send_message', message);
    // setMessages((prev) => [...prev, message]); // Optional: show own message instantly
    setMsg('');
  };

  return (
    <div className="App">
      <h2>Chat</h2>

      <div className="chat-box" ref={chatRef}>
        {messages.map((m) => (
          <div key={m.id} className="message">
            <strong>{m.time}</strong>: {m.text}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          placeholder="Type a message..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>

      <ToastContainer />
      <NetworkStatus />
    </div>
  );
}

export default ChatUi;
