/**
 * LLM Chat App Frontend
 *
 * Handles the chat UI interactions and communication with the backend API.
 */

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Chat state
let chatHistory = [];

// Persist chat history to localStorage
function saveChatHistory() {
  try {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  } catch (e) {
    console.error('Failed to save chat history:', e);
  }
}

function loadChatHistory() {
  try {
    const raw = localStorage.getItem('chatHistory');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        chatHistory = parsed;
        // Clear current messages and re-render from history
        chatMessages.innerHTML = '';
        parsed.forEach((m) => addMessageToChat(m.role, m.content));
        return;
      }
    }
  } catch (e) {
    console.error('Failed to load chat history:', e);
  }

  // No saved history: try to capture any static assistant message present in HTML
  const staticAssistant = document.querySelector('.assistant-message p');
  if (staticAssistant) {
    const content = staticAssistant.innerHTML;
    // Use the static DOM message as the initial history entry
    chatHistory = [{ role: 'assistant', content }];
    // Ensure it has a save button (if not already present)
    const container = staticAssistant.closest('.assistant-message');
    if (container && !container.querySelector('.save-button')) {
      const btn = document.createElement('button');
      btn.className = 'save-button';
      btn.title = 'Save';
      btn.innerHTML = '<img src="/assets/icons/save-icon.png" alt="Save">';
      btn.addEventListener('click', function () { saveMessage(container); });
      container.appendChild(btn);
      // If this message already saved, update the button state
      try {
        const saved = JSON.parse(localStorage.getItem('savedMessages') || '[]');
        if (saved.includes(content)) {
          const img = btn.querySelector('img');
          if (img) img.setAttribute('src', '/assets/icons/saved-icon.png');
          btn.classList.add('saved');
          btn.disabled = true;
          btn.title = 'Saved';
        }
      } catch (e) {
        /* ignore */
      }
    }
  } else {
    // Fallback default if nothing in DOM
    chatHistory = [{ role: 'assistant', content: "Hello! I'm an LLM chat app powered by Cloudflare Workers AI. How can I help you today?" }];
  }
}
let isProcessing = false;

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Send message on Enter (without Shift)
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send button click handler
sendButton.addEventListener("click", sendMessage);

// Load any saved history when the script runs
loadChatHistory();

/**
 * Sends a message to the chat API and processes the response
 */
async function sendMessage() {
  const message = userInput.value.trim();

  // Don't send empty messages
  if (message === "" || isProcessing) return;

  // Disable input while processing
  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message to chat
  addMessageToChat("user", message);

  // Clear input
  userInput.value = "";
  userInput.style.height = "auto";

  // Show typing indicator
  typingIndicator.classList.add("visible");

  // Add message to history
  chatHistory.push({ role: "user", content: message });
  saveChatHistory();

  try {
    // Create new assistant response element
    const assistantMessageEl = document.createElement("div");
    assistantMessageEl.className = "message assistant-message";
    assistantMessageEl.innerHTML = `
      <p></p>
      <button class="save-button" onclick="saveMessage(this.parentElement)" title="Save">
        <img src="/assets/icons/save-icon.png" alt="Save">
      </button>
    `;
    chatMessages.appendChild(assistantMessageEl);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Send request to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory,
      }),
    });

    // Handle errors
    if (!response.ok) {
      throw new Error("Failed to get response");
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode chunk
      const chunk = decoder.decode(value, { stream: true });

      // Process SSE format
      const lines = chunk.split("\n");
      for (const line of lines) {
        try {
          const jsonData = JSON.parse(line);
          if (jsonData.response) {
            // Append new content to existing text
            responseText += jsonData.response;
            assistantMessageEl.querySelector("p").textContent = responseText;

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }
    }

  // Add completed response to chat history
  chatHistory.push({ role: "assistant", content: responseText });
  saveChatHistory();
  } catch (error) {
    console.error("Error:", error);
    addMessageToChat(
      "assistant",
      "Sorry, there was an error processing your request.",
    );
  } finally {
    // Hide typing indicator
    typingIndicator.classList.remove("visible");

    // Re-enable input
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

/**
 * Helper function to add message to chat
 */
function addMessageToChat(role, content) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${role}-message`;
  
  //Add save button for assistant messages, not for user messages
  if (role === 'assistant') {
    messageEl.innerHTML = `
      <p>${content}</p>
      <button class="save-button" onclick="saveMessage(this.parentElement)" title="Save">
        <img src="/assets/icons/save-icon.png" alt="Save">
      </button>
    `;
  } else {
    messageEl.innerHTML = `<p>${content}</p>`;
  }
  
  chatMessages.appendChild(messageEl);

  // If this assistant message is already saved (in localStorage), mark its button as saved
  if (role === 'assistant') {
    try {
      const savedMessages = JSON.parse(localStorage.getItem('savedMessages') || '[]');
      if (savedMessages.includes(content)) {
        const btn = messageEl.querySelector('.save-button');
        if (btn) {
          const img = btn.querySelector('img');
          if (img) img.setAttribute('src', '/assets/icons/saved-icon.png');
          btn.classList.add('saved');
          btn.disabled = true;
          btn.title = 'Saved';
        }
      }
    } catch (e) {
      console.error('Error checking saved messages:', e);
    }
  }

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

//function written from Copilot to save messages
function saveMessage(messageElement) {
  const messageText = messageElement.querySelector('p').innerHTML;
  try {
    const savedMessages = JSON.parse(localStorage.getItem('savedMessages') || '[]');
    // avoid duplicates
    if (!savedMessages.includes(messageText)) {
      savedMessages.push(messageText);
      localStorage.setItem('savedMessages', JSON.stringify(savedMessages));
    }
  } catch (e) {
    console.error('Error saving message to localStorage:', e);
  }

  // Visual feedback: permanently switch icon to saved-icon and disable the button
  const saveButton = messageElement.querySelector('.save-button');
  if (!saveButton) return;
  const img = saveButton.querySelector('img');
  if (img) img.setAttribute('src', '/assets/icons/saved-icon.png');
  saveButton.classList.add('saved');
  saveButton.disabled = true;
  saveButton.title = 'Saved';
}