import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

function LoginSignup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = localStorage.getItem("chat_username");
    if (currentUser) {
      navigate('/users');
    }
  }, [navigate]);

  const handleAuth = (type) => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      alert('Username and password are required.');
      return;
    }

    setIsLoading(true);
    setLoadingType(type);
    setStatusMessage('Connecting...');

    const performAuth = () => {
      setStatusMessage('Authenticating...');
      const event = type === 'login' ? 'login_user' : 'register_user';

      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setLoadingType(null);
        setStatusMessage('');
        alert('Request timed out. Please try again.');
      }, 20000);

      socket.emit(event, { username: trimmedUsername, password: trimmedPassword }, (res) => {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setLoadingType(null);
        setStatusMessage('');
        if (res.success) {
          localStorage.setItem('chat_username', trimmedUsername);
          socket.emit("register_user_socket", { username: trimmedUsername });
          navigate('/users');
        } else {
          alert(res.message);
        }
      });
    };

    if (socket.connected) {
      performAuth();
    } else {
      let retryCount = 0;
      const maxRetries = 5;
      
      const attemptConnect = () => {
        if (socket.connected) {
          cleanup();
          performAuth();
          return;
        }
        socket.connect();
      };
      
      const onConnect = () => {
        cleanup();
        performAuth();
      };
      
      const onError = () => {
        retryCount++;
        if (retryCount < maxRetries) {
          setStatusMessage(`Connecting...`);
          socket.disconnect();
          setTimeout(attemptConnect, 1500);
        } else {
          cleanup();
          setIsLoading(false);
          setLoadingType(null);
          setStatusMessage('');
          alert('Unable to connect to server. Please try again later.');
        }
      };
      
      const cleanup = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
      };
      
      socket.on('connect', onConnect);
      socket.on('connect_error', onError);
      attemptConnect();
    }
  };

  return (
    <div className="login-screen">
      <h2>Login / Signup</h2>
      {statusMessage && (
        <p style={{ fontSize: '12px', color: '#888' }}>{statusMessage}</p>
      )}
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
      />
      <div style={{ display: 'flex', gap: '10px' }} className="login-buttons">
        <button onClick={() => handleAuth('login')} disabled={isLoading}>
          {loadingType === 'login' ? 'Please wait...' : 'Login'}
        </button>
        <button onClick={() => handleAuth('signup')} disabled={isLoading}>
          {loadingType === 'signup' ? 'Please wait...' : 'Signup'}
        </button>
      </div>
    </div>
  );
}

export default LoginSignup;
