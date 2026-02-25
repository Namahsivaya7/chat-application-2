import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import socket from "../socket";
import VideoCall from "./VideoCall";

function UsersList() {
  const loggedInUser = localStorage.getItem("chat_username");
  const [users, setUsers] = useState([]);
  const [unreadCountMap, setUnreadCountMap] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem("chat_username");
    if (!username) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (loggedInUser) {
      if (!socket.connected) socket.connect();
      socket.emit("register_user_socket", { username: loggedInUser });
      socket.emit("get_users", { username: loggedInUser });
    }
  }, [loggedInUser]);

  useEffect(() => {
    if (!loggedInUser) return;

    if (!socket.connected) socket.connect();

    const onConnect = () => {
      socket.emit("register_user_socket", { username: loggedInUser });
      socket.emit("chat_page_enter", { username: loggedInUser });
      socket.emit("get_users", { username: loggedInUser });
    };

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);

    return () => socket.off("connect", onConnect);
  }, [loggedInUser]);

  useEffect(() => {
    socket.on("user_list_update", (userArray) => {
      const filtered = userArray
        .filter((u) => u.username !== loggedInUser)
        .map((u) => ({
          username: u.username,
          online: u.online,
          lastSeen: u.lastSeen,
          isInChatPage: u.isInChatPage,
        }));

      setUsers(filtered);
    });

    return () => {
      socket.off("user_list_update");
    };
  }, [loggedInUser]);

  useEffect(() => {
    socket.on("receive_private_message", (data) => {
      const { from, message } = data;
      
      setUnreadCountMap((prev) => ({
        ...prev,
        [from]: (prev[from] || 0) + 1,
      }));

      if (Notification.permission === "granted") {
        new Notification(`New message from ${from}`, {
          body: message,
        });
      }
    });

    return () => {
      socket.off("receive_private_message");
    };
  }, []);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Handle incoming video calls
  useEffect(() => {
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
    };

    socket.on("video_call_offer", handleIncomingCall);

    return () => {
      socket.off("video_call_offer", handleIncomingCall);
    };
  }, []);

  const closeVideoCall = () => {
    setIncomingCall(null);
  };

  useEffect(() => {
    if (loggedInUser) {
      socket.emit("chat_page_enter", { username: loggedInUser });
    }

    const handleLeave = () => {
      if (loggedInUser) {
        socket.emit("chat_page_leave", { username: loggedInUser });
      }
    };

    window.addEventListener("beforeunload", handleLeave);
    return () => {
      handleLeave();
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [loggedInUser]);

  const handleLogout = () => {
    const username = localStorage.getItem("chat_username");
    if (username && socket.connected) {
      socket.emit("disconnect_user", { username });
    }

    localStorage.removeItem("chat_username");
    navigate("/");
  };

  const handleUserClick = (username) => {
    setUnreadCountMap((prev) => ({
      ...prev,
      [username]: 0,
    }));
    navigate(`/chat/${username}`);
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return "Offline";

    const date = new Date(dateStr);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    if (isToday) {
      const diff = Math.floor((now - date) / 60000);
      if (diff < 1) return "Last seen just now";
      if (diff < 60) return `Last seen ${diff} min ago`;
      return `Last seen today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    if (isYesterday) {
      return `Last seen yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return `Last seen on ${date.toLocaleDateString()} at ${date.toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    )}`;
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>Chats</h2>
        <div className="user-info">
          <span>Logged in as: {loggedInUser}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="users-list-container">
        {users.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
            No users available
          </p>
        ) : (
          users.map((userObj) => {
            const { username, online, lastSeen, isInChatPage } = userObj;

            let statusDisplay;
            if (online && isInChatPage) {
              statusDisplay = <span style={{ color: "green" }}>● Online</span>;
            } else if (lastSeen) {
              statusDisplay = (
                <span style={{ fontSize: "12px", color: "gray" }}>
                  {formatLastSeen(lastSeen)}
                </span>
              );
            } else {
              statusDisplay = (
                <span style={{ fontSize: "12px", color: "gray" }}>Offline</span>
              );
            }

            return (
              <div
                key={username}
                className="user-item"
                onClick={() => handleUserClick(username)}
              >
                <div className="user-avatar">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <div className="user-name">{username}</div>
                  <div className="user-status">{statusDisplay}</div>
                </div>
                {unreadCountMap[username] > 0 && (
                  <span className="badge">{unreadCountMap[username]}</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {incomingCall && (
        <VideoCall
          localUser={loggedInUser}
          remoteUser={incomingCall.from}
          onClose={closeVideoCall}
          isIncoming={true}
          incomingOffer={incomingCall.offer}
        />
      )}
    </div>
  );
}

export default UsersList;
