let checkpointId = null;

const chatBox = document.getElementById("chat-box");
const streamBox = document.getElementById("stream-box");
const sourcesBox = document.getElementById("sources-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

let eventSource = null;

/* SEND MESSAGE */
sendBtn.addEventListener("click", sendMessage);

/* ENTER KEY SUPPORT */
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

/* MAIN FUNCTION */
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage("user", message);
  input.value = "";

  streamBox.innerHTML = `<span class="typing">⌛ Typing...</span>`;
  sourcesBox.innerHTML = "";

  if (eventSource) eventSource.close();

  let url = `https://langgraph-learning-one.vercel.app/chat_stream/${encodeURIComponent(message)}`;

  if (checkpointId) {
    url += `?checkpoint_id=${checkpointId}`;
  }

  eventSource = new EventSource(url);

  let aiResponse = "";

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "checkpoint") {
      checkpointId = data.checkpoint_id;
    }

    if (data.type === "model_stream") {
      aiResponse += data.content;
      streamBox.innerHTML = aiResponse;
      chatBox.scrollTop = chatBox.scrollHeight;
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
      addMessage("ai", aiResponse);
      streamBox.innerHTML = "";
      eventSource.close();
    }
  };

  eventSource.onerror = () => {
    streamBox.innerHTML = "❌ Backend connection failed!";
    eventSource.close();
  };
}

/* ADD MESSAGE */
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerText = text;

  chatBox.appendChild(div);

  chatBox.scrollTo({
    top: chatBox.scrollHeight,
    behavior: "smooth",
  });
}
