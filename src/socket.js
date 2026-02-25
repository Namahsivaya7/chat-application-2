// src/socket.js
import { io } from "socket.io-client";

const socket = io("https://chat-application-server-2.onrender.com", {
  autoConnect: false,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000,
  withCredentials: false,
});

export default socket;
