import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import "../App.css";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function VideoCall({ localUser, remoteUser, onClose, isIncoming, incomingOffer }) {
  const [callStatus, setCallStatus] = useState(isIncoming ? "incoming" : "initializing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
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
          }
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
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

    const cleanup = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };

    // Setup socket listeners immediately (using server's event names)
    socket.on("video_call_answer", handleAnswer);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("video_call_ended", handleCallEnded);
    socket.on("video_call_rejected", handleCallRejected);

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
      cleanup();
    };
  }, [isIncoming, localUser, remoteUser, onClose, incomingOffer]);

  const acceptCall = async () => {
    try {
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

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("video_call_answer", {
        from: localUser,
        to: remoteUser,
        answer: pc.localDescription,
      });

      setCallStatus("connected");
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
