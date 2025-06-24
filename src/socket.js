// src/socket.js
import { io } from "socket.io-client";

const socket = io("https://chat-application-server-2.onrender.com", {
  autoConnect: false, // prevent early connect
  
});

export default socket;
