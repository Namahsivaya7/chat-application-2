import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../App.css";
import socket from "../socket";
import VideoCall from "./VideoCall";
import { Video } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getDateLabel = (dateStr) => {
  if (!dateStr) return null;

  const now = new Date();
  const msgDate = new Date(dateStr);

  if (isNaN(msgDate.getTime())) return null;

  const isToday = msgDate.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === msgDate.toDateString();
  const isThisYear = msgDate.getFullYear() === now.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  const day = msgDate.getDate();
  const month = MONTH_NAMES[msgDate.getMonth()];

  if (isThisYear) return `${day} ${month}`;

  return `${day} ${month} ${msgDate.getFullYear()}`;
};

const getDateKey = (dateStr) => {
  if (!dateStr) return null;
  const msgDate = new Date(dateStr);
  if (isNaN(msgDate.getTime())) return null;
  return msgDate.toDateString();
};

function ChatRoom() {
  const { username: chatUser } = useParams();
  const loggedInUser = localStorage.getItem("chat_username");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userStatus, setUserStatus] = useState({ online: false, lastSeen: null, loading: true });
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const username = localStorage.getItem("chat_username");
    if (!username) {
      navigate("/");
      return;
    }
    if (!chatUser) {
      navigate("/users");
    }
  }, [navigate, chatUser]);

  useEffect(() => {
    if (loggedInUser) {
      if (!socket.connected) socket.connect();
      socket.emit("register_user_socket", { username: loggedInUser });
    }
  }, [loggedInUser]);

  // Fetch chat history
  useEffect(() => {
    if (!loggedInUser || !chatUser) return;

    axios
      .get(
        `https://chat-application-server-2.onrender.com/messages/${loggedInUser}/${chatUser}`
      )
      .then((res) => {
        const history = res.data.map((msg) => ({
          from: msg.from,
          message: msg.message,
          time: msg.time,
          date: msg.date || msg.createdAt || null,
          seen: msg.seen || false,
        }));

        setMessages(history);
        socket.emit("message-seen", { from: chatUser, to: loggedInUser });
      })
      .catch((err) => {
        console.error("Failed to fetch chat history:", err);
      });
  }, [loggedInUser, chatUser]);

  // Handle receiving messages
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      const { from, message, time, date } = data;
      
      if (from === chatUser) {
        setMessages((prev) => [
          ...prev,
          { from, message, time, date: date || new Date().toISOString(), seen: false },
        ]);
      }
    };

    const handleSeenUpdate = ({ from }) => {
      if (from === chatUser) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.from === loggedInUser ? { ...msg, seen: true } : msg
          )
        );
      }
    };

    socket.on("receive_private_message", handleReceiveMessage);
    socket.on("message-seen-update", handleSeenUpdate);

    return () => {
      socket.off("receive_private_message", handleReceiveMessage);
      socket.off("message-seen-update", handleSeenUpdate);
    };
  }, [chatUser, loggedInUser]);

  // Auto mark messages as seen
  useEffect(() => {
    const interval = setInterval(() => {
      if (!chatUser || messages.length === 0) return;

      const unseenMessagesExist = messages.some(
        (msg) => msg.from === chatUser && !msg.seen
      );

      if (unseenMessagesExist) {
        socket.emit("message-seen", {
          from: chatUser,
          to: loggedInUser,
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [chatUser, messages, loggedInUser]);

  // Listen for user status updates
  useEffect(() => {
    const handleUserListUpdate = (userArray) => {
      const user = userArray.find((u) => u.username === chatUser);
      if (user) {
        const isOnline = user.online && user.isInChatPage;
        
        setUserStatus((prev) => {
          // If user just went offline (was online, now offline), use current time as last seen
          if (prev.online && !isOnline) {
            return {
              online: false,
              lastSeen: new Date().toISOString(),
              loading: false,
            };
          }
          
          return {
            online: isOnline,
            lastSeen: user.lastSeen || prev.lastSeen,
            loading: false,
          };
        });
      }
    };

    socket.on("user_list_update", handleUserListUpdate);

    // Fetch user status on mount and on reconnect
    const fetchUsers = () => {
      socket.emit("get_users", { username: loggedInUser });
    };

    if (socket.connected) {
      fetchUsers();
    }
    socket.on("connect", fetchUsers);

    return () => {
      socket.off("user_list_update", handleUserListUpdate);
      socket.off("connect", fetchUsers);
    };
  }, [chatUser, loggedInUser]);

  const sendMessage = () => {
    if (!chatUser || !message.trim()) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateISO = now.toISOString();

    socket.emit("send_private_message", {
      toUserId: chatUser,
      from: loggedInUser,
      message: message.trim(),
      time: timestamp,
      date: dateISO,
    });

    setMessages((prev) => [
      ...prev,
      { from: loggedInUser, message: message.trim(), time: timestamp, date: dateISO, seen: false },
    ]);

    setMessage("");
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return "Offline";

    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) return "Offline";
    
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      const diff = Math.floor((now - date) / 60000);
      if (diff < 1) return "last seen just now";
      if (diff < 60) return `last seen ${diff} min ago`;
      return `last seen today at ${timeStr}`;
    }

    if (isYesterday) {
      return `last seen yesterday at ${timeStr}`;
    }

    // For older dates, show date and time
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const currentYear = now.getFullYear();

    if (year === currentYear) {
      return `last seen ${day} ${month} at ${timeStr}`;
    }

    return `last seen ${day} ${month} ${year} at ${timeStr}`;
  };

  const goBack = () => {
    navigate("/users");
  };

  // Handle incoming video call
  useEffect(() => {
    const handleIncomingCall = (data) => {
      if (data.from === chatUser) {
        setIncomingCall(data);
      }
    };

    socket.on("video-call-offer", handleIncomingCall);

    return () => {
      socket.off("video-call-offer", handleIncomingCall);
    };
  }, [chatUser]);

  const startVideoCall = () => {
    if (!userStatus.online) {
      alert(`${chatUser} is offline. Cannot start video call.`);
      return;
    }
    setShowVideoCall(true);
  };

  const closeVideoCall = () => {
    setShowVideoCall(false);
    setIncomingCall(null);
  };

  return (
    <div className="chatroom-container">
      <div className="chatroom-header">
        <button className="back-button" onClick={goBack}>
          ←
        </button>
        <div className="chatroom-user-info">
          <div className="chatroom-username">{chatUser}</div>
          <div className="chatroom-status">
            {userStatus.loading ? (
              <span style={{ color: "rgba(255,255,255,0.7)" }}>...</span>
            ) : userStatus.online ? (
              <span style={{ color: "#90EE90" }}>Online</span>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.8)" }}>{formatLastSeen(userStatus.lastSeen)}</span>
            )}
          </div>
        </div>
        <button className="video-call-button" style={{ color: "white",display: "flex", alignItems: "center", justifyContent: "center" }} onClick={startVideoCall} title="Video Call">
        <Video />
        </button>
      </div>

      <div className="chatroom-messages">
        {messages.map((msg, i, arr) => {
          const currentDateKey = getDateKey(msg.date);
          const prevDateKey = i > 0 ? getDateKey(arr[i - 1].date) : null;
          const showDateSeparator = currentDateKey && currentDateKey !== prevDateKey;

          return (
            <div key={`${msg.from}-${msg.time}-${i}`} style={{ display: 'flex', flexDirection: 'column' }}>
              {showDateSeparator && (
                <div className="date-separator">
                  <span>{getDateLabel(msg.date)}</span>
                </div>
              )}
              <div
                className={`chat-message ${
                  msg.from === loggedInUser ? "sent" : "received"
                }`}
              >
                <div>{msg.message}</div>
                <div className="msg-time">
                  {msg.time}{" "}
                  {msg.from === loggedInUser ? (
                    <span
                      style={{
                        fontSize: "10px",
                        color: msg.seen ? "green" : "gray",
                      }}
                    >
                      {msg.seen ? "Seen" : "Sent"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatroom-input">
        <input
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {showVideoCall && (
        <VideoCall
          localUser={loggedInUser}
          remoteUser={chatUser}
          onClose={closeVideoCall}
          isIncoming={false}
          incomingOffer={null}
        />
      )}

      {incomingCall && !showVideoCall && (
        <VideoCall
          localUser={loggedInUser}
          remoteUser={chatUser}
          onClose={closeVideoCall}
          isIncoming={true}
          incomingOffer={incomingCall.offer}
        />
      )}
    </div>
  );
}

export default ChatRoom;
