// ================= USERS =================
const params = new URLSearchParams(window.location.search);

const user_id = parseInt(params.get("user")) || 1;
const receiver_id = parseInt(params.get("to")) || 2;

// ================= ELEMENTS =================
const chatApp = document.getElementById("chatApp");
const messagesContainer = document.getElementById("messages");
const filePreview = document.getElementById("filePreview");
const fileInput = document.getElementById("fileInput");
const msgInput = document.getElementById("msg");

const statusText = document.getElementById("chatStatus");
const statusDot = document.getElementById("statusDot");

// ================= HEADER =================
function setChatHeader() {
  document.getElementById("chatName").innerText =
    "User " + receiver_id;

  document.getElementById("chatAvatar").innerText =
    receiver_id;
}

// ================= FILE PREVIEW =================
fileInput.addEventListener("change", () => {

  const file = fileInput.files[0];

  if (!file) return;

  filePreview.style.display = "block";

  filePreview.innerHTML = `
    📎 ${file.name}
    <span onclick="removeFile()" 
    style="float:right;cursor:pointer;">
      ❌
    </span>
  `;
});

// ================= REMOVE FILE =================
function removeFile() {

  fileInput.value = "";

  filePreview.style.display = "none";
  filePreview.innerHTML = "";
}

// ================= ENTER SEND =================
msgInput.addEventListener("keydown", async (e) => {

  if (e.key === "Enter" && !e.shiftKey) {

    e.preventDefault();

    await sendMessage();
  }
});

// ================= CHAT TOGGLE =================
chatApp.addEventListener("click", (e) => {

  if (
    e.target.closest(".chat-body") ||
    e.target.closest(".chat-footer") ||
    e.target.closest("input") ||
    e.target.closest("button") ||
    e.target.closest("a")
  ) return;

  chatApp.classList.toggle("open");
});

// ================= CLOSE OUTSIDE =================
document.addEventListener("click", (e) => {

  if (!e.target.closest(".chat-app")) {

    chatApp.classList.remove("open");
  }
});

// ================= WEBSOCKET =================
const ws = new WebSocket("ws://localhost:3001");

// CONNECT
ws.onopen = () => {

  console.log("✅ WebSocket Connected");

  ws.send(JSON.stringify({
    type: "init",
    user_id
  }));
};

// RECEIVE
ws.onmessage = ({ data }) => {

  const response = JSON.parse(data);

  console.log("📩", response);

  // ================= CHAT =================
  if (
    response.type === "chat" &&
    parseInt(response.sender_id) === receiver_id
  ) {

    displayMessage(
      response.message,
      "received",
      response.file_path
    );
  }

  // ================= ONLINE USERS =================
  if (response.type === "online_users") {

    const online =
      response.users.includes(
        String(receiver_id)
      );

    statusText.innerText =
      online ? "Online" : "Offline";

    statusDot.classList.toggle("online", online);
    statusDot.classList.toggle("offline", !online);
  }
};

// ================= LOAD MESSAGES =================
async function loadMessages() {

  try {

    const res = await fetch(
      `../backend/fetch_messages.php?user1=${user_id}&user2=${receiver_id}`
    );

    const data = await res.json();

    messagesContainer.innerHTML = "";

    data.forEach((msg) => {

      displayMessage(
        msg.message,
        msg.sender_id == user_id
          ? "sent"
          : "received",
        msg.file_path
      );
    });

    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;

  } catch (err) {

    console.log("❌", err);
  }
}

// ================= SEND MESSAGE =================
async function sendMessage() {

  const msg = msgInput.value.trim();

  let filePath = null;

  // FILE UPLOAD
  if (fileInput.files.length > 0) {

    filePath = await uploadFile(
      fileInput.files[0]
    );
  }

  // EMPTY
  if (!msg && !filePath) return;

  const data = {
    type: "chat",
    sender_id: user_id,
    receiver_id,
    message: msg,
    file_path: filePath
  };

  // SHOW INSTANT
  displayMessage(msg, "sent", filePath);

  // REALTIME
  ws.send(JSON.stringify(data));

  // SAVE DATABASE
  await fetch("../backend/save_message.php", {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(data)
  });

  // CLEAR
  msgInput.value = "";

  removeFile();
}

// ================= DISPLAY =================
function displayMessage(msg, type, file) {

  const div = document.createElement("div");

  div.className = "msg " + type;

  let html = "";

  // TEXT
  if (msg) {

    html += `<div>${msg}</div>`;
  }

  // FILE
  if (file) {

    const fileName = file.split("/").pop();

    html += `
      <div style="margin-top:5px;">
        📎
        <a href="/chatbot_project/${file}" target="_blank">
          ${fileName}
        </a>
      </div>
    `;
  }

  div.innerHTML = html;

  messagesContainer.appendChild(div);

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;
}

// ================= FILE UPLOAD =================
async function uploadFile(file) {

  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch(
    "../backend/upload.php",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  return data.status === "success"
    ? data.path
    : null;
}

// ================= INIT =================
window.onload = () => {

  setChatHeader();

  loadMessages();
};

