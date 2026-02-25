import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import "../App.css";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

const VIDEO_CONSTRAINTS = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: "user",
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

const RINGTONE_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const RINGBACK_URL = "https://assets.mixkit.co/active_storage/sfx/1361/1361-preview.mp3";

function VideoCall({ localUser, remoteUser, onClose, isIncoming, incomingOffer }) {
  const [callStatus, setCallStatus] = useState(isIncoming ? "incoming" : "initializing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const isInitializedRef = useRef(false);
  const ringtoneRef = useRef(null);
  const ringbackRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // Play ringtone for incoming calls, ringback for outgoing calls
  useEffect(() => {
    const playRingtone = () => {
      if (isIncoming && callStatus === "incoming") {
        ringtoneRef.current = new Audio(RINGTONE_URL);
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.7;
        ringtoneRef.current.play().catch(() => {});
      }
    };

    const playRingback = () => {
      if (!isIncoming && callStatus === "calling") {
        ringbackRef.current = new Audio(RINGBACK_URL);
        ringbackRef.current.loop = true;
        ringbackRef.current.volume = 0.5;
        ringbackRef.current.play().catch(() => {});
      }
    };

    playRingtone();
    playRingback();

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      if (ringbackRef.current) {
        ringbackRef.current.pause();
        ringbackRef.current = null;
      }
    };
  }, [isIncoming, callStatus]);

  // Stop ringtone/ringback when call connects or ends
  useEffect(() => {
    if (callStatus === "connected" || callStatus === "disconnected") {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      if (ringbackRef.current) {
        ringbackRef.current.pause();
        ringbackRef.current = null;
      }
    }
  }, [callStatus]);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const getMedia = async () => {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        return stream;
      } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Could not access camera/microphone");
        onClose();
        return null;
      }
    };

    const createPeerConnection = () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus("connected");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice_candidate", {
            from: localUser,
            to: remoteUser,
            candidate: event.candidate,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          setCallStatus("disconnected");
        }
      };

      return pc;
    };

    const startOutgoingCall = async () => {
      const stream = await getMedia();
      if (!stream) return;

      const pc = createPeerConnection();
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit("video_call_offer", {
          from: localUser,
          to: remoteUser,
          offer: pc.localDescription,
        });

        setCallStatus("calling");
      } catch (err) {
        console.error("Error creating offer:", err);
        alert("Error starting call");
        onClose();
      }
    };

    const handleAnswer = async (data) => {
      if (data.from === remoteUser && peerConnectionRef.current) {
        try {
          if (peerConnectionRef.current.signalingState === "have-local-offer") {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
            await processPendingCandidates();
            setCallStatus("connected");
          }
        } catch (err) {
          console.error("Error handling answer:", err);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      if (data.from === remoteUser && peerConnectionRef.current) {
        try {
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } else {
            pendingCandidatesRef.current.push(data.candidate);
          }
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    };

    const processPendingCandidates = async () => {
      if (!peerConnectionRef.current?.remoteDescription) return;
      
      while (pendingCandidatesRef.current.length > 0) {
        const candidate = pendingCandidatesRef.current.shift();
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.error("Error adding queued ICE candidate:", err);
        }
      }
    };

    const handleCallEnded = (data) => {
      if (data.from === remoteUser) {
        cleanup();
        onClose();
      }
    };

    const handleCallRejected = (data) => {
      if (data.from === remoteUser) {
        alert(`${remoteUser} rejected the call`);
        cleanup();
        onClose();
      }
    };

    const handleCallTimeout = (data) => {
      if (data.to === remoteUser || data.from === remoteUser) {
        alert(data.reason || "Call timed out - no answer");
        cleanup();
        onClose();
      }
    };

    const handleCallUnavailable = (data) => {
      if (data.to === remoteUser) {
        alert(data.reason || `${remoteUser} is unavailable`);
        cleanup();
        onClose();
      }
    };

    const cleanup = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      pendingCandidatesRef.current = [];
    };

    // Setup socket listeners immediately (using server's event names)
    socket.on("video_call_answer", handleAnswer);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("video_call_ended", handleCallEnded);
    socket.on("video_call_rejected", handleCallRejected);
    socket.on("video_call_timeout", handleCallTimeout);
    socket.on("video_call_unavailable", handleCallUnavailable);

    // Defer heavy media operations to allow UI to paint first
    const timeoutId = setTimeout(() => {
      if (isIncoming) {
        getMedia();
      } else {
        startOutgoingCall();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      socket.off("video_call_answer", handleAnswer);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("video_call_ended", handleCallEnded);
      socket.off("video_call_rejected", handleCallRejected);
      socket.off("video_call_timeout", handleCallTimeout);
      socket.off("video_call_unavailable", handleCallUnavailable);
      cleanup();
    };
  }, [isIncoming, localUser, remoteUser, onClose, incomingOffer]);

  const acceptCall = async () => {
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus("connected");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice_candidate", {
            from: localUser,
            to: remoteUser,
            candidate: event.candidate,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setCallStatus("connected");
        } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          setCallStatus("disconnected");
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      
      while (pendingCandidatesRef.current.length > 0) {
        const candidate = pendingCandidatesRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding queued candidate:", err);
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("video_call_answer", {
        from: localUser,
        to: remoteUser,
        answer: pc.localDescription,
      });

      setCallStatus("connecting");
    } catch (err) {
      console.error("Error accepting call:", err);
      alert("Error accepting call");
      onClose();
    }
  };

  const rejectCall = () => {
    socket.emit("video_call_reject", {
      from: localUser,
      to: remoteUser,
    });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  const endCall = () => {
    socket.emit("video_call_end", {
      from: localUser,
      to: remoteUser,
    });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        <div className="video-call-header">
          <span>{remoteUser}</span>
          <span className="call-status">
            {callStatus === "initializing" && "Initializing..."}
            {callStatus === "calling" && "Calling..."}
            {callStatus === "incoming" && "Incoming call..."}
            {callStatus === "connecting" && "Connecting..."}
            {callStatus === "connected" && "Connected"}
            {callStatus === "disconnected" && "Disconnected"}
          </span>
        </div>

        <div className="video-streams">
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />
          <video
            ref={localVideoRef}
            className="local-video"
            autoPlay
            playsInline
            muted
          />
        </div>

        {callStatus === "incoming" ? (
          <div className="call-actions incoming-actions">
            <button className="call-btn accept-btn" onClick={acceptCall}>
              Accept
            </button>
            <button className="call-btn reject-btn" onClick={rejectCall}>
              Reject
            </button>
          </div>
        ) : (
          <div className="call-actions">
            <button
              className={`call-btn ${isMuted ? "active" : ""}`}
              onClick={toggleMute}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>
            <button
              className={`call-btn ${isVideoOff ? "active" : ""}`}
              onClick={toggleVideo}
            >
              {isVideoOff ? "📷" : "🎥"}
            </button>
            <button className="call-btn end-btn" onClick={endCall}>
              End
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoCall;
