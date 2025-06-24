import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import io from 'socket.io-client';
import socket from '../socket';

function LoginSignup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAuth = (type) => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      alert('Username and password are required.');
      return;
    }

    // const socket = io('http://localhost:5000'); 
// const socket = io("https://chat-application-server-m2ju.onrender.com")
  socket.connect()
const event = type === 'login' ? 'login_user' : 'register_user';

    socket.emit(event, { username: trimmedUsername, password: trimmedPassword }, (res) => {
      if (res.success) {
        localStorage.setItem('chat_username', trimmedUsername);

        socket.emit("register_user_socket", { username: trimmedUsername });

        navigate('/chat');
      } else {
        alert(res.message);
      }
    });
  };

 useEffect(() =>{
 const currentUser = localStorage.getItem("chat_username");
if (currentUser) navigate('/chat')
 },[navigate]);

  return (
    <div className="login-screen">
      <h2>Login / Signup</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '10px' }} className="login-buttons">
        <button onClick={() => handleAuth('login')}>Login</button>
        <button onClick={() => handleAuth('signup')}>Signup</button>
      </div>
    </div>
  );
}

export default LoginSignup;
