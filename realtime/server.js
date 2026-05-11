const WebSocket = require("ws");

const PORT = 3001;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 Server running on ws://localhost:${PORT}`);

let users = {};

// ================= LOG HELPERS =================
const log = {
  connect: (id) => console.log(`🟢 User ${id} connected`),
  disconnect: (id) => console.log(`🔴 User ${id} disconnected`),
  users: (list) => console.log(`👥 Online: [ ${list.join(", ")} ]`),
  message: (from, to, msg) =>
    console.log(`📨 ${from} ➝ ${to} : ${msg || "📎 File"}`),
  delivered: (to) => console.log(`✅ Delivered to ${to}`),
  offline: (to) => console.log(`⚫ User ${to} offline`),
};

// ================= BROADCAST =================
function broadcastUsers() {
  const onlineUsers = Object.keys(users);

  log.users(onlineUsers);

  const data = JSON.stringify({
    type: "online_users",
    users: onlineUsers,
  });

  Object.values(users).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// ================= CONNECTION =================
wss.on("connection", (ws) => {

  console.log("🔌 New connection");

  ws.on("message", (msg) => {
    let data;

    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    // INIT
    if (data.type === "init") {
      ws.user_id = data.user_id;
      users[data.user_id] = ws;

      log.connect(data.user_id);
      broadcastUsers();
    }

    // CHAT
    if (data.type === "chat") {

      log.message(data.sender_id, data.receiver_id, data.message);

      const receiver = users[data.receiver_id];

      if (receiver && receiver.readyState === WebSocket.OPEN) {
        receiver.send(JSON.stringify(data));
        log.delivered(data.receiver_id);
      } else {
        log.offline(data.receiver_id);
      }
    }
  });

  // DISCONNECT
  ws.on("close", () => {
    if (ws.user_id) {
      delete users[ws.user_id];

      log.disconnect(ws.user_id);
      broadcastUsers();
    }
  });
});