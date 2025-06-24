// import { useState, useEffect, useRef } from "react";
// import io from "socket.io-client";
// import axios from "axios";
// import "../App.css";
// import { useNavigate } from "react-router-dom";

// // const socket = io("http://localhost:5000");
// const socket = io("https://chat-application-server-m2ju.onrender.com")

// function PrivateChat() {
//   const loggedInUser = localStorage.getItem("chat_username");
//   const [users, setUsers] = useState([]);
//   const [activeChatUser, setActiveChatUser] = useState(null);
//   const [message, setMessage] = useState("");
//   const [chatMap, setChatMap] = useState({}); // { username: [{from, message}] }

//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// };

// useEffect(() => {
//   scrollToBottom();
// }, [chatMap, activeChatUser]);

//   useEffect(() => {
//     if (loggedInUser) {
//       socket.emit("register_user_socket", { username: loggedInUser });
//     //   axios.get(`http://localhost:5000/users/${loggedInUser}`).then(res => {
//         axios.get(`https://chat-application-server-m2ju.onrender.com/users/${loggedInUser}`).then(res =>{
//         setUsers(res.data);
//       });
//     }
//   }, [loggedInUser]);

//   useEffect(() => {
//     socket.on("receive_private_message", (data) => {
//       const { from, message,time } = data;

//       setChatMap(prev => {
//         const prevChat = prev[from] || [];
//         return {
//           ...prev,
//           [from]: [...prevChat, { from, message,time }],
//         };
//       });

//       // If first time chatting, add to user list
//       setUsers(prev =>
//         prev.includes(from) ? prev : [...prev, from]
//       );
//     });

//     return () => socket.off("receive_private_message");
//   }, []);

//   const sendMessage = () => {
//     if (!activeChatUser || !message) return;

//     const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//     socket.emit("send_private_message", {
//       toUserId: activeChatUser,
//       from: loggedInUser,
//       message,
//       time: timestamp,
//     });

//     setChatMap(prev => {
//       const prevChat = prev[activeChatUser] || [];
//       return {
//         ...prev,
//         [activeChatUser]: [...prevChat, { from: loggedInUser, message,time: timestamp }],
//       };
//     });

//     setUsers(prev =>
//       prev.includes(activeChatUser) ? prev : [...prev, activeChatUser]
//     );

//     setMessage("");
//   };
//   const navigate = useNavigate();
// const handleLogout = () =>{
//     localStorage.removeItem("chat_username");
//     navigate('/')
// }
// const user = localStorage.getItem("chat_username").toString()
//   return (
//     <div className="chat-container">
//       <div className="user-list">
//         <div style={{display:"flex",justifyContent:"space-between"}}>
//         <h3>Users</h3>
// Loggedin as: {user}
//         <button className="logout-button" onClick={handleLogout} style={{}}>Logout</button>
// </div>
//         {users.map(user => (
//           <div
//             key={user}
//             className={`user ${user === activeChatUser ? "active" : ""}`}
//             // onClick={() => setActiveChatUser(user)}
//             onClick={() => {
//   setActiveChatUser(user);

// //   axios.get(`http://localhost:5000/messages/${loggedInUser}/${user}`)
// axios.get(`https://chat-application-server-m2ju.onrender.com/messages/${loggedInUser}/${user}`)
//     .then(res => {
//       const history = res.data.map(msg => ({
//         from: msg.from,
//         message: msg.message,
//         time: msg.time,
//       }));

//       setChatMap(prev => ({
//         ...prev,
//         [user]: history,
//       }));
//     })
//     .catch(err => {
//       console.error("Failed to fetch chat history:", err);
//     });
// }}
//           >
//             {user}
//           </div>
//         ))}
//       </div>
// <div>
// <h3>Chat with: {activeChatUser || "Select a user"}</h3>

// </div>
//       <div className="chat-box">
//         <div className="messages">
//           {(chatMap[activeChatUser] || []).map((msg, i) => (
//             <div
//               key={i}
//               className={`chat-message ${
//                 msg.from === loggedInUser ? "sent" : "received"
//               }`}
//             >
//               <div>{msg.message}</div>
//               <div className="msg-time">{msg.time}</div>
//             </div>
//           ))}
//           <div ref={messagesEndRef}/>
//         </div>

//         {activeChatUser && (
//           <div className="input-area">
//             <input
//               placeholder="Type a message"
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//             />
//             <button onClick={sendMessage}>Send</button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default PrivateChat;





// added messages seen functioning

import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "../App.css";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

// const socket = io("https://chat-application-server-m2ju.onrender.com");
// const socket = io("http://localhost:5000");

function PrivateChat() {
  const loggedInUser = localStorage.getItem("chat_username");
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMap, setChatMap] = useState({}); // { username: [{from, message, time, seen}] }
  const [unreadCountMap, setUnreadCountMap] = useState({}); 

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMap, activeChatUser]);

  // useEffect(() => {
  //   if (loggedInUser) {
  //     socket.emit("register_user_socket", { username: loggedInUser });
  //     // axios
  //       // .get(`https://chat-application-server-m2ju.onrender.com/users/${loggedInUser}`)
  //       // axios.get(`http://localhost:5000/users/${loggedInUser}`)
  //       // .then((res) => setUsers(res.data));
  //   }
  // }, [loggedInUser]);

  useEffect(() => {
  if (loggedInUser) {
    if (!socket.connected) socket.connect(); // 🔁 Ensure it's connected
    socket.emit("register_user_socket", { username: loggedInUser });

    // fallback request
    socket.emit("get_users", { username: loggedInUser });
  }
}, [loggedInUser]);


  // ⏹️ Handle receiving message
  useEffect(() => {
    socket.on("receive_private_message", (data) => {
      const { from, message, time } = data;
      setChatMap((prev) => {
        const prevChat = prev[from] || [];
        return {
          ...prev,
          [from]: [...prevChat, { from, message, time, seen: false }],
        };
      });

      if (from !== activeChatUser) {
    setUnreadCountMap((prev) => ({
      ...prev,
      [from]: (prev[from] || 0) + 1,
    }));

    //  Trigger browser notification
    triggerBrowserNotification(from, message);
  }

      // if (!users.includes(from)) {
      //   setUsers((prev) => [...prev, from]);
      // }
    });

    // ⏹ Handle seen update from backend
    socket.on("message-seen-update", ({ from }) => {
      setChatMap((prev) => {
        const updatedChat = (prev[from] || []).map((msg) =>
          msg.from === loggedInUser ? { ...msg, seen: true } : msg
        );
        return { ...prev, [from]: updatedChat };
      });
    });

    return () => {
      socket.off("receive_private_message");
      socket.off("message-seen-update");
    };
  }, [users, loggedInUser]);


// Auto mark messages as seen when chatting with active user
useEffect(() => {
  const interval = setInterval(() => {
    if (!activeChatUser || !chatMap[activeChatUser]) return;

    const unseenMessagesExist = chatMap[activeChatUser].some(
      (msg) => msg.from === activeChatUser && !msg.seen
    );

    if (unseenMessagesExist) {
      socket.emit("message-seen", {
        from: activeChatUser,
        to: loggedInUser,
      });
    }
  }, 2000); // every 2 seconds

  return () => clearInterval(interval);
}, [activeChatUser, chatMap, loggedInUser]);


  // ⏹ Send Message
  const sendMessage = () => {
    if (!activeChatUser || !message) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    socket.emit("send_private_message", {
      toUserId: activeChatUser,
      from: loggedInUser,
      message,
      time: timestamp,
    });

    setChatMap((prev) => {
      const prevChat = prev[activeChatUser] || [];
      return {
        ...prev,
        [activeChatUser]: [...prevChat, { from: loggedInUser, message, time: timestamp, seen: false }],
      };
    });

    // if (!users.includes(activeChatUser)) {
    //   setUsers((prev) => [...prev, activeChatUser]);
    // }

    setMessage("");
  };
useEffect(() => {
  const username = localStorage.getItem("chat_username");
  if (!username) {
    navigate("/");
  }
}, []);

  const handleLogout = () => {
    const username = localStorage.getItem("chat_username");
    if(username && socket.connected){
      socket.emit("disconnect_user",{username})
    }

    localStorage.removeItem("chat_username");
    navigate("/");
  };

  const handleUserClick = (user) => {
    setActiveChatUser(user);

  setUnreadCountMap((prev) => ({
    ...prev,
    [user]: 0,
  }));

    // axios.get(`https://chat-application-server-m2ju.onrender.com/messages/${loggedInUser}/${user}`)
    axios.get(`http://localhost:5000/messages/${loggedInUser}/${user}`)
      .then((res) => {
        const history = res.data.map((msg) => ({
          from: msg.from,
          message: msg.message,
          time: msg.time,
          seen: msg.seen || false,
        }));

        setChatMap((prev) => ({
          ...prev,
          [user]: history,
        }));

        // Emit seen event to notify sender
        socket.emit("message-seen", { from: user, to: loggedInUser });
      })
      .catch((err) => {
        console.error("Failed to fetch chat history:", err);
      });
  };

  const currentUser = localStorage.getItem("chat_username");

    useEffect(() => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}, []);

const triggerBrowserNotification = (sender, msg) => {
  if (Notification.permission === "granted") {
    new Notification(`New message from ${sender}`, {
      body: msg,
      // icon: "/chat-icon.png", // optional
    });
  }
};

// useEffect(() => {
//   socket.on("user_list_update", (updatedUsers) => {
//     const filtered = updatedUsers.filter((u) => u !== loggedInUser);
//     setUsers(filtered);
//   });

//   return () => {
//     socket.off("user_list_update");
//   };
// }, [loggedInUser]);

useEffect(() => {
  socket.on("user_list_update", (userArray) => {
    // This now expects array of objects: { username, online }
    const filtered = userArray
      .filter((u) => u.username !== loggedInUser)
        .map((u) => ({
        username: u.username,
        online: u.online,
        lastSeen: u.lastSeen,
        isInChatPage:u.isInChatPage
      }));

    setUsers(filtered);
    console.log(" Updated user list received:", userArray);

  });

  return () => {
    socket.off("user_list_update");
  };
}, [loggedInUser]);


// useEffect(() => {
//   if (loggedInUser) {
//     socket.emit("register_user_socket", { username: loggedInUser });

//     // fetch users as fallback
//     socket.emit("get_users", { username: loggedInUser });
//   }
// }, [loggedInUser]);


// ------------- ONE effect only – handles (re)connects too -------------
useEffect(() => {
  if (!loggedInUser) return;

  // make sure we’re connected
  if (!socket.connected) socket.connect();

  /** after the websocket is really open we register & announce presence */
  const onConnect = () => {
    socket.emit("register_user_socket", { username: loggedInUser });
    socket.emit("chat_page_enter",       { username: loggedInUser });
    socket.emit("get_users",             { username: loggedInUser });
   
  };

  // call immediately if already connected
  if (socket.connected) onConnect();
  // and every time the socket reconnects
  socket.on("connect", onConnect);

  return () => socket.off("connect", onConnect);   // cleanup
}, [loggedInUser]);


// useEffect(() => {
//   const leaveHandler = () => {
//     const username = localStorage.getItem("chat_username");
//     if (username && socket.connected) {
//       socket.emit("chat_page_leave", { username });
//     }
//   };

//   window.addEventListener("beforeunload", leaveHandler);
//   return () => {
//     leaveHandler(); // call on unmount too
//     window.removeEventListener("beforeunload", leaveHandler);
//   };
// }, []);


// Tell server when user enters/leaves chat page
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

  return (
    <div className="chat-container">
      <div className="user-list">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>Users</h3>
          Logged in as: {currentUser}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        {console.log(users)}
        {/* {users.forEach(u => console.log("User:", u.username, "Online:", u.online))} */}
        {users?.map((userObj) => {
  const { username, online, lastSeen, isInChatPage } = userObj;


const formatLastSeen = (dateStr) => {
  if (!dateStr) return "Offline";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 60000); // in minutes

  if (diff < 1) return "Last seen just now";
  if (diff < 60) return `Last seen ${diff} min ago`;
  return `Last seen at ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};


  let statusDisplay;
if (online && isInChatPage) {
  statusDisplay = <span style={{ color: "green" }}>● Online</span>;
} else if ( lastSeen) {
  statusDisplay = (
    <span style={{ fontSize: "12px", color: "gray" }}>
      Last seen {formatLastSeen(lastSeen)}
    </span>
  );
  // } else if (!online && lastSeen) {
  // statusDisplay = (
  //   <span style={{ fontSize: "12px", color: "gray" }}>
  //     Last seen {formatLastSeen(lastSeen)}
  //   </span>
  // );
} else {
  statusDisplay = <span style={{ fontSize: "12px", color: "gray" }}>Offline</span>;
}


  console.log("User:", username, "Online:", online,"last seen: ", lastSeen ? formatLastSeen(lastSeen):"");

  return (
    <div
      key={username}
      className={`user ${username === activeChatUser ? "active" : ""}`}
      onClick={() => handleUserClick(username)}
      style={{display:"flex",alignItems:"center",gap:5,margin:"5px auto"}}
    >
      {username}{" "}
      {/* <span
        style={{
          color: online ? "green" : "gray",
          fontSize: "16px",
          // marginLeft: "3px",
        }}
      >
        {online ? "●" : ""}
      </span> */}

       {/* <div style={{ fontSize: "12px", color: "gray" }}>
          {online ? (
            <span style={{ color: "green" }}>● Online</span>
          ) : lastSeen ? (
            formatLastSeen(lastSeen)
          ) : (
            "Offline"
          )}
        </div> */}
        <div style={{ fontSize: "14px", marginLeft: "auto" }}>{statusDisplay}</div>
      {unreadCountMap[username] > 0 && username !== activeChatUser && (
        <span className="badge">{unreadCountMap[username]}</span>
      )}
    </div>
  );
})}

      </div>

      <div>
        <h3>Chat with: {activeChatUser || "Select a user"}</h3>
      </div>

      <div className="chat-box">
        <div className="messages">
          {(chatMap[activeChatUser] || []).map((msg, i) => (
            <div
              // key={i}
              key={`${msg.from}-${msg.time}-${i}`}
              className={`chat-message ${msg.from === currentUser ? "sent" : "received"}`}
            >
              <div>{msg.message}</div>
              <div className="msg-time">
                {msg.time}{" "}
                {msg.from === currentUser ? (
                  <span style={{ fontSize: "10px", color: msg.seen ? "green" : "gray" }}>
                    {msg.seen ? "Seen" : "Sent"}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {activeChatUser && (
          <div className="input-area">
            <input
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrivateChat;
