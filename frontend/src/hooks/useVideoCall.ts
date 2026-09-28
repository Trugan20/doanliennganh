import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export interface OnlineUser {
  userId: string;
  name: string;
  inCall: boolean;
}

export interface CallState {
  status: "idle" | "calling" | "incoming" | "connecting" | "connected" | "ended";
  remoteUserId?: string;
  remoteUserName?: string;
  callerId?: string;
  callerName?: string;
}

const SOCKET_URL = "http://localhost:5000";
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useVideoCall() {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callState, setCallState] = useState<CallState>({ status: "idle" });
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [busyNotice, setBusyNotice] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Socket setup ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    const socket = io(`${SOCKET_URL}/video-call`, {
      auth: { userId: user._id || user.id, userName: user.name },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("get-online-users");
    });

    socket.on("online-users", (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    socket.on("incoming-call", ({ callerId, callerName }: { callerId: string; callerName: string }) => {
      setCallState({ status: "incoming", callerId, callerName });
    });

    socket.on("call-accepted-ack", ({ calleeId, calleeName }: any) => {
      setCallState(prev => ({ ...prev, status: "connecting", remoteUserId: calleeId, remoteUserName: calleeName }));
      startWebRTC(calleeId, true);
    });

    socket.on("call-rejected", ({ calleeName }: any) => {
      setError(`${calleeName} đã từ chối cuộc gọi`);
      cleanupCall();
    });

    socket.on("call-busy", ({ targetName, message }: any) => {
      setBusyNotice(message || `${targetName} đang bận`);
      cleanupCall();
    });

    socket.on("call-ended", ({ byUserName }: any) => {
      setError(`${byUserName} đã kết thúc cuộc gọi`);
      cleanupCall();
    });

    socket.on("webrtc-offer", async ({ callerId, offer }: any) => {
      await handleOffer(callerId, offer);
    });

    socket.on("webrtc-answer", async ({ answer }: any) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        for (const c of pendingCandidatesRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];
      }
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }: any) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    return () => {
      socket.disconnect();
      cleanupCall();
    };
  }, [user, token]);

  // ─── WebRTC helpers ───────────────────────────────────────────────────
  const getLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPeerConnection = (remoteUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", { targetUserId: remoteUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState(prev => ({ ...prev, status: "connected" }));
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      } else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        cleanupCall();
      }
    };

    return pc;
  };

  const startWebRTC = async (remoteUserId: string, isInitiator: boolean) => {
    try {
      const stream = await getLocalStream();
      const pc = createPeerConnection(remoteUserId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      if (isInitiator) {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("webrtc-offer", { targetUserId: remoteUserId, offer });
      }
    } catch (err: any) {
      setError(err.message || "Không thể truy cập camera/microphone");
      cleanupCall();
    }
  };

  const handleOffer = async (callerId: string, offer: RTCSessionDescriptionInit) => {
    try {
      const stream = await getLocalStream();
      const pc = createPeerConnection(callerId);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit("webrtc-answer", { targetUserId: callerId, answer });

      setCallState(prev => ({ ...prev, status: "connected", remoteUserId: callerId }));
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const cleanupCall = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState({ status: "idle" });
    setDuration(0);
    setMicOn(true);
    setCamOn(true);
    pendingCandidatesRef.current = [];
  }, []);

  // ─── Public actions ───────────────────────────────────────────────────
  const callUser = useCallback(async (targetUserId: string, targetName: string) => {
    setError(""); setBusyNotice("");
    try {
      await getLocalStream();
      setCallState({ status: "calling", remoteUserId: targetUserId, remoteUserName: targetName });
      socketRef.current?.emit("call-request", {
        targetUserId,
        callerName: user?.name,
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  const acceptCall = useCallback(() => {
    const { callerId, callerName } = callState;
    if (!callerId) return;
    setCallState(prev => ({ ...prev, status: "connecting", remoteUserId: callerId, remoteUserName: callerName }));
    socketRef.current?.emit("call-accepted", { callerId, calleeName: user?.name });
    startWebRTC(callerId, false);
  }, [callState, user]);

  const rejectCall = useCallback(() => {
    const { callerId } = callState;
    if (!callerId) return;
    socketRef.current?.emit("call-rejected", { callerId, reason: "Từ chối" });
    cleanupCall();
  }, [callState, cleanupCall]);

  const endCall = useCallback(() => {
    const remoteUserId = callState.remoteUserId;
    if (remoteUserId) socketRef.current?.emit("end-call", { targetUserId: remoteUserId });
    cleanupCall();
    setCallState({ status: "ended" });
  }, [callState, cleanupCall]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(v => !v);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(v => !v);
  }, [camOn]);

  const capturePhoto = useCallback(() => {
    const video = localVideoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return canvas.toDataURL("image/png");
  }, []);

  return {
    localVideoRef, remoteVideoRef,
    callState, onlineUsers,
    micOn, camOn, duration, error, busyNotice,
    callUser, acceptCall, rejectCall, endCall,
    toggleMic, toggleCam, capturePhoto,
    setError, setBusyNotice,
  };
}
