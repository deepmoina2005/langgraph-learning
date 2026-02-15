let checkpointId = null;

const chatBox = document.getElementById("chat-box");
const streamBox = document.getElementById("stream-box");
const sourcesBox = document.getElementById("sources-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

let eventSource = null;

/* ===============================
   SEND BUTTON CLICK
================================ */
sendBtn.addEventListener("click", sendMessage);

/* ===============================
   ENTER KEY SUPPORT
================================ */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

/* ===============================
   MAIN SEND FUNCTION
================================ */
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  // Show user message
  addMessage("user", message);
  input.value = "";

  // Reset UI
  streamBox.innerHTML = `<span class="typing">⌛ Typing...</span>`;
  sourcesBox.innerHTML = "";

  // Close old stream
  if (eventSource) eventSource.close();

  // Backend URL
  let url = `https://langgraph-learning-one.vercel.app/chat_stream/${encodeURIComponent(
    message
  )}`;

  if (checkpointId) {
    url += `?checkpoint_id=${checkpointId}`;
  }

  // Start EventSource stream
  eventSource = new EventSource(url);

  let aiResponse = "";

  /* ===============================
     STREAM RESPONSE HANDLER
  ================================ */
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Save checkpoint
    if (data.type === "checkpoint") {
      checkpointId = data.checkpoint_id;
    }

    // Live AI streaming text
    if (data.type === "model_stream") {
      aiResponse += data.content;

      streamBox.innerHTML = aiResponse;

      scrollToBottom();
    }

    // Tavily Sources
    if (data.type === "search_results") {
      sourcesBox.innerHTML = "<h3>🔗 Sources</h3>";

      data.urls.forEach((link) => {
        const a = document.createElement("a");
        a.href = link;
        a.target = "_blank";
        a.innerText = link;
        sourcesBox.appendChild(a);
      });
    }

    // End of response
    if (data.type === "end")_attachFinalMessage(aiResponse);
  };

  /* ===============================
     ERROR HANDLER
  ================================ */
  eventSource.onerror = () => {
    streamBox.innerHTML = "❌ Backend connection failed!";
    eventSource.close();
  };

  /* ===============================
     FINAL MESSAGE FUNCTION
  ================================ */
  function _attachFinalMessage(responseText) {
    if (responseText.trim() !== "") {
      addMessage("ai", responseText);
    }

    streamBox.innerHTML = "";
    eventSource.close();
  }
}

/* ===============================
   ADD MESSAGE TO CHAT
================================ */
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerText = text;

  chatBox.appendChild(div);

  scrollToBottom();
}

/* ===============================
   AUTO SCROLL FIX
================================ */
function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "checkpoint") {
    checkpointId = data.checkpoint_id;
  }

  if (data.type === "model_stream") {
    aiResponse += data.content;
    streamBox.innerHTML = aiResponse;
    scrollToBottom();
  }

  if (data.type === "search_results") {
    sourcesBox.innerHTML = "<h3>🔗 Sources</h3>";
    data.urls.forEach((link) => {
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.innerText = link;
      sourcesBox.appendChild(a);
    });
  }

  if (data.type === "end") {
    _attachFinalMessage(aiResponse);
  }
};
