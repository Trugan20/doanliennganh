"use strict";

/**
 * WebRTC Signaling Server via Socket.IO
 * Handles: call offer/answer, ICE candidates, busy detection, user presence
 */

// Map: userId -> { socketId, name, inCall: boolean, callWith: userId|null }
const onlineUsers = new Map();

// Map: roomId -> { caller, callee, startedAt }
const activeRooms = new Map();

function setupVideoCallSocket(io) {
  const callNsp = io.of("/video-call");

  callNsp.on("connection", (socket) => {
    const { userId, userName } = socket.handshake.auth;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Register user as online
    onlineUsers.set(userId, {
      socketId: socket.id,
      name: userName || "Unknown",
      inCall: false,
      callWith: null,
    });

    console.log(`[Socket] ${userName} (${userId}) connected`);

    // Broadcast updated online list
    broadcastOnlineUsers(callNsp);

    // ─── Get online users ──────────────────────────────────────────────────
    socket.on("get-online-users", () => {
      socket.emit("online-users", buildOnlineUsersList(userId));
    });

    // ─── Call request ──────────────────────────────────────────────────────
    socket.on("call-request", ({ targetUserId, callerName }) => {
      const target = onlineUsers.get(targetUserId);
      if (!target) {
        socket.emit("call-error", { message: "Người dùng không online" });
        return;
      }

      if (target.inCall) {
        socket.emit("call-busy", {
          targetUserId,
          targetName: target.name,
          message: `${target.name} đang trong cuộc gọi với người khác`,
        });
        return;
      }

      // Mark caller as "in call"
      const callerData = onlineUsers.get(userId);
      if (callerData) {
        callerData.inCall = true;
        callerData.callWith = targetUserId;
      }

      // Notify target of incoming call
      callNsp.to(target.socketId).emit("incoming-call", {
        callerId: userId,
        callerName: callerName || callerData?.name || "Unknown",
        callerSocketId: socket.id,
      });

      broadcastOnlineUsers(callNsp);
    });

    // ─── Call accepted ─────────────────────────────────────────────────────
    socket.on("call-accepted", ({ callerId, calleeName }) => {
      const caller = onlineUsers.get(callerId);
      const callee = onlineUsers.get(userId);

      if (caller) {
        caller.inCall = true;
        caller.callWith = userId;
      }
      if (callee) {
        callee.inCall = true;
        callee.callWith = callerId;
      }

      const roomId = [callerId, userId].sort().join("_");
      activeRooms.set(roomId, {
        caller: callerId,
        callee: userId,
        startedAt: Date.now(),
      });

      if (caller) {
        callNsp.to(caller.socketId).emit("call-accepted-ack", {
          calleeId: userId,
          calleeName: calleeName || callee?.name,
          roomId,
        });
      }

      broadcastOnlineUsers(callNsp);
    });

    // ─── Call rejected ─────────────────────────────────────────────────────
    socket.on("call-rejected", ({ callerId, reason }) => {
      const caller = onlineUsers.get(callerId);
      if (caller) {
        caller.inCall = false;
        caller.callWith = null;
        callNsp.to(caller.socketId).emit("call-rejected", {
          calleeId: userId,
          calleeName: onlineUsers.get(userId)?.name,
          reason: reason || "Người dùng từ chối cuộc gọi",
        });
      }
      broadcastOnlineUsers(callNsp);
    });

    // ─── WebRTC Signaling ──────────────────────────────────────────────────
    socket.on("webrtc-offer", ({ targetUserId, offer }) => {
      const target = onlineUsers.get(targetUserId);
      if (target) {
        callNsp.to(target.socketId).emit("webrtc-offer", {
          callerId: userId,
          offer,
        });
      }
    });

    socket.on("webrtc-answer", ({ targetUserId, answer }) => {
      const target = onlineUsers.get(targetUserId);
      if (target) {
        callNsp.to(target.socketId).emit("webrtc-answer", {
          calleeId: userId,
          answer,
        });
      }
    });

    socket.on("webrtc-ice-candidate", ({ targetUserId, candidate }) => {
      const target = onlineUsers.get(targetUserId);
      if (target) {
        callNsp.to(target.socketId).emit("webrtc-ice-candidate", {
          senderId: userId,
          candidate,
        });
      }
    });

    // ─── End call ──────────────────────────────────────────────────────────
    socket.on("end-call", ({ targetUserId }) => {
      const target = onlineUsers.get(targetUserId);
      const self = onlineUsers.get(userId);

      if (self) {
        self.inCall = false;
        self.callWith = null;
      }
      if (target) {
        target.inCall = false;
        target.callWith = null;
        callNsp.to(target.socketId).emit("call-ended", {
          byUserId: userId,
          byUserName: self?.name,
        });
      }

      // Clean up rooms
      const roomId = [userId, targetUserId].sort().join("_");
      activeRooms.delete(roomId);

      broadcastOnlineUsers(callNsp);
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const userData = onlineUsers.get(userId);
      if (userData?.inCall && userData.callWith) {
        const partner = onlineUsers.get(userData.callWith);
        if (partner) {
          partner.inCall = false;
          partner.callWith = null;
          callNsp.to(partner.socketId).emit("call-ended", {
            byUserId: userId,
            byUserName: userData.name,
            reason: "disconnected",
          });
        }
      }

      onlineUsers.delete(userId);
      console.log(`[Socket] ${userData?.name} (${userId}) disconnected`);
      broadcastOnlineUsers(callNsp);
    });
  });
}

function buildOnlineUsersList(excludeUserId) {
  const users = [];
  onlineUsers.forEach((data, uid) => {
    if (uid !== excludeUserId) {
      users.push({
        userId: uid,
        name: data.name,
        inCall: data.inCall,
      });
    }
  });
  return users;
}

function broadcastOnlineUsers(nsp) {
  nsp.sockets.forEach((socket) => {
    const { userId } = socket.handshake.auth;
    if (userId) {
      socket.emit("online-users", buildOnlineUsersList(userId));
    }
  });
}

module.exports = { setupVideoCallSocket };
